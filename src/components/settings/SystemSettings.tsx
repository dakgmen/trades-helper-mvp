import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'

interface UserSettings {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  job_alerts: boolean
  application_updates: boolean
  payment_notifications: boolean
  system_maintenance: boolean
  weekly_digest: boolean
}

export function SystemSettings() {
  const { user } = useAuth()
  // TODO: const profile = useAuth().profile // Currently unused
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    job_alerts: true,
    application_updates: true,
    payment_notifications: true,
    system_maintenance: true,
    weekly_digest: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user, fetchSettings])

  const saveSettings = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          settings: settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const resetToDefaults = () => {
    setSettings({
      email_notifications: true,
      sms_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      job_alerts: true,
      application_updates: true,
      payment_notifications: true,
      system_maintenance: true,
      weekly_digest: false,
    })
  }

  if (loading) {
    return (
      <div>
        <EnhancedNavigation />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  return (
    <div>
      <EnhancedNavigation />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your notification preferences and account settings</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Notification Preferences */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Choose how you want to be notified about activity</p>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* General Notifications */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">General</h3>
                <div className="space-y-3">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive urgent notifications via SMS' },
                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive notifications on your devices' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(key as keyof UserSettings)}
                        className={`${
                          settings[key as keyof UserSettings] ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span className={`${
                          settings[key as keyof UserSettings] ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job-Related Notifications */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Job-Related</h3>
                <div className="space-y-3">
                  {[
                    { key: 'job_alerts', label: 'Job Alerts', desc: 'Get notified about new job opportunities' },
                    { key: 'application_updates', label: 'Application Updates', desc: 'Updates on your job applications' },
                    { key: 'payment_notifications', label: 'Payment Notifications', desc: 'Payment confirmations and updates' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(key as keyof UserSettings)}
                        className={`${
                          settings[key as keyof UserSettings] ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span className={`${
                          settings[key as keyof UserSettings] ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing & Updates */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Marketing & Updates</h3>
                <div className="space-y-3">
                  {[
                    { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Promotional offers and product updates' },
                    { key: 'system_maintenance', label: 'System Maintenance', desc: 'Important system updates and maintenance notices' },
                    { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of your activity and opportunities' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(key as keyof UserSettings)}
                        className={`${
                          settings[key as keyof UserSettings] ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span className={`${
                          settings[key as keyof UserSettings] ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Actions</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={resetToDefaults}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}