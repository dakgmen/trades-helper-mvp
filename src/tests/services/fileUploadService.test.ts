import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/file.jpg' } })),
        createSignedUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          order: vi.fn(() => ({
            order: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
}))

// Import after mocking
const { fileUploadService } = await import('../../services/fileUploadService')
const { supabase } = await import('../../lib/supabase')

describe('FileUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

      // Mock storage upload
      const mockStorageFrom = (supabase as any).storage.from()
      mockStorageFrom.upload.mockResolvedValueOnce({
        data: { path: 'user123/profile_image/123456.jpg' },
        error: null,
      })

      // Mock database insert
      const mockFrom = (supabase as any).from()
      const mockInsert = mockFrom.insert()
      const mockSelect = mockInsert.select()
      mockSelect.single.mockResolvedValueOnce({
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

      const mockStorageFrom = (supabase as any).storage.from()
      mockStorageFrom.upload.mockResolvedValueOnce({
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
      const mockStorageFrom = mockSupabase.storage.from()
      mockStorageFrom.upload
        .mockResolvedValueOnce({
          data: { path: 'user123/profile_image/123456.jpg' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { path: 'user123/profile_image/123457.jpg' },
          error: null,
        })

      const mockFrom = mockSupabase.from()
      const mockInsert = mockFrom.insert()
      const mockSelect = mockInsert.select()
      mockSelect.single
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

      // Mock database fetch
      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq1 = mockSelect.eq()
      const mockEq2 = mockEq1.eq()
      mockEq2.single.mockResolvedValueOnce({
        data: mockFileRecord,
        error: null,
      })

      // Mock storage delete
      const mockStorageFrom = mockSupabase.storage.from()
      mockStorageFrom.remove.mockResolvedValueOnce({
        error: null,
      })

      // Mock database delete
      const mockDelete = mockFrom.delete()
      const mockDeleteEq1 = mockDelete.eq()
      const mockDeleteEq2 = mockDeleteEq1.eq()
      mockDeleteEq2.mockResolvedValueOnce({
        error: null,
      })

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

      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq = mockSelect.eq()
      const mockOrder = mockEq.order()
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

      const mockFrom = mockSupabase.from()
      const mockSelect = mockFrom.select()
      const mockEq1 = mockSelect.eq()
      const mockEq2 = mockEq1.eq()
      const mockOrder = mockEq2.order()
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