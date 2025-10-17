import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api, { downloadInvoicePdf, findCustomerByPortalUser, getSalesInvoices } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';

export default function Invoices() {
  const { user } = useAuthStore();
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
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const customerDoc = await findCustomerByPortalUser(user);
        const customerName = (customerDoc as any)?.name || user;
        const rows = await getSalesInvoices(customerName, {
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: search?.trim() || undefined,
          fromDate,
          toDate,
          docstatusIn: [0,1],
        });
        setInvoices(rows);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user, page, pageSize, sortBy, sortOrder, search, fromDate, toDate]);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <button
            onClick={handleRequestStatement}
            className="btn-primary"
            disabled={requestingSent}
          >
            {requestingSent ? 'Request Sent!' : 'Request Account Statement'}
          </button>
        </div>

        {/* List controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              className="input-field mt-1"
              placeholder="Search by Invoice ID"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={fromDate || ''}
              onChange={(e) => { setPage(1); setFromDate(e.target.value || undefined); }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={toDate || ''}
              onChange={(e) => { setPage(1); setToDate(e.target.value || undefined); }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Sort By</label>
            <div className="flex gap-2 mt-1">
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => { setPage(1); setSortBy(e.target.value); }}
              >
                <option value="creation">Created At</option>
                <option value="posting_date">Posting Date</option>
              </select>
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => { setPage(1); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
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
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : invoices.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link 
                          to={`/invoices/${invoice.name}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {invoice.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.posting_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNaira(invoice.grand_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadPdf(invoice.name)}
                          disabled={downloadingId === invoice.name}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {downloadingId === invoice.name ? 'Downloading...' : 'Download PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-500">No invoices found.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page}</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => setPage(page + 1)}
              disabled={invoices.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}