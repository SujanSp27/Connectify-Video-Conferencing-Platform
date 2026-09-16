import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { Badge, IconButton, TextField, Tooltip, Select, MenuItem, FormControl } from '@mui/material';
import { Button } from '@mui/material';
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
import styles from '../styles/videoComponent.module.css';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Module-level peer connections map — survives re-renders
const peerConnections = {};

function formatDuration(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getInitials(name) {
    if (!name) return 'G';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
}

const REACTIONS = ['👍','👏','❤️','😂','🎉','😮'];

export default function VideoMeetComponent() {

    // ── refs ──
    const socketRef        = useRef(null);
    const socketIdRef      = useRef(null);
    const localVideoRef    = useRef(null);   // always mounted — hidden when cam off
    const chatEndRef       = useRef(null);
    const seenMsgIds       = useRef(new Set());
    const offersCreated    = useRef(new Set());
    const timerRef         = useRef(null);
    const participantsRef  = useRef([]);

    // ── state ──
    const [inMeeting, setInMeeting]               = useState(false);
    const [username, setUsername]                 = useState('');
    const [usernameError, setUsernameError]       = useState('');
    const [mediaStatus, setMediaStatus]           = useState('idle'); // idle|loading|ready|denied
    const [videoEnabled, setVideoEnabled]         = useState(true);
    const [audioEnabled, setAudioEnabled]         = useState(true);
    const [screenSharing, setScreenSharing]       = useState(false);
    const [screenAvailable, setScreenAvailable]   = useState(false);
    const [participants, setParticipants]         = useState([]);
    const [messages, setMessages]                 = useState([]);
    const [msgInput, setMsgInput]                 = useState('');
    const [newMessages, setNewMessages]           = useState(0);
    const [showChat, setShowChat]                 = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showReactions, setShowReactions]       = useState(false);
    const [showMore, setShowMore]                 = useState(false);
    const [reactions, setReactions]               = useState([]); // [{id, emoji, socketId}]
    const [elapsed, setElapsed]                   = useState(0);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [copied, setCopied]                     = useState(false);
    const [showSettings, setShowSettings]         = useState(false);
    const [settingsTab, setSettingsTab]           = useState('audio'); // audio|video|general
    const [isFullscreen, setIsFullscreen]         = useState(false);
    const [audioDevices, setAudioDevices]         = useState([]);
    const [videoDevices, setVideoDevices]         = useState([]);
    const [selectedAudio, setSelectedAudio]       = useState('');
    const [selectedVideo, setSelectedVideo]       = useState('');
    const meetingCode = window.location.pathname.slice(1);

    // ─────────────────────────────────────────────────────────
    // 1. GET CAMERA ON MOUNT — once only
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        setMediaStatus('loading');
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                window.localStream = stream;
                // Assign to video element if already mounted
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setMediaStatus('ready');
                if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
            })
            .catch(() => {
                setMediaStatus('denied');
            });

        return () => { cleanupAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─────────────────────────────────────────────────────────
    // 2. CRITICAL FIX: assign srcObject whenever localVideoRef
    //    attaches to a new DOM element (lobby → meeting room)
    // ─────────────────────────────────────────────────────────
    const assignLocalVideo = useCallback((el) => {
        localVideoRef.current = el;
        if (el && window.localStream) {
            el.srcObject = window.localStream;
        }
    }, []);

    // ─────────────────────────────────────────────────────────
    // 3. VIDEO TOGGLE — just flip the track enabled flag
    // ─────────────────────────────────────────────────────────
    const handleToggleVideo = useCallback(() => {
        const next = !videoEnabled;
        setVideoEnabled(next);
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(t => { t.enabled = next; });
        }
        socketRef.current?.emit('video-state', next);
    }, [videoEnabled]);

    // ─────────────────────────────────────────────────────────
    // 4. AUDIO TOGGLE
    // ─────────────────────────────────────────────────────────
    const handleToggleAudio = useCallback(() => {
        const next = !audioEnabled;
        setAudioEnabled(next);
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(t => { t.enabled = next; });
        }
        socketRef.current?.emit('audio-state', next);
    }, [audioEnabled]);

    // ─────────────────────────────────────────────────────────
    // 5. SCREEN SHARE
    // ─────────────────────────────────────────────────────────
    const handleScreenShare = useCallback(async () => {
        if (screenSharing) {
            setScreenSharing(false);
            try {
                const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                window.localStream = camStream;
                if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
                Object.values(peerConnections).forEach(pc => {
                    camStream.getTracks().forEach(t => {
                        const s = pc.getSenders().find(s => s.track?.kind === t.kind);
                        s?.replaceTrack(t).catch(() => {});
                    });
                });
            } catch (e) { console.error('Restore camera failed:', e); }
        } else {
            try {
                const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenSharing(true);
                if (localVideoRef.current) localVideoRef.current.srcObject = screen;
                Object.values(peerConnections).forEach(pc => {
                    screen.getVideoTracks().forEach(t => {
                        const s = pc.getSenders().find(s => s.track?.kind === 'video');
                        s?.replaceTrack(t).catch(() => {});
                    });
                });
                screen.getVideoTracks()[0].onended = () => handleScreenShare();
            } catch (e) { console.error('Screen share failed:', e); }
        }
    }, [screenSharing]);

    // ─────────────────────────────────────────────────────────
    // 6. SEND REACTION
    // ─────────────────────────────────────────────────────────
    const sendReaction = useCallback((emoji) => {
        setShowReactions(false);
        if (socketRef.current?.connected) {
            socketRef.current.emit('reaction', emoji, socketIdRef.current);
        }
        // Show locally too
        const id = `${Date.now()}-local`;
        setReactions(prev => [...prev, { id, emoji, socketId: socketIdRef.current }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    }, []);

    // ─────────────────────────────────────────────────────────
    // 7. SEND MESSAGE — no local add; server echoes back with ID
    // ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(() => {
        const text = msgInput.trim();
        if (!text || !socketRef.current?.connected) return;
        socketRef.current.emit('chat-message', text, username);
        setMsgInput('');
    }, [msgInput, username]);

    // ─────────────────────────────────────────────────────────
    // 8. CLEANUP
    // ─────────────────────────────────────────────────────────
    const cleanupAll = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch {}
        Object.values(peerConnections).forEach(pc => { try { pc.close(); } catch {} });
        Object.keys(peerConnections).forEach(k => delete peerConnections[k]);
        offersCreated.current.clear();
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    }, []);

    const handleLeaveConfirmed = useCallback(() => {
        cleanupAll();
        window.location.href = '/home';
    }, [cleanupAll]);

    // ─────────────────────────────────────────────────────────
    // 9. WebRTC signal handler
    // ─────────────────────────────────────────────────────────
    const gotMessageFromServer = useCallback(async (fromId, rawMsg) => {
        let signal;
        try { signal = JSON.parse(rawMsg); } catch { return; }
        if (fromId === socketIdRef.current) return;

        if (!peerConnections[fromId]) {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnections[fromId] = pc;
            pc.onicecandidate = ev => {
                if (ev.candidate)
                    socketRef.current?.emit('signal', fromId, JSON.stringify({ ice: ev.candidate }));
            };
            pc.ontrack = ev => {
                const stream = ev.streams[0];
                setParticipants(prev => {
                    const exists = prev.find(p => p.socketId === fromId);
                    const updated = exists
                        ? prev.map(p => p.socketId === fromId ? { ...p, stream } : p)
                        : [...prev, { socketId: fromId, name: 'Guest', stream, videoEnabled: true, audioEnabled: true }];
                    participantsRef.current = updated;
                    return updated;
                });
            };
            if (window.localStream)
                window.localStream.getTracks().forEach(t => pc.addTrack(t, window.localStream));
        }

        const pc = peerConnections[fromId];
        try {
            if (signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                if (signal.sdp.type === 'offer') {
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    socketRef.current?.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }));
                }
            }
            if (signal.ice) await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        } catch (e) { console.error('Signal error:', e); }
    }, []);

    // ─────────────────────────────────────────────────────────
    // 10. CONNECT TO SOCKET
    // ─────────────────────────────────────────────────────────
    const connectToSocketServer = useCallback(() => {
        if (socketRef.current?.connected) return;
        const socket = io.connect(SERVER_URL, { secure: false });
        socketRef.current = socket;

        socket.on('signal', gotMessageFromServer);

        socket.on('connect', () => {
            socketIdRef.current = socket.id;
            socket.emit('join-call', { roomId: window.location.href, name: username });
        });

        socket.on('chat-message', (msgId, text, sender, senderName, senderSocketId) => {
            if (seenMsgIds.current.has(msgId)) return;
            seenMsgIds.current.add(msgId);
            const isOwn = senderSocketId === socketIdRef.current;
            setMessages(prev => [...prev, {
                id: msgId,
                sender: senderName || sender || 'Guest',
                text, isOwn,
                ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
            if (!isOwn) setNewMessages(n => n + 1);
        });

        socket.on('video-state', (socketId, enabled) => {
            setParticipants(prev => {
                const u = prev.map(p => p.socketId === socketId ? { ...p, videoEnabled: enabled } : p);
                participantsRef.current = u;
                return u;
            });
        });

        socket.on('audio-state', (socketId, enabled) => {
            setParticipants(prev => {
                const u = prev.map(p => p.socketId === socketId ? { ...p, audioEnabled: enabled } : p);
                participantsRef.current = u;
                return u;
            });
        });

        socket.on('reaction', (emoji, fromSocketId) => {
            const id = `${Date.now()}-${fromSocketId}`;
            setReactions(prev => [...prev, { id, emoji, socketId: fromSocketId }]);
            setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
        });

        socket.on('user-left', socketId => {
            try { peerConnections[socketId]?.close(); delete peerConnections[socketId]; } catch {}
            setParticipants(prev => {
                const u = prev.filter(p => p.socketId !== socketId);
                participantsRef.current = u;
                return u;
            });
        });

        socket.on('user-joined', (newSocketId, _list, participantList) => {
            if (participantList) {
                const remotes = participantList.filter(p => p.socketId !== socketIdRef.current);
                setParticipants(prev => {
                    const u = remotes.map(p => {
                        const ex = prev.find(e => e.socketId === p.socketId);
                        return ex
                            ? { ...ex, name: p.name }
                            : { socketId: p.socketId, name: p.name, stream: null, videoEnabled: true, audioEnabled: true };
                    });
                    participantsRef.current = u;
                    return u;
                });
            }
            if (newSocketId === socketIdRef.current || peerConnections[newSocketId]) return;
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnections[newSocketId] = pc;
            pc.onicecandidate = ev => {
                if (ev.candidate)
                    socket.emit('signal', newSocketId, JSON.stringify({ ice: ev.candidate }));
            };
            pc.ontrack = ev => {
                const stream = ev.streams[0];
                setParticipants(prev => {
                    const exists = prev.find(p => p.socketId === newSocketId);
                    const entry = participantList?.find(p => p.socketId === newSocketId);
                    const u = exists
                        ? prev.map(p => p.socketId === newSocketId ? { ...p, stream } : p)
                        : [...prev, { socketId: newSocketId, name: entry?.name || 'Guest', stream, videoEnabled: true, audioEnabled: true }];
                    participantsRef.current = u;
                    return u;
                });
            };
            if (window.localStream)
                window.localStream.getTracks().forEach(t => pc.addTrack(t, window.localStream));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, gotMessageFromServer]);

    // Create offers to existing peers after participants list updates
    useEffect(() => {
        if (!inMeeting) return;
        participants.forEach(p => {
            if (offersCreated.current.has(p.socketId)) return;
            if (!peerConnections[p.socketId]) return;
            offersCreated.current.add(p.socketId);
            const pc = peerConnections[p.socketId];
            pc.createOffer()
                .then(o => pc.setLocalDescription(o))
                .then(() => socketRef.current?.emit('signal', p.socketId, JSON.stringify({ sdp: peerConnections[p.socketId].localDescription })))
                .catch(e => console.error('Offer error:', e));
        });
    }, [participants, inMeeting]);

    // Chat scroll
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    // Clear badge when chat opens
    useEffect(() => { if (showChat) setNewMessages(0); }, [showChat]);

    // ─────────────────────────────────────────────────────────
    // 11. JOIN MEETING
    // ─────────────────────────────────────────────────────────
    const joinMeeting = useCallback(() => {
        if (!username.trim()) { setUsernameError('Please enter your display name'); return; }
        setUsernameError('');
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
            window.localStream.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
        }
        setInMeeting(true);
        connectToSocketServer();
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }, [username, videoEnabled, audioEnabled, connectToSocketServer]);

    // Copy invite link
    const copyInvite = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (e) { console.error('Fullscreen error:', e); }
    }, []);

    // Listen for fullscreen change from Esc key
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Load available media devices for settings panel
    const loadDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
            setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
        } catch (e) { console.error('enumerate devices failed:', e); }
    }, []);

    // ═══════════════════════════════════════════════════════
    // RENDER — LOBBY
    // ═══════════════════════════════════════════════════════
    if (!inMeeting) {
        return (
            <div className={styles.meetContainer}>
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyCard}>
                        <p className={styles.lobbyMeetingCode}>
                            Meeting: <span>{meetingCode}</span>
                        </p>

                        {/* LOBBY VIDEO — ref callback ensures srcObject is set */}
                        <div className={styles.lobbyPreviewWrap}>
                            {mediaStatus === 'loading' && (
                                <div className={styles.lobbyPreviewPlaceholder}>
                                    <span>Starting camera…</span>
                                </div>
                            )}
                            {mediaStatus === 'denied' && (
                                <div className={styles.lobbyPreviewPlaceholder}>
                                    <span style={{ color: '#F87171' }}>Camera access blocked</span>
                                </div>
                            )}
                            <video
                                ref={assignLocalVideo}
                                autoPlay muted playsInline
                                className={styles.lobbyPreview}
                                style={{ display: mediaStatus === 'ready' ? 'block' : 'none' }}
                            />
                        </div>

                        <TextField
                            label="Your display name"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setUsernameError(''); }}
                            onKeyDown={e => e.key === 'Enter' && joinMeeting()}
                            variant="outlined"
                            error={Boolean(usernameError)}
                            helperText={usernameError || ' '}
                            inputProps={{ 'aria-label': 'Display name', maxLength: 30 }}
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={joinMeeting}
                            fullWidth
                            disabled={mediaStatus === 'loading'}
                            sx={{
                                background: '#6D28D9',
                                '&:hover': { background: '#5B21B6' },
                                '&:disabled': { background: 'rgba(109,40,217,0.4)' },
                                textTransform: 'none',
                                fontWeight: 600,
                                height: 44,
                                borderRadius: '10px',
                                boxShadow: '0 4px 16px rgba(109,40,217,0.4)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            {mediaStatus === 'loading' ? 'Starting camera…' : 'Join Meeting'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════
    // RENDER — MEETING ROOM
    // ═══════════════════════════════════════════════════════
    const total = participants.length + 1;
    const gridClass = styles[`grid${Math.min(total, 6)}`] || styles.grid6;

    return (
        <div className={styles.meetContainer}>
            {/* ── Leave confirm dialog ── */}
            {showLeaveConfirm && (
                <div className={styles.dialogOverlay}>
                    <div className={styles.dialog}>
                        <h2 className={styles.dialogTitle}>Leave meeting?</h2>
                        <p className={styles.dialogText}>Others will remain in the meeting.</p>
                        <div className={styles.dialogActions}>
                            <button className={styles.dialogCancel} onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
                            <button className={styles.dialogLeave} onClick={handleLeaveConfirmed}>Leave</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings modal ── */}
            {showSettings && (
                <div className={styles.dialogOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.settingsHeader}>
                            <h2 className={styles.settingsTitle}>Settings</h2>
                            <IconButton onClick={() => setShowSettings(false)} aria-label="Close settings" size="small"
                                sx={{ color: '#FAF9F7' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        {/* Tab row */}
                        <div className={styles.settingsTabs}>
                            {['audio','video','general'].map(tab => (
                                <button key={tab} onClick={() => setSettingsTab(tab)}
                                    className={`${styles.settingsTab} ${settingsTab === tab ? styles.settingsTabActive : ''}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className={styles.settingsBody}>

                            {settingsTab === 'audio' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Microphone</label>
                                        {audioDevices.length > 0 ? (
                                            <FormControl fullWidth size="small"
                                                sx={{ '& .MuiOutlinedInput-root': { color: '#FAF9F7', borderColor: 'rgba(139,92,246,0.3)' },
                                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(139,92,246,0.3)' },
                                                      '& .MuiSvgIcon-root': { color: '#C4B5FD' } }}>
                                                <Select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)}
                                                    displayEmpty sx={{ color: '#FAF9F7' }}>
                                                    <MenuItem value="">Default microphone</MenuItem>
                                                    {audioDevices.map(d => (
                                                        <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,8)}`}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <p className={styles.settingsHint}>No microphone devices found.</p>
                                        )}
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Microphone status</label>
                                        <div className={styles.settingsStatus}>
                                            <span className={audioEnabled ? styles.statusOn : styles.statusOff}>
                                                {audioEnabled ? '● Active' : '● Muted'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'video' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Camera</label>
                                        {videoDevices.length > 0 ? (
                                            <FormControl fullWidth size="small"
                                                sx={{ '& .MuiOutlinedInput-root': { color: '#FAF9F7' },
                                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(139,92,246,0.3)' },
                                                      '& .MuiSvgIcon-root': { color: '#C4B5FD' } }}>
                                                <Select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)}
                                                    displayEmpty sx={{ color: '#FAF9F7' }}>
                                                    <MenuItem value="">Default camera</MenuItem>
                                                    {videoDevices.map(d => (
                                                        <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,8)}`}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <p className={styles.settingsHint}>No camera devices found.</p>
                                        )}
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Camera status</label>
                                        <div className={styles.settingsStatus}>
                                            <span className={videoEnabled ? styles.statusOn : styles.statusOff}>
                                                {videoEnabled ? '● Camera on' : '● Camera off'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'general' && (
                                <div className={styles.settingsSection}>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Display name</label>
                                        <p className={styles.settingsValue}>{username || 'Not set'}</p>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Meeting ID</label>
                                        <p className={styles.settingsValue} style={{ fontFamily: 'monospace' }}>{meetingCode}</p>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Meeting link</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <p className={styles.settingsValue} style={{ fontSize: '0.75rem', wordBreak: 'break-all', flex: 1 }}>
                                                {window.location.href}
                                            </p>
                                            <button className={styles.settingsCopyBtn} onClick={copyInvite}>
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.settingsField}>
                                        <label className={styles.settingsLabel}>Fullscreen</label>
                                        <button className={styles.settingsCopyBtn} onClick={() => { toggleFullscreen(); setShowSettings(false); }}>
                                            {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.meetVideoContainer}>

                {/* ── TOP BAR ── */}
                <div className={styles.topBar}>
                    <div className={styles.topBarBrand}>
                        <span className={styles.topBarLogo}>Connectify</span>
                        <span className={styles.topBarSep}>·</span>
                        <span className={styles.topBarCode}>{meetingCode}</span>
                    </div>
                    <div className={styles.topBarTimer}>{formatDuration(elapsed)}</div>
                    <div className={styles.topBarRight}>
                        <Tooltip title="Copy invite link">
                            <button className={styles.topBarBtn} onClick={copyInvite} aria-label="Copy invite link">
                                <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />
                                {copied ? 'Copied!' : 'Invite'}
                            </button>
                        </Tooltip>
                        <span className={styles.topBarPeopleCount}>
                            <PeopleIcon sx={{ fontSize: '0.9rem' }} />
                            {total}
                        </span>
                    </div>
                </div>

                {/* ── SCREEN SHARE BANNER ── */}
                {screenSharing && (
                    <div className={styles.screenShareBanner}>
                        <ScreenShareIcon sx={{ fontSize: '0.9rem' }} />
                        You are sharing your screen
                    </div>
                )}

                {/* ── VIDEO GRID ── */}
                <div className={`${styles.conferenceView} ${gridClass}`}>

                    {/* LOCAL TILE — video always in DOM, hidden when cam off */}
                    <div className={`${styles.videoWrapper} ${styles.localTile}`}>
                        {/* Avatar shown when video off */}
                        {!videoEnabled && (
                            <div className={styles.avatarFallback}>
                                <span>{getInitials(username)}</span>
                            </div>
                        )}
                        {/* Video ALWAYS rendered — hidden via CSS when cam off */}
                        <video
                            ref={assignLocalVideo}
                            autoPlay muted playsInline
                            className={styles.tileVideo}
                            style={{ display: videoEnabled ? 'block' : 'none' }}
                        />
                        {/* Reaction overlay */}
                        {reactions.filter(r => r.socketId === socketIdRef.current).map(r => (
                            <div key={r.id} className={styles.reactionOverlay}>{r.emoji}</div>
                        ))}
                        <div className={styles.tileInfo}>
                            <span className={styles.participantName}>
                                {username || 'You'}&nbsp;<span className={styles.youTag}>You</span>
                            </span>
                            <span className={styles.tileIcons}>
                                {!audioEnabled && <MicOffIcon sx={{ fontSize: '0.9rem', color: '#F97360' }} />}
                                {!videoEnabled && <VideocamOffIcon sx={{ fontSize: '0.9rem', color: '#F97360' }} />}
                            </span>
                        </div>
                    </div>

                    {/* REMOTE TILES */}
                    {participants.map(p => {
                        const hasVideo = p.videoEnabled !== false && p.stream &&
                            p.stream.getVideoTracks().some(t => t.readyState === 'live');
                        return (
                            <div key={p.socketId} className={styles.videoWrapper}>
                                {!hasVideo && (
                                    <div className={styles.avatarFallback}>
                                        <span>{getInitials(p.name)}</span>
                                    </div>
                                )}
                                <video
                                    ref={el => { if (el && p.stream) el.srcObject = p.stream; }}
                                    autoPlay playsInline
                                    className={styles.tileVideo}
                                    style={{ display: hasVideo ? 'block' : 'none' }}
                                />
                                {reactions.filter(r => r.socketId === p.socketId).map(r => (
                                    <div key={r.id} className={styles.reactionOverlay}>{r.emoji}</div>
                                ))}
                                <div className={styles.tileInfo}>
                                    <span className={styles.participantName}>{p.name || 'Guest'}</span>
                                    <span className={styles.tileIcons}>
                                        {p.audioEnabled === false && <MicOffIcon sx={{ fontSize: '0.9rem', color: '#F97360' }} />}
                                        {p.videoEnabled === false && <VideocamOffIcon sx={{ fontSize: '0.9rem', color: '#F97360' }} />}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── CHAT PANEL ── */}
                {showChat && (
                    <div className={styles.chatRoom}>
                        <div className={styles.chatHeader}>
                            <h1>Chat</h1>
                            <IconButton onClick={() => setShowChat(false)} aria-label="Close chat" size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                        <div className={styles.chattingDisplay}>
                            {messages.length === 0
                                ? <p className={styles.noMessages}>No messages yet. Say hello!</p>
                                : messages.map(msg => (
                                    <div key={msg.id} className={`${styles.message} ${msg.isOwn ? styles.ownMessage : ''}`}>
                                        {!msg.isOwn && <div className={styles.sender}>{msg.sender}</div>}
                                        <div className={styles.messageText}>{msg.text}</div>
                                        <div className={styles.messageTime}>{msg.ts}</div>
                                    </div>
                                ))
                            }
                            <div ref={chatEndRef} />
                        </div>
                        <div className={styles.chattingArea}>
                            <TextField
                                fullWidth
                                placeholder="Type a message…"
                                value={msgInput}
                                onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                                }}
                                variant="outlined"
                                size="small"
                                multiline
                                maxRows={3}
                            />
                            <Tooltip title="Send">
                                <span>
                                    <IconButton onClick={sendMessage} disabled={!msgInput.trim()} aria-label="Send message"
                                        sx={{ background: '#6D28D9', color: '#fff', width: 36, height: 36,
                                              '&:hover': { background: '#5B21B6' },
                                              '&.Mui-disabled': { background: '#3d3047', color: 'rgba(255,255,255,0.3)' } }}>
                                        <SendIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </div>
                    </div>
                )}

                {/* ── PARTICIPANTS PANEL ── */}
                {showParticipants && (
                    <div className={styles.participantsPanel}>
                        <div className={styles.panelHeader}>
                            <span>Participants ({total})</span>
                            <IconButton onClick={() => setShowParticipants(false)} aria-label="Close" size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>
                        <div className={styles.participantsList}>
                            {/* Self */}
                            <div className={styles.participantRow}>
                                <div className={styles.participantAvatar}>{getInitials(username)}</div>
                                <div className={styles.participantInfo}>
                                    <span className={styles.participantRowName}>
                                        {username || 'You'}
                                        <span className={styles.youBadge}>You</span>
                                    </span>
                                </div>
                                <div className={styles.participantRowIcons}>
                                    {audioEnabled
                                        ? <MicIcon sx={{ fontSize: '1rem', color: '#22C55E' }} />
                                        : <MicOffIcon sx={{ fontSize: '1rem', color: '#F97360' }} />}
                                    {videoEnabled
                                        ? <VideocamIcon sx={{ fontSize: '1rem', color: '#22C55E' }} />
                                        : <VideocamOffIcon sx={{ fontSize: '1rem', color: '#F97360' }} />}
                                </div>
                            </div>
                            {/* Remotes */}
                            {participants.map(p => (
                                <div key={p.socketId} className={styles.participantRow}>
                                    <div className={styles.participantAvatar}>{getInitials(p.name)}</div>
                                    <div className={styles.participantInfo}>
                                        <span className={styles.participantRowName}>{p.name || 'Guest'}</span>
                                    </div>
                                    <div className={styles.participantRowIcons}>
                                        {p.audioEnabled !== false
                                            ? <MicIcon sx={{ fontSize: '1rem', color: '#22C55E' }} />
                                            : <MicOffIcon sx={{ fontSize: '1rem', color: '#F97360' }} />}
                                        {p.videoEnabled !== false
                                            ? <VideocamIcon sx={{ fontSize: '1rem', color: '#22C55E' }} />
                                            : <VideocamOffIcon sx={{ fontSize: '1rem', color: '#F97360' }} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── REACTIONS POPUP ── */}
                {showReactions && (
                    <div className={styles.reactionsPopup}>
                        {REACTIONS.map(e => (
                            <button key={e} className={styles.reactionBtn}
                                onClick={() => sendReaction(e)} aria-label={`React with ${e}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── MORE MENU ── */}
                {showMore && (
                    <div className={styles.moreMenu}>
                        <button className={styles.moreMenuItem} onClick={() => { copyInvite(); setShowMore(false); }}>
                            <ContentCopyIcon sx={{ fontSize: '1rem' }} /> Copy invite link
                        </button>
                        <button className={styles.moreMenuItem} onClick={() => { toggleFullscreen(); setShowMore(false); }}>
                            <FullscreenIcon sx={{ fontSize: '1rem' }} /> {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        </button>
                        <button className={styles.moreMenuItem} onClick={() => { setShowSettings(true); loadDevices(); setShowMore(false); }}>
                            <SettingsIcon sx={{ fontSize: '1rem' }} /> Settings
                        </button>
                    </div>
                )}

                {/* ── CONTROL BAR ── */}
                <div className={styles.buttonContainers}>

                    <Tooltip title={audioEnabled ? 'Mute' : 'Unmute'} placement="top">
                        <IconButton onClick={handleToggleAudio}
                            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                            className={!audioEnabled ? styles.controlBtnMuted : ''}>
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={videoEnabled ? 'Turn off camera' : 'Turn on camera'} placement="top">
                        <IconButton onClick={handleToggleVideo}
                            aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                            className={!videoEnabled ? styles.controlBtnMuted : ''}>
                            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                    </Tooltip>

                    {screenAvailable && (
                        <Tooltip title={screenSharing ? 'Stop sharing' : 'Share screen'} placement="top">
                            <IconButton onClick={handleScreenShare}
                                aria-label={screenSharing ? 'Stop sharing' : 'Share screen'}
                                className={screenSharing ? styles.controlBtnActive : ''}>
                                {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title={showParticipants ? 'Close participants' : 'Participants'} placement="top">
                        <IconButton onClick={() => { setShowParticipants(v => !v); setShowChat(false); setShowMore(false); }}
                            aria-label="Participants"
                            className={showParticipants ? styles.controlBtnActive : ''}>
                            <PeopleIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={showChat ? 'Close chat' : 'Chat'} placement="top">
                        <Badge badgeContent={newMessages} color="error" max={99}>
                            <IconButton onClick={() => { setShowChat(v => !v); setShowParticipants(false); setShowMore(false); }}
                                aria-label="Chat"
                                className={showChat ? styles.controlBtnActive : ''}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </Tooltip>

                    <Tooltip title="Reactions" placement="top">
                        <IconButton onClick={() => { setShowReactions(v => !v); setShowMore(false); }}
                            aria-label="Reactions"
                            className={showReactions ? styles.controlBtnActive : ''}>
                            <EmojiEmotionsOutlinedIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="More" placement="top">
                        <IconButton onClick={() => { setShowMore(v => !v); setShowReactions(false); }}
                            aria-label="More options"
                            className={showMore ? styles.controlBtnActive : ''}>
                            <MoreHorizIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} placement="top">
                        <IconButton onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Settings" placement="top">
                        <IconButton onClick={() => { setShowSettings(true); loadDevices(); setShowMore(false); }}
                            aria-label="Settings"
                            className={showSettings ? styles.controlBtnActive : ''}>
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Leave meeting" placement="top">
                        <IconButton onClick={() => setShowLeaveConfirm(true)} aria-label="End call">
                            <CallEndIcon />
                        </IconButton>
                    </Tooltip>

                </div>

            </div>
        </div>
    );
}
