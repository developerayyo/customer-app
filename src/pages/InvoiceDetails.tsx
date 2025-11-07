import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Calendar, FileText, Loader, Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import api, { downloadInvoicePdf } from '../api/erpnextApi';
import moment from 'moment';
import { formatNaira } from '../utils/currency';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { SmartBackButton } from '../components/ui/back-button';
import { FAB } from '../components/layout/FAB';

export function InvoiceDetails() {
   const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Using the api directly since getInvoiceDetails is not exported
        const response = await api.get(`/resource/Sales Invoice/${id}`);
        console.log(response.data)
        setInvoice(response.data?.data || {});
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        setError('Failed to load invoice details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id]);

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

  const handleDownloadPdf = async () => {
    if (!id) return;
    
    setIsDownloading(true);
    try {
      const blob = await downloadInvoicePdf(id, 'Sales Invoice');
      triggerBlobDownload(blob, `${id}-Invoice`);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (docstatus: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Draft', className: 'badge-warning' },
      1: { label: 'Invoiced', className: 'badge-success' },
      2: { label: 'Cancelled', className: 'badge-error' },
    };
    const config = statusMap[docstatus] || statusMap[1];
    return <span className={config.className}>{config.label}</span>;
  };

  const salesOrders: string[] = (invoice?.items || [])
    .map((i: any) => i?.sales_order)
    .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0);

  const uniqueSalesOrders: string[] = Array.from(new Set<string>(salesOrders));

  return (
    <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Sticky Back */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur backdrop-opacity-40 supports-[backdrop-filter]:bg-background/60 py-2">
        <SmartBackButton label="Back to Invoices" className="my-3" fallbackTo="/invoices" />
      </div>
      {/* Header */}
      <div className="mb-8 mt-1.5">
        {invoice && (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-3">Invoice {invoice.name}</h1>
              <p className="mb-2">
                <span className="font-medium">Dispatch Code: </span>
                <span>{invoice.custom_dispatch_code}</span>
              </p>
              {uniqueSalesOrders?.length ? (
                <p>
                  <span className="font-medium">Related Order: </span>
                  <span className="inline-flex flex-wrap gap-1">
                    {uniqueSalesOrders.map((sales_order: string, idx: number) => (
                      <Link
                        key={sales_order}
                        to={`/orders/${encodeURIComponent(sales_order)}`}
                        className="text-primary hover:underline"
                      >
                        {sales_order}
                        {idx < uniqueSalesOrders.length - 1 ? ',' : ''}
                      </Link>
                    ))}
                  </span>
                </p>
              ) : (
                <p>
                  <span className="font-medium">Related Order: </span>
                  <span className="text-muted-foreground">None</span>
                </p>
              )}
            </div>
            <div>{getStatusBadge(invoice.docstatus)}</div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader className="animate-spin rounded-full h-[calc(100vh/3)]" />
        </div>
      ) : invoice ? (
        <div className="space-y-6">
          {/* Floating action for printing/downloading invoice */}
          <FAB onClick={handleDownloadPdf} className="bottom-8" label="Download Invoice" icon={<Printer className="size-8" />} />
          {/* Invoice Info */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                    Issue Date
                  </p>
                  <p className="mt-1">{moment(invoice.posting_date).format('lll')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                    Due Date
                  </p>
                  <p className="mt-1">{moment(invoice.due_date).format('lll')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="card">
            <h3 className="mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border hidden xs:table-header-group">
                  <tr className="sm:hidden">
                    <th className="text-left pb-3 font-medium">
                      <div className="w-full flex items-center justify-between">
                        <span>Description</span>
                        <span className="hidden xs:block pr-8">Batch Code</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="hidden sm:table-row">
                    <th className="text-left pb-3 font-medium">
                      Description
                    </th>
                    <th className="text-left pb-3 font-medium hidden lg:table-cell">
                      Code
                    </th>
                    <th className="text-left pb-3 font-medium hidden md:table-cell">
                      Batch No.
                    </th>
                    <th className="text-right pb-3 font-medium hidden md:table-cell">
                      <span className="hidden lg:inline-block">Quantity</span>
                      <span className="lg:hidden">Qty</span>
                    </th>
                    <th className="text-right pb-3 font-medium hidden md:table-cell">
                      Rate
                    </th>
                    <th className="text-right pb-3 font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice?.items?.map((item: any) => (
                    <tr key={item.name} className="border-b border-border last:border-0">
                      <td className="sm:hidden">
                        <Accordion type="single" collapsible>
                          <AccordionItem value={`item-${item.name}`}>
                            <AccordionTrigger className="py-3">
                              <div className="w-full flex gap-2 items-center justify-between">
                                <span>{item.item_name}</span>
                                <span className="hidden xs:block">{item.batch_no}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex items-center pb-2 justify-between">
                                <span>Code:</span>
                                <span>{item.item_code}</span>
                              </div>
                              <div className="flex items-center pb-2 justify-between">
                                <span>Batch No.:</span>
                                <span>{item.batch_no}</span>
                              </div>
                              <div className="flex items-center pb-2 justify-between">
                                <span>Quantity:</span>
                                <span>{item.qty}{item.uom}</span>
                              </div>
                              <div className="flex items-center pb-2 justify-between">
                                <span>Rate:</span>
                                <span>{formatNaira(item.rate)}</span>
                              </div>
                              <div className="flex items-center pb-2 justify-between">
                                <span>Amount:</span>
                                <span>{formatNaira(item.amount)}</span>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        {item.item_name}
                        <div className="text-xs lg:hidden text-muted-foreground mt-1">
                          {item.item_code}
                        </div>
                        <div className="text-xs md:hidden text-muted-foreground mt-1">
                          Batch No.: {item.batch_no}
                        </div>
                      </td>
                      <td className="py-3 hidden lg:table-cell">{item.item_code}</td>
                      <td className="py-3 hidden md:table-cell">{item.batch_no}</td>
                      <td className="py-3 text-right hidden md:table-cell">{item.qty}{item.uom}</td>
                      <td className="py-3 text-right hidden md:table-cell">{formatNaira(item.rate)}</td>
                      <td className="py-3 text-right hidden sm:table-cell">
                        <div className="text-xs md:hidden text-muted-foreground mb-1">
                          {formatNaira(item.rate)}
                        </div>
                        <div className="text-xs md:hidden text-muted-foreground mb-1">
                          x {item.qty}{item.uom}
                        </div>
                        {formatNaira(item.amount)}
                      </td>  
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Subtotal</p>
                <p>{formatNaira(invoice.total)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Tax</p>
                <p>{formatNaira(invoice.tax)}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <h3>Total Amount</h3>
                <p style={{ fontSize: '24px', lineHeight: '32px', fontWeight: 600 }} className="text-[#D4AF37]">
                  {formatNaira(invoice.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice?.notes && (
            <div className="card">
              <h3 className="mb-4">Payment Terms</h3>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader className="animate-spin w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500">Invoice not found.</p>
        </div>
      )}
    </div>
  );
}
