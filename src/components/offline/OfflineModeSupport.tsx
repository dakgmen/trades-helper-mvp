import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Download, Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
}

interface Application {
  id: string;
  job_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

interface OfflineData {
  jobs: Job[];
  applications: Application[];
  messages: Message[];
  profile: UserProfile | null;
  lastSync: string;
}

interface PendingActionData {
  [key: string]: unknown;
}

interface PendingAction {
  id: string;
  type: 'job_application' | 'message' | 'profile_update' | 'job_update';
  data: PendingActionData;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingActions: number;
  failedActions: number;
  dataSize: string;
}

const OfflineModeSupport: React.FC = () => {
  const { user } = useAuth();
  const [offlineData, setOfflineData] = useState<OfflineData>({
    jobs: [],
    applications: [],
    messages: [],
    profile: null,
    lastSync: ''
  });
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingActions: 0,
    failedActions: 0,
    dataSize: '0 MB'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    initializeOfflineMode();
    setupOnlineStatusListener();
    loadOfflineData();
    loadPendingActions();
    
    // Auto-sync when online
    if (syncStatus.isOnline) {
      syncPendingActions();
    }
  }, [user?.id]);

  useEffect(() => {
    // Update sync status when online status changes
    if (syncStatus.isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [syncStatus.isOnline]);

  const initializeOfflineMode = () => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/offline-sw.js')
        .then((registration) => {
          console.log('Offline service worker registered:', registration);
        })
        .catch((error) => {
          console.error('Offline service worker registration failed:', error);
        });
    }

    // Setup background sync
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((swRegistration) => {
        return (swRegistration as ServiceWorkerRegistration & {sync: {register: (tag: string) => Promise<void>}}).sync.register('background-sync');
      });
    }
  };

  const setupOnlineStatusListener = () => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      setToast({ message: 'Connection restored. Syncing pending changes...', type: 'info' });
      syncPendingActions();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      setToast({ message: 'Working offline. Changes will sync when connection is restored.', type: 'info' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const loadOfflineData = async () => {
    try {
      const stored = localStorage.getItem(`offline_data_${user?.id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setOfflineData(data);
        updateDataSize(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const loadPendingActions = async () => {
    try {
      const stored = localStorage.getItem(`pending_actions_${user?.id}`);
      if (stored) {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
        
        const pendingCount = actions.filter((a: PendingAction) => a.status === 'pending').length;
        const failedCount = actions.filter((a: PendingAction) => a.status === 'failed').length;
        
        setSyncStatus(prev => ({
          ...prev,
          pendingActions: pendingCount,
          failedActions: failedCount
        }));
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  const updateDataSize = (data: OfflineData) => {
    const sizeInBytes = new Blob([JSON.stringify(data)]).size;
    const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
    setSyncStatus(prev => ({ ...prev, dataSize: `${sizeInMB} MB` }));
  };

  const downloadDataForOffline = async () => {
    if (!user?.id || !syncStatus.isOnline) {
      setToast({ message: 'Need internet connection to download data', type: 'error' });
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Download essential data for offline use
      const [jobsData, applicationsData, messagesData, profileData] = await Promise.all([
        // Recent jobs
        supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(50),
        
        // User's applications
        supabase
          .from('job_applications')
          .select(`
            *,
            jobs (*)
          `)
          .eq('helper_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Recent messages
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // User profile
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      const offlineData: OfflineData = {
        jobs: jobsData.data || [],
        applications: applicationsData.data || [],
        messages: messagesData.data || [],
        profile: profileData.data,
        lastSync: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem(`offline_data_${user.id}`, JSON.stringify(offlineData));
      
      setOfflineData(offlineData);
      updateDataSize(offlineData);
      setSyncStatus(prev => ({ 
        ...prev, 
        lastSyncTime: new Date(),
        isSyncing: false 
      }));

      setToast({ message: 'Data downloaded for offline use', type: 'success' });
    } catch (error) {
      console.error('Error downloading offline data:', error);
      setToast({ message: 'Failed to download offline data', type: 'error' });
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };


  const syncPendingActions = async () => {
    if (!syncStatus.isOnline || pendingActions.length === 0) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    const actionsToSync = pendingActions.filter(action => 
      action.status === 'pending' || (action.status === 'failed' && action.retryCount < 3)
    );

    for (const action of actionsToSync) {
      try {
        await syncSingleAction(action);
        
        // Mark as synced
        const updatedActions = pendingActions.map(a => 
          a.id === action.id ? { ...a, status: 'synced' as const } : a
        );
        setPendingActions(updatedActions);
        
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        
        // Mark as failed and increment retry count
        const updatedActions = pendingActions.map(a => 
          a.id === action.id 
            ? { ...a, status: 'failed' as const, retryCount: a.retryCount + 1 }
            : a
        );
        setPendingActions(updatedActions);
      }
    }

    // Remove synced actions and update localStorage
    const remainingActions = pendingActions.filter(action => action.status !== 'synced');
    setPendingActions(remainingActions);
    localStorage.setItem(`pending_actions_${user?.id}`, JSON.stringify(remainingActions));

    // Update status
    const pendingCount = remainingActions.filter(a => a.status === 'pending').length;
    const failedCount = remainingActions.filter(a => a.status === 'failed').length;

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      pendingActions: pendingCount,
      failedActions: failedCount,
      lastSyncTime: new Date()
    }));

    if (pendingCount === 0 && failedCount === 0) {
      setToast({ message: 'All changes synced successfully', type: 'success' });
    } else if (failedCount > 0) {
      setToast({ message: `${failedCount} actions failed to sync`, type: 'error' });
    }
  };

  const syncSingleAction = async (action: PendingAction) => {
    switch (action.type) {
      case 'job_application':
        await supabase
          .from('job_applications')
          .insert([action.data]);
        break;
      
      case 'message':
        await supabase
          .from('messages')
          .insert([action.data]);
        break;
      
      case 'profile_update':
        await supabase
          .from('user_profiles')
          .update(action.data)
          .eq('user_id', user?.id);
        break;
      
      case 'job_update':
        await supabase
          .from('jobs')
          .update(action.data)
          .eq('id', action.data.id);
        break;
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const clearOfflineData = () => {
    localStorage.removeItem(`offline_data_${user?.id}`);
    localStorage.removeItem(`pending_actions_${user?.id}`);
    
    setOfflineData({
      jobs: [],
      applications: [],
      messages: [],
      profile: null,
      lastSync: ''
    });
    
    setPendingActions([]);
    
    setSyncStatus(prev => ({
      ...prev,
      pendingActions: 0,
      failedActions: 0,
      dataSize: '0 MB'
    }));

    setToast({ message: 'Offline data cleared', type: 'info' });
  };

  const retryFailedActions = async () => {
    const updatedActions = pendingActions.map(action => 
      action.status === 'failed' 
        ? { ...action, status: 'pending' as const, retryCount: 0 }
        : action
    );
    
    setPendingActions(updatedActions);
    localStorage.setItem(`pending_actions_${user?.id}`, JSON.stringify(updatedActions));
    
    if (syncStatus.isOnline) {
      await syncPendingActions();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Offline Mode</h1>
        <p className="text-gray-600">
          Manage your offline data and sync pending changes when back online.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {syncStatus.isOnline ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </h2>
                <p className="text-sm text-gray-600">
                  {syncStatus.isOnline 
                    ? 'Connected to internet' 
                    : 'Working offline - changes will sync when connection is restored'}
                </p>
              </div>
            </div>
            
            {syncStatus.isSyncing && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {syncStatus.pendingActions}
              </div>
              <div className="text-xs text-gray-600">Pending Actions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-red-600">
                {syncStatus.failedActions}
              </div>
              <div className="text-xs text-gray-600">Failed Actions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {syncStatus.dataSize}
              </div>
              <div className="text-xs text-gray-600">Offline Data</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {syncStatus.lastSyncTime 
                  ? syncStatus.lastSyncTime.toLocaleTimeString()
                  : 'Never'
                }
              </div>
              <div className="text-xs text-gray-600">Last Sync</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Offline Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download for Offline
            </h3>
            <p className="text-gray-600 mb-4">
              Download essential data to use the app offline. This includes recent jobs, 
              your applications, and messages.
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Jobs</span>
                <span className="text-sm text-gray-600">{offlineData.jobs.length} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Applications</span>
                <span className="text-sm text-gray-600">{offlineData.applications.length} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Messages</span>
                <span className="text-sm text-gray-600">{offlineData.messages.length} items</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={downloadDataForOffline}
                disabled={!syncStatus.isOnline || syncStatus.isSyncing}
                className="flex-1"
              >
                {syncStatus.isSyncing ? 'Downloading...' : 'Download Data'}
              </Button>
              <Button
                variant="outline"
                onClick={clearOfflineData}
                className="px-3"
              >
                Clear
              </Button>
            </div>
            
            {offlineData.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last downloaded: {new Date(offlineData.lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Pending Sync
            </h3>
            <p className="text-gray-600 mb-4">
              Actions performed offline that will sync when connection is restored.
            </p>

            {pendingActions.length > 0 ? (
              <div className="space-y-2">
                {pendingActions.slice(0, 5).map(action => (
                  <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {action.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {action.status === 'syncing' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
                      {action.status === 'synced' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {action.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      
                      <span className="text-sm capitalize">
                        {action.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                
                {pendingActions.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{pendingActions.length - 5} more actions
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending actions</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                onClick={syncPendingActions}
                disabled={!syncStatus.isOnline || syncStatus.isSyncing || pendingActions.length === 0}
                className="flex-1"
              >
                Sync Now
              </Button>
              {syncStatus.failedActions > 0 && (
                <Button
                  variant="outline"
                  onClick={retryFailedActions}
                  disabled={!syncStatus.isOnline}
                  className="px-3"
                >
                  Retry Failed
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Status</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">All Pending Actions</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {pendingActions.map(action => (
                    <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {action.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            action.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            action.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
                            action.status === 'synced' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {action.status}
                          </span>
                          {action.retryCount > 0 && (
                            <span className="text-xs text-gray-500">
                              Retry {action.retryCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
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

export default OfflineModeSupport;