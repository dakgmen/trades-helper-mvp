import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, MapPin, DollarSign, Upload, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';

interface Job {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  location: string;
  estimatedHours: number;
  urgency: 'low' | 'medium' | 'high';
  skillsRequired: string[];
  tradie: {
    name: string;
    rating: number;
    avatar: string;
  };
}

interface Application {
  id?: string;
  jobId: string;
  helperId: string;
  coverLetter: string;
  proposedRate?: number;
  availability: string;
  estimatedStartDate: string;
  documents: string[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  quickApply: boolean;
}

interface MobileJobApplicationProps {
  jobId?: string;
  onBack?: () => void;
  quickApplyMode?: boolean;
}

const MobileJobApplication: React.FC<MobileJobApplicationProps> = ({
  jobId,
  onBack,
  quickApplyMode = false
}) => {
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application>({
    jobId: jobId || '',
    helperId: user?.id || '',
    coverLetter: '',
    availability: 'immediately',
    estimatedStartDate: new Date().toISOString().split('T')[0],
    documents: [],
    status: 'draft',
    quickApply: quickApplyMode
  });
  const [currentStep, setCurrentStep] = useState(quickApplyMode ? 'quick-apply' : 'details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);

  const steps = ['details', 'cover-letter', 'documents', 'review'];
  const stepTitles = {
    'details': 'Application Details',
    'cover-letter': 'Cover Letter',
    'documents': 'Documents',
    'review': 'Review & Submit',
    'quick-apply': 'Quick Apply'
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      loadDraftApplication();
    }
  }, [jobId]);

  useEffect(() => {
    // Auto-save draft every 30 seconds
    if (currentStep !== 'quick-apply' && currentStep !== 'review') {
      const timer = setTimeout(() => {
        saveDraft();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [application, currentStep]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_tradie_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      setJob({
        ...data,
        tradie: {
          name: data.users?.full_name || 'Unknown',
          rating: data.tradie_rating || 4.5,
          avatar: data.users?.avatar_url || ''
        }
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      setToast({ message: 'Failed to load job details', type: 'error' });
    }
  };

  const loadDraftApplication = async () => {
    if (!user?.id || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('helper_id', user.id)
        .eq('job_id', jobId)
        .eq('status', 'draft')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setApplication({
          id: data.id,
          jobId: data.job_id,
          helperId: data.helper_id,
          coverLetter: data.cover_letter || '',
          proposedRate: data.proposed_rate,
          availability: data.availability || 'immediately',
          estimatedStartDate: data.estimated_start_date || new Date().toISOString().split('T')[0],
          documents: data.documents || [],
          status: data.status,
          quickApply: false
        });
        setSavedDraft(data.id);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!user?.id || !jobId || quickApplyMode) return;

    try {
      const applicationData = {
        job_id: jobId,
        helper_id: user.id,
        cover_letter: application.coverLetter,
        proposed_rate: application.proposedRate,
        availability: application.availability,
        estimated_start_date: application.estimatedStartDate,
        documents: application.documents,
        status: 'draft'
      };

      if (savedDraft) {
        const { error } = await supabase
          .from('job_applications')
          .update(applicationData)
          .eq('id', savedDraft);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('job_applications')
          .insert([applicationData])
          .select()
          .single();
        if (error) throw error;
        setSavedDraft(data.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const uploadDocument = async (file: File): Promise<string> => {
    setUploadingDoc(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `applications/${user?.id}/${jobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('application-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadDocument(file);
      setApplication(prev => ({
        ...prev,
        documents: [...prev.documents, url]
      }));
      setToast({ message: 'Document uploaded successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to upload document', type: 'error' });
    }
  };

  const handleQuickApply = async () => {
    if (!user?.id || !jobId) return;

    setIsSubmitting(true);
    
    try {
      // Get user profile for quick apply
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const quickApplication = {
        job_id: jobId,
        helper_id: user.id,
        cover_letter: `Hi, I'm interested in this ${job?.title} position. I have relevant experience and I'm available to start immediately. Please review my profile and let me know if you'd like to discuss further.`,
        availability: 'immediately',
        estimated_start_date: new Date().toISOString().split('T')[0],
        documents: profile?.resume_url ? [profile.resume_url] : [],
        status: 'submitted',
        quick_apply: true,
        applied_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('job_applications')
        .insert([quickApplication]);

      if (error) throw error;

      setToast({ message: 'Quick application submitted successfully!', type: 'success' });
      
      // Navigate back or show success state
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting quick application:', error);
      setToast({ message: 'Failed to submit application', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    
    try {
      const applicationData = {
        job_id: jobId,
        helper_id: user?.id,
        cover_letter: application.coverLetter,
        proposed_rate: application.proposedRate,
        availability: application.availability,
        estimated_start_date: application.estimatedStartDate,
        documents: application.documents,
        status: 'submitted',
        applied_at: new Date().toISOString()
      };

      if (savedDraft) {
        const { error } = await supabase
          .from('job_applications')
          .update(applicationData)
          .eq('id', savedDraft);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_applications')
          .insert([applicationData]);
        if (error) throw error;
      }

      setToast({ message: 'Application submitted successfully!', type: 'success' });
      
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setToast({ message: 'Failed to submit application', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getStepProgress = () => {
    if (currentStep === 'quick-apply') return 100;
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate flex-1 mx-4">
            {stepTitles[currentStep as keyof typeof stepTitles]}
          </h1>
          {savedDraft && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Draft Saved
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      {/* Job Summary */}
      <Card className="m-4 mb-6">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <img
              src={job.tradie.avatar || '/default-avatar.png'}
              alt={job.tradie.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">{job.title}</h2>
              <p className="text-gray-600 text-sm">{job.tradie.name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${job.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
            </div>
            {job.urgency === 'high' && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Application Content */}
      <div className="px-4 pb-24">
        {/* Quick Apply Mode */}
        {currentStep === 'quick-apply' && (
          <Card>
            <div className="p-6 text-center">
              <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Quick Apply</h2>
              <p className="text-gray-600 mb-6">
                Apply instantly using your profile information. The tradie will see your profile, 
                ratings, and previous work history.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-medium mb-2">Your application will include:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your complete profile and skills</li>
                  <li>• Previous job ratings and reviews</li>
                  <li>• Availability: Immediately</li>
                  <li>• Standard introduction message</li>
                </ul>
              </div>
              
              <Button
                onClick={handleQuickApply}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                {isSubmitting ? 'Applying...' : 'Apply Now'}
              </Button>
              
              <Button
                onClick={() => setCurrentStep('details')}
                variant="outline"
                className="w-full mt-3"
              >
                Create Custom Application
              </Button>
            </div>
          </Card>
        )}

        {/* Step 1: Details */}
        {currentStep === 'details' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Application Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Hourly Rate (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={application.proposedRate || ''}
                      onChange={(e) => setApplication(prev => ({
                        ...prev,
                        proposedRate: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                      placeholder={`Suggested: $${job.hourlyRate}`}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to accept the posted rate of ${job.hourlyRate}/hr
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={application.availability}
                    onChange={(e) => setApplication(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="immediately">Available Immediately</option>
                    <option value="within-week">Within 1 Week</option>
                    <option value="within-month">Within 1 Month</option>
                    <option value="flexible">Flexible Timeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Start Date
                  </label>
                  <input
                    type="date"
                    value={application.estimatedStartDate}
                    onChange={(e) => setApplication(prev => ({ ...prev, estimatedStartDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Cover Letter */}
        {currentStep === 'cover-letter' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Cover Letter</h2>
              
              <textarea
                value={application.coverLetter}
                onChange={(e) => setApplication(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Tell the tradie why you're perfect for this job. Mention your relevant experience, availability, and enthusiasm for the work."
                rows={8}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <div className="mt-2 text-right">
                <span className="text-xs text-gray-500">
                  {application.coverLetter.length}/500 characters
                </span>
              </div>
              
              {/* Quick Templates */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "I have extensive experience in this field...",
                    "I'm available to start immediately...",
                    "I've completed similar projects successfully..."
                  ].map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setApplication(prev => ({ 
                        ...prev, 
                        coverLetter: template + ' ' + prev.coverLetter 
                      }))}
                      className="text-xs"
                    >
                      {template.slice(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Documents */}
        {currentStep === 'documents' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Supporting Documents</h2>
              <p className="text-gray-600 mb-4">
                Upload any relevant documents like certifications, previous work photos, or references.
              </p>
              
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Take a photo or upload from gallery
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                  </label>
                </div>

                {/* Uploaded Documents */}
                {application.documents.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {application.documents.map((_doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm">Document {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setApplication(prev => ({
                              ...prev,
                              documents: prev.documents.filter((_, i) => i !== index)
                            }))}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Review Application</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Rate & Availability</h3>
                  <p className="text-sm text-gray-600">
                    Rate: ${application.proposedRate || job.hourlyRate}/hr
                  </p>
                  <p className="text-sm text-gray-600">
                    Availability: {application.availability}
                  </p>
                  <p className="text-sm text-gray-600">
                    Start Date: {new Date(application.estimatedStartDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Cover Letter</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {application.coverLetter || 'No cover letter provided'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Documents</h3>
                  <p className="text-sm text-gray-600">
                    {application.documents.length} document(s) attached
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-900">Ready to Submit</h3>
                      <p className="text-sm text-blue-700">
                        Your application will be sent to {job.tradie.name} and you'll receive a confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          {currentStep !== 'details' && currentStep !== 'quick-apply' && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          
          {currentStep === 'review' ? (
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : currentStep !== 'quick-apply' ? (
            <Button
              onClick={nextStep}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
            </Button>
          ) : null}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MobileJobApplication;