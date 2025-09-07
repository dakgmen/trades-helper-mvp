import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  EyeSlashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface NotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  in_app_notifications: boolean
  marketing_emails: boolean
  job_alerts: boolean
  application_updates: boolean
  payment_reminders: boolean
  safety_alerts: boolean
  system_updates: boolean
  review_requests: boolean
  message_notifications: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  notification_frequency: 'immediate' | 'hourly' | 'daily'
}

interface CommunicationSettings {
  phone_visibility: 'public' | 'verified_only' | 'private'
  email_visibility: 'public' | 'verified_only' | 'private'
  profile_visibility: 'public' | 'verified_only' | 'private'
  auto_response_enabled: boolean
  auto_response_message: string
  preferred_contact_method: 'app' | 'email' | 'phone' | 'sms'
  response_time_expectation: '1hour' | '4hours' | '24hours' | '48hours'
  language_preference: string
  timezone: string
}

export const CommunicationPreferences: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'communication'>('notifications')
  
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    in_app_notifications: true,
    marketing_emails: false,
    job_alerts: true,
    application_updates: true,
    payment_reminders: true,
    safety_alerts: true,
    system_updates: false,
    review_requests: true,
    message_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    notification_frequency: 'immediate'
  })

  const [communication, setCommunication] = useState<CommunicationSettings>({
    phone_visibility: 'verified_only',
    email_visibility: 'verified_only',
    profile_visibility: 'public',
    auto_response_enabled: false,
    auto_response_message: 'Thanks for your message! I\'ll get back to you within 24 hours.',
    preferred_contact_method: 'app',
    response_time_expectation: '24hours',
    language_preference: 'en-AU',
    timezone: 'Australia/Sydney'
  })

  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [user])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (prefs) {
        setNotifications(prev => ({ ...prev, ...prefs.notification_preferences }))
        setCommunication(prev => ({ ...prev, ...prefs.communication_settings }))
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          notification_preferences: notifications,
          communication_settings: communication,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Show success feedback
      setTimeout(() => setSaving(false), 1000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaving(false)
    }
  }

  const NotificationSection: React.FC = () => (
    <div className="space-y-8">
      {/* General Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Methods</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'email_notifications', label: 'Email Notifications', icon: EnvelopeIcon },
            { key: 'sms_notifications', label: 'SMS Notifications', icon: DevicePhoneMobileIcon },
            { key: 'push_notifications', label: 'Push Notifications', icon: BellIcon },
            { key: 'in_app_notifications', label: 'In-App Notifications', icon: ChatBubbleLeftRightIcon }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 text-gray-600" />
                <label className="text-gray-900 font-medium">{item.label}</label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof NotificationPreferences] as boolean}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    [item.key]: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Content Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">What to notify me about</h3>
        
        <div className="space-y-4">
          {[
            { key: 'job_alerts', label: 'New job opportunities matching my skills', critical: false },
            { key: 'application_updates', label: 'Updates on my job applications', critical: true },
            { key: 'payment_reminders', label: 'Payment reminders and confirmations', critical: true },
            { key: 'safety_alerts', label: 'Safety alerts and emergency notifications', critical: true },
            { key: 'message_notifications', label: 'New messages from tradies/helpers', critical: false },
            { key: 'review_requests', label: 'Requests to review completed jobs', critical: false },
            { key: 'system_updates', label: 'App updates and new features', critical: false },
            { key: 'marketing_emails', label: 'Tips, promotions, and newsletters', critical: false }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {item.critical && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                )}
                <label className="text-gray-900">{item.label}</label>
                {item.critical && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Important
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof NotificationPreferences] as boolean}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    [item.key]: e.target.checked
                  }))}
                  className="sr-only peer"
                  disabled={item.critical}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Timing Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Timing</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Frequency
            </label>
            <select
              value={notifications.notification_frequency}
              onChange={(e) => setNotifications(prev => ({
                ...prev,
                notification_frequency: e.target.value as 'immediate' | 'hourly' | 'daily'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Quiet Hours
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.quiet_hours_enabled}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    quiet_hours_enabled: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {notifications.quiet_hours_enabled && (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="time"
                    value={notifications.quiet_hours_start}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      quiet_hours_start: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <span className="flex items-center text-gray-500">to</span>
                <div className="flex-1">
                  <input
                    type="time"
                    value={notifications.quiet_hours_end}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      quiet_hours_end: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const PrivacySection: React.FC = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <EyeSlashIcon className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
        </div>

        <div className="space-y-6">
          {[
            { key: 'profile_visibility', label: 'Profile Visibility', description: 'Who can see your full profile' },
            { key: 'phone_visibility', label: 'Phone Number Visibility', description: 'Who can see your phone number' },
            { key: 'email_visibility', label: 'Email Visibility', description: 'Who can see your email address' }
          ].map((item) => (
            <div key={item.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                {[
                  { value: 'public', label: 'Public', description: 'Anyone can see' },
                  { value: 'verified_only', label: 'Verified Users', description: 'Only ID-verified users' },
                  { value: 'private', label: 'Private', description: 'Only you can see' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      checked={communication[item.key as keyof CommunicationSettings] === option.value}
                      onChange={(e) => setCommunication(prev => ({
                        ...prev,
                        [item.key]: e.target.value
                      }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const CommunicationSection: React.FC = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Communication Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method
            </label>
            <select
              value={communication.preferred_contact_method}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                preferred_contact_method: e.target.value as 'app' | 'email' | 'phone' | 'sms'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="app">In-app messaging</option>
              <option value="email">Email</option>
              <option value="phone">Phone calls</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Time Expectation
            </label>
            <select
              value={communication.response_time_expectation}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                response_time_expectation: e.target.value as '1hour' | '4hours' | '24hours' | '48hours'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1hour">Within 1 hour</option>
              <option value="4hours">Within 4 hours</option>
              <option value="24hours">Within 24 hours</option>
              <option value="48hours">Within 48 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Preference
            </label>
            <select
              value={communication.language_preference}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                language_preference: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="en-AU">English (Australia)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={communication.timezone}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                timezone: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Australia/Sydney">Sydney (GMT+10)</option>
              <option value="Australia/Melbourne">Melbourne (GMT+10)</option>
              <option value="Australia/Brisbane">Brisbane (GMT+10)</option>
              <option value="Australia/Perth">Perth (GMT+8)</option>
              <option value="Australia/Adelaide">Adelaide (GMT+9:30)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start space-x-3 mb-4">
            <input
              type="checkbox"
              id="auto-response"
              checked={communication.auto_response_enabled}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                auto_response_enabled: e.target.checked
              }))}
              className="mt-1"
            />
            <label htmlFor="auto-response" className="block text-sm font-medium text-gray-700">
              Enable automatic response message
            </label>
          </div>
          
          {communication.auto_response_enabled && (
            <textarea
              value={communication.auto_response_message}
              onChange={(e) => setCommunication(prev => ({
                ...prev,
                auto_response_message: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter your automatic response message..."
              maxLength={200}
            />
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Communication Preferences
          </h1>
          <p className="text-gray-600">
            Manage how and when you receive notifications and communications
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'notifications', label: 'Notifications', icon: BellIcon },
                { id: 'privacy', label: 'Privacy', icon: EyeSlashIcon },
                { id: 'communication', label: 'Communication', icon: ChatBubbleLeftRightIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'notifications' | 'privacy' | 'communication')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'notifications' && <NotificationSection />}
        {activeTab === 'privacy' && <PrivacySection />}
        {activeTab === 'communication' && <CommunicationSection />}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </main>

      <MobileNavigation />
    </div>
  )
}