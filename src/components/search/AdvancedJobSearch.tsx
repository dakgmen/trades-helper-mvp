import React, { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Star, Clock, DollarSign, Bookmark, BookmarkCheck, X, Filter } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
    distance?: number;
  };
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate?: string;
    isUrgent: boolean;
    estimatedDuration?: string;
  };
  requirements: {
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    certifications: string[];
    equipment: string[];
  };
  poster: {
    id: string;
    name: string;
    rating: number;
    totalJobs: number;
    verified: boolean;
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: number;
  postedAt: string;
  saved?: boolean;
  matchScore?: number;
}

interface SearchFilters {
  query: string;
  category: string;
  location: string;
  radius: number;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly' | 'any';
  experienceLevel: string[];
  skills: string[];
  isUrgent: boolean;
  postedWithin: '24h' | '7d' | '30d' | 'any';
  sortBy: 'relevance' | 'date' | 'budget' | 'distance' | 'rating';
  sortOrder: 'asc' | 'desc';
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alertsEnabled: boolean;
  created_at: string;
}

export const AdvancedJobSearch: React.FC = () => {
  // useAuth() removed as profile was unused
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    location: '',
    radius: 50,
    budgetMin: 0,
    budgetMax: 10000,
    budgetType: 'any',
    experienceLevel: [],
    skills: [],
    isUrgent: false,
    postedWithin: 'any',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const categories = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Renovation',
    'Maintenance', 'Landscaping', 'Roofing', 'Flooring', 'HVAC'
  ];

  // const skillsOptions = [
  //   'Power Tools', 'Hand Tools', 'Blueprint Reading', 'Safety Procedures',
  //   'Lifting Heavy Objects', 'Working at Heights', 'Confined Spaces',
  //   'Customer Service', 'Team Work', 'Problem Solving'
  // ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
  ];

  const searchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call with filtered results
      const mockJobs: Job[] = [
        {
          id: 'job_1',
          title: 'Kitchen Renovation Helper Needed',
          description: 'Looking for an experienced helper to assist with a kitchen renovation project. Must have experience with tiling and cabinet installation.',
          category: 'Renovation',
          skills: ['Power Tools', 'Lifting Heavy Objects', 'Customer Service'],
          location: {
            address: 'Sydney, NSW',
            latitude: -33.8688,
            longitude: 151.2093,
            distance: 5.2
          },
          budget: {
            type: 'fixed',
            amount: 1200,
            currency: 'AUD'
          },
          timeline: {
            startDate: '2024-01-15',
            endDate: '2024-01-20',
            isUrgent: false,
            estimatedDuration: '5 days'
          },
          requirements: {
            experienceLevel: 'intermediate',
            certifications: [],
            equipment: ['Basic Hand Tools']
          },
          poster: {
            id: 'tradie_1',
            name: 'Mike Johnson',
            rating: 4.8,
            totalJobs: 127,
            verified: true
          },
          status: 'open',
          applicants: 3,
          postedAt: '2024-01-10T09:00:00Z',
          saved: false,
          matchScore: 92
        }
      ];
      setJobs(mockJobs);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedSearches = useCallback(async () => {
    // Load saved searches from storage or API
    const mockSavedSearches: SavedSearch[] = [];
    setSavedSearches(mockSavedSearches);
  }, []);

  // Load initial data
  useEffect(() => {
    searchJobs();
    loadSavedSearches();
  }, [loadSavedSearches, searchJobs]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSaveJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  }, []);

  // Mock data removed for now
  const mockJobs = [{
          id: 'job_1',
          title: 'Kitchen Renovation Helper Needed',
          description: 'Looking for an experienced helper to assist with a kitchen renovation project. Must have experience with tiling and cabinet installation.',
          category: 'Renovation',
          skills: ['Power Tools', 'Lifting Heavy Objects', 'Customer Service'],
          location: {
            address: 'Sydney, NSW',
            latitude: -33.8688,
            longitude: 151.2093,
            distance: 5.2
          },
          budget: {
            type: 'fixed',
            amount: 1200,
            currency: 'AUD'
          },
          timeline: {
            startDate: '2024-01-15',
            endDate: '2024-01-20',
            isUrgent: false,
            estimatedDuration: '5 days'
          },
          requirements: {
            experienceLevel: 'intermediate',
            certifications: [],
            equipment: ['Basic Hand Tools']
          },
          poster: {
            id: 'tradie_1',
            name: 'Mike Johnson',
            rating: 4.8,
            totalJobs: 127,
            verified: true
          },
          status: 'open',
          applicants: 3,
          postedAt: '2024-01-10T09:00:00Z',
          saved: false,
          matchScore: 92
        },
        {
          id: 'job_2',
          title: 'Urgent Plumbing Assistant Required',
          description: 'Emergency plumbing job needs an assistant. Must be available immediately and have experience with pipe work.',
          category: 'Plumbing',
          skills: ['Power Tools', 'Problem Solving', 'Working at Heights'],
          location: {
            address: 'Melbourne, VIC',
            latitude: -37.8136,
            longitude: 144.9631,
            distance: 12.8
          },
          budget: {
            type: 'hourly',
            amount: 35,
            currency: 'AUD'
          },
          timeline: {
            startDate: '2024-01-11',
            isUrgent: true,
            estimatedDuration: '1-2 days'
          },
          requirements: {
            experienceLevel: 'intermediate',
            certifications: ['White Card'],
            equipment: []
          },
          poster: {
            id: 'tradie_2',
            name: 'Sarah Chen',
            rating: 4.9,
            totalJobs: 89,
            verified: true
          },
          status: 'open',
          applicants: 1,
          postedAt: '2024-01-10T15:30:00Z',
          saved: true,
          matchScore: 87
        }
      ];

      // Apply filters (simplified for demo)
      let filteredJobs = mockJobs;

      if (filters.query) {
        filteredJobs = filteredJobs.filter(job =>
          job.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          job.description.toLowerCase().includes(filters.query.toLowerCase())
        );
      }

      if (filters.category) {
        filteredJobs = filteredJobs.filter(job => job.category === filters.category);
      }

      if (filters.isUrgent) {
        filteredJobs = filteredJobs.filter(job => job.timeline.isUrgent);
      }

      if (filters.experienceLevel.length > 0) {
        filteredJobs = filteredJobs.filter(job =>
          filters.experienceLevel.includes(job.requirements.experienceLevel)
        );
      }

      // Sort results
      filteredJobs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return filters.sortOrder === 'desc'
              ? new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
              : new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          case 'budget':
            return filters.sortOrder === 'desc'
              ? b.budget.amount - a.budget.amount
              : a.budget.amount - b.budget.amount;
          case 'distance':
            return filters.sortOrder === 'desc'
              ? (b.location.distance || 0) - (a.location.distance || 0)
              : (a.location.distance || 0) - (b.location.distance || 0);
          case 'rating':
            return filters.sortOrder === 'desc'
              ? b.poster.rating - a.poster.rating
              : a.poster.rating - b.poster.rating;
          default: // relevance
            return (b.matchScore || 0) - (a.matchScore || 0);
        }
      });


  const handleSaveSearch = useCallback(async () => {
    if (!saveSearchName.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name: saveSearchName,
      filters: { ...filters },
      alertsEnabled: true,
      created_at: new Date().toISOString()
    };

    setSavedSearches(prev => [newSavedSearch, ...prev]);
    setSaveSearchName('');
    setShowSaveSearch(false);
  }, [saveSearchName, filters]);

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: '',
      location: '',
      radius: 50,
      budgetMin: 0,
      budgetMax: 10000,
      budgetType: 'any',
      experienceLevel: [],
      skills: [],
      isUrgent: false,
      postedWithin: 'any',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  }, []);

  // Trigger search when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchJobs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchJobs]);

  const renderJobCard = (job: Job) => (
    <div key={job.id} className="mobile-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {job.category}
            </span>
            {job.timeline.isUrgent && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                URGENT
              </span>
            )}
            {job.matchScore && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {job.matchScore}% match
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleSaveJob(job.id)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {job.saved ? (
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
          ) : (
            <Bookmark className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {job.skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="text-gray-500 text-xs">+{job.skills.length - 3} more</span>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{job.location.address}</span>
          {job.location.distance && (
            <span className="text-xs">({job.location.distance}km)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>
            ${job.budget.amount} {job.budget.type === 'hourly' ? '/hr' : 'fixed'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{new Date(job.postedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>{job.poster.rating}</span>
          <span className="text-xs">({job.poster.totalJobs} jobs)</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{job.applicants} applicants</span>
          {job.poster.verified && (
            <span className="text-green-600 text-xs">✓ Verified</span>
          )}
        </div>
        <button className="mobile-button-primary text-sm px-4 py-2">
          Apply Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mobile-header">
        <h1 className="text-lg font-semibold text-gray-900">Find Jobs</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Filter className="w-6 h-6" />
          {Object.values(filters).some(v => v && v !== '' && v !== 'any' && (Array.isArray(v) ? v.length > 0 : true)) && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search jobs, skills, or keywords..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Saved Searches</h3>
            <button
              onClick={() => setShowSaveSearch(true)}
              className="text-blue-600 text-sm font-medium"
            >
              Save Current
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {savedSearches.map((search: SavedSearch) => (
              <button
                key={search.id}
                onClick={() => loadSavedSearch(search)}
                className="flex-shrink-0 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
              >
                {search.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Filters</h3>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="text-gray-600 text-sm"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Location & Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius ({filters.radius}km)
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={filters.budgetType}
                onChange={(e) => handleFilterChange('budgetType', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="any">Any Type</option>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </select>
              <input
                type="number"
                placeholder="Min $"
                value={filters.budgetMin || ''}
                onChange={(e) => handleFilterChange('budgetMin', parseInt(e.target.value) || 0)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Max $"
                value={filters.budgetMax || ''}
                onChange={(e) => handleFilterChange('budgetMax', parseInt(e.target.value) || 10000)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
            <div className="space-y-2">
              {experienceLevels.map((level) => (
                <label key={level.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.experienceLevel.includes(level.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('experienceLevel', [...filters.experienceLevel, level.value]);
                      } else {
                        handleFilterChange('experienceLevel', filters.experienceLevel.filter(l => l !== level.value));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isUrgent}
                onChange={(e) => handleFilterChange('isUrgent', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Urgent jobs only</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posted Within</label>
              <select
                value={filters.postedWithin}
                onChange={(e) => handleFilterChange('postedWithin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="any">Any Time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date Posted</option>
                <option value="budget">Budget</option>
                <option value="distance">Distance</option>
                <option value="rating">Poster Rating</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mobile-container">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-medium text-gray-900">
              {loading ? 'Searching...' : `${jobs.length} jobs found`}
            </h2>
            {filters.query && (
              <p className="text-sm text-gray-600">for "{filters.query}"</p>
            )}
          </div>
          <button
            onClick={() => setShowSaveSearch(true)}
            className="text-blue-600 text-sm font-medium"
          >
            Save Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or expanding your location radius.
            </p>
            <button
              onClick={clearFilters}
              className="mobile-button-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Job Results */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map(renderJobCard)}
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Search</h3>
            <input
              type="text"
              placeholder="Enter search name..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveSearch(false)}
                className="mobile-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="mobile-button-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedJobSearch;