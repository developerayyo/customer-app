import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Package, Calendar, DollarSign, ChevronRight } from "lucide-react";
import { Order } from "../lib/types";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Calendar className="size-4" />
              <span className="text-sm">{order.date}</span>
            </div>
          </div>
          <Badge className={statusColors[order.status]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4" />
              <span className="text-sm">{order.items} items</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-[#D4AF37]" />
              <span className="font-semibold">${order.total.toFixed(2)}</span>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}