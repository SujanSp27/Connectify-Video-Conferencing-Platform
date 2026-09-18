import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import '../App.css';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [search, setSearch]     = useState('');
    const [loading, setLoading]   = useState(true);
    const [copiedCode, setCopiedCode] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const h = await getHistoryOfUser();
                setMeetings(h || []);
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fmt = (ds) => {
        if (!ds) return '';
        const d = new Date(ds);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(''), 2000);
        } catch {}
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return meetings;
        const q = search.toLowerCase();
        return meetings.filter(m => (m.meetingCode || '').toLowerCase().includes(q));
    }, [meetings, search]);

    return (
        <div className="historyContainer">

            {/* Topbar */}
            <header className="historyNav">
                <div className="historyNavLeft">
                    <IconButton
                        onClick={() => navigate('/home')}
                        aria-label="Back to dashboard"
                        className="historyBackBtn"
                        size="small"
                        sx={{ color: '#f8fafc', background: 'rgba(255,255,255,0.06)', '&:hover': { background: 'rgba(255,255,255,0.12)' } }}
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <div className="historyTitleGroup">
                        <h1 className="historyNavTitle">Meeting History</h1>
                        <span className="historyNavSubtitle">
                            {meetings.length} previous meeting{meetings.length === 1 ? '' : 's'} recorded
                        </span>
                    </div>
                </div>

                <div className="historySearchWrap">
                    <SearchIcon sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                    <input
                        type="text"
                        placeholder="Search by code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {/* Content Area */}
            <main className="historyContent">

                {loading ? (
                    <div className="historyList">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="historyCard historyCardSkeleton">
                                <Skeleton variant="rounded" width={180} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                                <Skeleton variant="text" width={140} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="historyList">
                        {filtered.map((m, idx) => (
                            <div key={idx} className="historyCard">
                                <div className="historyCardDetails">
                                    <div className="historyCodePill">
                                        <VideoCallIcon sx={{ fontSize: '1.1rem', color: '#818cf8' }} />
                                        <span className="historyCardCode">{m.meetingCode}</span>
                                        <Tooltip title="Copy code">
                                            <button
                                                className="copyCodeBtn"
                                                onClick={() => copyCode(m.meetingCode)}
                                            >
                                                {copiedCode === m.meetingCode ? (
                                                    <CheckIcon sx={{ fontSize: '0.9rem', color: '#4ade80' }} />
                                                ) : (
                                                    <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                    <span className="historyCardDate">{fmt(m.date)}</span>
                                </div>

                                <button
                                    className="rejoinBtn"
                                    onClick={() => navigate(`/${m.meetingCode}`)}
                                >
                                    Rejoin Call
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="historyEmptyState">
                        <div className="emptyStateIcon">
                            <EventNoteOutlinedIcon sx={{ fontSize: '2.5rem', color: '#6366f1' }} />
                        </div>
                        <h3 className="emptyStateTitle">No meetings found</h3>
                        <p className="emptyStateDesc">
                            {search ? 'No meetings matched your search filter.' : 'When you start or join video calls, they will be logged here.'}
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
}
