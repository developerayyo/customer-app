import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import useAuthStore from '../store/useAuthStore';
import { findCustomerByPortalUser, getSalesOrders, getSalesInvoices, getPaymentEntries, getNews } from '../api/erpnextApi';
import { formatNaira } from '../utils/currency';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState<string>('');

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        let mappedName = user || '';
        if (user) {
          try {
            const doc = await findCustomerByPortalUser(user);
            mappedName = (doc as any)?.name || user;
          } catch {}
        }
        setCustomerName(mappedName);

        // Fetch recent activity
        let ordersRows: any[] = [];
        try {
          if (mappedName) {
            const resp = await getSalesOrders(mappedName, { page: 1, pageSize: 5, sortBy: 'creation', sortOrder: 'desc', docstatusIn: [0, 1] });
            const payload = resp?.data ?? resp;
            ordersRows = payload?.data ?? payload ?? [];
            setRecentOrders(ordersRows);
          }
        } catch (err) {
          console.warn('Orders fetch failed:', err);
        }

        try {
          if (mappedName) {
            const invRows = await getSalesInvoices(mappedName, { page: 1, pageSize: 5, sortBy: 'creation', sortOrder: 'desc', docstatusIn: [0, 1] });
            setRecentInvoices(Array.isArray(invRows) ? invRows : []);
          }
        } catch (err) {
          console.warn('Invoices fetch failed:', err);
        }

        try {
          if (mappedName) {
            const payRows = await getPaymentEntries(mappedName, { page: 1, pageSize: 5, sortBy: 'creation', sortOrder: 'desc', docstatusIn: [1] });
            setRecentPayments(Array.isArray(payRows) ? payRows : []);
          }
        } catch (err) {
          console.warn('Payments fetch failed:', err);
        }

        // Fetch announcements/news (non-blocking)
        try {
          const newsResp = await getNews();
          const raw = newsResp?.data ?? newsResp ?? [];
          setNews(Array.isArray(raw) ? raw.slice(0, 3) : []);
        } catch (err) {
          setNews([]);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('Some dashboard data failed to load.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const totalRecentInvoiceAmount = recentInvoices.reduce((sum, inv: any) => sum + (Number(inv.grand_total) || 0), 0);
  const totalRecentPayments = recentPayments.reduce((sum, p: any) => sum + (Number(p.paid_amount) || 0), 0);
  const nextDueDate = recentInvoices
    .map((inv: any) => inv.due_date)
    .filter(Boolean)
    .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())[0];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          {customerName && (
            <p className="mt-1 text-sm text-gray-500">Welcome back, {customerName}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="text-sm text-yellow-800">{error}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <div className="text-sm text-gray-500">Recent Orders</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{recentOrders.length}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500">Recent Invoices Total</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatNaira(totalRecentInvoiceAmount)}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500">Recent Payments</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{formatNaira(totalRecentPayments)}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500">Next Due</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{nextDueDate ? new Date(nextDueDate).toLocaleDateString() : '-'}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="flex flex-wrap gap-2">
                <Link to="/orders" className="btn-primary">Create Order</Link>
                <Link to="/invoices" className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">View Invoices</Link>
                <Link to="/payments" className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">View Payments</Link>
                <Link to="/price-list" className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Price List</Link>
                <Link to="/complaints" className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Raise Complaint</Link>
                <Link to="/feedback" className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Send Feedback</Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                  <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(recentOrders || []).map((o: any) => (
                        <tr key={o.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            <Link to={`/orders/${o.name}`}>{o.name}</Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.creation ? new Date(o.creation).toLocaleString() : o.transaction_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNaira(o.grand_total || 0)}</td>
                        </tr>
                      ))}
                      {(recentOrders || []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No recent orders.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
                  <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
                </div>
                <ul className="divide-y divide-gray-200">
                  {(recentInvoices || []).map((inv: any) => (
                    <li key={inv.name} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <div className="text-gray-900">{inv.name}</div>
                        <div className="text-gray-500">{new Date(inv.posting_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-gray-900">{formatNaira(inv.grand_total || 0)}</div>
                    </li>
                  ))}
                  {(recentInvoices || []).length === 0 && (
                    <li className="py-3 text-sm text-gray-500">No recent invoices.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Payments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Payments</h2>
                <Link to="/payments" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
              </div>
              <ul className="divide-y divide-gray-200">
                {(recentPayments || []).map((p: any) => (
                  <li key={p.name} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="text-gray-900">{p.name}</div>
                      <div className="text-gray-500">{new Date(p.posting_date).toLocaleDateString()} · {p.mode_of_payment}</div>
                    </div>
                    <div className="text-gray-900">{formatNaira(p.paid_amount || 0)}</div>
                  </li>
                ))}
                {(recentPayments || []).length === 0 && (
                  <li className="py-3 text-sm text-gray-500">No recent payments.</li>
                )}
              </ul>
            </div>

            {/* Announcements */}
            {news.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Announcements</h2>
                <ul className="space-y-2">
                  {news.map((n: any, idx: number) => (
                    <li key={n.name || idx} className="p-3 bg-white rounded border">
                      <h4 className="font-semibold">{n.title || n.name}</h4>
                      <p className="text-sm text-gray-700">{n.content || n.subtitle || ''}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}