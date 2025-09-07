import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock, Award, Camera, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';

interface SkillsAssessment {
  id: string;
  userId: string;
  skillCategory: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  assessmentDate: Date;
  expiryDate?: Date;
  documents: Document[];
  certifications: Certification[];
}

interface Certification {
  id: string;
  assessmentId: string;
  certificationName: string;
  issuingAuthority: string;
  documentUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface Document {
  id: string;
  assessmentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
}

const SKILL_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting & Decorating',
  'Tiling',
  'Roofing',
  'Landscaping',
  'General Construction',
  'HVAC',
  'Flooring',
  'Bricklaying',
  'Demolition'
];

const SkillsAssessmentInterface: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SkillsAssessment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCertification, setNewCertification] = useState({
    certificationName: '',
    issuingAuthority: '',
    document: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchSkillsAssessments();
  }, [user?.id]);

  const fetchSkillsAssessments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('skills_assessments')
        .select(`
          *,
          certifications (
            id,
            certification_name,
            issuing_authority,
            document_url,
            verification_status
          ),
          assessment_documents (
            id,
            document_type,
            file_name,
            file_url,
            upload_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching skills assessments:', error);
      setToast({ message: 'Failed to load skills assessments', type: 'error' });
    }
  };

  const createNewAssessment = async () => {
    if (!user?.id || !selectedCategory) return;

    try {
      const { data, error } = await supabase
        .from('skills_assessments')
        .insert([{
          user_id: user.id,
          skill_category: selectedCategory,
          verification_status: 'pending',
          assessment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAssessments([data, ...assessments]);
      setSelectedCategory('');
      setToast({ message: 'New skills assessment created', type: 'success' });
    } catch (error) {
      console.error('Error creating assessment:', error);
      setToast({ message: 'Failed to create assessment', type: 'error' });
    }
  };

  const uploadDocument = async (file: File, assessmentId: string, documentType: string = 'certification') => {
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${assessmentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('skills-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('skills-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('assessment_documents')
        .insert([{
          assessment_id: assessmentId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          upload_date: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      await fetchSkillsAssessments();
      setToast({ message: 'Document uploaded successfully', type: 'success' });
    } catch (error) {
      console.error('Error uploading document:', error);
      setToast({ message: 'Failed to upload document', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const addCertification = async (assessmentId: string) => {
    if (!newCertification.certificationName || !newCertification.issuingAuthority) {
      setToast({ message: 'Please fill in all certification details', type: 'error' });
      return;
    }

    try {
      let documentUrl = '';
      
      if (newCertification.document) {
        const fileExt = newCertification.document.name.split('.').pop();
        const fileName = `${user?.id}/${assessmentId}/cert-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('skills-documents')
          .upload(fileName, newCertification.document);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('skills-documents')
          .getPublicUrl(fileName);
        
        documentUrl = publicUrl;
      }

      const { error } = await supabase
        .from('certifications')
        .insert([{
          assessment_id: assessmentId,
          certification_name: newCertification.certificationName,
          issuing_authority: newCertification.issuingAuthority,
          document_url: documentUrl,
          verification_status: 'pending'
        }]);

      if (error) throw error;

      await fetchSkillsAssessments();
      setNewCertification({ certificationName: '', issuingAuthority: '', document: null });
      setShowAddForm(false);
      setToast({ message: 'Certification added successfully', type: 'success' });
    } catch (error) {
      console.error('Error adding certification:', error);
      setToast({ message: 'Failed to add certification', type: 'error' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Assessment</h1>
        <p className="text-gray-600">
          Verify your skills and certifications to build trust with potential clients and access higher-paying jobs.
        </p>
      </div>

      {/* Add New Assessment */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Skill Assessment</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="skillCategory" className="block text-sm font-medium text-gray-700 mb-2">
                Skill Category
              </label>
              <select
                id="skillCategory"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a skill category</option>
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={createNewAssessment}
              disabled={!selectedCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Create Assessment
            </Button>
          </div>
        </div>
      </Card>

      {/* Existing Assessments */}
      <div className="space-y-6">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold">{assessment.skillCategory}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(assessment.verificationStatus)}
                  <span className={`font-medium ${
                    assessment.verificationStatus === 'verified' ? 'text-green-600' :
                    assessment.verificationStatus === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {getStatusText(assessment.verificationStatus)}
                  </span>
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Certifications</h4>
                <div className="space-y-3">
                  {assessment.certifications?.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{cert.certificationName}</p>
                        <p className="text-sm text-gray-600">Issued by: {cert.issuingAuthority}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.documentUrl && (
                          <a
                            href={cert.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        )}
                        {getStatusIcon(cert.verificationStatus)}
                      </div>
                    </div>
                  ))}
                  
                  {(!assessment.certifications || assessment.certifications.length === 0) && (
                    <p className="text-gray-500 text-sm">No certifications added yet</p>
                  )}
                </div>
              </div>

              {/* Add Certification Form */}
              {showAddForm ? (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium mb-3">Add Certification</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={newCertification.certificationName}
                      onChange={(e) => setNewCertification({
                        ...newCertification,
                        certificationName: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Authority"
                      value={newCertification.issuingAuthority}
                      onChange={(e) => setNewCertification({
                        ...newCertification,
                        issuingAuthority: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setNewCertification({
                        ...newCertification,
                        document: e.target.files?.[0] || null
                      })}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addCertification(assessment.id)}
                        disabled={isUploading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isUploading ? 'Uploading...' : 'Add Certification'}
                      </Button>
                      <Button
                        onClick={() => setShowAddForm(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="mb-4"
                >
                  Add Certification
                </Button>
              )}

              {/* Document Upload */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Supporting Documents</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Upload additional documents (photos of work, references, insurance certificates)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => uploadDocument(file, assessment.id));
                      }}
                      className="hidden"
                      id={`upload-${assessment.id}`}
                    />
                    <label
                      htmlFor={`upload-${assessment.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Documents
                    </label>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {assessment.documents && assessment.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {assessment.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{doc.fileName}</span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {assessments.length === 0 && (
        <Card className="text-center p-8">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Assessments Yet</h3>
          <p className="text-gray-600 mb-4">
            Start by creating your first skills assessment to showcase your expertise and build trust with clients.
          </p>
        </Card>
      )}

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

export default SkillsAssessmentInterface;