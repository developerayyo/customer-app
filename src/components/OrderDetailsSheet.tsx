import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Package, Calendar, DollarSign, FileText, Tag, Warehouse, MapPin } from "lucide-react";
import { Order } from "../lib/types";

interface OrderDetailsSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function OrderDetailsSheet({ order, open, onOpenChange }: OrderDetailsSheetProps) {
  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Details</SheetTitle>
          <SheetDescription>
            Review your precious metals order information
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Order #{order.orderNumber}</h3>
              <Badge className={statusColors[order.status]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <Separator />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="size-5 text-[#D4AF37] mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">{order.date}</p>
              </div>
            </div>

            {order.productName && (
              <div className="flex items-start gap-3">
                <Package className="size-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{order.productName}</p>
                </div>
              </div>
            )}

            {order.category && (
              <div className="flex items-start gap-3">
                <Tag className="size-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{order.category}</p>
                </div>
              </div>
            )}

            {order.warehouse && (
              <div className="flex items-start gap-3">
                <Warehouse className="size-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{order.warehouse}</p>
                </div>
              </div>
            )}

            {order.deliveryAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Package className="size-5 text-[#D4AF37] mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="font-medium">{order.items} {order.items === 1 ? 'item' : 'items'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="size-5 text-[#D4AF37] mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-semibold">${order.total.toFixed(2)}</p>
              </div>
            </div>

            {order.notes && (
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="bg-accent/20 p-4 rounded-lg border border-border/50">
            <h4 className="font-medium mb-2">Order Timeline</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Order placed: {order.date}</p>
              {order.status === "processing" && <p>• Processing: In progress</p>}
              {order.status === "shipped" && <p>• Shipped: On the way</p>}
              {order.status === "delivered" && <p>• Delivered: Completed</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}