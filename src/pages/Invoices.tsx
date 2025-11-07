import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { downloadInvoicePdf, getSalesInvoices } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';
import DateRangeFilter from "../components/ui/DateRangeFilter";

import { Search, Download, Eye, FileTextIcon, Loader } from 'lucide-react';
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
import moment from 'moment';

export function Invoices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'invoiced' | 'cancelled'>('all');

  const getStatusBadge = (docstatus: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Draft', className: 'badge-warning' },
      1: { label: 'Invoiced', className: 'badge-success' },
      2: { label: 'Cancelled', className: 'badge-error' },
    };
    const config = statusMap[docstatus] || statusMap[1];
    return <span className={config.className}>{config.label}</span>;
  };

  const { customerName } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [requestingSent, setRequestingSent] = useState(false);
  // Filters & pagination state
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('creation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [moreItemAvailable, setMoreItemAvailable] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!customerName) return;
      setIsLoading(true);
      try {
        const docFilter = statusFilter === 'all'
          ? [0, 1]
          : statusFilter === 'draft'
          ? [0]
          : statusFilter === 'invoiced'
          ? [1]
          : [2];
        const rows = await getSalesInvoices(customerName, {
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: search?.trim() || undefined,
          fromDate,
          toDate,
          docstatusIn: docFilter,
        });
        if (rows?.length < pageSize) setMoreItemAvailable(false);
        else setMoreItemAvailable(true);
        if (page === 1) setInvoices(rows);
        else setInvoices((prev) => [...prev, ...rows]);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [customerName, page, pageSize, sortBy, sortOrder, search, fromDate, toDate, statusFilter]);

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const blob = await downloadInvoicePdf(invoiceId, 'Sales Invoice');
      triggerBlobDownload(blob, `${invoiceId}-Invoice`);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestStatement = () => {
    setRequestingSent(true);
    setTimeout(() => {
      setRequestingSent(false);
    }, 3000);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <Layout>
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                <FileTextIcon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="mb-1">Invoices</h1>
                <p className="text-muted-foreground">
                  View and manage your invoices
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by Invoice ID"
                className="input-field pl-10"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
            </div>
            <div className="flex-1">
              <DateRangeFilter
                start={fromDate}
                end={toDate}
                onChange={(start, end) => {
                  setPage(1);
                  setFromDate(start);
                  setToDate(end);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val: 'all' | 'draft' | 'invoiced' | 'cancelled') => {
                setPage(1);
                setStatusFilter(val);
              }}
            >
              <SelectTrigger className="w-full md:w-52 h-[46px]!">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                {/* <SelectItem value="cancelled">Cancelled</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card overflow-hidden max-xs:p-4!">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="hidden xs:table-cell text-right">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.name} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Link to={`/invoices/${invoice.name}`} state={{ from: '/invoices' }} className="text-[#D4AF37] hover:text-[#B9972C] transition-colors">
                        {invoice.name}
                      </Link>
                      <div className="text-xs md:hidden text-muted-foreground mt-1">
                        {new Date(invoice.posting_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{moment(invoice.posting_date).format('L')}</TableCell>
                    <TableCell className="hidden lg:table-cell">{moment(invoice.due_date).format('L')}</TableCell>
                    <TableCell className="hidden xs:table-cell text-right">{formatNaira(invoice.grand_total)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{getStatusBadge(invoice.docstatus)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-evenly gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => navigate(`/invoices/${invoice.name}`, { state: { from: '/invoices' } })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleDownloadPdf(invoice.name)}
                          disabled={downloadingId === invoice.name}
                        >
                          {downloadingId === invoice.name ? (
                            <Loader className="animate-spin w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
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
          ) : !moreItemAvailable && !invoices?.length && (
            <div className="flex justify-center py-4">
              <p className="text-muted-foreground">
                No invoice records found.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
