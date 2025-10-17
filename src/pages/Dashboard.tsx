import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import useAuthStore from '../store/useAuthStore';
import api, { findCustomerByPortalUser } from '../api/erpnextApi';
import { formatNaira } from '../utils/currency';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Map username to Customer name via portal_user child table
          const customerDoc = await findCustomerByPortalUser(user);
          const customerName = customerDoc?.name || user;
          const [ordersResponse, invoicesResponse, newsResponse] = await Promise.all([
            api.get(`/resource/Sales Order?filters=[["customer","=","${customerName}"]]`),
            api.get(`/resource/Sales Invoice?filters=[["customer","=","${customerName}"]]`),
            api.get('/resource/Website News')
          ]);

          const orders = (ordersResponse.data?.data ?? ordersResponse.data ?? []) as any[];
          const invoices = (invoicesResponse.data?.data ?? invoicesResponse.data ?? []) as any[];
          const newsItems = (newsResponse.data?.data ?? newsResponse.data ?? []) as any[];

          setRecentOrders(orders.slice(0, 5));
          setRecentInvoices(invoices.slice(0, 5));
          setNews(newsItems.slice(0, 3));
        }
      } catch (error) {
        // Log minimally and continue; allow page to render with empty lists
        console.warn('Error fetching dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/orders" className="card-interactive hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">New Order</h3>
                <p className="mt-1 text-sm text-gray-500">Place a new order for products</p>
              </Link>
              
              <Link to="/invoices" className="card-interactive hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">View Invoices</h3>
                <p className="mt-1 text-sm text-gray-500">Check and download your invoices</p>
              </Link>
              
              <Link to="/price-list" className="card-interactive hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">Price List</h3>
                <p className="mt-1 text-sm text-gray-500">View current product prices</p>
              </Link>
              
              <Link to="/complaints" className="card-interactive hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">Support</h3>
                <p className="mt-1 text-sm text-gray-500">Submit complaints or feedback</p>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="card-interactive">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              
              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order: any) => (
                        <tr key={order.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            <Link to={`/orders/${order.name}`}>{order.name}</Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.creation).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNaira(order.grand_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent orders found.</p>
              )}
            </div>

            {/* Latest News */}
            <div className="card-interactive">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Latest News</h2>
                <Link to="/news" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              
              {news.length > 0 ? (
                <div className="space-y-4">
                  {news.map((item: any) => (
                    <div key={item.name} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-md font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.content.substring(0, 150)}...</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(item.creation).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No news available.</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}