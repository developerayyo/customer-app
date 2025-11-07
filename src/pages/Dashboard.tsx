import { Layout } from '../components/layout/Layout';
import { ShoppingCart, FileText, CreditCard, TrendingUp, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { KPICard } from '../components/KPICard';

export function Dashboard() {
  const kpis = [
    {
      title: 'Active Orders',
      value: '24',
      icon: ShoppingCart,
      trend: { value: '12% from last month', direction: 'up' as const },
    },
    {
      title: 'Pending Invoices',
      value: '8',
      icon: FileText,
      trend: { value: '3 overdue', direction: 'down' as const },
    },
    {
      title: 'Total Payments',
      value: '$48,524',
      icon: CreditCard,
      trend: { value: '23% from last month', direction: 'up' as const },
    },
  ];

  const quickLinks = [
    { name: 'Create New Order', href: '/orders/create', description: 'Start a new order request' },
    { name: 'View Price List', href: '/price-list', description: 'Check current pricing' },
    { name: 'Submit Feedback', href: '/feedback', description: 'Share your thoughts' },
  ];

  const recentNews = [
    {
      id: 1,
      title: 'New Product Lines Available',
      date: '2025-10-25',
      excerpt: 'We\'ve expanded our inventory with premium product selections.',
    },
    {
      id: 2,
      title: 'Holiday Shipping Schedule',
      date: '2025-10-20',
      excerpt: 'Important updates regarding delivery times for the holiday season.',
    },
    {
      id: 3,
      title: 'Price Updates Effective November 1st',
      date: '2025-10-15',
      excerpt: 'Review the latest pricing adjustments in your price list.',
    },
  ];

  const navigate = useNavigate();

  const handleCreateOrder = () => {
    navigate('/orders/create');
  };

  return (
    <Layout
      onCreateOrder={handleCreateOrder}
      showFab={true}
    >
      <div className="p-3 xs:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-3">Welcome to LordsMint</h1>
          <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
            Manage your orders, payments, and business activities
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-10">
          <h2 className="mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {quickLinks.map((link) => (
              <Link key={link.name} to={link.href} className="card-interactive group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[#D4AF37] group-hover:text-[#B9972C] transition-colors mb-2">
                      {link.name}
                    </h3>
                    <p className="text-muted-foreground" style={{ fontSize: '14px', lineHeight: '20px' }}>
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2>Recent News</h2>
            <Link to="/news" className="text-[#D4AF37] hover:text-[#B9972C] transition-colors flex items-center gap-2">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-5">
            {recentNews.map((news) => (
              <div key={news.id} className="card hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="flex-1">{news.title}</h3>
                      <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '12px', lineHeight: '18px' }}>
                        {new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: '14px', lineHeight: '20px' }}>
                      {news.excerpt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
