import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getNews } from '../api/erpnextApi';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const response = await getNews();
        setNews(response.data || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Company News</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with the latest announcements and updates.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-6">
            {news.map((item) => (
              <div key={item.name} className="card overflow-hidden">
                {item.image && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                    <span className="text-sm text-gray-500">{formatDate(item.published_date)}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{item.summary}</p>
                  {item.content && (
                    <div 
                      className="prose max-w-none text-gray-700" 
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}
                  {item.link && (
                    <div className="mt-4">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Read more →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="text-gray-500">No news available at this time.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}