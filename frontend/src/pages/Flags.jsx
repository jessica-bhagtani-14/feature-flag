// frontend/src/pages/Flags.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Flag } from 'lucide-react';
import { flagService } from '../services/flagService';
import Loading from '../components/common/Loading';
import ApplicationSelector from '../components/common/ApplicationSelector';
import FlagTable from '../components/flags/flagTable';

const Flags = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  const selectedAppId = searchParams.get('app');
  
  // Debug logging (remove in production)
  console.log('selectedAppId:', selectedAppId);

  // Only fetch flags if an application is selected
  const { 
    data: flags, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['flags', selectedAppId],
    queryFn: () => flagService.getFlags(selectedAppId),
    enabled: !!selectedAppId, // Only run query if appId exists
  });

  // Handle application selection
  const handleApplicationSelect = (app) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (app) {
      newSearchParams.set('app', app.id);
    } else {
      newSearchParams.delete('app');
    }
    setSearchParams(newSearchParams);
    setSearchTerm(''); // Clear search when switching apps
  };

  // Filter flags based on search term
  const filteredFlags = flags?.data?.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateFlag = () => {
    if (selectedAppId) {
      navigate(`/apps/${selectedAppId}/flags/new`);
    } else {
      // Show error or redirect to select app first
      alert('Please select an application first');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600">
            Manage feature flags for your applications
          </p>
        </div>
        <button
          onClick={handleCreateFlag}
          disabled={!selectedAppId}
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!selectedAppId ? "Select an application first" : "Create new flag"}
        >
          <Plus className="h-4 w-4" />
          <span>New Flag</span>
        </button>
      </div>

      {/* Application Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Application
        </label>
        <div className="max-w-md">
          <ApplicationSelector
            selectedAppId={selectedAppId}
            onApplicationSelect={handleApplicationSelect}
            placeholder="Choose an application to view flags"
          />
        </div>
      </div>

      {/* Show content only if application is selected */}
      {selectedAppId ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loading size="lg" text="Loading flags..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <p className="text-lg font-medium">Error loading flags</p>
                <p className="text-sm">{error.message}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Flags Content */}
          {!isLoading && !error && (
            <>
              {/* Flags Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {searchTerm ? (
                    <>
                      Showing {filteredFlags.length} of {flags?.data?.length || 0} flags
                    </>
                  ) : (
                    <>
                      {flags?.data?.length || 0} flag{(flags?.data?.length || 0) !== 1 ? 's' : ''} total
                    </>
                  )}
                </p>
              </div>

              {/* Flags Table or Empty State */}
              {filteredFlags.length > 0 ? (
                <FlagTable 
                  flags={filteredFlags} 
                  onRefetch={refetch}
                  selectedAppId={selectedAppId}
                />
              ) : (
                <div className="text-center py-12">
                  {searchTerm ? (
                    <div>
                      <p className="text-gray-500 text-lg mb-2">No flags found</p>
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
                      <Flag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No flags yet</p>
                      <p className="text-gray-400 text-sm mb-6">
                        Create your first feature flag for this application
                      </p>
                      <button
                        onClick={handleCreateFlag}
                        className="btn btn-primary"
                      >
                        Create Flag
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* No Application Selected State */
        <div className="text-center py-16">
          <Flag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Application</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Choose an application from the dropdown above to view and manage its feature flags.
          </p>
        </div>
      )}
    </div>
  );
};

export default Flags;