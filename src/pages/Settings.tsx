import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, Globe, Moon, Sun } from 'lucide-react';
import { SmartBackButton } from '../components/ui/back-button';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile saved');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password changed');
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <SmartBackButton label="Back" className="mb-6" fallbackTo="/" />
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="mb-1">Settings</h1>
            <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
              Manage your account preferences and settings
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <User className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3>Profile Information</h3>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">First Name</label>
                <input type="text" defaultValue="John" className="input-field" />
              </div>
              <div>
                <label className="block mb-2">Last Name</label>
                <input type="text" defaultValue="Doe" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block mb-2">Email Address</label>
              <input type="email" defaultValue="john.doe@example.com" className="input-field" />
            </div>
            <div>
              <label className="block mb-2">Company</label>
              <input type="text" defaultValue="Acme Corporation" className="input-field" />
            </div>
            <div>
              <label className="block mb-2">Phone Number</label>
              <input type="tel" defaultValue="+1 (555) 123-4567" className="input-field" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-[#D4AF37]" />
            <h3>Appearance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Theme</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Choose your preferred color scheme
                </p>
              </div>
              <button
                onClick={handleThemeToggle}
                className="btn-secondary flex items-center gap-2"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'light' ? 'Dark' : 'Light'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            <h3>Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Email Notifications</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Receive notifications via email
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p>Order Updates</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Get notified about order status changes
                </p>
              </div>
              <Switch checked={orderUpdates} onCheckedChange={setOrderUpdates} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p>Payment Alerts</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Receive alerts for payment transactions
                </p>
              </div>
              <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p>Newsletter</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Subscribe to our monthly newsletter
                </p>
              </div>
              <Switch checked={newsletter} onCheckedChange={setNewsletter} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
            <h3>Security</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block mb-2">Current Password</label>
              <input type="password" className="input-field" required />
            </div>
            <div>
              <label className="block mb-2">New Password</label>
              <input type="password" className="input-field" required />
            </div>
            <div>
              <label className="block mb-2">Confirm New Password</label>
              <input type="password" className="input-field" required />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Change Password
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card border-destructive">
          <h3 className="mb-4 text-destructive">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Delete Account</p>
                <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
