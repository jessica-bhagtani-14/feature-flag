// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import Loading from '../components/common/Loading';
import { 
  User, 
  Lock, 
  LogOut, 
  Key, 
  Bell, 
  Palette, 
  Shield, 
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    organization: ''
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Theme state
  const [theme, setTheme] = useState('light');
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    flagChanges: true,
    systemUpdates: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      
      if (user) {
        // Set initial data from user context
        setProfileData({
          username: user.username || '',
          email: user.email || '',
          organization: user.organization || ''
        });
      }
      
      // Fetch latest profile data from server
      try {
        const response = await authService.getProfile();
        if (response.data && response.data.user) {
          setProfileData({
            username: response.data.user.username || '',
            email: response.data.user.email || '',
            organization: response.data.user.organization || ''
          });
        }
      } catch (error) {
        console.warn('Failed to fetch profile data:', error);
        // If fetch fails, keep using the user context data
      } finally {
        setIsProfileLoading(false);
      }
    };
  
    fetchProfile();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // You'll need to implement updateProfile in authService
      // await authService.updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        toast.success('Logged out successfully');
      } catch (error) {
        toast.error('Logout failed');
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Export', icon: Download },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-600">
          Update your personal information and organization details.
        </p>
      </div>
      
      {isProfileLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Loading profile..." />
        </div>
      ) : (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={profileData.username}
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
              Organization
            </label>
            <input
              type="text"
              id="organization"
              value={profileData.organization}
              onChange={(e) => setProfileData({...profileData, organization: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loading size="sm" text="" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <p className="mt-1 text-sm text-gray-600">
          Update your password to keep your account secure.
        </p>
      </div>
      
      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="mt-1 relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="mt-1 relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="mt-1 relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loading size="sm" text="" /> : 'Change Password'}
          </button>
        </div>
      </form>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900">Logout</h3>
        <p className="mt-1 text-sm text-gray-600">
          Sign out of your account on this device.
        </p>
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlaceholderTab = (title, description) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">This section is coming soon...</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'api-keys':
        return renderPlaceholderTab('API Keys', 'Manage your API keys for feature flag integrations.');
      case 'notifications':
        return renderPlaceholderTab('Notifications', 'Configure your notification preferences.');
      case 'appearance':
        return renderPlaceholderTab('Appearance', 'Customize the look and feel of your dashboard.');
      case 'data':
        return renderPlaceholderTab('Data & Export', 'Export your data and manage backups.');
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;