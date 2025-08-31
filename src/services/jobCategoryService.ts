import { supabase } from '../lib/supabase'
import type { JobCategory, Job } from '../types'

export class JobCategoryService {
  // Get all active job categories
  static async getAllCategories(): Promise<JobCategory[]> {
    try {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching job categories:', error)
        return []
      }

      return data as JobCategory[]
    } catch (error) {
      console.error('Error fetching job categories:', error)
      return []
    }
  }

  // Get categories with parent-child hierarchy
  static async getCategoriesHierarchy(): Promise<JobCategory[]> {
    try {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .eq('is_active', true)
        .order('parent_category_id', { ascending: true, nullsFirst: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching category hierarchy:', error)
        return []
      }

      return data as JobCategory[]
    } catch (error) {
      console.error('Error fetching category hierarchy:', error)
      return []
    }
  }

  // Get jobs by category
  static async getJobsByCategory(categoryId: string, limit = 20): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories!category_id(*)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching jobs by category:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching jobs by category:', error)
      return []
    }
  }

  // Search jobs by skills and category
  static async searchJobsBySkills(skills: string[], limit = 50): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories!category_id(*)
        `)
        .overlaps('required_skills', skills)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching jobs by skills:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching jobs by skills:', error)
      return []
    }
  }

  // Create default job categories
  static async createDefaultCategories(): Promise<boolean> {
    try {
      const defaultCategories: Omit<JobCategory, 'id' | 'created_at'>[] = [
        {
          name: 'General Labor',
          description: 'General labor and assistance tasks',
          parent_category_id: null,
          skills_required: ['physical_work', 'reliability'],
          is_active: true
        },
        {
          name: 'Cleanup & Maintenance',
          description: 'Site cleanup and basic maintenance tasks',
          parent_category_id: null,
          skills_required: ['cleanup', 'organization'],
          is_active: true
        },
        {
          name: 'Materials Handling',
          description: 'Loading, unloading, and moving materials',
          parent_category_id: null,
          skills_required: ['physical_strength', 'materials_handling'],
          is_active: true
        },
        {
          name: 'Painting Preparation',
          description: 'Surface preparation and painting assistance',
          parent_category_id: null,
          skills_required: ['surface_prep', 'attention_to_detail'],
          is_active: true
        },
        {
          name: 'Tool & Equipment Assistance',
          description: 'Operating tools and equipment assistance',
          parent_category_id: null,
          skills_required: ['tool_operation', 'safety_awareness'],
          is_active: true
        },
        {
          name: 'Demolition Assistance',
          description: 'Safe demolition and debris removal',
          parent_category_id: null,
          skills_required: ['demolition', 'safety_procedures'],
          is_active: true
        },
        {
          name: 'Landscaping & Outdoor',
          description: 'Outdoor work and landscaping assistance',
          parent_category_id: null,
          skills_required: ['outdoor_work', 'landscaping'],
          is_active: true
        },
        {
          name: 'Electrical Assistant',
          description: 'Electrical work assistance (no licensed work)',
          parent_category_id: null,
          skills_required: ['electrical_safety', 'cable_running'],
          is_active: true
        },
        {
          name: 'Plumbing Assistant',
          description: 'Plumbing work assistance (no licensed work)',
          parent_category_id: null,
          skills_required: ['pipe_cutting', 'fixture_installation'],
          is_active: true
        },
        {
          name: 'Carpentry Assistant',
          description: 'Woodworking and carpentry assistance',
          parent_category_id: null,
          skills_required: ['measuring', 'cutting', 'assembly'],
          is_active: true
        }
      ]

      const categoriesToInsert = defaultCategories.map(category => ({
        ...category,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('job_categories')
        .upsert(categoriesToInsert, { onConflict: 'name' })

      if (error) {
        console.error('Error creating default categories:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating default categories:', error)
      return false
    }
  }

  // Admin: Create new category
  static async createCategory(categoryData: Omit<JobCategory, 'id' | 'created_at'>): Promise<JobCategory | null> {
    try {
      const { data, error } = await supabase
        .from('job_categories')
        .insert([{
          ...categoryData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating category:', error)
        return null
      }

      return data as JobCategory
    } catch (error) {
      console.error('Error creating category:', error)
      return null
    }
  }

  // Admin: Update category
  static async updateCategory(categoryId: string, updates: Partial<JobCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('job_categories')
        .update(updates)
        .eq('id', categoryId)

      if (error) {
        console.error('Error updating category:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating category:', error)
      return false
    }
  }

  // Admin: Delete/deactivate category
  static async deactivateCategory(categoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('job_categories')
        .update({ is_active: false })
        .eq('id', categoryId)

      if (error) {
        console.error('Error deactivating category:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deactivating category:', error)
      return false
    }
  }
}