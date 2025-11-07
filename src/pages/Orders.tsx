import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import useOrderStore from '../store/useOrderStore';
import { Eye, Package, PackageIcon, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import useAuthStore from '../store/useAuthStore';
import { getWarehouses } from '../api/erpnextApi';
import { formatNaira } from '../utils/currency';
import moment from 'moment';
import DateRangeFilter from '../components/ui/DateRangeFilter';

export function Orders() {
  const navigate = useNavigate();
  const { customerName } = useAuthStore();
  const { 
    selectedWarehouse, 
    items, 
    orders,
    setWarehouse, 
    fetchOrders,
    isLoading,
    moreItemAvailable,
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
    status,
    setStatus,
    setDateRange
  } = useOrderStore();
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [isLoading2, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
          setWarehouseQuery(warehousesList[0].warehouse_name ?? warehousesList[0].name);
        }

        if (customerName) await fetchOrders(customerName);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
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
          : undefined;
        const resp = await getWarehouses(filters, undefined, 20, 0);
        const list = resp?.data ?? resp ?? [];
        setWarehouses(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error searching warehouses:', err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [warehouseQuery]);

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
  }, [customerName, page, pageSize, search, sortBy, sortOrder, fromDate, toDate, status]);

  const getStatusBadge = (docstatus: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Draft', className: 'badge-warning' },
      1: { label: 'Approved', className: 'badge-success' },
      2: { label: 'Cancelled', className: 'badge-error' },
    };
    const config = statusMap[docstatus] || statusMap[1];
    return <span className={config.className}>{config.label}</span>;
  };

  const handleCreateOrder = () => {
    navigate('/orders/create');
  };

  return (
    <Layout
      onCreateOrder={handleCreateOrder}
      showFab={true}
    >
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                <PackageIcon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="mb-1">Orders</h1>
                <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
                  Manage and track your order requests
                </p>
              </div>
            </div>
            <Link to="/orders/create" className="flex-shrink-0">
              <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
                <Package className="w-5 h-5" />
                <span>Create Order</span>
              </button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by Order ID"
                className="input-field pl-10"
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <DateRangeFilter
                start={fromDate}
                end={toDate}
                onChange={(start, end) => setDateRange(start, end)}
              />
            </div>
            <Select
              value={status}
              onValueChange={(val: string) => {
                setPage(1);
                setStatus(val);
              }}
            >
              <SelectTrigger className="flex-1! lg:w-52 min-h-[46px]!">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="0">Draft</SelectItem>
                <SelectItem value="1">Approved</SelectItem>
                {/* <SelectItem value="2">Cancelled</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden max-xs:p-4!">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden xs:table-cell text-right">Total</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.name} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Link to={`/orders/${order.name}`} state={{ from: '/orders' }} className="text-[#D4AF37] hover:text-[#B9972C] transition-colors">
                        {order.name}
                      </Link>
                      <div className="text-xs md:hidden text-muted-foreground mt-1">
                        {new Date(order.creation).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{order.creation ? moment(order.creation).format('lll') : moment(order.transaction_date).format('lll')}</TableCell>
                    <TableCell className="hidden xs:table-cell text-right">{formatNaira(order.grand_total || 0)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{getStatusBadge(order.docstatus)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/orders/${order.name}`} state={{ from: '/orders' }}>
                          <Button variant="ghost" size="sm" aria-label="View order">
                            <Eye className="w-4 h-4" /> 
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
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
                onClick={() => setPage((page ?? 1) + 1)}
              >Load more</button>
            </div>
          ) : !moreItemAvailable && !orders?.length && (
            <div className="flex justify-center py-4">
              <p className="text-muted-foreground">
                No orders found.
                {/* No orders found matching your search criteria */}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
