import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { getPaymentEntries, downloadPaymentEntryPdf } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';

import { Download, CreditCard, CheckCircle, Clock, CreditCardIcon, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function Payments() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [relatedOrder, setRelatedOrder] = useState('');

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      completed: { label: 'Completed', className: 'badge-success', icon: CheckCircle },
      pending: { label: 'Pending', className: 'badge-warning', icon: Clock },
      failed: { label: 'Failed', className: 'badge-error', icon: CreditCard },
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`${config.className} self-start flex items-center gap-1 text-xs`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleCreatePayment = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log({ paymentAmount, paymentMethod, relatedOrder });
    setShowCreateDialog(false);
    setPaymentAmount('');
    setPaymentMethod('');
    setRelatedOrder('');
  };

  const { customerName } = useAuthStore();
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
  const [pageSize, setPageSize] = useState<number>(20);
  const [moreItemAvailable, setMoreItemAvailable] = useState(false);
  
  useEffect(() => {
    const fetchPayments = async () => {
      if (!customerName) return;
      setIsLoading(true);
      try {
        // Fetch submitted Payment Entries for the mapped customer with filters/pagination
        const rows = await getPaymentEntries(customerName, {
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: search?.trim() || undefined,
          fromDate,
          toDate,
          docstatusIn: [1],
        });

        if (rows?.length < pageSize) setMoreItemAvailable(false);
        else setMoreItemAvailable(true);

        if (page === 1) {
          setPayments(Array.isArray(rows) ? rows : []);
        } else {
          setPayments(prevPayments => [...prevPayments, ...(Array.isArray(rows) ? rows : [])]);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [customerName, page, pageSize, sortBy, sortOrder, search, fromDate, toDate]);

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
    <Layout
      onCreatePayment={handleCreatePayment}
      showFab={true}
      fabAction={"payment"}
    >
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                <CreditCardIcon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="mb-1">Payments</h1>
                <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
                  Track and manage your payment transactions
                </p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <button className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <CreditCard className="w-5 h-5" />
                  <span>Create Payment</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Payment</DialogTitle>
                  <DialogDescription>
                    Enter payment details to create a new transaction
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePayment} className="space-y-4 mt-4">
                  <div>
                    <label className="block mb-2">Related Order</label>
                    <Select value={relatedOrder} onValueChange={setRelatedOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORD-001">ORD-001 - $2,450.00</SelectItem>
                        <SelectItem value="ORD-002">ORD-002 - $1,820.00</SelectItem>
                        <SelectItem value="ORD-003">ORD-003 - $3,125.00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2">Amount</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateDialog(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Payment
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
          
        {/* Payment Cards */}
        <div className="space-y-5">
          {payments?.map((payment) => (
            <div key={payment.name} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-end lg:items-start lg:justify-between gap-3 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-3 mb-4">
                    <h3 className="flex-shrink-0">{payment.name}</h3>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
                        Date
                      </p>
                      <p className="mt-1">{formatDate(payment.posting_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
                        Method
                      </p>
                      <p className="mt-1">{payment.mode_of_payment}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
                        Related Order(s)
                      </p>
                      <p className="mt-1">Nil</p>
                      {/* <p className="mt-1 text-[#D4AF37] hover:text-[#B9972C] cursor-pointer transition-colors">{payment.orderId || 'Nil'}</p> */}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-4 justify-between md:justify-start">
                  <div className="text-right">
                    <p className="text-muted-foreground" style={{ fontSize: '12px', lineHeight: '18px' }}>
                      Amount
                    </p>
                    <p style={{ fontSize: '24px', lineHeight: '32px', fontWeight: 600 }} className="text-[#D4AF37] mt-1">
                      {formatCurrency(payment.paid_amount)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={() => handleDownloadReceipt(payment.name)}
                    disabled={downloadingId === payment.name}
                  >
                    {downloadingId === payment.name ? (
                      <Loader className="animate-spin w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4"/>
                    )}
                    <span className="hidden sm:inline">Receipt</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
        ) : !payments?.length && !isLoading && (
          <div className="flex justify-center py-4">
            <p className="text-muted-foreground">
              No payment records found.
            </p>
          </div>
        )}

        {/* Pagination */}
        {/* {payments.length > 0 && !isLoading && (
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
              Page {page}
            </p>
            <div className="flex items-center gap-2">
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-[46px]!">
                  <SelectValue />  
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => setPage(Math.max(1, (page ?? 1) - 1))}
                disabled={(page ?? 1) === 1}
              >Previous</button>
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => setPage((page ?? 1) + 1)}
                disabled={(payments || []).length < (pageSize ?? 10)}
              >Next</button>
            </div>
          </div>
        )} */}

        {/* Summary */}
        {/* <div className="card mt-10 bg-accent/30">
          <h3 className="mb-6">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-card">
              <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                Total Paid
              </p>
              <p style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 600 }} className="text-[#D4AF37] mt-2">
                ${payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                Pending
              </p>
              <p style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 600 }} className="text-yellow-600 dark:text-yellow-400 mt-2">
                ${payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                Transactions
              </p>
              <p style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 600 }} className="mt-2">
                {payments.length}
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}
