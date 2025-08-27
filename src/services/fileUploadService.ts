import { supabase } from '../lib/supabase'
import type { FileUpload, FileCategory } from '../types'

export class FileUploadService {
  private static instance: FileUploadService

  private constructor() {}

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService()
    }
    return FileUploadService.instance
  }

  // Upload file to Supabase Storage
  async uploadFile(
    file: File,
    userId: string,
    category: FileCategory,
    onProgress?: (progress: number) => void
  ): Promise<{ fileUpload: FileUpload | null; error: string | null }> {
    try {
      // Validate file
      const validationResult = this.validateFile(file, category)
      if (!validationResult.valid) {
        return { fileUpload: null, error: validationResult.error }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${category}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { fileUpload: null, error: uploadError.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName)

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: userId,
          filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          category,
        })
        .select()
        .single()

      if (dbError) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from('user-files').remove([fileName])
        return { fileUpload: null, error: dbError.message }
      }

      // Report progress complete
      onProgress?.(100)

      return { fileUpload: fileRecord, error: null }
    } catch (error) {
      return { fileUpload: null, error: 'File upload failed' }
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    userId: string,
    category: FileCategory,
    onProgress?: (progress: number) => void
  ): Promise<{ uploads: FileUpload[]; errors: string[] }> {
    const uploads: FileUpload[] = []
    const errors: string[] = []
    let completedUploads = 0

    for (const file of files) {
      const result = await this.uploadFile(file, userId, category)
      
      if (result.error) {
        errors.push(`${file.name}: ${result.error}`)
      } else if (result.fileUpload) {
        uploads.push(result.fileUpload)
      }

      completedUploads++
      onProgress?.(Math.round((completedUploads / files.length) * 100))
    }

    return { uploads, errors }
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        return { success: false, error: 'File not found' }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([fileRecord.file_path])

      if (storageError) {
        return { success: false, error: storageError.message }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'File deletion failed' }
    }
  }

  // Get user's files
  async getUserFiles(
    userId: string,
    category?: FileCategory
  ): Promise<{ files: FileUpload[]; error: string | null }> {
    try {
      let query = supabase
        .from('file_uploads')
        .select('*')
        .eq('user_id', userId)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return { files: [], error: error.message }
      }

      return { files: data || [], error: null }
    } catch (error) {
      return { files: [], error: 'Failed to fetch files' }
    }
  }

  // Get file URL
  async getFileUrl(filePath: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath)

      return { url: data.publicUrl, error: null }
    } catch (error) {
      return { url: null, error: 'Failed to get file URL' }
    }
  }

  // Validate file
  private validateFile(file: File, category: FileCategory): { valid: boolean; error?: string } {
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }

    // Check file type based on category
    const allowedTypes = this.getAllowedTypes(category)
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type not allowed for ${category}` }
    }

    return { valid: true }
  }

  // Get allowed file types for category
  private getAllowedTypes(category: FileCategory): string[] {
    switch (category) {
      case 'profile_image':
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      case 'white_card':
      case 'id_document':
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      case 'job_image':
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      case 'other':
        return [
          'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
          'application/pdf', 'text/plain', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      default:
        return []
    }
  }

  // Create signed URL for temporary access
  async createSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        return { url: null, error: error.message }
      }

      return { url: data.signedUrl, error: null }
    } catch (error) {
      return { url: null, error: 'Failed to create signed URL' }
    }
  }
}

export const fileUploadService = FileUploadService.getInstance()