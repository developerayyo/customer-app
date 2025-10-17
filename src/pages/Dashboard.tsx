import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getNews } from '../api/erpnextApi';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const newsItems = await getNews();
        setNews(newsItems || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <Layout>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div>
        <h2 className="text-xl font-semibold mb-4">News</h2>
        <ul className="space-y-2">
          {news.map((n, idx) => (
            <li key={idx} className="p-3 bg-white rounded shadow">
              <h4 className="font-semibold">{n.title}</h4>
              <p className="text-sm text-gray-700">{n.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}