// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import Loading from '../components/common/Loading';

const Dashboard = () => {
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getApplications,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => applicationService.getStats(),
  });

  if (appsLoading || statsLoading) {
    return <Loading size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your feature flags and applications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {applications?.data?.length || 0}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications?.data?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                <span className="text-success-600 font-semibold text-sm">
                  0
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Flags</p>
              <p className="text-2xl font-bold text-gray-900">{userStats?.data?.stats?.enabled_flags || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">
                  0
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Flags</p>
              <p className="text-2xl font-bold text-gray-900">{userStats?.data?.stats?.total_flags ||0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-sm">
                  0
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive Flags</p>
              <p className="text-2xl font-bold text-gray-900"> {userStats?.data?.stats?.disabled_flags ||0 }</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Applications
        </h2>
        {applications?.data?.length > 0 ? (
          <div className="space-y-3">
            {applications.data.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">API Key</p>
                  <p className="text-xs font-mono text-gray-900">
                    {app.api_key?.substring(0, 8)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No applications found. Create your first application to get started.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;