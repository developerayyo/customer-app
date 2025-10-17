import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'en',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setPreferences(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSave = () => {
    // Save preferences to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Apply dark mode if enabled
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Show success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              Your settings have been saved successfully.
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="input-field bg-gray-50">{user?.full_name || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="input-field bg-gray-50">{user?.email || 'N/A'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <div className="input-field bg-gray-50">{user?.name || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="input-field bg-gray-50">{user?.phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center">
                <input
                  id="notifications"
                  name="notifications"
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                  Enable push notifications
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Receive notifications about order updates and important announcements.
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  id="emailUpdates"
                  name="emailUpdates"
                  type="checkbox"
                  checked={preferences.emailUpdates}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailUpdates" className="ml-2 block text-sm text-gray-700">
                  Receive email updates
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Get email notifications about order status, promotions, and news.
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  id="darkMode"
                  name="darkMode"
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700">
                  Dark mode
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Use dark theme for better visibility in low-light environments.
              </p>
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={preferences.language}
                onChange={handleChange}
                className="input-field"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>

        <div className="card bg-red-50">
          <h2 className="text-lg font-medium text-red-700 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-600 mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="space-y-4">
            <button
              onClick={logout}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}