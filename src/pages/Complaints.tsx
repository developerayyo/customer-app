import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MessageSquare, Send, Plus, MessageSquareIcon } from 'lucide-react';
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

export function Complaints() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const complaints = [
    {
      id: 'COMP-001',
      subject: 'Delayed Delivery',
      category: 'Delivery',
      date: '2025-10-25',
      status: 'open',
      orderId: 'ORD-003',
    },
    {
      id: 'COMP-002',
      subject: 'Product Quality Issue',
      category: 'Quality',
      date: '2025-10-20',
      status: 'in-progress',
      orderId: 'ORD-001',
    },
    {
      id: 'COMP-003',
      subject: 'Incorrect Invoice Amount',
      category: 'Billing',
      date: '2025-10-15',
      status: 'resolved',
      orderId: 'ORD-002',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'badge-warning' },
      'in-progress': { label: 'In Progress', className: 'badge-gold' },
      resolved: { label: 'Resolved', className: 'badge-success' },
    };
    const config = statusMap[status] || statusMap.open;
    return <span className={config.className}>{config.label}</span>;
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ subject, category, description });
    setShowCreateDialog(false);
    setSubject('');
    setCategory('');
    setDescription('');
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                <MessageSquareIcon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="mb-1">Complaints</h1>
                <p className="text-muted-foreground">
                  Submit and track complaint tickets
                </p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Complaint
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit Complaint</DialogTitle>
                  <DialogDescription>
                    Describe the issue you're experiencing
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitComplaint} className="space-y-4 mt-4">
                  <div>
                    <label className="block mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of the issue"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="quality">Product Quality</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="service">Customer Service</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide detailed information about your complaint"
                      className="input-field min-h-32 resize-none"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateDialog(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="mb-1">{complaint.subject}</h3>
                    <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                      Ticket #{complaint.id} • {complaint.category}
                    </p>
                  </div>
                </div>
                {getStatusBadge(complaint.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                    Related Order
                  </p>
                  <p className="mt-1 text-[#D4AF37]">{complaint.orderId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                    Submitted
                  </p>
                  <p className="mt-1">{new Date(complaint.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {complaints.length === 0 && (
          <div className="card text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">No complaints submitted</h3>
            <p className="text-muted-foreground">
              You haven't submitted any complaints yet
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
