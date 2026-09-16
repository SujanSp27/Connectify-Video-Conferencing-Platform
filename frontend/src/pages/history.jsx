import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import '../App.css';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading]   = useState(true);
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
        const d = new Date(ds);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };

    return (
        <div className="historyContainer">

            {/* Navbar */}
            <nav className="historyNav">
                <IconButton
                    onClick={() => navigate('/home')}
                    aria-label="Back to dashboard"
                    className="historyBackBtn"
                    size="small"
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <h2 className="historyNavTitle">Meeting History</h2>
                <div style={{ width: 36 }} />
            </nav>

            <div className="historyContent">

                {loading ? (
                    [0, 1, 2, 3].map((i) => (
                        <div key={i} className="historyCard historyCardSkeleton">
                            <Skeleton variant="text" width="55%" height={20} sx={{ bgcolor: '#EDE9FE' }} />
                            <Skeleton variant="text" width="28%" height={16} sx={{ bgcolor: '#F3E8FF' }} />
                        </div>
                    ))
                ) : meetings.length > 0 ? (
                    meetings.map((m, idx) => (
                        <div key={idx} className="historyCard">
                            <span className="historyCardCode">{m.meetingCode}</span>
                            <span className="historyCardDate">{fmt(m.date)}</span>
                        </div>
                    ))
                ) : (
                    <div className="historyEmptyState">
                        <EventNoteOutlinedIcon sx={{ fontSize: '3.5rem', color: '#C4B5FD', mb: 1 }} />
                        <p>No meeting history yet</p>
                        <p style={{ fontSize: '0.875rem', color: '#8A8292' }}>
                            Meetings you join will appear here.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
