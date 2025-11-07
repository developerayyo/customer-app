import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Search, DollarSign, Loader } from 'lucide-react';
import { getItemPrices, getWarehouses } from '../api/erpnextApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { formatNaira } from '../utils/currency';
import { SearchDropdown, type SearchOption } from '../components/ui/search-dropdown'

export function PriceList() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(50);
  const [moreItemAvailable, setMoreItemAvailable] = useState(false);

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
    if (!selectedWarehouse) return;

    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        // Use selected Location (Warehouse) as the price list, like Create Order
        const response = await getItemPrices(selectedWarehouse, undefined, undefined, itemPageSize, itemPage);
        const rows = response.data ?? [];
        if (rows?.length < itemPageSize) setMoreItemAvailable(false);
        else setMoreItemAvailable(true);
        if (itemPage === 1) {
          setItems(rows);
        } else {
          setItems((prev) => [...prev, ...rows]);
        }
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
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="mb-1">Price List</h1>
              <p className="text-muted-foreground">
                View current prices for items at your location.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 relative">
          <SearchDropdown
            options={(warehouses ?? []).map((w: any) => ({ label: w.warehouse_name ?? w.name, value: w.name })) as SearchOption[]}
            value={selectedWarehouse || null}
            onChange={(val) => {
              if (typeof val === 'string' && val) {
                setSelectedWarehouse(val);
                setWarehouseQuery(val);
                setItemPage(1);
              } else {
                setSelectedWarehouse('');
                setWarehouseQuery('');
              }
            }}
            query={warehouseQuery}
            onQueryChange={setWarehouseQuery}
            placeholder="Type to search locations..."
            emptyLabel="No location found"
          />
        </div>

        {/* Price lists */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="hidden sm:table-header-group">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.name} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      {item.item_name || item.item_code}
                      <div className="text-xs sm:hidden text-primary mt-1">
                        {formatNaira(item.price_list_rate || 0)}
                      </div>  
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatNaira(item.price_list_rate || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination and Loading */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin rounded-full h-10" />
            </div>
          ) : moreItemAvailable ? (
            <div className="flex p-5">
              <button
                className="cursor-pointer btn-secondary px-3 py-2 mx-auto"
                onClick={() => setItemPage((itemPage ?? 1) + 1)}
              >Load more</button>
            </div>
          ) : !items?.length && (
            <div className="flex justify-center py-4">
              <p className="text-muted-foreground">
                No Price list found for this warehouse.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
