'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  Users, Copy, Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

function log(...args: unknown[]) {
  console.log(`[Meet ${new Date().toLocaleTimeString()}]`, ...args);
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params?.id as string;
  const { userProfile, loading: authLoading } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSocketIdRef = useRef<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const initedRef = useRef(false);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('waiting');
  const [hasMediaError, setHasMediaError] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (msg: string) => {
    log(msg);
    setDebugLogs((prev) => [...prev.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  const createPC = (targetSocketId: string): RTCPeerConnection => {
    if (pcRef.current) {
      addLog('Closing existing peer connection');
      pcRef.current.close();
    }

    remoteSocketIdRef.current = targetSocketId;
    addLog(`Creating RTCPeerConnection for target: ${targetSocketId.slice(0, 8)}...`);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    const stream = localStreamRef.current;
    if (stream) {
      const tracks = stream.getTracks();
      addLog(`Adding ${tracks.length} local tracks to PC`);
      tracks.forEach((track) => {
        pc.addTrack(track, stream);
      });
    } else {
      addLog('WARNING: No local stream when creating PC');
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog(`ICE candidate generated: ${event.candidate.candidate.slice(0, 50)}...`);
        socketRef.current?.emit('webrtc-ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate.toJSON(),
        });
      } else {
        addLog('ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      addLog(`Remote track received: ${event.track.kind}`);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        addLog('Remote video stream attached');
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      addLog(`ICE connection state: ${state}`);
      setConnectionState(state);
      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setIsConnected(false);
        if (state === 'failed') {
          addLog('ICE FAILED - connection could not be established');
        }
      }
    };

    pc.onconnectionstatechange = () => {
      addLog(`Connection state: ${pc.connectionState}`);
    };

    pc.onsignalingstatechange = () => {
      addLog(`Signaling state: ${pc.signalingState}`);
    };

    pc.onicegatheringstatechange = () => {
      addLog(`ICE gathering state: ${pc.iceGatheringState}`);
    };

    return pc;
  };

  const sendOffer = async (targetSocketId: string, displayName?: string) => {
    if (displayName) setRemoteUser(displayName);
    setConnectionState('connecting');

    addLog(`Sending offer to ${targetSocketId.slice(0, 8)}...`);
    const pc = createPC(targetSocketId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      addLog(`Offer created (type: ${offer.type})`);

      await pc.setLocalDescription(offer);
      addLog('Local description set (offer)');

      socketRef.current?.emit('webrtc-offer', {
        target: targetSocketId,
        offer: offer,
      });
      addLog('Offer emitted via socket');
    } catch (err) {
      addLog(`ERROR creating/sending offer: ${err}`);
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    addLog(`Received offer from ${data.from.slice(0, 8)}...`);
    setConnectionState('connecting');

    const pc = createPC(data.from);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      addLog('Remote description set (offer)');

      if (pendingCandidatesRef.current.length > 0) {
        addLog(`Flushing ${pendingCandidatesRef.current.length} pending ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer();
      addLog(`Answer created (type: ${answer.type})`);

      await pc.setLocalDescription(answer);
      addLog('Local description set (answer)');

      socketRef.current?.emit('webrtc-answer', {
        target: data.from,
        answer: answer,
      });
      addLog('Answer emitted via socket');
    } catch (err) {
      addLog(`ERROR handling offer: ${err}`);
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
    addLog(`Received answer from ${data.from.slice(0, 8)}...`);
    const pc = pcRef.current;
    if (!pc) {
      addLog('ERROR: No peer connection for answer');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      addLog('Remote description set (answer)');

      if (pendingCandidatesRef.current.length > 0) {
        addLog(`Flushing ${pendingCandidatesRef.current.length} pending ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      addLog(`ERROR handling answer: ${err}`);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      addLog(`Queuing ICE candidate (no remote desc yet) from ${data.from.slice(0, 8)}...`);
      pendingCandidatesRef.current.push(data.candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      addLog(`ICE candidate added from ${data.from.slice(0, 8)}...`);
    } catch (err) {
      addLog(`ERROR adding ICE candidate: ${err}`);
    }
  };

  const handleUserLeft = () => {
    addLog('Remote user left');
    setRemoteUser(null);
    setIsConnected(false);
    setConnectionState('waiting');
    remoteSocketIdRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
  };

  useEffect(() => {
    if (!meetingId || authLoading || !userProfile) return;
    if (initedRef.current) return;
    initedRef.current = true;

    addLog(`Initializing meeting: ${meetingId}`);
    addLog(`User: ${userProfile.displayName} (${userProfile._id})`);

    const init = async () => {
      try {
        addLog('Requesting media devices...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        addLog(`Got media: ${stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', ')}`);
      } catch (err) {
        addLog(`Media error: ${err}. Proceeding without camera.`);
        setHasMediaError(true);
        const emptyStream = new MediaStream();
        localStreamRef.current = emptyStream;
      }

      const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      addLog(`Connecting socket to ${socketUrl}...`);

      const socket = io(socketUrl, {
        path: '/api/socketio',
        addTrailingSlash: false,
        transports: ['polling', 'websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        addLog(`Socket connected! ID: ${socket.id}`);
        socket.emit('join-meeting', {
          meetingId,
          userId: userProfile._id,
          displayName: userProfile.displayName,
        });
        addLog(`Emitted join-meeting for room: ${meetingId}`);
      });

      socket.on('connect_error', (err) => {
        addLog(`Socket connect error: ${err.message}`);
      });

      socket.on('disconnect', (reason) => {
        addLog(`Socket disconnected: ${reason}`);
      });

      socket.on('meeting-participants', (participants: string[]) => {
        addLog(`Received existing participants: ${participants.length} [${participants.map(p => p.slice(0, 8)).join(', ')}]`);
        if (participants.length > 0) {
          addLog(`I am the joiner. Sending offer to first participant: ${participants[0].slice(0, 8)}...`);
          sendOffer(participants[0]);
        }
      });

      socket.on('user-joined-meeting', (data: { socketId: string; userId: string; displayName: string }) => {
        addLog(`User joined meeting: ${data.displayName} (socket: ${data.socketId.slice(0, 8)}...)`);
        setRemoteUser(data.displayName);
        // The joiner will send the offer via meeting-participants, so we wait for their offer
        // But if we're the only existing user, they'll send us an offer
        addLog('Waiting for offer from the joiner...');
      });

      socket.on('webrtc-offer', (data: { offer: RTCSessionDescriptionInit; from: string }) => {
        addLog(`>>> Received webrtc-offer from ${data.from.slice(0, 8)}...`);
        handleOffer(data);
      });

      socket.on('webrtc-answer', (data: { answer: RTCSessionDescriptionInit; from: string }) => {
        addLog(`>>> Received webrtc-answer from ${data.from.slice(0, 8)}...`);
        handleAnswer(data);
      });

      socket.on('webrtc-ice-candidate', (data: { candidate: RTCIceCandidateInit; from: string }) => {
        handleIceCandidate(data);
      });

      socket.on('user-left-meeting', () => {
        handleUserLeft();
      });
    };

    init();

    return () => {
      addLog('Cleanup: tearing down meeting');
      initedRef.current = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcRef.current?.close();
      pcRef.current = null;

      if (socketRef.current) {
        socketRef.current.emit('leave-meeting', meetingId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, userProfile?._id, authLoading]);

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
      addLog(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(audioTrack.enabled);
      addLog(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (originalVideoTrackRef.current) {
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(originalVideoTrackRef.current);
        }
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
      addLog('Screen sharing stopped');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        originalVideoTrackRef.current = sender.track;
        await sender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = () => {
        toggleScreenShare();
      };

      setIsScreenSharing(true);
      addLog('Screen sharing started');
    } catch {
      addLog('Screen share cancelled by user');
    }
  };

  const leaveMeeting = () => {
    addLog('Leaving meeting');
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();

    if (socketRef.current) {
      socketRef.current.emit('leave-meeting', meetingId);
      socketRef.current.disconnect();
    }

    router.push('/sessions');
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Video size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">SkillSwap Meeting</h1>
            <p className="text-xs text-gray-400">{meetingId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' || connectionState === 'completed'
                ? 'bg-green-400' : connectionState === 'connecting' || connectionState === 'checking' || connectionState === 'new'
                ? 'bg-yellow-400 animate-pulse' : connectionState === 'failed'
                ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-gray-400">
              {connectionState === 'connected' || connectionState === 'completed'
                ? 'Connected' : connectionState === 'checking' || connectionState === 'new'
                ? 'Negotiating...' : connectionState === 'connecting'
                ? 'Connecting...' : connectionState === 'failed'
                ? 'Failed' : 'Waiting for others'}
            </span>
          </div>

          <button
            onClick={copyMeetingLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={() => setShowDebug((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showDebug ? 'bg-yellow-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            Debug
          </button>

          {remoteUser && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs">
              <Users size={12} />
              {remoteUser}
            </div>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center p-6 gap-4 relative">
        {/* Remote Video (large) */}
        <div className="flex-1 max-w-4xl aspect-video relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <Users size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">
                {connectionState === 'checking' || connectionState === 'new'
                  ? 'Negotiating connection...'
                  : connectionState === 'connecting'
                  ? 'Connecting...'
                  : connectionState === 'failed'
                  ? 'Connection failed. Try refreshing.'
                  : 'Waiting for someone to join'}
              </p>
              <p className="text-gray-600 text-xs mt-2">Share the meeting link to invite others</p>
            </div>
          )}
          {isConnected && remoteUser && (
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 text-white text-xs">
              {remoteUser}
            </div>
          )}
        </div>

        {/* Local Video (small pip) */}
        <div className="absolute bottom-24 right-8 w-64 aspect-video rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-700 shadow-2xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <VideoOff size={24} className="text-gray-500" />
            </div>
          )}
          {hasMediaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <p className="text-gray-500 text-xs text-center px-2">Camera not available</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
            You {isScreenSharing && '(Screen)'}
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="absolute top-2 left-2 w-96 max-h-[60vh] bg-black/90 border border-gray-700 rounded-lg p-3 overflow-y-auto z-20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-yellow-400 text-xs font-bold">Debug Logs</span>
              <button onClick={() => setDebugLogs([])} className="text-gray-500 text-xs hover:text-gray-300">Clear</button>
            </div>
            <div className="space-y-0.5">
              {debugLogs.map((entry, i) => (
                <p key={i} className={`text-[10px] font-mono ${
                  entry.includes('ERROR') ? 'text-red-400' :
                  entry.includes('WARNING') ? 'text-yellow-400' :
                  entry.includes('>>>') ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {entry}
                </p>
              ))}
              {debugLogs.length === 0 && (
                <p className="text-gray-600 text-xs">No logs yet...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-5 bg-gray-900/80 border-t border-gray-800">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-all ${
            isAudioOn
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${
            isVideoOn
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-all ${
            isScreenSharing
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        <button
          onClick={leaveMeeting}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all ml-4"
          title="Leave meeting"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
