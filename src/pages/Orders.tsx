import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useOrderStore from '../store/useOrderStore';
import { getWarehouses, getItemPrices, searchItems, findCustomerByPortalUser, uploadAndAttachFile, getPlants } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    selectedWarehouse, 
    items, 
    orders,
    setWarehouse, 
    addItem, 
    removeItem, 
    updateItemQuantity,
    submitOrder,
    setPlant,
    fetchOrders,
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    setSearch,
    sortBy,
    sortOrder,
    setSort,
    fromDate,
    toDate,
    setDateRange
  } = useOrderStore();
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const warehousesResponse = await getWarehouses();
        const warehousesList = warehousesResponse.data || [];
        
        setWarehouses(warehousesList);
        
        // Auto-select the first warehouse if none selected
        if (warehousesList.length > 0 && !selectedWarehouse) {
          setWarehouse(warehousesList[0].name);
        }

        // Fetch plants
        const plantsResponse = await getPlants();
        const plantList = plantsResponse.data || [];
        setPlants(plantList);
        if (plantList.length > 0 && !selectedPlant) {
          setSelectedPlant(plantList[0].name);
          setPlant(plantList[0].name);
        }

        // Fetch existing orders list for the mapped customer
        let customerDoc: any = null;
        if (user) {
          customerDoc = await findCustomerByPortalUser(user);
        }
        const mappedName = (customerDoc as any)?.name || user;
        setCustomerName(mappedName);
        await fetchOrders(mappedName);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedWarehouse) return;
      
      setIsLoading(true);
      try {
        // Use selected Location (Warehouse) as Item Price price_list filter
        const pricesResponse = await getItemPrices(selectedWarehouse, undefined, undefined, undefined, 50);
        const prices = pricesResponse.data || [];
        const normalized = prices.map((p: any) => ({
          item_code: p.item_code,
          item_name: p.item_name,
          price: p.price_list_rate,
          currency: p.currency,
          price_list: p.price_list,
          valid_from: p.valid_from,
          valid_upto: p.valid_upto
        }));
        setAvailableItems(normalized);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedWarehouse) {
      fetchItems();
    }
  }, [selectedWarehouse]);

  // Re-fetch orders when list controls change
  useEffect(() => {
    if (!customerName) return;
    const run = async () => {
      try {
        await fetchOrders(customerName);
      } catch (err) {
        console.warn('Refresh orders failed:', err);
      }
    };
    run();
  }, [customerName, page, pageSize, search, sortBy, sortOrder, fromDate, toDate]);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWarehouse(e.target.value);
  };

  const handlePlantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlant(e.target.value);
    setPlant(e.target.value);
  };

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || !selectedWarehouse) {
      return;
    }

    setIsLoading(true);
    try {
      // Treat selected Location (Warehouse) as the Item Price price_list
      const searchResults = await searchItems(searchTerm, selectedWarehouse);
      setAvailableItems(searchResults);
    } catch (error) {
      console.error('Error searching items:', error);
      setError('Failed to search items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem || quantity <= 0) {
      setError('Please select an item and enter a valid quantity');
      return;
    }
    
    const item = availableItems.find((i: any) => i.item_code === selectedItem);
    if (!item) return;
    
    addItem({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: quantity,
      rate: item.price,
      amount: quantity * item.price
    });
    
    // Reset selection
    setSelectedItem('');
    setQuantity(1);
    setError('');
  };

  const handleRemoveItem = (itemCode: string) => {
    removeItem(itemCode);
  };

  const handleQuantityChange = (itemCode: string, newQty: number) => {
    if (newQty <= 0) return;
    updateItemQuantity(itemCode, newQty);
  };

  const handleNextStep = () => {
    // Merge Make Payment into Step 1; remove confirmation step
    if (!selectedWarehouse || items.length === 0) {
      setError('Please select a location and add at least one item');
      return;
    }
    setError('');
    // No step progression; keep single step UI
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmitOrder = async () => {
    if (!selectedWarehouse || items.length === 0) {
      setError('Please select a location and add at least one item');
      return;
    }
    if (!paymentReceipt) {
      setError('Please upload a payment receipt');
      return;
    }

    setIsLoading(true);
    try {
      // Map username to Customer via portal_user child table
      let customerDoc: any = null;
      if (user) {
        customerDoc = await findCustomerByPortalUser(user);
      }
      const customerName = (customerDoc as any)?.name || user;

      const orderData = {
        customer: customerName,
      };

      const result = await submitOrder(orderData);
      if (result) {
        // Attach receipt to Sales Order
        try {
          await uploadAndAttachFile(paymentReceipt, 'Sales Order', result.name);
        } catch (attachErr) {
          console.warn('Receipt attachment failed:', attachErr);
        }
        setSuccess('Order created successfully!');
        setTimeout(() => {
          navigate(`/orders/${result.name}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStep(step === 1 ? 0 : 1)}
          >
            {step === 1 ? 'View Orders' : 'Create New Order'}
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <div className="card">
          {/* Single Step: Select Location, Items, and Attach Receipt */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">1</div>
-              <div className="ml-2 text-sm font-medium">Select Location & Items, then upload receipt</div>
+              {/* Removed instructional text per request */}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Orders List View */}
              {step === 0 && (
                <div className="space-y-6">
                  {/* List controls */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Search</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        placeholder="Search by Order ID"
                        value={search || ''}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">From Date</label>
                      <input
                        type="date"
                        className="input-field mt-1"
                        value={fromDate || ''}
                        onChange={(e) => setDateRange(e.target.value || undefined, toDate)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">To Date</label>
                      <input
                        type="date"
                        className="input-field mt-1"
                        value={toDate || ''}
                        onChange={(e) => setDateRange(fromDate, e.target.value || undefined)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Sort By</label>
                      <div className="flex gap-2 mt-1">
                        <select
                          className="input-field"
                          value={sortBy}
                          onChange={(e) => setSort(e.target.value, (sortOrder ?? 'desc'))}
                        >
                          <option value="creation">Created At</option>
                          <option value="transaction_date">Transaction Date</option>
                        </select>
                        <button
                          type="button"
                          className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          onClick={() => setSort((sortBy ?? 'creation'), ((sortOrder ?? 'desc') === 'desc' ? 'asc' : 'desc'))}
                        >
                          {sortOrder === 'desc' ? 'Desc' : 'Asc'}
                        </button>
                      </div>
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700">Page Size</label>
                      <select
                        className="input-field mt-1"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(orders || []).map((o: any) => (
                          <tr key={o.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.name}`)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">{o.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.creation ? new Date(o.creation).toLocaleString() : o.transaction_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.status}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNaira(o.grand_total || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button type="button" className="text-blue-600 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.name}`); }}>View</button>
                            </td>
                          </tr>
                        ))}
                        {(!orders || orders.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Page {page}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        onClick={() => setPage(Math.max(1, (page ?? 1) - 1))}
                        disabled={(page ?? 1) === 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        onClick={() => setPage((page ?? 1) + 1)}
                        disabled={(orders || []).length < (pageSize ?? 10)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Single Step: Select Location & Items + Receipt */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700">
                      Select Location
                    </label>
                    <select
                      id="warehouse"
                      name="warehouse"
                      className="input-field mt-1"
                      value={selectedWarehouse || ''}
                      onChange={handleWarehouseChange}
                    >
                      <option value="">Select a location</option>
                      {warehouses.map((warehouse: any) => (
                        <option key={warehouse.name} value={warehouse.name}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedWarehouse && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                            Select Item
                          </label>
                          <select
                            id="item"
                            name="item"
                            className="input-field mt-1"
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                          >
                            <option value="">Select an item</option>
                            {availableItems.map((item: any) => (
                              <option key={item.item_code} value={item.item_code}>
                                {item.item_name} ({formatNaira(item.price)})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                            Quantity
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            min="1"
                            className="input-field mt-1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="plant" className="block text-sm font-medium text-gray-700">
                            Select Plant
                          </label>
                          <select
                            id="plant"
                            name="plant"
                            className="input-field mt-1"
                            value={selectedPlant}
                            onChange={handlePlantChange}
                          >
                            <option value="">Select a plant</option>
                            {plants.map((p: any) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={handleAddItem}
                          >
                            Add Item
                          </button>
                        </div>
                      </div>

                      {/* Item list */}
                      {items.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price (₦)
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item) => (
                                  <tr key={item.item_code}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {item.item_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatNaira(item.rate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center">
                                        <button
                                          type="button"
                                          className="p-1 text-gray-500 hover:text-gray-700"
                                          onClick={() => handleQuantityChange(item.item_code, item.qty - 1)}
                                        >
                                          -
                                        </button>
                                        <span className="mx-2">{item.qty}</span>
                                        <button
                                          type="button"
                                          className="p-1 text-gray-500 hover:text-gray-700"
                                          onClick={() => handleQuantityChange(item.item_code, item.qty + 1)}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatNaira(item.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <button
                                        type="button"
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => handleRemoveItem(item.item_code)}
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50">
                                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                    Total:
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatNaira(total)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {/* Payment receipt upload merged into this step */}
                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-900">Payment Receipt</h3>
                        <p className="mt-1 text-sm text-gray-500">Total amount: {formatNaira(total)}</p>
                        <label className="block text-sm font-medium text-gray-700 mt-2">Upload Payment Receipt</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                          </div>
                        </div>
                        {paymentReceipt && (
                          <p className="mt-2 text-sm text-gray-500">Selected file: {paymentReceipt.name}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Navigation buttons */}
              {step === 1 && (
                <div className="mt-8 flex justify-between">
                  <div></div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmitOrder}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}