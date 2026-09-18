import { useEffect, useRef, useState, useCallback, memo, useContext } from 'react';
import io from 'socket.io-client';
import {
    Badge, IconButton, TextField, Tooltip, Select, MenuItem,
    FormControl
} from '@mui/material';
import VideocamIcon        from '@mui/icons-material/Videocam';
import VideocamOffIcon     from '@mui/icons-material/VideocamOff';
import MicIcon             from '@mui/icons-material/Mic';
import MicOffIcon          from '@mui/icons-material/MicOff';
import ScreenShareIcon     from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon         from '@mui/icons-material/CallEnd';
import ChatIcon            from '@mui/icons-material/Chat';
import PeopleIcon          from '@mui/icons-material/People';
import CloseIcon           from '@mui/icons-material/Close';
import SendIcon            from '@mui/icons-material/Send';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import MoreHorizIcon       from '@mui/icons-material/MoreHoriz';
import ContentCopyIcon     from '@mui/icons-material/ContentCopy';
import SettingsIcon        from '@mui/icons-material/Settings';
import FullscreenIcon      from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon  from '@mui/icons-material/FullscreenExit';
import VolumeUpIcon        from '@mui/icons-material/VolumeUp';
import CheckIcon           from '@mui/icons-material/Check';
import styles from '../styles/videoComponent.module.css';
import { AuthContext } from '../contexts/AuthContext';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const REACTIONS = ['👍', '👏', '❤️', '😂', '🎉', '😮'];

const THEMES = [
    { id: 'theme-cinematic', name: 'Dark Cinematic', desc: 'Deep indigo & midnight violet' },
    { id: 'theme-navy',      name: 'Midnight Blue',  desc: 'Classic enterprise navy' },
    { id: 'theme-slate',     name: 'Modern Slate',   desc: 'Clean minimal dark slate' },
    { id: 'theme-obsidian',  name: 'Studio Obsidian',desc: 'Pure dark cinematic' }
];

function sanitizeName(name) {
    if (!name || typeof name !== 'string') return '';
    const trimmed = name.trim();
    if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
        return '';
    }
    return trimmed;
}

function getInitials(name) {
    const clean = sanitizeName(name);
    if (!clean) return 'G';
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, Math.min(2, clean.length)).toUpperCase();
}

// ════════════════════════════════════════════════════════
// MeetingTimer — isolated component so timer ticks never
// cause VideoGrid or participant tiles to re-render
// ════════════════════════════════════════════════════════
const MeetingTimer = memo(function MeetingTimer() {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const str = h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return <span className={styles.topBarTimer}>{str}</span>;
});

// ════════════════════════════════════════════════════════
// RemoteVideo — isolated tile for remote participants
// ════════════════════════════════════════════════════════
const RemoteVideo = memo(function RemoteVideo({ participant, reactions }) {
    const videoRef = useRef(null);
    const safeName = sanitizeName(participant?.name) || 'Guest';

    // Bind stream safely to video element
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            if (videoRef.current.srcObject !== participant.stream) {
                videoRef.current.srcObject = participant.stream;
            }
            videoRef.current.play().catch(e => console.warn('Remote video play error:', e));
        }
    }, [participant.stream, participant.videoEnabled]);

    const isVideoOn = participant.videoEnabled !== false && participant.stream;
    const isAudioMuted = participant.audioEnabled === false;
    const myReactions = reactions.filter(r => r.socketId === participant.socketId);

    return (
        <div className={styles.videoWrapper}>
            {/* Avatar when camera is disabled */}
            {!isVideoOn && (
                <div className={styles.avatarFallback}>
                    <div className={styles.avatarCircle}>
                        <span>{getInitials(safeName)}</span>
                    </div>
                    <span className={styles.avatarLabel}>{safeName}</span>
                </div>
            )}

            {/* Video element */}
            <video
                ref={el => {
                    videoRef.current = el;
                    if (el && participant.stream && el.srcObject !== participant.stream) {
                        el.srcObject = participant.stream;
                        el.play().catch(() => {});
                    }
                }}
                autoPlay
                playsInline
                className={styles.tileVideo}
                style={{ display: isVideoOn ? 'block' : 'none' }}
            />

            {/* Floating reaction animation */}
            {myReactions.map(r => (
                <div key={r.id} className={styles.reactionOverlay}>{r.emoji}</div>
            ))}

            {/* Tile Info Bar */}
            <div className={styles.tileInfo}>
                <span className={styles.participantName}>
                    <span className={styles.tileMiniAvatar}>{getInitials(safeName)}</span>
                    <span>{safeName}</span>
                </span>
                <span className={styles.tileIcons}>
                    {isAudioMuted ? (
                        <span className={styles.tileMutedBadge} title="Microphone muted">
                            <MicOffIcon sx={{ fontSize: '0.85rem', color: '#f87171' }} />
                        </span>
                    ) : (
                        <span className={styles.tileActiveBadge} title="Microphone active">
                            <MicIcon sx={{ fontSize: '0.85rem', color: '#4ade80' }} />
                        </span>
                    )}
                    {!isVideoOn && (
                        <span className={styles.tileMutedBadge} title="Camera off">
                            <VideocamOffIcon sx={{ fontSize: '0.85rem', color: '#f87171' }} />
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
});

// ════════════════════════════════════════════════════════
// LocalVideo — isolated tile for current local user
// ════════════════════════════════════════════════════════
const LocalVideo = memo(function LocalVideo({
    stream,
    videoEnabled,
    audioEnabled,
    displayName,
    reactions,
    localSocketId,
    screenSharing
}) {
    const videoRef = useRef(null);
    const cleanDisplayName = sanitizeName(displayName) || 'You';

    // Assign stream on mount or when stream changes
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
            }
            if (videoEnabled || screenSharing) {
                videoRef.current.play().catch(e => console.warn('Local play error:', e));
            }
        }
    }, [stream, videoEnabled, screenSharing]);

    const isVideoActive = screenSharing || videoEnabled;
    const myReactions = reactions.filter(r => r.socketId === localSocketId);

    return (
        <div className={`${styles.videoWrapper} ${styles.localTile}`}>
            {/* Avatar Fallback */}
            {!isVideoActive && (
                <div className={styles.avatarFallback}>
                    <div className={styles.avatarCircle}>
                        <span>{getInitials(cleanDisplayName)}</span>
                    </div>
                    <span className={styles.avatarLabel}>{cleanDisplayName} (You)</span>
                </div>
            )}

            {/* Video Element */}
            <video
                ref={el => {
                    videoRef.current = el;
                    if (el) {
                        el.defaultMuted = true;
                        el.muted = true;
                        if (stream && el.srcObject !== stream) {
                            el.srcObject = stream;
                        }
                        if (isVideoActive) {
                            el.play().catch(() => {});
                        }
                    }
                }}
                autoPlay
                muted
                playsInline
                className={styles.tileVideo}
                style={{ display: isVideoActive ? 'block' : 'none' }}
            />

            {/* Floating reaction animation */}
            {myReactions.map(r => (
                <div key={r.id} className={styles.reactionOverlay}>{r.emoji}</div>
            ))}

            {/* Screen share watermark if sharing */}
            {screenSharing && (
                <div className={styles.tileWatermark}>
                    <ScreenShareIcon sx={{ fontSize: '0.85rem' }} /> You are sharing your screen
                </div>
            )}

            {/* Tile Info Bar */}
            <div className={styles.tileInfo}>
                <span className={styles.participantName}>
                    <span className={styles.tileMiniAvatar}>{getInitials(cleanDisplayName)}</span>
                    <span>{cleanDisplayName}</span>
                    <span className={styles.youTag}>You</span>
                </span>
                <span className={styles.tileIcons}>
                    {!audioEnabled ? (
                        <span className={styles.tileMutedBadge} title="Microphone muted">
                            <MicOffIcon sx={{ fontSize: '0.85rem', color: '#f87171' }} />
                        </span>
                    ) : (
                        <span className={styles.tileActiveBadge} title="Microphone active">
                            <MicIcon sx={{ fontSize: '0.85rem', color: '#4ade80' }} />
                        </span>
                    )}
                    {!videoEnabled && !screenSharing && (
                        <span className={styles.tileMutedBadge} title="Camera off">
                            <VideocamOffIcon sx={{ fontSize: '0.85rem', color: '#f87171' }} />
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
});

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function VideoMeetComponent() {
    const { userData } = useContext(AuthContext);

    // ── Persistent refs across re-renders ──
    const socketRef              = useRef(null);
    const socketIdRef            = useRef(null);
    const peerConnectionsRef     = useRef({}); // socketId -> RTCPeerConnection
    const iceCandidateQueuesRef  = useRef({}); // socketId -> [candidates]
    const remoteStreamsRef       = useRef({}); // socketId -> MediaStream
    const remoteNamesRef         = useRef({}); // socketId -> string
    const localStreamRef         = useRef(null);
    const cameraTrackRef         = useRef(null);
    const screenTrackRef         = useRef(null);
    const seenMsgIds             = useRef(new Set());
    const explicitLeaveRef       = useRef(false);
    const chatEndRef             = useRef(null);
    const lobbyVideoRef          = useRef(null);
    const previewVideoRef        = useRef(null);

    // ── State ──
    let savedUser = null;
    try {
        savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {}
    const resolvedInitialName = sanitizeName(userData?.name) || sanitizeName(userData?.username) || sanitizeName(savedUser?.name) || sanitizeName(savedUser?.username) || '';

    const [inMeeting, setInMeeting]               = useState(false);
    const [displayName, setDisplayName]           = useState(resolvedInitialName);
    const [nameError, setNameError]               = useState('');
    const [mediaStatus, setMediaStatus]           = useState('loading'); // 'loading' | 'ready' | 'denied'
    const [localStream, setLocalStream]           = useState(null);
    const [videoEnabled, setVideoEnabled]         = useState(true);
    const [audioEnabled, setAudioEnabled]         = useState(true);
    const [screenSharing, setScreenSharing]       = useState(false);
    const [screenAvailable, setScreenAvailable]   = useState(false);

    // Participants: [{ socketId, name, stream, videoEnabled, audioEnabled }]
    const [participants, setParticipants]         = useState([]);
    const [messages, setMessages]                 = useState([]);
    const [msgInput, setMsgInput]                 = useState('');
    const [unreadCount, setUnreadCount]           = useState(0);
    const [showChat, setShowChat]                 = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showReactions, setShowReactions]       = useState(false);
    const [showMore, setShowMore]                 = useState(false);
    const [reactions, setReactions]               = useState([]);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [copied, setCopied]                     = useState(false);
    const [showSettings, setShowSettings]         = useState(false);
    const [settingsTab, setSettingsTab]           = useState('audio');
    const [isFullscreen, setIsFullscreen]         = useState(false);
    const [audioDevices, setAudioDevices]         = useState([]);
    const [videoDevices, setVideoDevices]         = useState([]);
    const [selectedAudio, setSelectedAudio]       = useState('');
    const [selectedVideo, setSelectedVideo]       = useState('');
    const [meetingTheme, setMeetingTheme]         = useState('theme-cinematic');
    const [micVolume, setMicVolume]               = useState(0);

    // Canonical meeting code sanitized from path
    const meetingCode = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || 'meeting';

    // Prevent viewport page scroll during meeting
    useEffect(() => {
        if (inMeeting) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [inMeeting]);

    // Update display name if user logs in or context initializes
    useEffect(() => {
        if (!displayName) {
            const bestName = sanitizeName(userData?.name) || sanitizeName(userData?.username) || sanitizeName(savedUser?.name) || sanitizeName(savedUser?.username);
            if (bestName) setDisplayName(bestName);
        }
    }, [userData, displayName, savedUser?.name, savedUser?.username]);

    // ── Safe participant upsert: strictly avoids self or duplicates ──
    const upsertParticipant = useCallback((remoteSocketId, updates) => {
        if (!remoteSocketId || remoteSocketId === socketIdRef.current) return;
        setParticipants(prev => {
            const index = prev.findIndex(p => p.socketId === remoteSocketId);
            const rawName = updates.name !== undefined ? updates.name : undefined;
            const safeName = rawName !== undefined ? (sanitizeName(rawName) || 'Guest') : undefined;
            const finalUpdates = safeName !== undefined ? { ...updates, name: safeName } : updates;

            if (index !== -1) {
                const next = [...prev];
                next[index] = { ...next[index], ...finalUpdates };
                return next;
            }
            return [...prev, {
                socketId: remoteSocketId,
                name: safeName || 'Guest',
                stream: null,
                videoEnabled: true,
                audioEnabled: true,
                ...finalUpdates
            }];
        });
    }, []);

    const removeParticipant = useCallback((remoteSocketId) => {
        setParticipants(prev => prev.filter(p => p.socketId !== remoteSocketId));
        if (peerConnectionsRef.current[remoteSocketId]) {
            try { peerConnectionsRef.current[remoteSocketId].close(); } catch {}
            delete peerConnectionsRef.current[remoteSocketId];
        }
        delete iceCandidateQueuesRef.current[remoteSocketId];
        delete remoteStreamsRef.current[remoteSocketId];
        delete remoteNamesRef.current[remoteSocketId];
    }, []);

    // ── Full cleanup on leave ──
    const cleanupAll = useCallback(() => {
        explicitLeaveRef.current = true;
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (screenTrackRef.current) {
                screenTrackRef.current.stop();
            }
        } catch {}

        Object.values(peerConnectionsRef.current).forEach(pc => {
            try { pc.close(); } catch {}
        });
        peerConnectionsRef.current = {};
        iceCandidateQueuesRef.current = {};
        remoteStreamsRef.current = {};
        remoteNamesRef.current = {};

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    // ── 1. ACQUIRE CAMERA ON MOUNT ONCE ──
    useEffect(() => {
        let isMounted = true;
        setMediaStatus('loading');

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (!isMounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                window.localStream = stream;
                cameraTrackRef.current = stream.getVideoTracks()[0] || null;
                setLocalStream(stream);
                setMediaStatus('ready');
                if (navigator.mediaDevices.getDisplayMedia) {
                    setScreenAvailable(true);
                }
            })
            .catch(err => {
                console.warn('Camera/Mic permission error:', err);
                if (isMounted) setMediaStatus('denied');
            });

        return () => {
            isMounted = false;
            // StrictMode protection: only stop tracks on intentional leave
            if (explicitLeaveRef.current) {
                cleanupAll();
            }
        };
    }, [cleanupAll]);

    // Bind lobby video preview
    useEffect(() => {
        if (lobbyVideoRef.current && localStream) {
            lobbyVideoRef.current.defaultMuted = true;
            lobbyVideoRef.current.muted = true;
            if (lobbyVideoRef.current.srcObject !== localStream) {
                lobbyVideoRef.current.srcObject = localStream;
            }
            lobbyVideoRef.current.play().catch(() => {});
        }
    }, [localStream, inMeeting]);

    // Bind settings video preview
    useEffect(() => {
        if (showSettings && previewVideoRef.current && localStream) {
            previewVideoRef.current.defaultMuted = true;
            previewVideoRef.current.muted = true;
            if (previewVideoRef.current.srcObject !== localStream) {
                previewVideoRef.current.srcObject = localStream;
            }
            previewVideoRef.current.play().catch(() => {});
        }
    }, [showSettings, localStream]);

    // ── 2. CAMERA TOGGLE ──
    const handleToggleVideo = useCallback(() => {
        const next = !videoEnabled;
        setVideoEnabled(next);

        // Enable / disable video tracks without creating a new stream
        localStreamRef.current?.getVideoTracks().forEach(track => {
            track.enabled = next;
        });

        // Notify remote peers via socket
        socketRef.current?.emit('video-state', next);
    }, [videoEnabled]);

    // ── 3. MICROPHONE TOGGLE ──
    const handleToggleAudio = useCallback(() => {
        const next = !audioEnabled;
        setAudioEnabled(next);

        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = next;
        });

        socketRef.current?.emit('audio-state', next);
    }, [audioEnabled]);

    // ── 4. SCREEN SHARE ──
    const handleScreenShare = useCallback(async () => {
        if (screenSharing) {
            // Stop sharing, restore camera track
            setScreenSharing(false);
            try {
                if (screenTrackRef.current) {
                    screenTrackRef.current.stop();
                    screenTrackRef.current = null;
                }
                const camTrack = cameraTrackRef.current || localStreamRef.current?.getVideoTracks()[0];
                if (camTrack) {
                    camTrack.enabled = videoEnabled;
                    for (const pc of Object.values(peerConnectionsRef.current)) {
                        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            await sender.replaceTrack(camTrack).catch(() => {});
                        }
                    }
                }
            } catch (err) {
                console.error('Error stopping screen share:', err);
            }
        } else {
            // Start screen share
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;
                setScreenSharing(true);

                // Replace track on all peer connections
                for (const pc of Object.values(peerConnectionsRef.current)) {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(screenTrack).catch(() => {});
                    }
                }

                // Handle user clicking native browser "Stop sharing" floating bar
                screenTrack.onended = () => {
                    handleScreenShare();
                };
            } catch (err) {
                console.warn('Screen share cancelled or failed:', err);
            }
        }
    }, [screenSharing, videoEnabled]);

    // ── 5. PEER CONNECTION FACTORY ──
    const getOrCreatePeerConnection = useCallback((remoteSocketId, socket) => {
        if (!remoteSocketId || remoteSocketId === socketIdRef.current) return null;
        if (peerConnectionsRef.current[remoteSocketId]) {
            return peerConnectionsRef.current[remoteSocketId];
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current[remoteSocketId] = pc;
        iceCandidateQueuesRef.current[remoteSocketId] = [];

        // Exchange ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', remoteSocketId, JSON.stringify({ ice: event.candidate }));
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                removeParticipant(remoteSocketId);
            }
        };

        // Receive remote stream (merge audio and video tracks into one MediaStream per remote socket)
        pc.ontrack = (event) => {
            const incomingTrack = event.track;
            let stream = remoteStreamsRef.current[remoteSocketId];
            if (!stream) {
                stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
                remoteStreamsRef.current[remoteSocketId] = stream;
            }
            const exists = stream.getTracks().some(t => t.id === incomingTrack.id);
            if (!exists) {
                stream.addTrack(incomingTrack);
            }
            upsertParticipant(remoteSocketId, {
                stream,
                name: remoteNamesRef.current[remoteSocketId] || 'Guest'
            });
        };

        // Add local tracks (camera or screen)
        const activeStream = localStreamRef.current;
        if (activeStream) {
            activeStream.getTracks().forEach(track => {
                const effectiveTrack = (track.kind === 'video' && screenTrackRef.current)
                    ? screenTrackRef.current
                    : track;
                try {
                    pc.addTrack(effectiveTrack, activeStream);
                } catch (e) {
                    console.warn('addTrack error:', e);
                }
            });
        }

        return pc;
    }, [upsertParticipant, removeParticipant]);

    // ── 6. WEBRTC SIGNALING HANDLER ──
    const handleSignalMessage = useCallback(async (fromSocketId, rawPayload) => {
        if (fromSocketId === socketIdRef.current) return;

        let data;
        try { data = JSON.parse(rawPayload); } catch { return; }

        const socket = socketRef.current;
        if (!socket) return;

        const pc = getOrCreatePeerConnection(fromSocketId, socket);
        if (!pc) return;

        try {
            if (data.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

                // If offer, send answer
                if (data.sdp.type === 'offer') {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('signal', fromSocketId, JSON.stringify({ sdp: pc.localDescription }));
                }

                // Drain buffered ICE candidates now that remote description is set
                const queue = iceCandidateQueuesRef.current[fromSocketId] || [];
                for (const cand of queue) {
                    await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
                iceCandidateQueuesRef.current[fromSocketId] = [];
            }

            if (data.ice) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.ice)).catch(() => {});
                } else {
                    // Buffer ICE candidate until SDP is set
                    if (!iceCandidateQueuesRef.current[fromSocketId]) {
                        iceCandidateQueuesRef.current[fromSocketId] = [];
                    }
                    iceCandidateQueuesRef.current[fromSocketId].push(data.ice);
                }
            }
        } catch (err) {
            console.error('Signaling processing error:', err);
        }
    }, [getOrCreatePeerConnection]);

    // ── 7. SOCKET.IO CONNECTION ──
    const connectToSocketServer = useCallback((myUserName) => {
        if (socketRef.current) return;

        const socket = io.connect(SERVER_URL, { secure: false });
        socketRef.current = socket;

        socket.on('connect', () => {
            socketIdRef.current = socket.id;
            socket.emit('join-call', {
                roomId: meetingCode,
                name: myUserName,
                userId: userData?._id || userData?.username || socket.id,
                videoEnabled,
                audioEnabled
            });
        });

        socket.on('signal', handleSignalMessage);

        // When participants join the room
        socket.on('user-joined', (newSocketId, _allSocketIds, participantList) => {
            const myId = socketIdRef.current;

            // Sync participant list for all remotes
            if (Array.isArray(participantList)) {
                participantList.forEach(p => {
                    if (p.socketId === myId) return;
                    const cleanName = sanitizeName(p.name);
                    if (cleanName) {
                        remoteNamesRef.current[p.socketId] = cleanName;
                    }
                    upsertParticipant(p.socketId, {
                        name: cleanName || remoteNamesRef.current[p.socketId] || 'Guest',
                        videoEnabled: p.videoEnabled !== false,
                        audioEnabled: p.audioEnabled !== false
                    });
                });
            }

            // WebRTC caller-callee negotiation:
            // Existing participants in the room initiate offer to the new joiner
            if (newSocketId !== myId) {
                const pc = getOrCreatePeerConnection(newSocketId, socket);
                if (pc && pc.signalingState === 'stable') {
                    pc.createOffer()
                        .then(offer => pc.setLocalDescription(offer))
                        .then(() => {
                            socket.emit('signal', newSocketId, JSON.stringify({ sdp: pc.localDescription }));
                        })
                        .catch(err => console.error('Create offer error:', err));
                }
            }
        });

        // Remote user toggles video
        socket.on('video-state', (remoteSocketId, enabled) => {
            if (remoteSocketId === socketIdRef.current) return;
            upsertParticipant(remoteSocketId, { videoEnabled: enabled });
        });

        // Remote user toggles audio
        socket.on('audio-state', (remoteSocketId, enabled) => {
            if (remoteSocketId === socketIdRef.current) return;
            upsertParticipant(remoteSocketId, { audioEnabled: enabled });
        });

        // Chat message received: absolute de-duplication guaranteed
        socket.on('chat-message', (msgId, text, sender, senderName, senderSocketId, timestamp) => {
            if (seenMsgIds.current.has(msgId)) return;
            seenMsgIds.current.add(msgId);

            const isOwn = senderSocketId === socketIdRef.current;
            const finalSender = sanitizeName(senderName) || sanitizeName(sender) || 'Guest';
            const timeStr = timestamp
                ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setMessages(prev => {
                if (prev.some(m => m.id === msgId)) return prev;
                return [...prev, {
                    id: msgId,
                    sender: finalSender,
                    text,
                    isOwn,
                    ts: timeStr
                }];
            });

            if (!isOwn && !showChat) {
                setUnreadCount(n => n + 1);
            }
        });

        // Reactions
        socket.on('reaction', (emoji, fromSocketId) => {
            const id = `${Date.now()}-${fromSocketId}-${Math.random()}`;
            setReactions(prev => [...prev, { id, emoji, socketId: fromSocketId }]);
            setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2800);
        });

        // User leaves
        socket.on('user-left', (leftSocketId) => {
            removeParticipant(leftSocketId);
        });

    }, [handleSignalMessage, getOrCreatePeerConnection, upsertParticipant, removeParticipant, videoEnabled, audioEnabled, showChat, meetingCode, userData?._id, userData?.username]);

    // ── 8. JOIN MEETING HANDLER ──
    const handleJoinMeeting = useCallback(() => {
        const finalName = displayName.trim() || 'Guest';
        if (!finalName) {
            setNameError('Please enter your display name');
            return;
        }
        setNameError('');

        // Ensure tracks are set to user's desired state
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });

        setInMeeting(true);
        connectToSocketServer(finalName);
    }, [displayName, videoEnabled, audioEnabled, connectToSocketServer]);

    // ── 9. SEND CHAT MESSAGE ──
    const handleSendMessage = useCallback(() => {
        const text = msgInput.trim();
        if (!text || !socketRef.current?.connected) return;

        socketRef.current.emit('chat-message', text, displayName || 'Guest');
        setMsgInput('');
    }, [msgInput, displayName]);

    // ── 10. SEND REACTION ──
    const handleSendReaction = useCallback((emoji) => {
        setShowReactions(false);
        socketRef.current?.emit('reaction', emoji);

        const id = `${Date.now()}-local-${Math.random()}`;
        setReactions(prev => [...prev, { id, emoji, socketId: socketIdRef.current }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2800);
    }, []);

    // ── 11. LEAVE MEETING ──
    const handleLeaveConfirmed = useCallback(() => {
        cleanupAll();
        window.location.href = '/home';
    }, [cleanupAll]);

    // ── 12. UTILITY HANDLERS ──
    const copyMeetingInvite = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {}
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {}
    }, []);

    const loadMediaDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
            setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
        } catch {}
    }, []);

    // Audio level meter simulation for settings
    useEffect(() => {
        if (!showSettings || !audioEnabled) return;
        const interval = setInterval(() => {
            setMicVolume(Math.floor(Math.random() * 65) + 15);
        }, 120);
        return () => clearInterval(interval);
    }, [showSettings, audioEnabled]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear unread count when opening chat
    useEffect(() => {
        if (showChat) setUnreadCount(0);
    }, [showChat]);

    // Fullscreen event listener
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Clean up on component unmount
    useEffect(() => {
        return () => {
            if (explicitLeaveRef.current) {
                cleanupAll();
            }
        };
    }, [cleanupAll]);

    // Total participant count (remotes + local)
    const totalCount = participants.length + 1;

    // Grid class based on count
    const getGridClass = () => {
        if (totalCount === 1) return styles.grid1;
        if (totalCount === 2) return styles.grid2;
        if (totalCount === 3) return styles.grid3;
        if (totalCount === 4) return styles.grid4;
        if (totalCount <= 6) return styles.grid6;
        return styles.gridAdaptive;
    };

    // ════════════════════════════════════════════════
    // LOBBY VIEW (Pre-meeting check)
    // ════════════════════════════════════════════════
    if (!inMeeting) {
        return (
            <div className={`${styles.meetContainer} ${styles[meetingTheme]}`}>
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyCard}>
                        {/* Brand header */}
                        <div className={styles.lobbyBrand}>
                            <span className={styles.lobbyLogo}>Connectify</span>
                            <span className={styles.lobbyMeetingBadge}>
                                Meeting ID: <strong>{meetingCode}</strong>
                            </span>
                        </div>

                        {/* Camera Preview */}
                        <div className={styles.lobbyPreviewWrap}>
                            {mediaStatus === 'loading' && (
                                <div className={styles.lobbyPreviewPlaceholder}>
                                    <div className={styles.spinner} />
                                    <span>Starting your camera & microphone…</span>
                                </div>
                            )}

                            {mediaStatus === 'denied' && (
                                <div className={styles.lobbyPreviewPlaceholder}>
                                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                                        Camera access blocked.
                                    </span>
                                    <span style={{ fontSize: '0.8rem', marginTop: 4, color: 'rgba(255,255,255,0.6)' }}>
                                        Please allow camera access in your browser or continue with audio/chat only.
                                    </span>
                                </div>
                            )}

                            {!videoEnabled && mediaStatus === 'ready' && (
                                <div className={styles.avatarFallback}>
                                    <div className={styles.avatarCircle}>
                                        <span>{getInitials(displayName)}</span>
                                    </div>
                                    <span className={styles.avatarLabel}>Camera is off</span>
                                </div>
                            )}

                            <video
                                ref={lobbyVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={styles.lobbyPreview}
                                style={{ display: videoEnabled && mediaStatus === 'ready' ? 'block' : 'none' }}
                            />

                            {/* Lobby quick device controls */}
                            <div className={styles.lobbyControls}>
                                <Tooltip title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}>
                                    <IconButton
                                        onClick={handleToggleAudio}
                                        className={!audioEnabled ? styles.controlBtnMuted : ''}
                                        size="small"
                                    >
                                        {audioEnabled ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={videoEnabled ? 'Turn camera off' : 'Turn camera on'}>
                                    <IconButton
                                        onClick={handleToggleVideo}
                                        className={!videoEnabled ? styles.controlBtnMuted : ''}
                                        size="small"
                                    >
                                        {videoEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Name input */}
                        <div className={styles.lobbyForm}>
                            <TextField
                                label="Your display name"
                                value={displayName}
                                onChange={e => { setDisplayName(e.target.value); setNameError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleJoinMeeting()}
                                variant="outlined"
                                error={Boolean(nameError)}
                                helperText={nameError || 'This is the name other participants will see'}
                                inputProps={{ 'aria-label': 'Display name', maxLength: 35 }}
                                fullWidth
                                size="small"
                            />

                            <button
                                className={styles.lobbyJoinBtn}
                                onClick={handleJoinMeeting}
                                disabled={mediaStatus === 'loading'}
                            >
                                {mediaStatus === 'loading' ? 'Initializing…' : 'Join Meeting Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════
    // MAIN MEETING ROOM VIEW
    // ════════════════════════════════════════════════
    return (
        <div className={`${styles.meetContainer} ${styles[meetingTheme]}`}>

            {/* ── TOP MEETING BAR ── */}
            <header className={styles.topBar}>
                <div className={styles.topBarBrand}>
                    <span className={styles.topBarLogo}>Connectify</span>
                    <span className={styles.topBarSep}>/</span>
                    <Tooltip title="Click to copy invite link">
                        <button
                            type="button"
                            className={styles.topBarCode}
                            onClick={copyMeetingInvite}
                            aria-label={`Meeting code: ${meetingCode}. Click to copy invite link`}
                        >
                            {copied ? 'Copied!' : meetingCode}
                        </button>
                    </Tooltip>
                    <span className={styles.topBarConnectedBadge} title="Connected">
                        <span className={styles.pulseDot} />
                        <span>Connected</span>
                    </span>
                </div>

                {/* Duration timer (isolated memo) */}
                <MeetingTimer />

                <div className={styles.topBarRight}>
                    <Tooltip title="Copy meeting invite link">
                        <button
                            className={styles.topBarBtn}
                            onClick={copyMeetingInvite}
                            aria-label="Copy meeting invite link"
                        >
                            {copied ? <CheckIcon sx={{ fontSize: '0.9rem', color: '#4ade80' }} /> : <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />}
                            <span>{copied ? 'Copied!' : 'Invite'}</span>
                        </button>
                    </Tooltip>

                    <button
                        className={`${styles.topBarBtn} ${showParticipants ? styles.topBarBtnActive : ''}`}
                        onClick={() => { setShowParticipants(v => !v); setShowChat(false); setShowMore(false); }}
                        aria-label="View participants"
                    >
                        <PeopleIcon sx={{ fontSize: '0.9rem' }} />
                        <span>{totalCount}</span>
                    </button>
                </div>
            </header>

            {/* Screen sharing banner */}
            {screenSharing && (
                <div className={styles.screenShareBanner}>
                    <ScreenShareIcon sx={{ fontSize: '1rem' }} />
                    <span>You are presenting your screen to everyone</span>
                    <button className={styles.stopShareBtn} onClick={handleScreenShare}>
                        Stop sharing
                    </button>
                </div>
            )}

            {/* ── STAGE CONTAINER: Houses dynamic grid and side panels without overflowing viewport ── */}
            <div className={styles.stageContainer}>
                {/* ── VIDEO CONFERENCING GRID ── */}
                <main className={`${styles.conferenceView} ${getGridClass()}`}>
                    {/* Local user video tile */}
                    <LocalVideo
                        stream={localStream}
                        videoEnabled={videoEnabled}
                        audioEnabled={audioEnabled}
                        displayName={displayName || 'You'}
                        reactions={reactions}
                        localSocketId={socketIdRef.current}
                        screenSharing={screenSharing}
                    />

                    {/* Remote participants video tiles */}
                    {participants.map(p => (
                        <RemoteVideo
                            key={p.socketId}
                            participant={p}
                            reactions={reactions}
                        />
                    ))}
                </main>

                {/* ── CHAT PANEL (Right slide-over) ── */}
                {showChat && (
                    <aside className={styles.chatRoom} aria-label="Meeting Chat">
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderTitle}>
                                <ChatIcon fontSize="small" sx={{ color: '#818cf8' }} />
                                <span>In-call Messages</span>
                            </div>
                            <IconButton
                                onClick={() => setShowChat(false)}
                                aria-label="Close chat"
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        <div className={styles.chatNotice}>
                            Messages can be seen only by people in the call.
                        </div>

                        <div className={styles.chattingDisplay}>
                            {messages.length === 0 ? (
                                <div className={styles.noMessages}>
                                    <p>No messages yet.</p>
                                    <span>Send a message to start the conversation.</span>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`${styles.message} ${msg.isOwn ? styles.ownMessage : ''}`}
                                    >
                                        {!msg.isOwn && (
                                            <div className={styles.sender}>{msg.sender}</div>
                                        )}
                                        <div className={styles.messageText}>{msg.text}</div>
                                        <div className={styles.messageTime}>{msg.ts}</div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className={styles.chattingArea}>
                            <TextField
                                fullWidth
                                placeholder="Message..."
                                value={msgInput}
                                onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                variant="outlined"
                                size="small"
                                autoComplete="off"
                                inputProps={{
                                    'aria-label': 'Chat message text',
                                    style: { color: '#f8fafc', caretColor: '#818cf8' }
                                }}
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        color: '#f8fafc',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                                        '&:hover fieldset': { borderColor: '#6366f1' },
                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#f8fafc !important',
                                        WebkitTextFillColor: '#f8fafc !important',
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: '#94a3b8 !important',
                                        opacity: 1,
                                        WebkitTextFillColor: '#94a3b8 !important',
                                    }
                                }}
                            />
                            <Tooltip title="Send message (Enter)">
                                <span>
                                    <IconButton
                                        onClick={handleSendMessage}
                                        disabled={!msgInput.trim()}
                                        aria-label="Send message"
                                        className={styles.chatSendBtn}
                                    >
                                        <SendIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </div>
                    </aside>
                )}

                {/* ── PARTICIPANTS PANEL (Right slide-over) ── */}
                {showParticipants && (
                    <aside className={styles.participantsPanel} aria-label="Meeting Participants">
                        <div className={styles.panelHeader}>
                            <div className={styles.panelHeaderTitle}>
                                <PeopleIcon fontSize="small" sx={{ color: '#818cf8' }} />
                                <span>Participants ({totalCount})</span>
                            </div>
                            <IconButton
                                onClick={() => setShowParticipants(false)}
                                aria-label="Close participants"
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        <div className={styles.participantsList}>
                            {/* Local User Row */}
                            <div className={styles.participantRow}>
                                <div className={styles.participantAvatar}>
                                    {getInitials(displayName)}
                                </div>
                                <div className={styles.participantInfo}>
                                    <span className={styles.participantRowName}>
                                        {displayName || 'You'}
                                        <span className={styles.youBadge}>You</span>
                                    </span>
                                </div>
                                <div className={styles.participantRowIcons}>
                                    {audioEnabled ? (
                                        <MicIcon sx={{ fontSize: '1rem', color: '#22c55e' }} />
                                    ) : (
                                        <MicOffIcon sx={{ fontSize: '1rem', color: '#f87171' }} />
                                    )}
                                    {videoEnabled ? (
                                        <VideocamIcon sx={{ fontSize: '1rem', color: '#22c55e' }} />
                                    ) : (
                                        <VideocamOffIcon sx={{ fontSize: '1rem', color: '#f87171' }} />
                                    )}
                                </div>
                            </div>

                            {/* Remote Participants Rows */}
                            {participants.map(p => (
                                <div key={p.socketId} className={styles.participantRow}>
                                    <div className={styles.participantAvatar}>
                                        {getInitials(p.name)}
                                    </div>
                                    <div className={styles.participantInfo}>
                                        <span className={styles.participantRowName}>{p.name || 'Guest'}</span>
                                    </div>
                                    <div className={styles.participantRowIcons}>
                                        {p.audioEnabled !== false ? (
                                            <MicIcon sx={{ fontSize: '1rem', color: '#22c55e' }} />
                                        ) : (
                                            <MicOffIcon sx={{ fontSize: '1rem', color: '#f87171' }} />
                                        )}
                                        {p.videoEnabled !== false ? (
                                            <VideocamIcon sx={{ fontSize: '1rem', color: '#22c55e' }} />
                                        ) : (
                                            <VideocamOffIcon sx={{ fontSize: '1rem', color: '#f87171' }} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>

            {/* ── REACTIONS POPOVER ── */}
            {showReactions && (
                <div className={styles.reactionsPopup}>
                    {REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            className={styles.reactionBtn}
                            onClick={() => handleSendReaction(emoji)}
                            aria-label={`Send reaction ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* ── MORE MENU POPOVER / BOTTOM SHEET ── */}
            {showMore && (
                <>
                    <div className={styles.mobileBackdrop} onClick={() => setShowMore(false)} />
                    <div className={styles.moreMenu}>
                        {/* Mobile Quick Reactions Row */}
                        <div className={styles.mobileReactionsStrip}>
                            {REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    className={styles.reactionBtn}
                                    onClick={() => { handleSendReaction(emoji); setShowMore(false); }}
                                    aria-label={`Send reaction ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {screenAvailable && (
                            <button
                                className={styles.moreMenuItem}
                                onClick={() => { handleScreenShare(); setShowMore(false); }}
                            >
                                {screenSharing ? <StopScreenShareIcon sx={{ fontSize: '1rem', color: '#ef4444' }} /> : <ScreenShareIcon sx={{ fontSize: '1rem' }} />}
                                <span>{screenSharing ? 'Stop Presenting Screen' : 'Share Screen'}</span>
                            </button>
                        )}

                        <button
                            className={styles.moreMenuItem}
                            onClick={() => { copyMeetingInvite(); setShowMore(false); }}
                        >
                            {copied ? <CheckIcon sx={{ fontSize: '1rem', color: '#4ade80' }} /> : <ContentCopyIcon sx={{ fontSize: '1rem' }} />}
                            <span>{copied ? 'Invite Link Copied!' : 'Copy Meeting Invite'}</span>
                        </button>

                        <button
                            className={styles.moreMenuItem}
                            onClick={() => { toggleFullscreen(); setShowMore(false); }}
                        >
                            {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: '1rem' }} /> : <FullscreenIcon sx={{ fontSize: '1rem' }} />}
                            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
                        </button>

                        <button
                            className={styles.moreMenuItem}
                            onClick={() => { setShowSettings(true); loadMediaDevices(); setShowMore(false); }}
                        >
                            <SettingsIcon sx={{ fontSize: '1rem' }} />
                            <span>Settings & Appearance</span>
                        </button>

                        <button
                            className={`${styles.moreMenuItem} ${styles.moreMenuLeaveItem}`}
                            onClick={() => { setShowLeaveConfirm(true); setShowMore(false); }}
                        >
                            <CallEndIcon sx={{ fontSize: '1rem', color: '#ef4444' }} />
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>Leave Meeting</span>
                        </button>
                    </div>
                </>
            )}

            {/* ── BOTTOM MEETING TOOLBAR ── */}
            <footer className={styles.buttonContainers}>
                {/* Microphone Toggle */}
                <Tooltip title={audioEnabled ? 'Mute (Mic)' : 'Unmute (Mic)'} placement="top">
                    <IconButton
                        onClick={handleToggleAudio}
                        aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        className={!audioEnabled ? styles.controlBtnMuted : ''}
                    >
                        {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>
                </Tooltip>

                {/* Camera Toggle */}
                <Tooltip title={videoEnabled ? 'Stop Video (Camera)' : 'Start Video (Camera)'} placement="top">
                    <IconButton
                        onClick={handleToggleVideo}
                        aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                        className={!videoEnabled ? styles.controlBtnMuted : ''}
                    >
                        {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>
                </Tooltip>

                {/* Screen Share (Desktop only on toolbar, accessible via More on mobile) */}
                {screenAvailable && (
                    <Tooltip title={screenSharing ? 'Stop Presenting' : 'Share Screen'} placement="top">
                        <IconButton
                            onClick={handleScreenShare}
                            aria-label={screenSharing ? 'Stop sharing screen' : 'Share screen'}
                            className={`${screenSharing ? styles.controlBtnActive : ''} ${styles.desktopOnlyBtn}`}
                        >
                            {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>
                    </Tooltip>
                )}

                {/* Participants Panel Toggle */}
                <Tooltip title="Participants" placement="top">
                    <Badge badgeContent={totalCount} color="primary" max={99}>
                        <IconButton
                            onClick={() => {
                                setShowParticipants(v => !v);
                                setShowChat(false);
                                setShowMore(false);
                            }}
                            aria-label="Participants list"
                            className={showParticipants ? styles.controlBtnActive : ''}
                        >
                            <PeopleIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>

                {/* Chat Panel Toggle */}
                <Tooltip title="In-call Chat" placement="top">
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                        <IconButton
                            onClick={() => {
                                setShowChat(v => !v);
                                setShowParticipants(false);
                                setShowMore(false);
                            }}
                            aria-label="Chat window"
                            className={showChat ? styles.controlBtnActive : ''}
                        >
                            <ChatIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>

                {/* Reactions (Desktop only on toolbar, accessible via More on mobile) */}
                <Tooltip title="Reactions" placement="top">
                    <IconButton
                        onClick={() => {
                            setShowReactions(v => !v);
                            setShowMore(false);
                        }}
                        aria-label="Reactions"
                        className={`${showReactions ? styles.controlBtnActive : ''} ${styles.desktopOnlyBtn}`}
                    >
                        <EmojiEmotionsOutlinedIcon />
                    </IconButton>
                </Tooltip>

                {/* More Options (Always visible) */}
                <Tooltip title="More Options" placement="top">
                    <IconButton
                        onClick={() => {
                            setShowMore(v => !v);
                            setShowReactions(false);
                        }}
                        aria-label="More options"
                        className={showMore ? styles.controlBtnActive : ''}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                </Tooltip>

                {/* Settings (Desktop only on toolbar, accessible via More on mobile) */}
                <Tooltip title="Settings" placement="top">
                    <IconButton
                        onClick={() => {
                            setShowSettings(true);
                            loadMediaDevices();
                            setShowMore(false);
                        }}
                        aria-label="Settings"
                        className={`${showSettings ? styles.controlBtnActive : ''} ${styles.desktopOnlyBtn}`}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>

                {/* Leave Meeting (Danger Button) */}
                <Tooltip title="Leave Meeting" placement="top">
                    <IconButton
                        onClick={() => setShowLeaveConfirm(true)}
                        aria-label="End call"
                        className={styles.leaveMeetingBtn}
                    >
                        <CallEndIcon />
                    </IconButton>
                </Tooltip>
            </footer>

            {/* ── LEAVE CONFIRMATION MODAL ── */}
            {showLeaveConfirm && (
                <div className={styles.dialogOverlay}>
                    <div className={styles.dialog}>
                        <h2 className={styles.dialogTitle}>Leave Meeting?</h2>
                        <p className={styles.dialogText}>
                            Are you sure you want to leave? Other participants will remain in the call.
                        </p>
                        <div className={styles.dialogActions}>
                            <button
                                className={styles.dialogCancel}
                                onClick={() => setShowLeaveConfirm(false)}
                            >
                                Stay in Meeting
                            </button>
                            <button
                                className={styles.dialogLeave}
                                onClick={handleLeaveConfirmed}
                            >
                                Leave Meeting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SETTINGS & BACKGROUND MODAL ── */}
            {showSettings && (
                <div className={styles.dialogOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.settingsHeader}>
                            <div className={styles.settingsHeaderTitle}>
                                <SettingsIcon fontSize="small" sx={{ color: '#818cf8' }} />
                                <h2>Meeting Settings</h2>
                            </div>
                            <IconButton
                                onClick={() => setShowSettings(false)}
                                size="small"
                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        {/* Settings Tabs */}
                        <div className={styles.settingsTabs}>
                            <button
                                onClick={() => setSettingsTab('audio')}
                                className={`${styles.settingsTab} ${settingsTab === 'audio' ? styles.settingsTabActive : ''}`}
                            >
                                Audio
                            </button>
                            <button
                                onClick={() => setSettingsTab('video')}
                                className={`${styles.settingsTab} ${settingsTab === 'video' ? styles.settingsTabActive : ''}`}
                            >
                                Video
                            </button>
                            <button
                                onClick={() => setSettingsTab('theme')}
                                className={`${styles.settingsTab} ${settingsTab === 'theme' ? styles.settingsTabActive : ''}`}
                            >
                                Appearance
                            </button>
                            <button
                                onClick={() => setSettingsTab('general')}
                                className={`${styles.settingsTab} ${settingsTab === 'general' ? styles.settingsTabActive : ''}`}
                            >
                                General
                            </button>
                        </div>

                        <div className={styles.settingsBody}>
                            {/* AUDIO SETTINGS */}
                            {settingsTab === 'audio' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Microphone Device</label>
                                        {audioDevices.length > 0 ? (
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={selectedAudio}
                                                    onChange={e => setSelectedAudio(e.target.value)}
                                                    displayEmpty
                                                    className={styles.settingsSelect}
                                                >
                                                    <MenuItem value="">System Default Microphone</MenuItem>
                                                    {audioDevices.map(d => (
                                                        <MenuItem key={d.deviceId} value={d.deviceId}>
                                                            {d.label || `Microphone (${d.deviceId.slice(0, 6)}…)`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <p className={styles.settingsHint}>System default microphone active.</p>
                                        )}
                                    </div>

                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Input Level Test</label>
                                        <div className={styles.meterContainer}>
                                            <VolumeUpIcon sx={{ fontSize: '1.1rem', color: audioEnabled ? '#22c55e' : '#94a3b8' }} />
                                            <div className={styles.meterTrack}>
                                                <div
                                                    className={styles.meterBar}
                                                    style={{ width: audioEnabled ? `${micVolume}%` : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Microphone State</label>
                                        <span className={audioEnabled ? styles.statusOn : styles.statusOff}>
                                            {audioEnabled ? '● Microphone active & sending audio' : '● Microphone muted'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* VIDEO SETTINGS */}
                            {settingsTab === 'video' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Camera Device</label>
                                        {videoDevices.length > 0 ? (
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={selectedVideo}
                                                    onChange={e => setSelectedVideo(e.target.value)}
                                                    displayEmpty
                                                    className={styles.settingsSelect}
                                                >
                                                    <MenuItem value="">System Default Camera</MenuItem>
                                                    {videoDevices.map(d => (
                                                        <MenuItem key={d.deviceId} value={d.deviceId}>
                                                            {d.label || `Camera (${d.deviceId.slice(0, 6)}…)`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <p className={styles.settingsHint}>System default camera active.</p>
                                        )}
                                    </div>

                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Camera Preview</label>
                                        <div className={styles.settingsPreviewWrap}>
                                            <video
                                                ref={previewVideoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className={styles.settingsPreview}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Camera State</label>
                                        <span className={videoEnabled ? styles.statusOn : styles.statusOff}>
                                            {videoEnabled ? '● Camera active & broadcasting' : '● Camera turned off'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* THEME & APPEARANCE */}
                            {settingsTab === 'theme' && (
                                <div className={styles.settingsSection}>
                                    <label className={styles.settingsLabel}>Meeting Background Theme</label>
                                    <div className={styles.themeGrid}>
                                        {THEMES.map(t => (
                                            <div
                                                key={t.id}
                                                className={`${styles.themeOption} ${meetingTheme === t.id ? styles.themeOptionActive : ''}`}
                                                onClick={() => setMeetingTheme(t.id)}
                                            >
                                                <div className={`${styles.themePreview} ${styles[t.id]}`} />
                                                <div className={styles.themeInfo}>
                                                    <span className={styles.themeTitle}>{t.name}</span>
                                                    <span className={styles.themeDesc}>{t.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GENERAL SETTINGS */}
                            {settingsTab === 'general' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Your Display Name</label>
                                        <p className={styles.settingsValue}>{displayName || 'Guest'}</p>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Meeting Code</label>
                                        <p className={styles.settingsValue} style={{ fontFamily: 'monospace' }}>
                                            {meetingCode}
                                        </p>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Meeting Link</label>
                                        <div className={styles.settingsLinkRow}>
                                            <p className={styles.settingsLinkText}>{window.location.href}</p>
                                            <button className={styles.settingsCopyBtn} onClick={copyMeetingInvite}>
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Full Screen Mode</label>
                                        <button
                                            className={styles.settingsCopyBtn}
                                            onClick={() => { toggleFullscreen(); setShowSettings(false); }}
                                        >
                                            {isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
