// EXAMPLE: ApplicationManagement Component Template
// Location: src/components/applications/ApplicationManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { jobService } from '../../services/jobService';
import { Application, ApplicationFilters, BulkAction } from '../../types';

interface ApplicationManagementProps {
  userType: 'tradie' | 'helper';
}

export const ApplicationManagement: React.FC<ApplicationManagementProps> = ({ 
  userType 
}) => {
  // State management
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    dateRange: '30days',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // API integration
  // TODO: const { jobs } = useJobs(); // Currently unused

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobService.getApplications(filters, userType);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filters, userType]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedApplications.length === 0) return;

    try {
      await jobService.bulkUpdateApplications(selectedApplications, action);
      await fetchApplications(); // Refresh data
      setSelectedApplications([]); // Clear selection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    }
  };

  const handleFilterChange = (newFilters: Partial<ApplicationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Statistics calculations
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading applications</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <div className="mt-3">
              <Button 
                onClick={fetchApplications}
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {userType === 'tradie' ? 'Job Applications' : 'My Applications'}
        </h1>
        
        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedApplications.length} selected
            </span>
            <Button
              onClick={() => handleBulkAction('accept')}
              variant="primary"
              size="sm"
            >
              Accept Selected
            </Button>
            <Button
              onClick={() => handleBulkAction('reject')}
              variant="secondary"
              size="sm"
            >
              Reject Selected
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-sm text-gray-600">Accepted</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as ApplicationFilters['status'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange({ dateRange: e.target.value as ApplicationFilters['dateRange'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as ApplicationFilters['sortBy'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="created_at">Date Applied</option>
              <option value="job_title">Job Title</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange({ sortOrder: e.target.value as ApplicationFilters['sortOrder'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
              <p className="text-gray-500">
                {filters.status === 'all' 
                  ? 'No applications match your current filters.' 
                  : `No ${filters.status} applications found.`
                }
              </p>
            </div>
          </Card>
        ) : (
          applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              userType={userType}
              isSelected={selectedApplications.includes(application.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedApplications(prev => [...prev, application.id]);
                } else {
                  setSelectedApplications(prev => prev.filter(id => id !== application.id));
                }
              }}
              onStatusUpdate={fetchApplications}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Supporting component
interface ApplicationCardProps {
  application: Application;
  userType: 'tradie' | 'helper';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onStatusUpdate: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  userType,
  isSelected,
  onSelect,
  // TODO: onStatusUpdate - Currently unused but may be needed for status updates
}) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {userType === 'tradie' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {application.job.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[application.status]}`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Location:</strong> {application.job.location}</p>
              <p><strong>Budget:</strong> ${application.job.budget}</p>
              <p><strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
            </div>
            
            {application.message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{application.message}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Navigate to application details */}}
          >
            View Details
          </Button>
          
          {userType === 'tradie' && application.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {/* Handle accept */}}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {/* Handle reject */}}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ApplicationManagement;