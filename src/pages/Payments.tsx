import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getPaymentEntries, downloadPaymentEntryPdf, findCustomerByPortalUser } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';

export default function Payments() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Filters & pagination state
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('creation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let customerDoc: any = null;
        try {
          customerDoc = await findCustomerByPortalUser(user);
        } catch {}
        const mappedName = (customerDoc as any)?.name || user;
        // Fetch submitted Payment Entries for the mapped customer with filters/pagination
        const rows = await getPaymentEntries(mappedName, {
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: search?.trim() || undefined,
          fromDate,
          toDate,
          docstatusIn: [1],
        });
        setPayments(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [user, page, pageSize, sortBy, sortOrder, search, fromDate, toDate]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatCurrency = (amount: number) => formatNaira(amount);

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

  const handleDownloadReceipt = async (name: string) => {
    setDownloadingId(name);
    try {
      const blob = await downloadPaymentEntryPdf(name, 'Receipts');
      triggerBlobDownload(blob, `${name}-Receipt`);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment History</h1>

        {/* List controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              className="input-field mt-1"
              placeholder="Search by Payment ID"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={fromDate || ''}
              onChange={(e) => {
                setPage(1);
                setFromDate(e.target.value || undefined);
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={toDate || ''}
              onChange={(e) => {
                setPage(1);
                setToDate(e.target.value || undefined);
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Sort By</label>
            <div className="flex gap-2 mt-1">
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => {
                  setPage(1);
                  setSortBy(e.target.value);
                }}
              >
                <option value="creation">Created At</option>
                <option value="posting_date">Posting Date</option>
              </select>
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setPage(1);
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                }}
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
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
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
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {payment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.posting_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.paid_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.mode_of_payment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {payment.status || 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference_no || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownloadReceipt(payment.name)}
                        disabled={downloadingId === payment.name}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {downloadingId === payment.name ? 'Downloading...' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No payment records found.</p>
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
              disabled={payments.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}