import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import useOrderStore from '../store/useOrderStore';

import { SmartBackButton } from '../components/ui/back-button';
import { SearchDropdown, type SearchOption } from '../components/ui/search-dropdown';
import { getItemPrices, getWarehouses, uploadAndAttachFile } from '../api/erpnextApi';
import { formatNaira } from '../utils/currency';
import useAuthStore from '../store/useAuthStore';

export function CreateOrder() {
  const { 
    selectedWarehouse,
    items,
    setWarehouse,
    setPlant,
    addItem,
    removeItem,
    submitOrder,
  } = useOrderStore();
  const { customerName } = useAuthStore();

  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseObj, setWarehouseObj] = useState<any>();
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedItem, setSelectedItem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [itemPage, setItemPage] = useState(1);

  // Fetch enabled warehouses when the field receives focus
  const handleWarehouseFocus = async () => {
    try {
      const resp = await getWarehouses(undefined, undefined, 20, 0);
      const list = resp?.data ?? resp ?? [];
      setWarehouses(Array.isArray(list) ? list : []);
      // Ensure dropdown opens by having a non-empty query
      if (!warehouseQuery?.trim()) {
        setWarehouseQuery(warehouseObj?.warehouse_name ?? warehouseObj?.name ?? ' ');
      }
    } catch (err) {
      console.error('Error fetching warehouses on focus:', err);
    }
  };

  // Fetch item prices for the selected warehouse when product field receives focus
  const handleProductFocus = async () => {
    try {
      if (!selectedWarehouse) return;
      const pricesResponse = await getItemPrices(selectedWarehouse, undefined, undefined, 50, 1);
      const prices = pricesResponse?.data ?? pricesResponse ?? [];
      const normalized = (Array.isArray(prices) ? prices : []).map((p: any) => ({
        item_code: p.item_code,
        item_name: p.item_name,
        price: p.price_list_rate,
        currency: p.currency,
        price_list: p.price_list,
        valid_from: p.valid_from,
        valid_upto: p.valid_upto,
      }));
      setAvailableProducts(normalized);
      if (!productQuery?.trim()) {
        setProductQuery(' ');
      }
    } catch (error) {
      console.error('Error fetching item prices on focus:', error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const warehousesResponse = await getWarehouses();
        const warehousesList = warehousesResponse.data || [];
        
        setWarehouses(warehousesList);
        
        // Auto-select the first warehouse if none selected
        if (warehousesList.length > 0 && !selectedWarehouse) {
          const first = warehousesList[0];
          // keep local selection object and store string name
          setWarehouseObj(first);
          setWarehouse(first?.name ?? first?.warehouse_name ?? '');
          setWarehouseQuery(first?.warehouse_name ?? '');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again.');
      }
    };

    fetchInitialData();
  }, []);

  // Debounced server-side search for warehouses
  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const q = warehouseQuery.trim();
        const filters = q
          ? JSON.stringify([["disabled","=",0],["warehouse_name","like", `%${q}%`]])
          : undefined; // default filter handled by API when undefined
        const resp = await getWarehouses(filters, undefined, 20, 0);
        const list = resp?.data ?? resp ?? [];
        setWarehouses(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error searching warehouses:', err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [warehouseQuery]);
  
  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        const fetchItems = async () => {
          if (!selectedWarehouse) return;
          const warehouseName = selectedWarehouse;
          // Strip any price label appended in parentheses from the query
          const raw = productQuery.trim();
          const q = raw.replace(/\s*\((?:₦|\$)?[0-9,\.\s]+\)\s*$/g, '').trim();
          // setIsLoading(true);
          try {
            // Use selected Location (Warehouse) as Item Price price_list filter
            const pricesResponse = await getItemPrices(warehouseName, undefined, q, undefined, 50);
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
            setAvailableProducts(normalized);
          } catch (error) {
            console.error('Error fetching items:', error);
            setError('Failed to load products. Please try again.');
          } finally {
            // setIsLoading(false);
          }
        };
        if (selectedWarehouse) {
          fetchItems();
        }
      } catch (err) {
        console.error('Error searching availableProducts:', err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [selectedWarehouse, productQuery]);

  const handleWarehouseChange = (val: any) => {
    if (val?.name && val?.warehouse_name && val?.name && val?.custom_plant) {
      setWarehouseObj(val);
      setWarehouseQuery(val.warehouse_name);
      // setItemPage(1);
    } else {
      setWarehouseObj(null);
      setWarehouseQuery('');
    }
    setSelectedItem('');
    setProductQuery('');
  }

  useEffect(() => {
    setWarehouse(warehouseObj?.name ?? "");
    setPlant(warehouseObj?.custom_plant ?? "");
  }, [warehouseObj]);
 
  const handleAddItem = () => {
    console.log(selectedItem, quantity);
    if (!selectedItem || quantity <= 0) {
      setError('Please select an item and enter a valid quantity');
      return;
    }
    
    const item = availableProducts.find((i: any) => i.item_code === selectedItem);
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
    setProductQuery('');
    setQuantity(1);
    setError('');
  };

  const handleRemoveItem = (itemCode: string) => {
    removeItem(itemCode);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await submitOrder(customerName || '');
      // Attach receipt to Sales Order
      if (result && receipt) {
        try {
          await uploadAndAttachFile(receipt, 'Sales Order', result.name);
        } catch (attachErr) {
          console.warn('Receipt attachment failed:', attachErr);
        }
        setSuccess('Order created successfully!');
      }
      setTimeout(() => {
        navigate(`/orders/${result.name}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Sticky Back */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xs backdrop-opacity-45 supports-[backdrop-filter]:bg-background/60 py-2">
        <SmartBackButton className="my-2" fallbackTo="/orders" />
      </div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="mb-3">Create New Order</h1>
        <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
          Fill in the details below to submit a new order request
        </p>
      </div>

      <form className="space-y-6">
        {/* Location Details */}
        <div className="card">
          <h3 className="mb-6">Location Details</h3>
          <div>
            <label className="block mb-2">Warehouse Location *</label>
            <SearchDropdown
              options={(warehouses ?? [])?.map((w: any) => ({ label: w.warehouse_name ?? w.name, value: w })) as SearchOption[]}
              value={warehouseObj || null}
              onChange={handleWarehouseChange}
              query={warehouseQuery}
              onQueryChange={setWarehouseQuery}
              onFocus={handleWarehouseFocus}
              placeholder="Type to search locations..."
              emptyLabel="No location found"
            />
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <h3 className="mb-6">Order Items</h3>

          <div
            className="flex flex-col md:flex-row gap-4 items-end mb-6"
          >
            <div className="flex-1 w-full">
              <label className="block mb-2">
                Product
              </label>
              <SearchDropdown
                options={(availableProducts ?? [])?.map((i: any) => ({ label: i.item_name + ' (' + formatNaira(i.price) + ')', value: i.item_code })) as SearchOption[]}
                value={selectedItem || null}
                onChange={(val) => {
                  if (typeof val === 'string' && val) {
                    setSelectedItem(val);
                    setProductQuery(val);
                    setItemPage(1);
                  } else {
                    setSelectedItem('');
                    setProductQuery('');
                  }
                }}
                query={productQuery}
                onQueryChange={setProductQuery}
                onFocus={handleProductFocus}
                placeholder="Type to search available products..."
                emptyLabel="No product found"
              />
            </div>
            <div className="flex gap-4 justify-between max-md:w-full">
              <div className="max-sm:flex-1">
                <label className="block mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="input-field md:w-32!"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={Boolean(!selectedItem || !quantity)}
                className="cursor-pointer btn-secondary self-end flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {items?.length > 0 && (
            <div className="overflow-x-auto p-5 rounded-lg border border-border hover:border-[#D4AF37]/30 transition-colors bg-card">
              <table className="w-full">
                <thead className="border-b border-border hidden sm:table-header-group">
                  <tr>
                    <th className="text-left font-medium pb-3">
                      Product
                    </th>
                    <th className="pb-3 text-center font-medium">
                      Qty
                    </th>
                    <th className="pb-3 text-center font-medium hidden md:table-cell">
                      Rate
                    </th>
                    <th className="pb-3 text-right font-medium">
                      Total
                    </th>
                    <th className="pb-3 text-center font-medium hidden md:table-cell">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item: any) => (
                    <tr key={item.name} className="border-b border-border last:border-0 text-left">
                      <td className="py-3">
                        <div className="flex items-end justify-between">
                          <p>{item.item_name}</p>
                          <p className="text-xs sm:hidden text-muted-foreground whitespace-nowrap">
                            x {item.qty}
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <p className="text-xs text-muted-foreground md:hidden">{formatNaira(item.rate)}</p>
                          <p className="text-muted-foreground sm:hidden">{formatNaira(item.amount)}</p>
                        </div>
                      </td>
                      <td className="py-3 text-center hidden sm:table-cell">{item.qty}</td>
                      <td className="py-3 text-right hidden md:table-cell">{formatNaira(item.rate)}</td>
                      <td className="py-3 text-right hidden sm:table-cell">{formatNaira(item.amount)}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-end sm:justify-evenly gap-2">
                          <Button
                            type="button"
                            onClick={() => handleRemoveItem(item.item_code)}
                            variant="ghost"
                            className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-foreground">
                  <tr>
                    <td colSpan={2} className="pt-4 text-left max-sm:hidden md:hidden">
                      <h4>Total</h4>
                    </td>
                    <td colSpan={3} className="pt-4 text-left hidden md:table-cell">
                      <h4>Total Amount</h4>
                    </td>
                    <td className="pt-4 text-right flex items-center justify-between sm:justify-end gap-1.5">
                      <h4 className="sm:hidden">Total:</h4>
                      <h4 className="text-primary font-medium">
                        {formatNaira(calculateTotal())}
                      </h4>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Receipt Upload */}
        <div className="card">
          <h3 className="mb-6">Receipt Upload (Optional)</h3>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-[#D4AF37]/50 transition-colors">
            <input
              type="file"
              id="receipt-upload"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf"
            />
            <label
              htmlFor="receipt-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#D4AF37] mb-1">Click to upload receipt</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </label>
            {receipt && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-foreground">
                  <span className="text-muted-foreground">Selected: </span>
                  {receipt.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col xs:flex-row items-stretch sm:items-center justify-end gap-4 sticky bottom-0
          bg-background/80 py-5 -mx-6 px-6 lg:-mx-8 lg:px-8
          backdrop-blur-xs backdrop-opacity-45 supports-[backdrop-filter]:bg-background/60">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center justify-center text-center"
            onClick={handleSubmit}
            disabled={!items?.length || isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              "Submit Order"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
