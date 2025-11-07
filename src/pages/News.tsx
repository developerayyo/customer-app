import { Layout } from '../components/layout/Layout';
import { Newspaper, Calendar } from 'lucide-react';

export function News() {
  const newsItems = [
    {
      id: 1,
      title: 'New Product Lines Available',
      date: '2025-10-25',
      category: 'Product Updates',
      content:
        'We\'re excited to announce the expansion of our inventory with premium product selections. These new additions include cutting-edge solutions designed to meet your evolving business needs. Check the price list for detailed information on availability and pricing.',
      featured: true,
    },
    {
      id: 2,
      title: 'Holiday Shipping Schedule',
      date: '2025-10-20',
      category: 'Logistics',
      content:
        'Important updates regarding delivery times for the upcoming holiday season. Please note that processing times may be extended during peak periods. We recommend placing orders early to ensure timely delivery.',
      featured: false,
    },
    {
      id: 3,
      title: 'Price Updates Effective November 1st',
      date: '2025-10-15',
      category: 'Pricing',
      content:
        'Review the latest pricing adjustments in your price list. These changes reflect current market conditions and our continued commitment to providing competitive pricing. Contact your account manager for specific questions.',
      featured: false,
    },
    {
      id: 4,
      title: 'Enhanced Customer Portal Features',
      date: '2025-10-10',
      category: 'System Updates',
      content:
        'We\'ve updated the customer portal with new features including improved order tracking, faster invoice access, and enhanced payment processing. Explore the updated interface to discover all the improvements.',
      featured: false,
    },
    {
      id: 5,
      title: 'Sustainability Initiative Launch',
      date: '2025-10-05',
      category: 'Company News',
      content:
        'LordsMint is proud to announce our new sustainability initiative. We\'re committed to reducing our environmental impact through eco-friendly packaging, optimized logistics, and responsible sourcing practices.',
      featured: false,
    },
  ];

  const categories = ['All', 'Product Updates', 'Logistics', 'Pricing', 'System Updates', 'Company News'];

  return (
    <Layout>
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="mb-1">News & Updates</h1>
              <p className="text-muted-foreground">
                Stay informed with the latest announcements
              </p>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-lg border border-border hover:border-[#D4AF37] hover:bg-accent transition-all whitespace-nowrap"
                style={{ fontSize: '14px' }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured News */}
        {newsItems.filter((item) => item.featured).map((item) => (
          <div key={item.id} className="card mb-8 bg-gradient-to-br from-accent to-background border-[#D4AF37]">
            <div className="flex items-start gap-3 mb-4">
              <span className="badge-gold">Featured</span>
              <span className="badge-gold">{item.category}</span>
            </div>
            <h2 className="mb-3">{item.title}</h2>
            <p className="text-muted-foreground mb-4">{item.content}</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Regular News */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsItems
            .filter((item) => !item.featured)
            .map((item) => (
              <div key={item.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-gold" style={{ fontSize: '12px' }}>
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span style={{ fontSize: '12px' }}>
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <h3 className="mb-3">{item.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {item.content}
                </p>
              </div>
            ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="btn-secondary">
            Load More News
          </button>
        </div>
      </div>
    </Layout>
  );
}
