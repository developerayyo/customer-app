import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Order } from "../lib/types";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrder: (order: Order) => void;
}

export function CreateOrderDialog({ open, onOpenChange, onCreateOrder }: CreateOrderDialogProps) {
  const [formData, setFormData] = useState({
    productName: "",
    quantity: "",
    category: "",
    warehouse: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName || !formData.quantity || !formData.category || !formData.warehouse) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `LM-2025-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "pending" as const,
      total: parseFloat(formData.quantity) * 1250.00, // Mock price
      items: parseInt(formData.quantity),
      productName: formData.productName,
      category: formData.category,
      warehouse: formData.warehouse,
      notes: formData.notes,
    };

    onCreateOrder(newOrder);
    toast.success("Order created successfully!");
    setFormData({ productName: "", quantity: "", category: "", warehouse: "", notes: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new precious metals order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="Enter product name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="border-border"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Precious Metals">Precious Metals</SelectItem>
                  <SelectItem value="Numismatics">Numismatics</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Jewelry">Jewelry</SelectItem>
                  <SelectItem value="Collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select value={formData.warehouse} onValueChange={(value: any) => setFormData({ ...formData, warehouse: value })}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New York Vault">New York Vault</SelectItem>
                  <SelectItem value="London Facility">London Facility</SelectItem>
                  <SelectItem value="Singapore Hub">Singapore Hub</SelectItem>
                  <SelectItem value="Dubai Center">Dubai Center</SelectItem>
                  <SelectItem value="Zurich Storage">Zurich Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="border-border"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-border resize-none min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#D4AF37] hover:bg-[#B9972C] text-[#222222] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}