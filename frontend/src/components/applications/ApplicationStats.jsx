// frontend/src/components/applications/ApplicationStats.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flag, ToggleLeft, ToggleRight } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import Loading from '../common/Loading';

const ApplicationStats = ({ appId, appName }) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['applicationStats', appId],
    queryFn: () => applicationService.getApplicationStats(appId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loading size="sm" text="Loading statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-sm">Failed to load statistics</p>
      </div>
    );
  }

  const statsData = stats?.data?.stats || {
    total_flags: 0,
    enabled_flags: 0,
    disabled_flags: 0
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Flag className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">
          Statistics for {appName}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <Flag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Flags</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData.total_flags || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <ToggleRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enabled Flags</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData.enabled_flags || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                <ToggleLeft className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Disabled Flags</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData.disabled_flags || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {statsData.total_flags > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Flag Status</span>
            <span className="text-sm text-gray-500">
              {Math.round((statsData.enabled_flags / statsData.total_flags) * 100)}% enabled
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(statsData.enabled_flags / statsData.total_flags) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}

      {statsData.total_flags === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            No feature flags created yet for this application
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationStats;