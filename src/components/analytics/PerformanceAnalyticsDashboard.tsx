import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Star, Download, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PerformanceMetrics {
  totalEarnings: number;
  earningsChange: number;
  totalJobs: number;
  jobsChange: number;
  averageRating: number;
  ratingChange: number;
  totalHours: number;
  hoursChange: number;
  successRate: number;
  successRateChange: number;
  responseTime: number;
  responseTimeChange: number;
}

interface EarningsData {
  date: string;
  amount: number;
  jobs: number;
}

interface JobMetrics {
  category: string;
  totalJobs: number;
  totalEarnings: number;
  averageRate: number;
  averageRating: number;
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '90 Days', value: '90d', days: 90 },
  { label: '1 Year', value: '1y', days: 365 }
];

const PerformanceAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalEarnings: 0,
    earningsChange: 0,
    totalJobs: 0,
    jobsChange: 0,
    averageRating: 0,
    ratingChange: 0,
    totalHours: 0,
    hoursChange: 0,
    successRate: 0,
    successRateChange: 0,
    responseTime: 0,
    responseTimeChange: 0
  });
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'tradie' | 'helper'>('helper');

  const initializeData = useCallback(async () => {
    if (user?.id) {
      await fetchUserRole();
      await fetchPerformanceData();
    }
  }, [user?.id]);

  useEffect(() => {
    initializeData();
  }, [initializeData, selectedTimeRange]);

  const fetchUserRole = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data?.role || 'helper');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    
    try {
      const selectedRange = timeRanges.find(range => range.value === selectedTimeRange);
      const days = selectedRange?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      await Promise.all([
        fetchMetrics(startDate),
        fetchEarningsData(startDate),
        fetchJobMetrics(startDate)
      ]);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async (startDate: Date) => {
    if (!user?.id) return;

    try {
      // Current period metrics
      const { data: currentJobs, error: jobsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            hourly_rate,
            estimated_hours,
            status
          ),
          reviews (
            rating
          )
        `)
        .eq(userRole === 'tradie' ? 'jobs.tradie_id' : 'helper_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (jobsError) throw jobsError;

      // Previous period for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const { data: prevJobs, error: prevJobsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            hourly_rate,
            estimated_hours,
            status
          ),
          reviews (
            rating
          )
        `)
        .eq(userRole === 'tradie' ? 'jobs.tradie_id' : 'helper_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', prevStartDate.toISOString())
        .lt('completed_at', startDate.toISOString());

      if (prevJobsError) throw prevJobsError;

      // Calculate current metrics
      const currentTotalJobs = currentJobs?.length || 0;
      const currentTotalEarnings = currentJobs?.reduce((sum, job) => {
        return sum + ((job.jobs?.hourly_rate || 0) * (job.jobs?.estimated_hours || 0));
      }, 0) || 0;
      
      const currentTotalHours = currentJobs?.reduce((sum, job) => {
        return sum + (job.jobs?.estimated_hours || 0);
      }, 0) || 0;

      const currentRatings = currentJobs?.flatMap(job => job.reviews?.map((r: {rating: number}) => r.rating) || []) || [];
      const currentAvgRating = currentRatings.length > 0 
        ? currentRatings.reduce((sum, rating) => sum + rating, 0) / currentRatings.length 
        : 0;

      // Calculate previous metrics for comparison
      const prevTotalJobs = prevJobs?.length || 0;
      const prevTotalEarnings = prevJobs?.reduce((sum, job) => {
        return sum + ((job.jobs?.hourly_rate || 0) * (job.jobs?.estimated_hours || 0));
      }, 0) || 0;
      
      const prevTotalHours = prevJobs?.reduce((sum, job) => {
        return sum + (job.jobs?.estimated_hours || 0);
      }, 0) || 0;

      const prevRatings = prevJobs?.flatMap(job => job.reviews?.map((r: {rating: number}) => r.rating) || []) || [];
      const prevAvgRating = prevRatings.length > 0 
        ? prevRatings.reduce((sum, rating) => sum + rating, 0) / prevRatings.length 
        : 0;

      // Calculate success rate and response time
      const { data: allApplications } = await supabase
        .from('job_applications')
        .select('status, created_at, responded_at')
        .eq(userRole === 'tradie' ? 'jobs.tradie_id' : 'helper_id', user.id)
        .gte('created_at', startDate.toISOString());

      const successRate = (allApplications?.length || 0) > 0 
        ? (allApplications!.filter(app => app.status === 'accepted').length / allApplications!.length) * 100 
        : 0;

      const responseTimes = allApplications?.filter(app => app.responded_at).map(app => {
        const created = new Date(app.created_at);
        const responded = new Date(app.responded_at);
        return (responded.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      }) || [];

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      setMetrics({
        totalEarnings: currentTotalEarnings,
        earningsChange: prevTotalEarnings > 0 ? ((currentTotalEarnings - prevTotalEarnings) / prevTotalEarnings) * 100 : 0,
        totalJobs: currentTotalJobs,
        jobsChange: prevTotalJobs > 0 ? ((currentTotalJobs - prevTotalJobs) / prevTotalJobs) * 100 : 0,
        averageRating: currentAvgRating,
        ratingChange: prevAvgRating > 0 ? ((currentAvgRating - prevAvgRating) / prevAvgRating) * 100 : 0,
        totalHours: currentTotalHours,
        hoursChange: prevTotalHours > 0 ? ((currentTotalHours - prevTotalHours) / prevTotalHours) * 100 : 0,
        successRate,
        successRateChange: 0, // Would need previous period calculation
        responseTime: avgResponseTime,
        responseTimeChange: 0 // Would need previous period calculation
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchEarningsData = async (startDate: Date) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          completed_at,
          jobs (
            hourly_rate,
            estimated_hours
          )
        `)
        .eq(userRole === 'tradie' ? 'jobs.tradie_id' : 'helper_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Group by date and sum earnings
      const earningsByDate: Record<string, { amount: number; jobs: number }> = {};
      
      data?.forEach(job => {
        if (job.completed_at && job.jobs) {
          const date = new Date(job.completed_at).toLocaleDateString();
          const jobData = Array.isArray(job.jobs) ? job.jobs[0] : job.jobs;
          const earnings = (jobData?.hourly_rate || 0) * (jobData?.estimated_hours || 0);
          
          if (!earningsByDate[date]) {
            earningsByDate[date] = { amount: 0, jobs: 0 };
          }
          
          earningsByDate[date].amount += earnings;
          earningsByDate[date].jobs += 1;
        }
      });

      const formattedData = Object.entries(earningsByDate).map(([date, data]) => ({
        date,
        amount: data.amount,
        jobs: data.jobs
      }));

      setEarningsData(formattedData);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    }
  };

  const fetchJobMetrics = async (startDate: Date) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            category,
            hourly_rate,
            estimated_hours
          ),
          reviews (
            rating
          )
        `)
        .eq(userRole === 'tradie' ? 'jobs.tradie_id' : 'helper_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (error) throw error;

      // Group by category
      const metricsByCategory: Record<string, {
        totalJobs: number;
        totalEarnings: number;
        totalRating: number;
        ratingCount: number;
      }> = {};

      data?.forEach(job => {
        const category = job.jobs?.category || 'Other';
        const earnings = (job.jobs?.hourly_rate || 0) * (job.jobs?.estimated_hours || 0);
        const ratings = job.reviews || [];
        
        if (!metricsByCategory[category]) {
          metricsByCategory[category] = {
            totalJobs: 0,
            totalEarnings: 0,
            totalRating: 0,
            ratingCount: 0
          };
        }
        
        metricsByCategory[category].totalJobs += 1;
        metricsByCategory[category].totalEarnings += earnings;
        
        ratings.forEach((review: {rating: number}) => {
          metricsByCategory[category].totalRating += review.rating;
          metricsByCategory[category].ratingCount += 1;
        });
      });

      const formattedMetrics = Object.entries(metricsByCategory).map(([category, data]) => ({
        category,
        totalJobs: data.totalJobs,
        totalEarnings: data.totalEarnings,
        averageRate: data.totalJobs > 0 ? data.totalEarnings / data.totalJobs : 0,
        averageRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0
      }));

      setJobMetrics(formattedMetrics.sort((a, b) => b.totalEarnings - a.totalEarnings));
    } catch (error) {
      console.error('Error fetching job metrics:', error);
    }
  };

  const exportData = async () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Current Value', 'Change %'],
      ['Total Earnings', `$${metrics.totalEarnings.toFixed(2)}`, `${metrics.earningsChange.toFixed(1)}%`],
      ['Total Jobs', metrics.totalJobs.toString(), `${metrics.jobsChange.toFixed(1)}%`],
      ['Average Rating', metrics.averageRating.toFixed(1), `${metrics.ratingChange.toFixed(1)}%`],
      ['Total Hours', metrics.totalHours.toFixed(1), `${metrics.hoursChange.toFixed(1)}%`],
      ['Success Rate', `${metrics.successRate.toFixed(1)}%`, `${metrics.successRateChange.toFixed(1)}%`],
      ['Response Time', `${metrics.responseTime.toFixed(1)}h`, `${metrics.responseTimeChange.toFixed(1)}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `performance-analytics-${selectedTimeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    format?: 'currency' | 'number' | 'percentage' | 'hours';
  }> = ({ title, value, change, icon, format = 'number' }) => {
    const formatValue = (val: string | number) => {
      if (typeof val === 'string') return val;
      
      switch (format) {
        case 'currency':
          return `$${val.toFixed(2)}`;
        case 'percentage':
          return `${val.toFixed(1)}%`;
        case 'hours':
          return `${val.toFixed(1)}h`;
        default:
          return val.toString();
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">
            Track your performance and earnings over time
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          
          <Button
            onClick={exportData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Earnings"
          value={metrics.totalEarnings}
          change={metrics.earningsChange}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          format="currency"
        />
        <MetricCard
          title="Jobs Completed"
          value={metrics.totalJobs}
          change={metrics.jobsChange}
          icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
        />
        <MetricCard
          title="Average Rating"
          value={metrics.averageRating}
          change={metrics.ratingChange}
          icon={<Star className="h-6 w-6 text-blue-600" />}
        />
        <MetricCard
          title="Total Hours"
          value={metrics.totalHours}
          change={metrics.hoursChange}
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          format="hours"
        />
        <MetricCard
          title="Success Rate"
          value={metrics.successRate}
          change={metrics.successRateChange}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          format="percentage"
        />
        <MetricCard
          title="Response Time"
          value={metrics.responseTime}
          change={metrics.responseTimeChange}
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          format="hours"
        />
      </div>

      {/* Earnings Chart */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Earnings Over Time</h2>
          {earningsData.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2 bg-gray-50 p-4 rounded-lg">
              {earningsData.slice(-15).map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-600 rounded-t w-full min-h-[2px]"
                    style={{
                      height: `${(data.amount / Math.max(...earningsData.map(d => d.amount))) * 200}px`
                    }}
                  />
                  <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                    {new Date(data.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No earnings data available for this period</p>
            </div>
          )}
        </div>
      </Card>

      {/* Job Categories Performance */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance by Category</h2>
          {jobMetrics.length > 0 ? (
            <div className="space-y-4">
              {jobMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{metric.category}</h3>
                    <p className="text-sm text-gray-600">
                      {metric.totalJobs} job{metric.totalJobs !== 1 ? 's' : ''} • 
                      Average rating: {metric.averageRating.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      ${metric.totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${(metric.averageRate).toFixed(0)}/job avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No job categories data available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PerformanceAnalyticsDashboard;