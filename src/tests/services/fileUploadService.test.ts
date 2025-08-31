import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock functions that we can control per test
const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockCreateSignedUrl = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockDelete = vi.fn()

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
      delete: mockDelete,
    })),
  },
}))

// Import after mocking
const { fileUploadService } = await import('../../services/fileUploadService')

describe('FileUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks to return themselves for chaining
    mockInsert.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder })
    mockOrder.mockReturnValue({ order: mockOrder })
    mockDelete.mockReturnValue({ eq: mockEq })
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockFileUpload = {
        id: '1',
        user_id: 'user123',
        filename: 'test.jpg',
        file_path: 'user123/profile_image/123456.jpg',
        file_size: 4,
        mime_type: 'image/jpeg',
        category: 'profile_image',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Mock storage upload success
      mockUpload.mockResolvedValueOnce({
        data: { path: 'user123/profile_image/123456.jpg' },
        error: null,
      })

      // Mock database insert success
      mockSingle.mockResolvedValueOnce({
        data: mockFileUpload,
        error: null,
      })

      const result = await fileUploadService.uploadFile(mockFile, 'user123', 'profile_image')

      expect(result.error).toBeNull()
      expect(result.fileUpload).toEqual(mockFileUpload)
    })

    it('should reject file that is too large', async () => {
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

      const result = await fileUploadService.uploadFile(mockFile, 'user123', 'profile_image')

      expect(result.fileUpload).toBeNull()
      expect(result.error).toBe('File size exceeds 10MB limit')
    })

    it('should reject invalid file type', async () => {
      const mockFile = new File(['test'], 'test.exe', { type: 'application/exe' })

      const result = await fileUploadService.uploadFile(mockFile, 'user123', 'profile_image')

      expect(result.fileUpload).toBeNull()
      expect(result.error).toBe('File type not allowed for profile_image')
    })

    it('should handle storage upload error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Mock storage upload error
      mockUpload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Storage error' },
      })

      const result = await fileUploadService.uploadFile(mockFile, 'user123', 'profile_image')

      expect(result.fileUpload).toBeNull()
      expect(result.error).toBe('Storage error')
    })
  })

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      const mockFileUploads = [
        {
          id: '1',
          user_id: 'user123',
          filename: 'test1.jpg',
          file_path: 'user123/profile_image/123456.jpg',
          file_size: 5,
          mime_type: 'image/jpeg',
          category: 'profile_image',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'user123',
          filename: 'test2.jpg',
          file_path: 'user123/profile_image/123457.jpg',
          file_size: 5,
          mime_type: 'image/jpeg',
          category: 'profile_image',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock successful uploads
      mockUpload
        .mockResolvedValueOnce({
          data: { path: 'user123/profile_image/123456.jpg' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { path: 'user123/profile_image/123457.jpg' },
          error: null,
        })

      // Mock database insert chain for multiple files
      mockSingle
        .mockResolvedValueOnce({
          data: mockFileUploads[0],
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockFileUploads[1],
          error: null,
        })

      const result = await fileUploadService.uploadMultipleFiles(mockFiles, 'user123', 'profile_image')

      expect(result.uploads).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.uploads).toEqual(mockFileUploads)
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockFileRecord = {
        id: '1',
        user_id: 'user123',
        filename: 'test.jpg',
        file_path: 'user123/profile_image/123456.jpg',
        file_size: 4,
        mime_type: 'image/jpeg',
        category: 'profile_image',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Reset mocks for this test
      mockSingle.mockResolvedValueOnce({
        data: mockFileRecord,
        error: null,
      })
      
      // Mock storage remove success
      mockRemove.mockResolvedValueOnce({
        data: null,
        error: null,
      })
      
      // Mock database delete success - need to ensure the delete chain works
      // The delete operation calls: .delete().eq('id', fileId).eq('user_id', userId)
      const deleteChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValueOnce({ error: null })
        })
      }
      mockDelete.mockReturnValueOnce(deleteChain)

      const result = await fileUploadService.deleteFile('1', 'user123')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('getUserFiles', () => {
    it('should get user files successfully', async () => {
      const mockFiles = [
        {
          id: '1',
          user_id: 'user123',
          filename: 'test.jpg',
          file_path: 'user123/profile_image/123456.jpg',
          file_size: 4,
          mime_type: 'image/jpeg',
          category: 'profile_image',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock database query success
      mockOrder.mockResolvedValueOnce({
        data: mockFiles,
        error: null,
      })

      const result = await fileUploadService.getUserFiles('user123')

      expect(result.error).toBeNull()
      expect(result.files).toEqual(mockFiles)
    })

    it('should filter files by category', async () => {
      const mockFiles = [
        {
          id: '1',
          user_id: 'user123',
          filename: 'test.jpg',
          file_path: 'user123/profile_image/123456.jpg',
          file_size: 4,
          mime_type: 'image/jpeg',
          category: 'profile_image',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock database query success with category filter
      mockOrder.mockResolvedValueOnce({
        data: mockFiles,
        error: null,
      })

      const result = await fileUploadService.getUserFiles('user123', 'profile_image')

      expect(result.error).toBeNull()
      expect(result.files).toEqual(mockFiles)
    })
  })
})