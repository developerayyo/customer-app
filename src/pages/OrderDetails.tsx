import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSalesOrderDetails, getDeliveryNotesForOrder, getSalesInvoicesForOrder, getAttachments, findCustomerByPortalUser, downloadDeliveryNotePdf, downloadInvoicePdf } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';
import { formatNaira } from '../utils/currency';


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

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Polling disabled; remove unused state to satisfy TS
  const [downloadingDeliveryId, setDownloadingDeliveryId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await getSalesOrderDetails(id);
        const so = response.data;
        // Authorization: ensure the viewing user is the mapped customer
        try {
          if (user) {
            const customerDoc = await findCustomerByPortalUser(user);
            const customerName = (customerDoc as any)?.name || user;
            if (so.customer !== customerName) {
              setError('You are not authorized to view this order.');
              setOrder(null);
              return;
            }
          }
        } catch {}
        setOrder(so);
        // Related docs
        try {
          const dn = await getDeliveryNotesForOrder(id);
          setDeliveryNotes(Array.isArray(dn) ? dn : []);
        } catch {}
        try {
          const inv = await getSalesInvoicesForOrder(id);
          setInvoices(Array.isArray(inv) ? inv : []);
        } catch {}
        try {
          const files = await getAttachments('Sales Order', id);
          setAttachments(Array.isArray(files) ? files : []);
        } catch {}
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
    // Reduce polling frequency to avoid constant refresh; disabled
    return () => {};
  }, [id]);

  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Timeline helpers per requirement
  const dedupeByName = (arr: any[]) => Array.from(new Map(arr.map((item: any) => [item.name, item])).values());
  const uniqueDeliveryNotes = useMemo(() => dedupeByName(deliveryNotes), [deliveryNotes]);
  const uniqueInvoices = useMemo(() => dedupeByName(invoices), [invoices]);
  const highestStage = useMemo(() => {
    let stage = order ? 1 : 0; // Order exists -> stage 1
    const orderDoc = Number(order?.docstatus);
    if (orderDoc === 1) stage = Math.max(stage, 2); // Submitted -> stage 2
    if (uniqueDeliveryNotes.some((dn) => Number(dn.docstatus) === 0)) stage = Math.max(stage, 3); // DN Draft
    if (uniqueDeliveryNotes.some((dn) => Number(dn.docstatus) === 1)) stage = Math.max(stage, 4); // DN Submitted
    if (uniqueInvoices.some((inv) => Number(inv.docstatus) === 1)) stage = Math.max(stage, 5); // Invoice Submitted
    return stage;
  }, [order, uniqueDeliveryNotes, uniqueInvoices]);

  const isOrderReceived = () => highestStage >= 1; // Draft or Submitted
  const isOrderApproved = () => highestStage >= 2; // Submitted
  const hasDeliveryDraft = () => highestStage >= 3; // Any DN draft or later stages
  const isDeliveryCompleted = () => highestStage >= 4; // Any DN submitted or later stages
  const isInvoiceGenerated = () => highestStage >= 5; // Any invoice submitted

  // Date-time helpers
  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr && !timeStr) return '';
    try {
      if (dateStr && timeStr) {
        const dt = new Date(`${dateStr}T${timeStr}`);
        return dt.toLocaleString();
      }
      const dt = new Date(String(dateStr));
      return dt.toLocaleString();
    } catch {
      return `${dateStr || ''} ${timeStr || ''}`.trim();
    }
  };

  const getFirstDraftDN = () => uniqueDeliveryNotes.find((dn) => Number(dn.docstatus) === 0);
  const getFirstSubmittedDN = () => uniqueDeliveryNotes.find((dn) => Number(dn.docstatus) === 1);
  const getFirstSubmittedInvoice = () => uniqueInvoices.find((inv) => Number(inv.docstatus) === 1);

  const handleDownloadDeliveryNote = async (name: string) => {
    setDownloadingDeliveryId(name);
    try {
      // Try Waybill first
      const blob = await downloadDeliveryNotePdf(name, 'Waybill.');
      triggerBlobDownload(blob, `${name}-Waybill`);
    } catch (err) {
      try {
        // Fallback to Standard
        const blobStd = await downloadDeliveryNotePdf(name, 'Standard');
        triggerBlobDownload(blobStd, `${name}-Standard`);
      } catch (err2) {
        console.error('Error downloading delivery note:', err2);
        setError('Failed to download delivery note. Please try again.');
      }
    } finally {
      setDownloadingDeliveryId(null);
    }
  };

  const handleDownloadInvoice = async (name: string) => {
    setDownloadingInvoiceId(name);
    try {
      const blob = await downloadInvoicePdf(name);
      triggerBlobDownload(blob, `${name}-Invoice`);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
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
        ) : order ? (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Order #{order.name}
              </h2>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Order Timeline (Vertical) */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">Order Timeline</h3>
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isOrderReceived() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isOrderReceived() ? '✓' : '1'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Order Received</p>
                          <p className="text-xs text-gray-500">Sales Order is in Draft</p>
                          <p className="text-xs text-gray-500">{order ? `Placed: ${formatDateTime(order.creation)}` : ''}</p>
                          <p className="text-xs italic text-gray-500">We’ve logged your request and queued processing.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isOrderApproved() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isOrderApproved() ? '✓' : '2'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Order Approved</p>
                          <p className="text-xs text-gray-500">Sales Order has been Submitted</p>
                          <p className="text-xs text-gray-500">{order ? `Updated: ${formatDateTime(order.modified)}` : ''}</p>
                          <p className="text-xs italic text-gray-500">Approved — dispatch is being scheduled.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${hasDeliveryDraft() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{hasDeliveryDraft() ? '✓' : '3'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Delivery in Process</p>
                          <p className="text-xs text-gray-500">Delivery Note is in Draft</p>
                          <p className="text-xs text-gray-500">{getFirstDraftDN() ? `Drafted: ${formatDateTime(getFirstDraftDN()?.posting_date, getFirstDraftDN()?.posting_time)}` : ''}</p>
                          <p className="text-xs italic text-gray-500">Preparing items for dispatch.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isDeliveryCompleted() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isDeliveryCompleted() ? '✓' : '4'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Delivery Completed</p>
                          <p className="text-xs text-gray-500">Delivery Note has been Submitted</p>
                          <p className="text-xs text-gray-500">{getFirstSubmittedDN() ? `Delivered: ${formatDateTime(getFirstSubmittedDN()?.posting_date, getFirstSubmittedDN()?.posting_time)}` : ''}</p>
                          <p className="text-xs italic text-gray-500">Delivered — you can download the delivery note.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex items-start space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isInvoiceGenerated() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isInvoiceGenerated() ? '✓' : '5'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Sales Invoice Generated</p>
                          <p className="text-xs text-gray-500">Invoice has been Submitted</p>
                          <p className="text-xs text-gray-500">{getFirstSubmittedInvoice() ? `Invoiced: ${formatDateTime(getFirstSubmittedInvoice()?.posting_date, getFirstSubmittedInvoice()?.posting_time)}` : ''}</p>
                          <p className="text-xs italic text-gray-500">Invoice ready — view or download a copy.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Order Details */}
            <div className="border-t border-gray-200 pt-4">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(order.transaction_date).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Delivery Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Customer</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.customer}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Warehouse</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.set_warehouse}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item: any) => (
                      <tr key={item.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNaira(item.rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNaira(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNaira(order.grand_total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Related Documents */}
            {(deliveryNotes.length > 0 || invoices.length > 0 || attachments.length > 0) && (
              <div className="mt-8 border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Related Documents</h3>
                
                {deliveryNotes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Notes</h4>
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {uniqueDeliveryNotes.map((note: any) => (
                        <li key={note.name} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">{note.name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {Number(note.docstatus) === 1 && (
                              <button
                                onClick={() => handleDownloadDeliveryNote(note.name)}
                                disabled={downloadingDeliveryId === note.name}
                                className="text-blue-600 hover:text-blue-500 ml-4"
                              >
                                {downloadingDeliveryId === note.name ? 'Downloading...' : 'Download PDF'}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {uniqueInvoices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invoices</h4>
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {uniqueInvoices.map((invoice: any) => (
                        <li key={invoice.name} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">{invoice.name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {Number(invoice.docstatus) === 1 && (
                              <button
                                onClick={() => handleDownloadInvoice(invoice.name)}
                                disabled={downloadingInvoiceId === invoice.name}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                {downloadingInvoiceId === invoice.name ? 'Downloading...' : 'Download PDF'}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {attachments.map((file: any) => (
                        <li key={file.name} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">{file.file_name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">Download</a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-500">Order not found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}