import { useParams, useNavigate } from 'react-router-dom';
import { Download, Package, MapPin, Calendar, FileText, Phone, Mail, User, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { OrderTimeline } from '../components/OrderTimeline';
import { SmartBackButton } from '../components/ui/back-button';

import { useEffect, useMemo, useState } from 'react';
import { getSalesOrderDetails, getDeliveryNotesForOrder, getSalesInvoicesForOrder, getAttachments, downloadDeliveryNotePdf, downloadInvoicePdf } from '../api/erpnextApi';
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

export function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { customerName } = useAuthStore();
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
          if (so.customer !== customerName) {
            setError('You are not authorized to view this order.');
            setOrder(null);
            return;
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

  const navigate = useNavigate();

  const getStatusBadge = (docstatus: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Draft', className: 'badge-warning' },
      1: { label: 'Approved', className: 'badge-success' },
      2: { label: 'Cancelled', className: 'badge-error' },
    };
    const config = statusMap[docstatus] || statusMap[1];
    return <span className={config.className}>{config.label}</span>;
  };

  return (
    <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sticky Back */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 backdrop-opacity-35 py-2">
        <SmartBackButton className="my-2" fallbackTo="/orders" to="/orders" />
      </div>
      {/* Header */}
      <div className="mb-8">
        {order && (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="mb-2">Order {order.name}</h1>
              <p className="text-muted-foreground">
                Created on {formatDateTime(order.creation)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(order.docstatus)}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader className="animate-spin rounded-full h-[calc(100vh/3)]" />
        </div>
      ) : order ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              <div className="card">
                <h3 className="mb-6">Order Status</h3>
                <OrderTimeline currentStatus={order.status} order={order} />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Order Information */}
              <div className="card">
                <h3 className="mb-6">Order Information</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Order Date
                      </p>
                      <p>{formatDateTime(order.transaction_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Delivery Date
                      </p>
                      <p>{formatDateTime(order.delivery_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0 text-[15px]">
                      <p className="text-sm text-muted-foreground">
                        Warehouse
                      </p>
                      <p className="break-words">{order.set_warehouse}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Order Items */}
            <div className="card">
              <h3 className="mb-6">Order Items</h3>
              <div className="overflow-x-auto -mx-6 px-6">
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
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item: any) => (
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
                          {formatNaira(order.grand_total)}
                        </h4>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
              {/* Related Documents */}
              {(deliveryNotes.length > 0 || invoices.length > 0 || attachments.length > 0) && (
                <div className="card">
                  <h3 className="mb-4">Related Documents</h3>
  
                  {/* Delivery Notes */}
                  {deliveryNotes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-4">Delivery Notes</h4>
                      <div className="space-y-3">
                        {uniqueDeliveryNotes.map((note) => (
                          <div
                            key={note.name}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[#D4AF37]" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate">{note.name}</p>
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  uploaded {formatDateTime(note?.posting_date)}
                                </p>
                              </div>
                            </div>
                            {/* <Button variant="ghost" size="sm" className="cursor-pointer flex-shrink-0">
                              <Download className="w-4 h-4" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex-shrink-0"
                              onClick={() => handleDownloadDeliveryNote(note.name)}
                              disabled={downloadingDeliveryId === note.name}
                            >
                              {downloadingDeliveryId === note.name ? (
                                <Loader className="animate-spin w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Invoices */}
                  {uniqueInvoices.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-4">Invoices</h4>
                      <div className="space-y-3">
                        {uniqueInvoices.map((invoice) => (
                          <div
                            key={invoice.name}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[#D4AF37]" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate">{invoice.name}</p>
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  uploaded {formatDateTime(invoice?.posting_date)}
                                </p>
                              </div>
                            </div>
                            {/* <Button variant="ghost" size="sm" className="cursor-pointer flex-shrink-0">
                              <Download className="w-4 h-4" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex-shrink-0"
                              onClick={() => handleDownloadInvoice(invoice.name)}
                              disabled={downloadingInvoiceId === invoice.name}
                            >
                              {downloadingInvoiceId === invoice.name ? (
                                <Loader className="animate-spin w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-4">Attachments</h4>
                      <div className="space-y-3">
                        {attachments.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-[#D4AF37]" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate">{file.name}</p>
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  uploaded {formatDateTime(file.posting_date)}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="cursor-pointer flex-shrink-0">
                              <Download className="w-4 h-4" />
                            </Button>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer flex-shrink-0"
                              onClick={() => handleDownloadPdf(invoice.name)}
                              disabled={downloadingId === invoice.name}
                            >
                              {downloadingId === invoice.name ? (
                                <Loader className="animate-spin w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Order Summary Card */}
              <div className="card bg-accent/30">
                <h3 className="mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{order.items.reduce((sum: any, item: any) => sum + item.qty, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatNaira(order.grand_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>0.00</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 600 }} className="text-[#D4AF37]">
                      {formatNaira(order.grand_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500">Order not found.</p>
        </div>
      )}
    </div>
  );
}
