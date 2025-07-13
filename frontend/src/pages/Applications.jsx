// frontend/src/pages/Applications.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import Loading from '../components/common/Loading';
import ApplicationTable from '../components/applications/ApplicationTable';

const Applications = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    data: applications, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getApplications,
  });

  // Filter applications based on search term
  const filteredApplications = applications?.data?.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading applications..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-medium">Error loading applications</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">
            Manage your applications and their API keys
          </p>
        </div>
        <button
          onClick={() => navigate('/applications/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Applications Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {searchTerm ? (
            <>
              Showing {filteredApplications.length} of {applications?.data?.length || 0} applications
            </>
          ) : (
            <>
              {applications?.data?.length || 0} application{(applications?.data?.length || 0) !== 1 ? 's' : ''} total
            </>
          )}
        </p>
      </div>

      {/* Applications Table */}
      {filteredApplications.length > 0 ? (
        <ApplicationTable 
          applications={filteredApplications} 
          onRefetch={refetch}
        />
      ) : (
        <div className="text-center py-12">
          {searchTerm ? (
            <div>
              <p className="text-gray-500 text-lg mb-2">No applications found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search terms
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-lg mb-2">No applications yet</p>
              <p className="text-gray-400 text-sm mb-6">
                Create your first application to get started with feature flags
              </p>
              <button
                onClick={() => navigate('/applications/new')}
                className="btn btn-primary"
              >
                Create Application
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;