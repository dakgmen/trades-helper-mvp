import React, { useState, useEffect } from 'react';
import { Target, Star, MapPin, Clock, DollarSign, Zap, Settings, TrendingUp } from 'lucide-react';
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
  const [matchingPreferences, setMatchingPreferences] = useState<MatchingPreferences>({
    skillWeight: 30,
    locationWeight: 25,
    rateWeight: 20,
    availabilityWeight: 15,
    experienceWeight: 10,
    enableAIRecommendations: true,
    notificationFrequency: 'daily'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalRecommendations: 0,
    averageCompatibility: 0,
    appliedJobs: 0,
    successfulMatches: 0
  });

  useEffect(() => {
    if (user?.id) {
      initializeMatchingEngine();
    }
  }, [user?.id]);

  const initializeMatchingEngine = async () => {
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
  };

  const fetchUserPreferences = async () => {
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
  };

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

  const generateRecommendations = async () => {
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
  };

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
    const availabilityMatch = calculateAvailabilityMatch([], userPreferences.preferredTimes); // job.preferred_times not available
    totalScore += (availabilityMatch * weights.availabilityWeight) / 100;

    // Experience match (0-100)
    const experienceMatch = calculateExperienceMatch('entry'); // job.experience_required not available
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
    // Simulate distance calculation - in real implementation, use geolocation APIs
    const estimatedDistance = Math.random() * 40; // Simulate 0-40km distance
    
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
    // Simulate experience matching based on user's profile
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

  const generateRecommendationReasons = (job: Job, factors: JobRecommendation['matchingFactors']): string[] => {
    const reasons = [];
    
    if (factors.skillsMatch >= 80) reasons.push('Perfect skills match');
    else if (factors.skillsMatch >= 60) reasons.push('Good skills alignment');
    
    if (factors.locationMatch >= 80) reasons.push('Close to your location');
    if (factors.rateMatch >= 80) reasons.push('Excellent pay rate');
    if (job.urgency === 'high') reasons.push('Urgent job - quick start');
    if (job.tradie?.rating >= 4.5) reasons.push('Highly rated tradie');
    
    return reasons.slice(0, 3); // Show top 3 reasons
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

  const fetchMatchingAnalytics = async () => {
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
  };

  const updateMatchingPreferences = async (preferences: Partial<MatchingPreferences>) => {
    setMatchingPreferences(prev => ({ ...prev, ...preferences }));
    await generateRecommendations(); // Regenerate with new preferences
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Job Matching</h1>
          <p className="text-gray-600">
            Get personalized job recommendations based on your skills, location, and preferences.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            onClick={refreshRecommendations}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Refresh Matches
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 text-center">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{analytics.totalRecommendations}</h3>
          <p className="text-gray-600">Total Recommendations</p>
        </Card>
        <Card className="p-6 text-center">
          <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{analytics.averageCompatibility}%</h3>
          <p className="text-gray-600">Avg. Compatibility</p>
        </Card>
        <Card className="p-6 text-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{analytics.appliedJobs}</h3>
          <p className="text-gray-600">Jobs Applied</p>
        </Card>
        <Card className="p-6 text-center">
          <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{analytics.successfulMatches}</h3>
          <p className="text-gray-600">Successful Matches</p>
        </Card>
      </div>

      {/* Matching Settings */}
      {showSettings && (
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Matching Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Matching Factors Weight</h3>
                <div className="space-y-4">
                  {[
                    { key: 'skillWeight', label: 'Skills Match', value: matchingPreferences.skillWeight },
                    { key: 'locationWeight', label: 'Location', value: matchingPreferences.locationWeight },
                    { key: 'rateWeight', label: 'Pay Rate', value: matchingPreferences.rateWeight },
                    { key: 'availabilityWeight', label: 'Availability', value: matchingPreferences.availabilityWeight },
                    { key: 'experienceWeight', label: 'Experience', value: matchingPreferences.experienceWeight }
                  ].map(({ key, label, value }) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm font-medium">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={value}
                          onChange={(e) => updateMatchingPreferences({
                            [key]: parseInt(e.target.value)
                          })}
                          className="w-20"
                        />
                        <span className="text-sm w-8">{value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">AI Recommendations</label>
                    <input
                      type="checkbox"
                      checked={matchingPreferences.enableAIRecommendations}
                      onChange={(e) => updateMatchingPreferences({
                        enableAIRecommendations: e.target.checked
                      })}
                      className="rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Notification Frequency</label>
                    <select
                      value={matchingPreferences.notificationFrequency}
                      onChange={(e) => updateMatchingPreferences({
                        notificationFrequency: e.target.value as 'immediate' | 'daily' | 'weekly'
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Job Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Recommended Jobs For You</h2>
        {recommendations.length > 0 ? (
          <div className="space-y-6">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{recommendation.job.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{recommendation.job.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${recommendation.job.hourlyRate}/hr</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{recommendation.job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{recommendation.job.estimatedHours || 8} hours</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium">Why this matches:</span>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.recommendationReasons.map((reason, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {recommendation.compatibilityScore}%
                        </div>
                        <div className="text-xs text-gray-600">Match</div>
                      </div>
                      
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                  
                  {/* Matching Factors Breakdown */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Match Breakdown</h4>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(recommendation.matchingFactors).map(([factor, score]) => (
                        <div key={factor} className="text-center">
                          <div className={`text-lg font-bold ${
                            score >= 80 ? 'text-green-600' :
                            score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {score}%
                          </div>
                          <div className="text-xs text-gray-600 capitalize">
                            {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
            <p className="text-gray-600 mb-4">
              Complete your profile and set your preferences to get personalized job recommendations.
            </p>
            <Button onClick={refreshRecommendations} className="bg-blue-600 hover:bg-blue-700 text-white">
              Generate Recommendations
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedJobMatchingEngine;