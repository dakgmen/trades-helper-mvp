import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff, 
  Settings, 
  MessageCircle,
  Maximize,
  Minimize
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';

interface VideoCallProps {
  jobId: string;
  participantId: string;
  onCallEnd?: () => void;
  callType?: 'consultation' | 'interview' | 'support';
}

interface CallState {
  isConnected: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  participants: Participant[];
  callDuration: number;
  callQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'tradie' | 'helper';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

const VideoCallInterface: React.FC<VideoCallProps> = ({
  jobId,
  participantId,
  onCallEnd,
  callType = 'consultation'
}) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isVideo: true,
    isAudio: true,
    isScreenSharing: false,
    isMuted: false,
    isFullscreen: false,
    participants: [],
    callDuration: 0,
    callQuality: 'good'
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    initializeCall();
  }, []);

  useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize]);

  useEffect(() => {
    if (callState.isConnected) {
      startCallTimer();
    } else {
      stopCallTimer();
    }
  }, [callState.isConnected]);

  const initializeCall = async () => {
    try {
      setIsInitializing(true);
      await setupLocalStream();
      await setupPeerConnection();
      await fetchParticipantInfo();
      setCallState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Error initializing call:', error);
      setToast({ message: 'Failed to initialize video call', type: 'error' });
    } finally {
      setIsInitializing(false);
    }
  };

  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.isVideo,
        audio: callState.isAudio
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Could not access camera/microphone');
    }
  };

  const setupPeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState;
      updateCallQuality(state);
    };

    // ICE candidate handling
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate to remote peer via signaling server
        sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };
  };

  const fetchParticipantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', participantId)
        .single();

      if (error) throw error;

      const participant: Participant = {
        id: data.id,
        name: data.full_name || 'Unknown User',
        avatar: data.avatar_url || '',
        role: 'tradie', // Would be determined based on job context
        isVideoEnabled: true,
        isAudioEnabled: true,
        connectionStatus: 'connecting'
      };

      setCallState(prev => ({
        ...prev,
        participants: [participant]
      }));
    } catch (error) {
      console.error('Error fetching participant info:', error);
    }
  };

  const sendSignalingMessage = async (message: Record<string, unknown>) => {
    // In a real implementation, this would use a signaling server
    // For demo purposes, we'll use Supabase realtime
    try {
      await supabase
        .from('call_signals')
        .insert([{
          job_id: jobId,
          from_user: user?.id,
          to_user: participantId,
          signal: message,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  };

  const updateCallQuality = (connectionState: string | undefined) => {
    let quality: CallState['callQuality'] = 'poor';
    
    switch (connectionState) {
      case 'connected':
        quality = 'excellent';
        break;
      case 'connecting':
        quality = 'fair';
        break;
      case 'disconnected':
      case 'failed':
        quality = 'poor';
        break;
      default:
        quality = 'good';
    }

    setCallState(prev => ({ ...prev, callQuality: quality }));
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        callDuration: prev.callDuration + 1
      }));
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !callState.isVideo;
        setCallState(prev => ({ ...prev, isVideo: !prev.isVideo }));
      }
    }
  };

  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !callState.isMuted;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (callState.isScreenSharing) {
        // Stop screen sharing and revert to camera
        await setupLocalStream();
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setCallState(prev => ({ ...prev, isScreenSharing: false }));
          setupLocalStream();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setToast({ message: 'Screen sharing not supported or denied', type: 'error' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setCallState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setCallState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const endCall = async () => {
    try {
      // Record call end in database
      await supabase
        .from('call_logs')
        .insert([{
          job_id: jobId,
          participant_1: user?.id,
          participant_2: participantId,
          duration: callState.callDuration,
          call_type: callType,
          ended_at: new Date().toISOString()
        }]);

      cleanup();
      if (onCallEnd) onCallEnd();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      senderName: user?.user_metadata?.full_name || 'You',
      message: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send to remote participant
    try {
      await supabase
        .from('call_chat')
        .insert([{
          job_id: jobId,
          sender_id: user?.id,
          message: newMessage,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const cleanup = () => {
    stopCallTimer();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {callType === 'consultation' ? 'Job Consultation' : 
               callType === 'interview' ? 'Job Interview' : 'Support Call'}
            </h1>
            <span className="text-sm text-gray-300">
              {formatDuration(callState.callDuration)}
            </span>
            <div className={`text-sm ${getQualityColor(callState.callQuality)}`}>
              {callState.callQuality} connection
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-gray-700"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video - Picture in Picture */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!callState.isVideo && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.user_metadata?.full_name?.[0] || 'U'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Participant Info */}
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-3 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {callState.participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    {participant.avatar ? (
                      <img src={participant.avatar} alt={participant.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm">{participant.name[0]}</span>
                    )}
                  </div>
                  <span className="text-sm">{participant.name}</span>
                  <div className="flex gap-1">
                    {!participant.isVideoEnabled && <VideoOff className="h-3 w-3" />}
                    {!participant.isAudioEnabled && <MicOff className="h-3 w-3" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <Card className="w-80 bg-white flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map(message => (
                <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    message.senderId === user?.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <Button onClick={sendChatMessage} size="sm">
                  Send
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full ${
              callState.isVideo ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {callState.isVideo ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full ${
              !callState.isMuted ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {!callState.isMuted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full ${
              callState.isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            {callState.isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-full bg-gray-700 text-white"
          >
            {callState.isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
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

export default VideoCallInterface;