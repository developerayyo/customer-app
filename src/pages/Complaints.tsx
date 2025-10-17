import { useState } from 'react';
import Layout from '../components/Layout';
import { submitComplaint, uploadFile, findCustomerByPortalUser } from '../api/erpnextApi';
import useAuthStore from '../store/useAuthStore';

export default function Complaints() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    subject: '',
    complaint_type: 'Product',
    details: '',
    priority: 'Medium',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      let fileUrl = '';
    
      // Resolve customer under the hood
      let customerName = '';
      try {
        if (user) {
          const mapped = await findCustomerByPortalUser(user);
          customerName = (mapped as any)?.name || user;
        }
      } catch {}
      
      // Upload file if selected
      if (file) {
        const fileResponse = await uploadFile(file);
        fileUrl = fileResponse.data.file_url;
      }
      
      // Submit complaint
      await submitComplaint({
        doctype: 'Customer Complaints',
        customer: customerName,
        subject: formData.subject,
        complaint_type: formData.complaint_type,
        details: formData.details,
        priority: formData.priority,
        attachment: fileUrl,
      });
      
      // Reset form and show success message
      setFormData({
        subject: '',
        complaint_type: 'Product',
        details: '',
        priority: 'Medium',
      });
      setFile(null);
      setSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Submit Complaint</h1>
          <p className="mt-1 text-sm text-gray-500">
            We're sorry you're experiencing an issue. Please provide details so we can help resolve it.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              Your complaint has been submitted successfully. Our team will review it and get back to you soon.
            </div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="input-field"
                placeholder="Brief description of your complaint"
              />
            </div>

            <div>
              <label htmlFor="complaint_type" className="block text-sm font-medium text-gray-700 mb-1">
                Complaint Type
              </label>
              <select
                id="complaint_type"
                name="complaint_type"
                value={formData.complaint_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Product">Product</option>
                <option value="Service">Service</option>
                <option value="Delivery">Delivery</option>
                <option value="Billing">Billing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Details
              </label>
              <textarea
                id="details"
                name="details"
                rows={4}
                required
                value={formData.details}
                onChange={handleChange}
                className="input-field"
                placeholder="Please provide detailed information about your complaint"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Attachment (Optional)
              </label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {file.name}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}