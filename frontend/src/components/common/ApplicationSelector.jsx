// frontend/src/components/common/ApplicationSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, Check } from 'lucide-react';
import { applicationService } from '../../services/applicationService';

const ApplicationSelector = ({ selectedAppId, onApplicationSelect, placeholder = "Select Application" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getApplications,
  });

  // Filter applications based on search term
  const filteredApplications = applications?.data?.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Find selected application - handle both string and number IDs
  const selectedApp = applications?.data?.find(app => {
    // Convert both to strings for comparison since URL params are always strings
    return String(app.id) === String(selectedAppId);
  });

  // Debug logging (remove in production)
  console.log('ApplicationSelector - selectedAppId:', selectedAppId, 'type:', typeof selectedAppId);
  console.log('ApplicationSelector - applications:', applications?.data);
  console.log('ApplicationSelector - selectedApp:', selectedApp);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplicationSelect = (app) => {
    onApplicationSelect(app);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        disabled={isLoading}
      >
        <span className="block truncate">
          {isLoading ? (
            'Loading applications...'
          ) : selectedApp ? (
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
          <ChevronDown 
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {/* Search Input */}
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* Application List */}
          <div className="py-1">
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
                    String(selectedAppId) === String(app.id) ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
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
                      <Check className="h-4 w-4 text-primary-600 ml-2 flex-shrink-0" />
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

export default ApplicationSelector;