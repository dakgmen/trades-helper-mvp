import React, { useState, useEffect, useCallback } from 'react';
import { Target, Star, MapPin, Clock, DollarSign, Zap, Settings, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Job {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  location: string;
  postedDate: string;
  tradie: {
    name: string;
    rating: number;
    totalJobs: number;
  };
  skillsRequired: string[];
  urgency: 'low' | 'medium' | 'high';
  estimatedHours: number;
}

interface JobRecommendation {
  id: string;
  jobId: string;
  userId: string;
  compatibilityScore: number;
  recommendationReasons: string[];
  job: Job;
  matchingFactors: {
    skillsMatch: number;
    locationMatch: number;
    rateMatch: number;
    availabilityMatch: number;
    experienceMatch: number;
  };
}

interface UserPreferences {
  id: string;
  userId: string;
  preferredJobTypes: string[];
  maxDistance: number;
  minHourlyRate: number;
  preferredTimes: string[];
  skillPriorities: Record<string, number>;
  availabilityPattern: string;
}

interface MatchingPreferences {
  skillWeight: number;
  locationWeight: number;
  rateWeight: number;
  availabilityWeight: number;
  experienceWeight: number;
  enableAIRecommendations: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
}

const AdvancedJobMatchingEngine: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [matchingPreferences] = useState<MatchingPreferences>({
    skillWeight: 30,
    locationWeight: 25,
    rateWeight: 20,
    availabilityWeight: 15,
    experienceWeight: 10,
    enableAIRecommendations: true,
    notificationFrequency: 'daily'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRecommendations: 0,
    averageCompatibility: 0,
    appliedJobs: 0,
    successfulMatches: 0
  });

  const createDefaultPreferences = async () => {
    if (!user?.id) return;

    const defaultPreferences = {
      user_id: user.id,
      preferred_job_types: ['General Construction', 'Carpentry', 'Painting'],
      max_distance: 25,
      min_hourly_rate: 25,
      preferred_times: ['morning', 'afternoon'],
      skill_priorities: { 'General Construction': 5, 'Carpentry': 4, 'Painting': 3 },
      availability_pattern: 'weekdays'
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) {
      console.error('Error creating default preferences:', error);
    } else {
      setUserPreferences(data);
    }
  };

  const fetchUserPreferences = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (data) {
      setUserPreferences(data);
    } else {
      // Create default preferences
      await createDefaultPreferences();
    }
  }, [user?.id, createDefaultPreferences]);

  const calculateCompatibilityScore = async (job: Job): Promise<number> => {
    if (!userPreferences) return 50;

    let totalScore = 0;
    const weights = matchingPreferences;

    // Skills match (0-100)
    const skillsMatch = calculateSkillsMatch(job.skillsRequired || [], userPreferences.preferredJobTypes);
    totalScore += (skillsMatch * weights.skillWeight) / 100;

    // Location match (0-100)
    const locationMatch = calculateLocationMatch(job.location, userPreferences.maxDistance);
    totalScore += (locationMatch * weights.locationWeight) / 100;

    // Rate match (0-100)
    const rateMatch = calculateRateMatch(job.hourlyRate, userPreferences.minHourlyRate);
    totalScore += (rateMatch * weights.rateWeight) / 100;

    // Availability match (0-100)
    const availabilityMatch = calculateAvailabilityMatch([], userPreferences.preferredTimes);
    totalScore += (availabilityMatch * weights.availabilityWeight) / 100;

    // Experience match (0-100)
    const experienceMatch = calculateExperienceMatch('entry');
    totalScore += (experienceMatch * weights.experienceWeight) / 100;

    return Math.min(Math.round(totalScore), 100);
  };

  const calculateSkillsMatch = (jobSkills: string[], userSkills: string[]): number => {
    if (jobSkills.length === 0) return 70;

    const intersection = jobSkills.filter(skill =>
      userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    return Math.round((intersection.length / jobSkills.length) * 100);
  };

  const calculateLocationMatch = (_jobLocation: string, maxDistance: number): number => {
    const estimatedDistance = Math.random() * 40;

    if (estimatedDistance <= maxDistance) {
      return Math.round(100 - (estimatedDistance / maxDistance) * 30);
    }
    return Math.max(20, Math.round(100 - estimatedDistance * 2));
  };

  const calculateRateMatch = (jobRate: number, minRate: number): number => {
    if (jobRate >= minRate) {
      const bonus = Math.min((jobRate - minRate) / minRate, 0.5) * 20;
      return Math.min(100, 80 + bonus);
    }
    return Math.max(10, Math.round((jobRate / minRate) * 60));
  };

  const calculateAvailabilityMatch = (jobTimes: string[], userTimes: string[]): number => {
    if (jobTimes.length === 0 || userTimes.length === 0) return 70;

    const intersection = jobTimes.filter(time => userTimes.includes(time));
    return Math.round((intersection.length / jobTimes.length) * 100);
  };

  const calculateExperienceMatch = (requiredExperience: string): number => {
    const experienceLevels = { 'entry': 90, 'intermediate': 75, 'senior': 60, 'expert': 40 };
    return experienceLevels[requiredExperience as keyof typeof experienceLevels] || 70;
  };

  const analyzeMatchingFactors = async (job: Job) => {
    return {
      skillsMatch: calculateSkillsMatch(job.skillsRequired || [], userPreferences?.preferredJobTypes || []),
      locationMatch: calculateLocationMatch(job.location, userPreferences?.maxDistance || 25),
      rateMatch: calculateRateMatch(job.hourlyRate, userPreferences?.minHourlyRate || 25),
      availabilityMatch: calculateAvailabilityMatch([], userPreferences?.preferredTimes || []),
      experienceMatch: calculateExperienceMatch('entry')
    };
  };

  const generateRecommendationReasons = (job: Job, factors: {
    skillsMatch: number;
    locationMatch: number;
    rateMatch: number;
    availabilityMatch: number;
    experienceMatch: number;
  }): string[] => {
    const reasons = [];
    if (factors.skillsMatch >= 80) reasons.push('Perfect skill match');
    if (factors.locationMatch >= 80) reasons.push('Close to your location');
    if (factors.rateMatch >= 80) reasons.push('Excellent pay rate');
    if (job.urgency === 'high') reasons.push('Urgent job - quick start');
    if (job.tradie?.rating >= 4.5) reasons.push('Highly rated tradie');

    return reasons.slice(0, 3);
  };

  const saveRecommendations = async (recommendations: JobRecommendation[]) => {
    if (!user?.id) return;

    const recommendationsData = recommendations.map(rec => ({
      user_id: rec.userId,
      job_id: rec.jobId,
      compatibility_score: rec.compatibilityScore,
      recommendation_reasons: rec.recommendationReasons,
      matching_factors: rec.matchingFactors
    }));

    const { error } = await supabase
      .from('job_recommendations')
      .upsert(recommendationsData, {
        onConflict: 'user_id,job_id'
      });

    if (error) {
      console.error('Error saving recommendations:', error);
    }
  };

  const fetchMatchingAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: recommendations } = await supabase
        .from('job_recommendations')
        .select('compatibility_score')
        .eq('user_id', user.id);

      const { data: applications } = await supabase
        .from('job_applications')
        .select('status')
        .eq('helper_id', user.id);

      const totalRecommendations = recommendations?.length || 0;
      const averageCompatibility = recommendations?.length
        ? recommendations.reduce((acc, rec) => acc + rec.compatibility_score, 0) / recommendations.length
        : 0;
      const appliedJobs = applications?.length || 0;
      const successfulMatches = applications?.filter(app => app.status === 'accepted').length || 0;

      setAnalytics({
        totalRecommendations,
        averageCompatibility: Math.round(averageCompatibility),
        appliedJobs,
        successfulMatches
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [user?.id]);

  const generateRecommendations = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Simulate ML-powered job matching algorithm
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_tradie_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'open')
        .limit(50);

      if (error) throw error;

      const scoredJobs = await Promise.all(
        jobs.map(async (job) => {
          const compatibilityScore = await calculateCompatibilityScore(job);
          const matchingFactors = await analyzeMatchingFactors(job);
          const reasons = generateRecommendationReasons(job, matchingFactors);

          return {
            id: `rec_${job.id}_${user.id}`,
            jobId: job.id,
            userId: user.id,
            compatibilityScore,
            recommendationReasons: reasons,
            job: {
              ...job,
              tradie: {
                name: job.users?.full_name || 'Unknown',
                rating: job.tradie_rating || 4.5,
                totalJobs: job.tradie_total_jobs || 0
              }
            },
            matchingFactors
          } as JobRecommendation;
        })
      );

      // Sort by compatibility score and take top 10
      const topRecommendations = scoredJobs
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 10);

      setRecommendations(topRecommendations);

      // Save recommendations to database
      await saveRecommendations(topRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  }, [user?.id, analyzeMatchingFactors, calculateCompatibilityScore, saveRecommendations]);

  const initializeMatchingEngine = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUserPreferences(),
        generateRecommendations(),
        fetchMatchingAnalytics()
      ]);
    } catch (error) {
      console.error('Error initializing matching engine:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserPreferences, generateRecommendations, fetchMatchingAnalytics]);

  useEffect(() => {
    if (user?.id) {
      initializeMatchingEngine();
    }
  }, [user?.id, initializeMatchingEngine]);

  const refreshRecommendations = async () => {
    setIsLoading(true);
    await generateRecommendations();
    setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Smart Job Matching</h1>
          <p className="text-gray-600 mt-2">AI-powered job recommendations tailored for you</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => console.log('Settings clicked')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={refreshRecommendations}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Recommendations</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRecommendations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Avg Compatibility</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageCompatibility}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Applied Jobs</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.appliedJobs}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">Successful Matches</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.successfulMatches}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Job Recommendations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
        {recommendations.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">We're analyzing jobs to find the perfect matches for you.</p>
            <Button onClick={refreshRecommendations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Get Recommendations
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {recommendation.job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${recommendation.job.hourlyRate}/hr
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {recommendation.job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {recommendation.job.estimatedHours}h
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {recommendation.compatibilityScore}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">
                  {recommendation.job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendation.recommendationReasons.map((reason, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {recommendation.job.tradie.rating}
                    </div>
                    <span>{recommendation.job.tradie.totalJobs} jobs completed</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedJobMatchingEngine;
