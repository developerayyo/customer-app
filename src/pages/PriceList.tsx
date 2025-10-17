import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getWarehouses, getItemPrices } from '../api/erpnextApi';
import { formatNaira } from '../utils/currency';

export default function PriceList() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Searchable select (combobox) state for locations
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const warehousesResponse = await getWarehouses();
        const warehousesList = warehousesResponse.data || [];
        setWarehouses(warehousesList);
        if (warehousesList.length > 0) {
          const first = warehousesList[0];
          setSelectedWarehouse(first.name);
          setWarehouseQuery(first.warehouse_name ?? first.name);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again.');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) return;

    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        // Use selected Location (Warehouse) as the price list, like Create Order
        const response = await getItemPrices(selectedWarehouse, undefined, undefined, itemPageSize, itemPage);
        setItems(response.data || []);
      } catch (err) {
        console.error('Error fetching item prices:', err);
        setError('Failed to load price list. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedWarehouse, itemPage, itemPageSize]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Price List</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            View current prices for items at your selected location.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="card">
          <div className="mb-6">
            <label htmlFor="warehouseCombobox" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
              Select Location
            </label>
            <div className="relative">
              <input
                id="warehouseCombobox"
                name="warehouseCombobox"
                className="input-field"
                placeholder="Type to search locations..."
                value={warehouseQuery}
                onFocus={() => setLocationOpen(true)}
                onChange={(e) => { setWarehouseQuery(e.target.value); setLocationOpen(true); }}
                onBlur={() => setTimeout(() => setLocationOpen(false), 150)}
              />
              {locationOpen && (
                <div className="absolute z-10 mt-2 w-full rounded-md border border-gray-200 bg-white dark:bg-[var(--color-surface)] shadow-lg max-h-60 overflow-auto">
                  {warehouses
                    .filter((w) => (w.warehouse_name ?? w.name).toLowerCase().includes(warehouseQuery.toLowerCase()))
                    .map((w) => (
                      <button
                        key={w.name}
                        type="button"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-[var(--color-muted)]"
                        onMouseDown={() => {
                          setSelectedWarehouse(w.name);
                          setWarehouseQuery(w.warehouse_name ?? w.name);
                          setItemPage(1);
                          setLocationOpen(false);
                        }}
                      >
                        {w.warehouse_name ?? w.name}
                      </button>
                    ))}
                  {warehouses.filter((w) => (w.warehouse_name ?? w.name).toLowerCase().includes(warehouseQuery.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">No locations found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price List</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((price: any) => (
                      <tr key={price.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{price.item_name || price.item_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{price.price_list}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNaira(price.price_list_rate || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{price.currency || 'NGN'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {price.valid_from ? new Date(price.valid_from).toLocaleDateString() : '-'}
                          {' '}to{' '}
                          {price.valid_upto ? new Date(price.valid_upto).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Page {itemPage}</div>
                <div className="flex gap-2">
                  <select
                    className="input-field"
                    value={itemPageSize}
                    onChange={(e) => { setItemPageSize(Number(e.target.value)); setItemPage(1); }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    disabled={itemPage === 1}
                    onClick={() => setItemPage(Math.max(1, itemPage - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    disabled={items.length < itemPageSize}
                    onClick={() => setItemPage(itemPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No items found for this location.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}