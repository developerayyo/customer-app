import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MessageCircle, Send, Star } from 'lucide-react';
import { SmartBackButton } from '../components/ui/back-button';

export function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ rating, category, message });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setCategory('');
      setMessage('');
    }, 3000);
  };

  const categories = [
    'Product Quality',
    'Delivery Service',
    'Customer Support',
    'Pricing',
    'Website Experience',
    'General',
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <SmartBackButton label="Back" className="mb-6" fallbackTo="/" />
      </div>
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="mb-2">Share Your Feedback</h1>
        <p className="text-muted-foreground">
          We value your input and use it to improve our services
        </p>
      </div>

      {submitted ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2">Thank You!</h2>
          <p className="text-muted-foreground">
            Your feedback has been submitted successfully
          </p>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="text-center">
              <label className="block mb-4">How would you rate your experience?</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-[#D4AF37] text-[#D4AF37]'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-[#D4AF37]" style={{ fontSize: '14px' }}>
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block mb-2">Feedback Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-lg border transition-all ${
                      category === cat
                        ? 'border-[#D4AF37] bg-accent text-[#D4AF37]'
                        : 'border-border hover:border-[#D4AF37]/50 hover:bg-muted'
                    }`}
                    style={{ fontSize: '14px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block mb-2">Your Feedback</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more about your experience..."
                className="input-field min-h-40 resize-none"
                required
              />
              <p className="text-muted-foreground mt-2" style={{ fontSize: '12px' }}>
                {message.length} / 500 characters
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={rating === 0 || !category || !message}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Feedback
            </button>
          </form>
        </div>
      )}

      {/* Recent Feedback (if any) */}
      <div className="mt-8">
        <h3 className="mb-4">Your Recent Feedback</h3>
        <div className="card">
          <p className="text-muted-foreground text-center py-8">
            No previous feedback submissions
          </p>
        </div>
      </div>
    </div>
  );
}
