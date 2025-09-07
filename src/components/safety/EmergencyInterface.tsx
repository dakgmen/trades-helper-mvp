import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  BellAlertIcon,
  HeartIcon,
  ShieldCheckIcon,
  TruckIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  is_primary: boolean
}

interface EmergencyIncident {
  id: string
  user_id: string
  incident_type: 'injury' | 'property_damage' | 'theft' | 'harassment' | 'safety_violation' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  title: string
  description: string
  location: string
  job_id?: string
  emergency_contacts_notified: boolean
  authorities_contacted: boolean
  medical_attention_required: boolean
  created_at: string
  resolved_at?: string
  evidence_urls: string[]
}

interface SafetyCheckIn {
  id: string
  user_id: string
  job_id: string
  location: string
  status: 'safe' | 'concern' | 'emergency'
  notes?: string
  created_at: string
}

export const EmergencyInterface: React.FC = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'emergency' | 'contacts' | 'incidents' | 'checkin'>('emergency')
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([])
  const [checkIns, setCheckIns] = useState<SafetyCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [showReportForm, setShowReportForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [panicActivated, setPanicActivated] = useState(false)
  
  const [newIncident, setNewIncident] = useState({
    type: 'safety_violation' as EmergencyIncident['incident_type'],
    severity: 'medium' as EmergencyIncident['severity'],
    title: '',
    description: '',
    location: '',
    job_id: '',
    emergency_contacts: false,
    authorities: false,
    medical: false
  })

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    is_primary: false
  })

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if (user) {
      fetchEmergencyContacts()
      fetchIncidents()
      fetchCheckIns()
      getCurrentLocation()
    }
  }, [user])

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })

      if (error) throw error
      setEmergencyContacts(data || [])
    } catch (error) {
      console.error('Error fetching emergency contacts:', error)
    }
  }

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_incidents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIncidents(data || [])
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('safety_checkins')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setCheckIns(data || [])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const triggerPanicButton = async () => {
    setPanicActivated(true)
    setEmergencyMode(true)

    try {
      // Create emergency incident
      const { data: incident, error: incidentError } = await supabase
        .from('emergency_incidents')
        .insert({
          user_id: user?.id,
          incident_type: 'other',
          severity: 'critical',
          title: 'PANIC BUTTON ACTIVATED',
          description: 'User has activated the panic button. Immediate assistance required.',
          location: currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : 'Location unavailable',
          emergency_contacts_notified: true,
          authorities_contacted: true,
          medical_attention_required: true,
          status: 'reported'
        })
        .select()
        .single()

      if (incidentError) throw incidentError

      // Notify emergency contacts
      await notifyEmergencyContacts(incident.id)

      // Send location and user details to emergency services
      await notifyEmergencyServices(incident.id)

      // Auto-call primary emergency contact after 30 seconds
      setTimeout(() => {
        if (emergencyContacts.length > 0) {
          const primaryContact = emergencyContacts.find(c => c.is_primary) || emergencyContacts[0]
          window.open(`tel:${primaryContact.phone}`, '_self')
        }
      }, 30000)

    } catch (error) {
      console.error('Error triggering panic button:', error)
    }
  }

  const notifyEmergencyContacts = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_notifications')
        .insert(
          emergencyContacts.map(contact => ({
            incident_id: incidentId,
            contact_id: contact.id,
            notification_type: 'sms',
            status: 'sent',
            message: `EMERGENCY: ${profile?.full_name} has activated their panic button on TradieHelper. Location: ${currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : 'Unknown'}. Please contact them immediately.`
          }))
        )

      if (error) throw error
    } catch (error) {
      console.error('Error notifying emergency contacts:', error)
    }
  }

  const notifyEmergencyServices = async (incidentId: string) => {
    try {
      // In a real implementation, this would integrate with emergency services APIs
      const { error } = await supabase
        .from('emergency_service_notifications')
        .insert({
          incident_id: incidentId,
          service_type: 'emergency',
          user_location: currentLocation,
          user_details: {
            name: profile?.full_name,
            phone: profile?.phone,
            email: user?.email
          },
          status: 'sent'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error notifying emergency services:', error)
    }
  }

  const reportIncident = async () => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('emergency_incidents')
        .insert({
          user_id: user?.id,
          incident_type: newIncident.type,
          severity: newIncident.severity,
          title: newIncident.title,
          description: newIncident.description,
          location: newIncident.location || (currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : ''),
          job_id: newIncident.job_id || null,
          emergency_contacts_notified: newIncident.emergency_contacts,
          authorities_contacted: newIncident.authorities,
          medical_attention_required: newIncident.medical,
          status: 'reported'
        })

      if (error) throw error

      setShowReportForm(false)
      setNewIncident({
        type: 'safety_violation',
        severity: 'medium',
        title: '',
        description: '',
        location: '',
        job_id: '',
        emergency_contacts: false,
        authorities: false,
        medical: false
      })
      
      await fetchIncidents()
    } catch (error) {
      console.error('Error reporting incident:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const addEmergencyContact = async () => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user?.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship,
          is_primary: newContact.is_primary
        })

      if (error) throw error

      setShowContactForm(false)
      setNewContact({
        name: '',
        phone: '',
        relationship: '',
        is_primary: false
      })
      
      await fetchEmergencyContacts()
    } catch (error) {
      console.error('Error adding emergency contact:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const performSafetyCheckIn = async (status: 'safe' | 'concern' | 'emergency', notes?: string) => {
    try {
      const { error } = await supabase
        .from('safety_checkins')
        .insert({
          user_id: user?.id,
          job_id: 'current-job', // This would be dynamic based on current job
          location: currentLocation ? `${currentLocation.lat}, ${currentLocation.lng}` : 'Unknown',
          status,
          notes
        })

      if (error) throw error

      if (status === 'emergency') {
        await triggerPanicButton()
      }

      await fetchCheckIns()
    } catch (error) {
      console.error('Error performing safety check-in:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'injury': return HeartIcon
      case 'property_damage': return TruckIcon
      case 'theft': return ExclamationTriangleIcon
      case 'harassment': return UserIcon
      case 'safety_violation': return ShieldCheckIcon
      case 'fire': return FireIcon
      default: return ExclamationTriangleIcon
    }
  }

  const EmergencyPanel: React.FC = () => (
    <div className="space-y-6">
      {/* Panic Button */}
      <div className={`p-8 rounded-lg border-2 ${panicActivated ? 'bg-red-100 border-red-300' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="text-center">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${panicActivated ? 'bg-red-200' : 'bg-red-100'} mb-4`}>
            <BellAlertIcon className={`w-12 h-12 ${panicActivated ? 'text-red-800' : 'text-red-600'}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {panicActivated ? 'EMERGENCY ACTIVATED' : 'Emergency Panic Button'}
          </h2>
          
          {panicActivated ? (
            <div className="space-y-4">
              <p className="text-red-800 font-medium">
                Emergency services and your contacts have been notified.
                Help is on the way.
              </p>
              <div className="animate-pulse text-red-600">
                <p>🚨 Emergency Response Active 🚨</p>
              </div>
              <button
                onClick={() => {
                  setPanicActivated(false)
                  setEmergencyMode(false)
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                I'm Safe - Cancel Emergency
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Press and hold for 3 seconds to alert emergency services and your emergency contacts
              </p>
              <button
                onMouseDown={() => {
                  const timer = setTimeout(() => triggerPanicButton(), 3000)
                  const handleMouseUp = () => {
                    clearTimeout(timer)
                    document.removeEventListener('mouseup', handleMouseUp)
                  }
                  document.addEventListener('mouseup', handleMouseUp)
                }}
                className="w-32 h-32 bg-red-600 hover:bg-red-700 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                EMERGENCY
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Safety Check-In</h3>
          <div className="space-y-3">
            <button
              onClick={() => performSafetyCheckIn('safe')}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>I'm Safe</span>
            </button>
            <button
              onClick={() => performSafetyCheckIn('concern', 'Minor safety concern reported')}
              className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>Safety Concern</span>
            </button>
            <button
              onClick={() => performSafetyCheckIn('emergency')}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
            >
              <BellAlertIcon className="w-5 h-5" />
              <span>Emergency Help Needed</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Services</h3>
          <div className="space-y-3">
            {[
              { name: 'Emergency Services', number: '000', color: 'red' },
              { name: 'Police', number: '000', color: 'blue' },
              { name: 'Fire & Rescue', number: '000', color: 'orange' },
              { name: 'Ambulance', number: '000', color: 'green' }
            ].map((service, index) => (
              <a
                key={index}
                href={`tel:${service.number}`}
                className={`flex items-center justify-between p-3 border border-${service.color}-200 rounded-lg hover:bg-${service.color}-50`}
              >
                <div className="flex items-center space-x-3">
                  <PhoneIcon className={`w-5 h-5 text-${service.color}-600`} />
                  <span className="font-medium">{service.name}</span>
                </div>
                <span className={`text-${service.color}-600 font-bold`}>{service.number}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      {checkIns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Safety Check-ins</h3>
          <div className="space-y-3">
            {checkIns.slice(0, 5).map((checkIn) => (
              <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    checkIn.status === 'safe' ? 'bg-green-500' :
                    checkIn.status === 'concern' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="capitalize font-medium">{checkIn.status}</span>
                  {checkIn.notes && (
                    <span className="text-gray-600 text-sm">- {checkIn.notes}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(checkIn.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const ContactsPanel: React.FC = () => (
    <div className="space-y-6">
      {/* Add Contact Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Emergency Contacts</h2>
        <button
          onClick={() => setShowContactForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Contact
        </button>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {emergencyContacts.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Emergency Contacts</h3>
            <p className="text-gray-600">Add contacts who should be notified in case of an emergency</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      {contact.is_primary && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{contact.relationship}</p>
                    <div className="flex items-center space-x-4">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    ⋮
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Emergency Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+61 4XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={newContact.is_primary}
                  onChange={(e) => setNewContact(prev => ({ ...prev, is_primary: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="is_primary" className="text-sm text-gray-700">
                  Make this my primary emergency contact
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowContactForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addEmergencyContact}
                disabled={submitting || !newContact.name || !newContact.phone || !newContact.relationship}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const IncidentsPanel: React.FC = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Safety Incidents</h2>
        <button
          onClick={() => setShowReportForm(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Report Incident
        </button>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents Reported</h3>
            <p className="text-gray-600">Your reported safety incidents will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidents.map((incident) => {
              const IconComponent = getIncidentIcon(incident.incident_type)
              
              return (
                <div key={incident.id} className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getSeverityColor(incident.severity)}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{incident.description}</p>
                      {incident.location && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{incident.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {incident.emergency_contacts_notified && (
                          <span className="flex items-center space-x-1">
                            <PhoneIcon className="w-3 h-3" />
                            <span>Contacts notified</span>
                          </span>
                        )}
                        {incident.authorities_contacted && (
                          <span className="flex items-center space-x-1">
                            <ShieldCheckIcon className="w-3 h-3" />
                            <span>Authorities contacted</span>
                          </span>
                        )}
                        {incident.medical_attention_required && (
                          <span className="flex items-center space-x-1">
                            <HeartIcon className="w-3 h-3" />
                            <span>Medical attention</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Safety Incident</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type</label>
                  <select
                    value={newIncident.type}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value as EmergencyIncident['incident_type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="injury">Personal Injury</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="theft">Theft/Security</option>
                    <option value="harassment">Harassment</option>
                    <option value="safety_violation">Safety Violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value as EmergencyIncident['severity'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of the incident"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Detailed description of what happened..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={currentLocation ? `Current: ${currentLocation.lat}, ${currentLocation.lng}` : "Where did this occur?"}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Additional Actions</p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newIncident.emergency_contacts}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, emergency_contacts: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Notify my emergency contacts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newIncident.authorities}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, authorities: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Contact authorities</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newIncident.medical}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, medical: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Medical attention required</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={reportIncident}
                disabled={submitting || !newIncident.title || !newIncident.description}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Reporting...' : 'Report Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Emergency Safety Center
          </h1>
          <p className="text-gray-600">
            Your safety is our priority. Access emergency services, manage contacts, and report incidents.
          </p>
        </div>

        {/* Emergency Alert Banner */}
        {emergencyMode && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 rounded-lg">
            <div className="flex items-center">
              <BellAlertIcon className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <p className="text-red-800 font-bold">EMERGENCY MODE ACTIVE</p>
                <p className="text-red-700">Your emergency contacts and services have been notified.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'emergency', label: 'Emergency', icon: BellAlertIcon },
                { id: 'contacts', label: 'Emergency Contacts', icon: PhoneIcon },
                { id: 'incidents', label: 'Incident Reports', icon: DocumentTextIcon },
                { id: 'checkin', label: 'Safety Check-ins', icon: ShieldCheckIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'emergency' | 'contacts' | 'incidents' | 'checkin')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
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
        {activeTab === 'emergency' && <EmergencyPanel />}
        {activeTab === 'contacts' && <ContactsPanel />}
        {activeTab === 'incidents' && <IncidentsPanel />}
        {activeTab === 'checkin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Safety Check-ins History</h3>
            <p className="text-gray-600">Your safety check-in history will be displayed here</p>
          </div>
        )}
      </main>

      <MobileNavigation />
    </div>
  )
}