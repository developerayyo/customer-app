import { Check, Clock, Package, Truck, Home, Loader, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { getAttachments, getDeliveryNotesForOrder, getSalesInvoicesForOrder, getSalesOrderDetails } from '../api/erpnextApi';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  date?: Date;
  status: 'completed' | 'current' | 'upcoming';
  icon: React.ReactNode;
}

interface OrderTimelineProps {
  currentStatus: string;
  order: any;
  // currentStatus: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
}

export function OrderTimeline({ currentStatus, order }: OrderTimelineProps) {
  const { id } = useParams<{ id: string }>();
  const { customerName } = useAuthStore();
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
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

  const getFirstDraftDN = () => uniqueDeliveryNotes.find((dn) => Number(dn.docstatus) === 0);
  const getFirstSubmittedDN = () => uniqueDeliveryNotes.find((dn) => Number(dn.docstatus) === 1);
  const getFirstSubmittedInvoice = () => uniqueInvoices.find((inv) => Number(inv.docstatus) === 1);


  const getTimelineSteps = (): TimelineStep[] => {
    if (currentStatus === 'cancelled') {
      return [
        {
          id: 'ordered',
          label: 'Order Placed',
          description: 'Your Order has been submitted',
          date: isOrderReceived() ? new Date(order.creation) : undefined,
          status: 'completed',
          icon: <Package className="w-5 h-5" />,
        },
        {
          id: 'cancelled',
          label: 'Order Cancelled',
          description: 'Order has been cancelled',
          date: isOrderReceived() ? new Date(order.modified) : undefined,
          status: 'current',
          icon: <Clock className="w-5 h-5" />,
        },
      ];
    }

    return [
      {
        id: 'pending',
        label: 'Order Placed',
        description: 'We\'ve logged your request and queued processing.',
        date: isOrderReceived() ? order.creation : undefined,
        status: isOrderReceived() ? 'completed' : 'upcoming',
        icon: <Package className="w-5 h-5" />,
      },
      {
        id: 'approved',
        label: 'Order Approved',
        description: 'Approved — dispatch is being scheduled.',
        date: isOrderApproved() ?  order.modified : undefined,
        status: isOrderApproved() ? 'completed' : 'upcoming',
        icon: <Check className="w-5 h-5" />,
      },
      {
        id: 'shipped',
        label: 'Delivery in Process',
        description: 'Order is on its way',
        date: hasDeliveryDraft() && getFirstDraftDN() ? new Date(`${getFirstDraftDN().posting_date}T${getFirstDraftDN().posting_time}`) : undefined,
        status: hasDeliveryDraft() ? 'completed' : 'upcoming',
        icon: <Truck className="w-5 h-5" />,
      },
      {
        id: 'delivered',
        label: 'Delivery Note Generated',
        description: 'You can download the delivery note.',
        date: getFirstSubmittedDN() ? new Date(`${getFirstSubmittedDN().posting_date}T${getFirstSubmittedDN().posting_time}`) : undefined,
        status: getFirstSubmittedDN() ? 'completed' : 'upcoming',
        icon: <Home className="w-5 h-5" />,
      },
      {
        id: 'invoice',
        label: 'Sales Invoice Generated',
        description: 'Invoice ready — view or download a copy.',
        date: getFirstSubmittedInvoice() ? new Date(`${getFirstSubmittedInvoice().posting_date}T${getFirstSubmittedInvoice().posting_time}`) : undefined,
        status: isInvoiceGenerated() ? 'completed' : 'upcoming',
        icon: <FileText className="w-5 h-5" />,
      },
    ];

    return [
      {
        id: 'pending',
        label: 'Order Placed',
        description: 'Order has been submitted',
        date: currentIndex >= 0 ? 'Oct 25, 2025' : undefined,
        status: currentIndex >= 0 ? 'completed' : 'upcoming',
        icon: <Package className="w-5 h-5" />,
      },
      {
        id: 'approved',
        label: 'Order Approved',
        description: 'Order has been approved',
        date: currentIndex >= 1 ? 'Oct 26, 2025' : undefined,
        status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming',
        icon: <Check className="w-5 h-5" />,
      },
      {
        id: 'shipped',
        label: 'Order Shipped',
        description: 'Order is on its way',
        date: currentIndex >= 2 ? 'Oct 27, 2025' : undefined,
        status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming',
        icon: <Truck className="w-5 h-5" />,
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: 'Order has been delivered',
        date: currentIndex >= 3 ? 'Oct 28, 2025' : undefined,
        status: currentIndex === 3 ? 'current' : 'upcoming',
        icon: <Home className="w-5 h-5" />,
      },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="animate-spin rounded-full h-10" />
          </div>
        ) : order && steps &&
          steps?.slice(0, highestStage).map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isCancelled = currentStatus === 'cancelled' && step.id === 'cancelled';
          const isHighestStage = index === highestStage - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical Line */}
              {isHighestStage || !isLast && (
                <div
                  className={`absolute left-[19px] top-[40px] w-0.5 h-[calc(100%+8px)] ${
                    isCompleted 
                      ? 'bg-[#D4AF37]' 
                      : isCancelled 
                      ? 'bg-red-300 dark:bg-red-800' 
                      : 'bg-border'
                  }`}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-[#D4AF37] text-black shadow-lg'
                    : isCurrent
                    ? isCancelled
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 ring-4 ring-red-100 dark:ring-red-900/50'
                      : 'bg-accent text-[#D4AF37] ring-4 ring-accent/50'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className={`${
                        isCompleted || isCurrent 
                          ? isCancelled 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-foreground' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {step.description}
                      </p>
                    )}
                    {step.date && (
                      <span className="sm:hidden flex-shrink-0 mt-1 text-sm font-medium">
                        {moment(step.date).format('lll')}
                      </span>
                    )}
                  </div>
                  {step.date && (
                    <span className="hidden sm:block flex-shrink-0 ml-4 text-sm">
                      {moment(step.date).format('lll')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
