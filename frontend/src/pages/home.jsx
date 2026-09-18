import { useContext, useEffect, useState, useRef } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { Button, TextField, Tooltip, Skeleton } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../contexts/AuthContext';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.slice(0, Math.min(2, trimmed.length)).toUpperCase();
}

function cleanName(val) {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
        return '';
    }
    return trimmed;
}

function HomeComponent() {
    const navigate = useNavigate();
    const { addToUserHistory, getHistoryOfUser, userData } = useContext(AuthContext);
    
    // Resolve user name with zero "unknown" leakage
    const rawName = cleanName(userData?.name) || cleanName(userData?.username);
    let savedLocalUser = null;
    try {
        savedLocalUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {}
    const resolvedName = rawName || cleanName(savedLocalUser?.name) || cleanName(savedLocalUser?.username) || '';
    const displayGreetingName = resolvedName ? resolvedName.split(' ')[0] : '';

    const [meetingCode, setMeetingCode] = useState('');
    const [joinError, setJoinError]     = useState('');
    const [recent, setRecent]           = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [copiedCode, setCopiedCode]   = useState('');
    const [joining, setJoining]         = useState(false);
    const [creating, setCreating]       = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const joinInputRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const h = await getHistoryOfUser();
                if (isMounted) {
                    setRecent((h || []).slice(0, 6));
                }
            } catch {
                /* non-blocking */
            } finally {
                if (isMounted) setLoadingRecent(false);
            }
        })();
        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNewMeeting = async () => {
        setCreating(true);
        const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
        try {
            await addToUserHistory(code);
            await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
            setCopiedCode(code);
        } catch { /* proceed */ }
        setTimeout(() => {
            navigate(`/${code}`);
        }, 250);
    };

    const handleJoin = async () => {
        const clean = meetingCode.trim().replace(/^\/+|\/+$/g, '').split('/')[0];
        if (!clean) { 
            setJoinError('Please enter a valid meeting code or room link'); 
            joinInputRef.current?.focus();
            return; 
        }
        setJoinError('');
        setJoining(true);
        try { await addToUserHistory(clean); } catch { /* non-blocking */ }
        navigate(`/${clean}`);
    };

    const copyCodeOnly = async (e, code) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(''), 2000);
        } catch {}
    };

    const fmt = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    return (
        <div className="appShell">
            {/* ── Left Collapsible Navigation Sidebar ── */}
            <aside className={`appSidebar ${mobileMenuOpen ? 'mobileOpen' : ''}`} aria-label="Main Navigation">
                <div>
                    <div className="sidebarBrand">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { navigate('/home'); setMobileMenuOpen(false); }}>
                            <div className="sidebarLogoIcon">
                                <VideoCallIcon sx={{ color: '#fff', fontSize: '1.4rem' }} />
                            </div>
                            <span className="sidebarBrandText">Connectify</span>
                            <span className="sidebarBadge">v2.0</span>
                        </div>
                        <button
                            className="sidebarCloseBtn"
                            aria-label="Close navigation menu"
                            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
                        >
                            <CloseIcon fontSize="small" />
                        </button>
                    </div>

                    <nav className="sidebarMenu">
                        <button className="sidebarItem sidebarItemActive" onClick={() => { navigate('/home'); setMobileMenuOpen(false); }}>
                            <DashboardIcon fontSize="small" sx={{ color: '#818cf8' }} />
                            <span>Dashboard</span>
                        </button>
                        <button className="sidebarItem" onClick={() => { navigate('/history'); setMobileMenuOpen(false); }}>
                            <RestoreIcon fontSize="small" />
                            <span>Meeting History</span>
                        </button>
                    </nav>
                </div>

                <div className="sidebarFooter">
                    <div className="sidebarUserWrap">
                        <div className="userAvatarMini">
                            {getInitials(resolvedName || 'User')}
                        </div>
                        <div className="sidebarUserInfo">
                            <span className="sidebarUserName" title={resolvedName || 'Connecting…'}>
                                {resolvedName || <Skeleton width={90} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
                            </span>
                            <span className="sidebarUserStatus">Connected</span>
                        </div>
                    </div>
                    <Tooltip title="Sign Out">
                        <button
                            className="sidebarLogoutBtn"
                            aria-label="Sign out"
                            onClick={handleLogout}
                        >
                            <LogoutIcon fontSize="small" />
                        </button>
                    </Tooltip>
                </div>
            </aside>

            {/* Mobile Sidebar Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="sidebarBackdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu backdrop"
                />
            )}

            {/* ── Main Content Area ── */}
            <div className="appMainContent">
                {/* Fixed Topbar */}
                <header className="appTopbar">
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '520px' }}>
                        <button
                            className="mobileMenuToggleBtn"
                            aria-label="Open navigation menu"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <MenuIcon sx={{ fontSize: '1.35rem' }} />
                        </button>

                        <div className="topbarSearch">
                            <SearchIcon sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                            <input
                                type="text"
                                placeholder="Enter meeting code or link to jump in…"
                                value={meetingCode}
                                onChange={(e) => { setMeetingCode(e.target.value); setJoinError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                aria-label="Meeting code search"
                            />
                            {meetingCode && (
                                <button className="topbarSearchBtn" onClick={handleJoin}>
                                    Join
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="topbarActions">
                        <div className="topbarUserPill">
                            <div className="userAvatarMini">
                                {getInitials(resolvedName || 'User')}
                            </div>
                            <span className="topbarUsername">
                                {resolvedName || 'Account'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Body Container */}
                <main className="dashboardBody">
                    {/* Welcome Hero Card */}
                    <section className="dashboardHero">
                        <div className="greetingWrap">
                            <h1 className="greetingTitle">
                                {getGreeting()}{displayGreetingName ? `, ${displayGreetingName}` : ''} 👋
                            </h1>
                            <p className="greetingSubtitle">
                                Host high-definition video conferences, collaborate with real-time screen sharing, or jump into any room with a code.
                            </p>
                            
                            <div className="heroCtasRow">
                                <Button
                                    variant="contained"
                                    onClick={handleNewMeeting}
                                    disabled={creating}
                                    startIcon={<AddIcon />}
                                    className="btnNatural"
                                    sx={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                        color: '#ffffff',
                                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' },
                                        boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
                                    }}
                                >
                                    {creating ? 'Creating Room…' : (copiedCode ? '✓ Copied & Opening…' : 'Start Instant Meeting')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => joinInputRef.current?.focus()}
                                    startIcon={<LoginIcon />}
                                    className="btnNatural"
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        color: '#f8fafc',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        '&:hover': {
                                            borderColor: '#6366f1',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: '#c7d2fe',
                                        },
                                    }}
                                >
                                    Join via Code
                                </Button>
                            </div>
                        </div>

                        <div className="statBadges">
                            <div className="statBadge">
                                <SpeedIcon fontSize="small" sx={{ color: '#38bdf8' }} />
                                <span>&lt; 45ms P2P Signal</span>
                            </div>
                            <div className="statBadge">
                                <SecurityIcon fontSize="small" sx={{ color: '#22c55e' }} />
                                <span>Direct E2E Encrypted</span>
                            </div>
                            <div className="statBadge">
                                <VideocamOutlinedIcon fontSize="small" sx={{ color: '#a855f7' }} />
                                <span>1080p HD Video</span>
                            </div>
                        </div>
                    </section>

                    {/* Quick Action Cards Grid */}
                    <section className="dashboardCardsGrid">
                        {/* Instant Meeting Card */}
                        <div className="actionCardSaaS actionCardPrimary">
                            <div className="cardHeaderIcon">
                                <AddIcon sx={{ fontSize: '1.7rem', color: '#fff' }} />
                            </div>
                            <h2 className="actionCardTitle">Start Instant Meeting</h2>
                            <p className="actionCardDesc">
                                Create an instant secure video conference room. A unique 10-character code is generated and the invite link is automatically copied to your clipboard.
                            </p>
                            
                            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                                <Button
                                    variant="contained"
                                    onClick={handleNewMeeting}
                                    disabled={creating}
                                    startIcon={copiedCode ? <CheckIcon /> : <ContentCopyIcon />}
                                    className="btnNatural"
                                    sx={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                        color: '#ffffff',
                                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' },
                                        height: 42,
                                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                                    }}
                                >
                                    {creating ? 'Starting Session…' : (copiedCode ? '✓ Invite Link Copied!' : 'Generate Room & Join')}
                                </Button>
                            </div>
                        </div>

                        {/* Join Meeting Card with Inline Input & Button */}
                        <div className="actionCardSaaS">
                            <div className="cardHeaderIcon cardHeaderIconNeutral">
                                <LoginIcon sx={{ fontSize: '1.6rem', color: '#818cf8' }} />
                            </div>
                            <h2 className="actionCardTitle">Join with Meeting ID</h2>
                            <p className="actionCardDesc">
                                Have an invitation code or URL? Paste it below to jump straight into the conference session without any setup.
                            </p>
                            
                            <div style={{ marginTop: 'auto', width: '100%', paddingTop: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <TextField
                                        inputRef={joinInputRef}
                                        placeholder="e.g. daily-sync or k9x2m4"
                                        variant="outlined"
                                        fullWidth
                                        value={meetingCode}
                                        onChange={(e) => { setMeetingCode(e.target.value); setJoinError(''); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                        error={Boolean(joinError)}
                                        helperText={joinError}
                                        size="small"
                                        disabled={joining}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '10px',
                                                background: 'rgba(15, 23, 42, 0.6)',
                                                color: '#f8fafc',
                                                height: 42,
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                                '&:hover fieldset': { borderColor: '#6366f1' },
                                                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                            },
                                            '& .MuiInputBase-input::placeholder': {
                                                color: 'rgba(255,255,255,0.4)',
                                                fontSize: '0.875rem',
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleJoin}
                                        disabled={joining || !meetingCode.trim()}
                                        className="btnNatural"
                                        sx={{
                                            background: '#6366f1',
                                            color: '#ffffff',
                                            '&:hover': { background: '#4f46e5' },
                                            '&:disabled': { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' },
                                            height: 42,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {joining ? 'Joining…' : 'Join'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Meetings Table */}
                    <section className="recentSection">
                        <div className="sectionHeader">
                            <div className="sectionTitleGroup">
                                <h3 className="sectionTitle">Recent Meetings</h3>
                                <span className="sectionSubtitle">Direct one-click access to your recent conference sessions</span>
                            </div>
                            {recent.length > 0 && (
                                <button className="viewAllBtn" onClick={() => navigate('/history')}>
                                    View Full History ({recent.length})
                                </button>
                            )}
                        </div>

                        {loadingRecent ? (
                            <div className="recentTableWrap">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="meetingRow">
                                        <Skeleton variant="rounded" width={160} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                                        <Skeleton variant="text" width={140} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        <Skeleton variant="rounded" width={100} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                                    </div>
                                ))}
                            </div>
                        ) : recent.length > 0 ? (
                            <div className="recentTableWrap">
                                {recent.map((m, i) => (
                                    <div key={i} className="meetingRow">
                                        <div className="meetingRowInfo">
                                            <div className="codePill">
                                                <VideoCallIcon sx={{ fontSize: '1.1rem', color: '#818cf8' }} />
                                                <span>{m.meetingCode}</span>
                                                <Tooltip title="Copy meeting code">
                                                    <button
                                                        className="copyCodeBtn"
                                                        aria-label="Copy meeting code"
                                                        onClick={(e) => copyCodeOnly(e, m.meetingCode)}
                                                    >
                                                        {copiedCode === m.meetingCode ? (
                                                            <CheckIcon sx={{ fontSize: '0.9rem', color: '#4ade80' }} />
                                                        ) : (
                                                            <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />
                                                        )}
                                                    </button>
                                                </Tooltip>
                                            </div>
                                            <span className="meetingRowDate">
                                                <AccessTimeIcon sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle', color: 'rgba(255,255,255,0.4)' }} />
                                                {fmt(m.date)}
                                            </span>
                                        </div>

                                        <button
                                            className="rejoinBtn"
                                            onClick={() => navigate(`/${m.meetingCode}`)}
                                        >
                                            Rejoin Room
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="emptyStateSaaS">
                                <div className="emptyStateIcon">
                                    <CalendarTodayOutlinedIcon sx={{ fontSize: '1.8rem', color: '#6366f1' }} />
                                </div>
                                <h4 className="emptyStateTitle">No meetings logged yet</h4>
                                <p className="emptyStateDesc">
                                    Start an instant meeting or join with a code above. Your previous sessions will be listed here for one-click rejoining.
                                </p>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default withAuth(HomeComponent);
