import { useContext, useEffect, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { AuthContext } from '../contexts/AuthContext';

const PLUM = '#6D28D9';
const PLUM_HOVER = '#5B21B6';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function HomeComponent() {
    const navigate = useNavigate();
    const { addToUserHistory, getHistoryOfUser, userData } = useContext(AuthContext);
    const username = userData?.username || null;

    const [meetingCode, setMeetingCode] = useState('');
    const [joinError, setJoinError]     = useState('');
    const [recent, setRecent]           = useState([]);
    const [copied, setCopied]           = useState(false);
    const [joining, setJoining]         = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const h = await getHistoryOfUser();
                setRecent((h || []).slice(0, 3));
            } catch { /* non-blocking */ }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNewMeeting = async () => {
        const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
        try {
            await addToUserHistory(code);
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* proceed anyway */ }
        navigate(`/${code}`);
    };

    const handleJoin = async () => {
        if (!meetingCode.trim()) { setJoinError('Please enter a meeting code'); return; }
        setJoinError('');
        setJoining(true);
        try { await addToUserHistory(meetingCode.trim()); } catch { /* non-blocking */ }
        navigate(`/${meetingCode.trim()}`);
    };

    const fmt = (d) => {
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    };

    return (
        <div className="homeContainer">

            {/* ── Navbar ── */}
            <nav className="homeNav">
                <span className="homeNavBrand" style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>
                    Connectify
                </span>
                <div className="homeNavActions">
                    <IconButton
                        onClick={() => navigate('/history')}
                        title="Meeting history"
                        aria-label="Meeting history"
                        size="small"
                        sx={{ color: '#625A6B' }}
                    >
                        <RestoreIcon fontSize="small" />
                    </IconButton>
                    <span className="homeNavHistoryLabel">History</span>
                    <Button
                        onClick={() => { localStorage.removeItem('token'); navigate('/auth'); }}
                        startIcon={<LogoutIcon fontSize="small" />}
                        size="small"
                        sx={{
                            color: '#625A6B',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </nav>

            {/* ── Main ── */}
            <main className="homeMain">

                {/* Greeting */}
                <div className="homeGreeting">
                    <h1 className="homeGreetingTitle">
                        {getGreeting()}{username ? `, ${username}` : ''} 👋
                    </h1>
                    <p className="homeGreetingSubtitle">
                        What would you like to do today?
                    </p>
                </div>

                {/* Action Cards */}
                <div className="actionCards">

                    {/* New Meeting */}
                    <div className="actionCard actionCardNew">
                        <div className="actionCardIcon">
                            <AddIcon sx={{ fontSize: '1.5rem', color: PLUM }} />
                        </div>
                        <h2 className="actionCardTitle">New Meeting</h2>
                        <p className="actionCardDesc">
                            Start an instant meeting. A unique code is generated and
                            copied to your clipboard automatically.
                        </p>
                        <Button
                            variant="contained"
                            onClick={handleNewMeeting}
                            startIcon={copied ? null : <ContentCopyIcon fontSize="small" />}
                            fullWidth
                            sx={{
                                background: PLUM,
                                '&:hover': { background: PLUM_HOVER },
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                mt: 'auto',
                                boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
                                fontFamily: 'Inter, sans-serif',
                                height: 40,
                            }}
                        >
                            {copied ? '✓ Code copied!' : 'Start New Meeting'}
                        </Button>
                    </div>

                    {/* Join Meeting */}
                    <div className="actionCard">
                        <div className="actionCardIcon">
                            <LoginIcon sx={{ fontSize: '1.5rem', color: PLUM }} />
                        </div>
                        <h2 className="actionCardTitle">Join Meeting</h2>
                        <p className="actionCardDesc">
                            Have a meeting code? Enter it below to join the call instantly.
                        </p>
                        <div className="joinMeetingField">
                            <TextField
                                label="Meeting code"
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
                                        borderRadius: '8px',
                                        '&:hover fieldset': { borderColor: PLUM },
                                        '&.Mui-focused fieldset': { borderColor: PLUM },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: PLUM },
                                }}
                            />
                        </div>
                        <Button
                            variant="outlined"
                            onClick={handleJoin}
                            fullWidth
                            disabled={joining}
                            sx={{
                                borderColor: PLUM,
                                color: PLUM,
                                '&:hover': { background: 'rgba(109,40,217,0.06)', borderColor: PLUM_HOVER },
                                '&:disabled': { borderColor: '#C4B5FD', color: '#C4B5FD' },
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                mt: 'auto',
                                fontFamily: 'Inter, sans-serif',
                                height: 40,
                            }}
                        >
                            {joining ? 'Joining…' : 'Join Meeting'}
                        </Button>
                    </div>
                </div>

                {/* Recent Meetings */}
                <section className="recentMeetings">
                    <h3 className="recentMeetingsTitle">Recent Meetings</h3>

                    {recent.length > 0 ? (
                        <ul className="meetingList">
                            {recent.map((m, i) => (
                                <li key={i} className="meetingCard">
                                    <div className="meetingCardCode">{m.meetingCode}</div>
                                    <div className="meetingCardDate">{fmt(m.date)}</div>
                                    <Button
                                        size="small"
                                        onClick={() => navigate(`/${m.meetingCode}`)}
                                        sx={{
                                            textTransform: 'none',
                                            color: PLUM,
                                            fontWeight: 600,
                                            minWidth: 0,
                                            px: 1.5,
                                            fontSize: '0.8rem',
                                            fontFamily: 'Inter, sans-serif',
                                            '&:hover': { background: 'rgba(109,40,217,0.06)' },
                                        }}
                                    >
                                        Rejoin
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="emptyState">
                            <CalendarTodayOutlinedIcon sx={{ fontSize: '2.5rem', color: '#C4B5FD' }} />
                            <p>No meetings yet — start one above</p>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

export default withAuth(HomeComponent);
