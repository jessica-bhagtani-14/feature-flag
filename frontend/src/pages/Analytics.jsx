// frontend/src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {analyticsService} from '../services/analyticsService';
import { 
  Clock, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Flag, 
  Activity, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Calendar,
  Timer,
  CheckCircle,
  XCircle,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  
  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashboard, timeSeries, activity] = await Promise.all([
        analyticsService.getDashboardData(),
        analyticsService.getEvaluationTimeSeries(),
        analyticsService.getRecentActivity()
      ]);
      
      setDashboardData(dashboard);
      setTimeSeriesData(timeSeries.data);
      setActivityData(activity.data);
      
      // Extract unique applications from the dashboard data
      if (dashboard?.data?.appAnalytics) {
        const uniqueApps = dashboard.data.appAnalytics.map(app => ({
          id: app.app_id,
          name: app.app_name,
          description: `${app.total_flags} flags, ${app.total_evaluations} evaluations`
        }));
        setApplications(uniqueApps);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchData();
  };

  // Export functionality
  const handleExport = async () => {
    try {
      const exportData = await analyticsService.exportAnalytics();
      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Time range options
  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const appAnalytics = dashboardData?.data?.appAnalytics || [];
  const performanceMetrics = dashboardData?.data?.performanceMetrics || {};
  const timeSeries = timeSeriesData || [];
  const activities = activityData || [];

  // Filter app analytics based on selected app
  const filteredAppAnalytics = selectedAppId 
    ? appAnalytics.filter(app => String(app.app_id) === String(selectedAppId))
    : appAnalytics;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Feature flag performance and usage insights</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* App Filter */}
            <div className="w-64">
              <ApplicationSelector
                applications={applications}
                selectedAppId={selectedAppId}
                onApplicationSelect={(app) => setSelectedAppId(app ? app.id : null)}
                placeholder="Filter by application"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoRefresh}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Applications"
          value={overview.total_apps || 0}
          icon={Users}
          color="blue"
        />
        <OverviewCard
          title="Total Flags"
          value={overview.total_flags || 0}
          icon={Flag}
          color="green"
        />
        <OverviewCard
          title="Total Evaluations"
          value={overview.total_evaluations || 0}
          icon={Activity}
          color="purple"
        />
        <OverviewCard
          title="Avg Response Time"
          value={`${overview.avg_response_time?.toFixed(1) || 0}ms`}
          icon={Timer}
          color="orange"
        />
      </div>

      {/* Application Analytics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Application Performance
            {selectedAppId && (
              <span className="ml-2 text-sm text-blue-600 font-normal">
                (Filtered)
              </span>
            )}
          </h2>
          {selectedAppId && (
            <button
              onClick={() => setSelectedAppId(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear filter
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evaluations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppAnalytics.map((app) => (
                <tr key={app.app_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{app.app_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {app.total_flags}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.total_evaluations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.avg_response_time?.toFixed(1)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.last_evaluation).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Avg', value: performanceMetrics.overall_stats?.avg_response_time || 0 },
                { name: 'P50', value: performanceMetrics.overall_stats?.p50_response_time || 0 },
                { name: 'P95', value: performanceMetrics.overall_stats?.p95_response_time || 0 },
                { name: 'P99', value: performanceMetrics.overall_stats?.p99_response_time || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Series */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value, name) => [value, name === 'evaluations' ? 'Evaluations' : 'Avg Response (ms)']}
                />
                <Line 
                  type="monotone" 
                  dataKey="evaluations" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_response_time" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.evaluation_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activity.result 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {activity.result ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{activity.flag_name}</span>
                  <span className="text-gray-500">in</span>
                  <span className="font-medium text-blue-600">{activity.app_name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span>{activity.response_time}ms</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics Data</h3>
            <p className="text-gray-600 mb-6">
              This will download all analytics data as a JSON file including overview, app analytics, and performance metrics.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ApplicationSelector Component
const ApplicationSelector = ({ applications, selectedAppId, onApplicationSelect, placeholder = "Select Application" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter applications based on search term
  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected application
  const selectedApp = applications.find(app => String(app.id) === String(selectedAppId));

  const handleApplicationSelect = (app) => {
    onApplicationSelect(app);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onApplicationSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="block truncate">
          {selectedApp ? (
            <span>
              <span className="font-medium">{selectedApp.name}</span>
              {selectedApp.description && (
                <span className="ml-2 text-gray-500 text-sm">- {selectedApp.description}</span>
              )}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="py-1">
            {/* Clear selection option */}
            <button
              onClick={handleClearSelection}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-gray-900 border-b border-gray-100"
            >
              <div className="font-medium text-gray-500">All Applications</div>
              <div className="text-gray-400 text-xs">Show all applications</div>
            </button>
            
            {filteredApplications.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No applications found' : 'No applications available'}
              </div>
            ) : (
              filteredApplications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleApplicationSelect(app)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                    String(selectedAppId) === String(app.id) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{app.name}</div>
                      {app.description && (
                        <div className="text-gray-500 text-xs truncate">{app.description}</div>
                      )}
                    </div>
                    {String(selectedAppId) === String(app.id) && (
                      <Check className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OverviewCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default Analytics;