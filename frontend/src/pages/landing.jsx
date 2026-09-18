import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import LockIcon from '@mui/icons-material/Lock';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ScreenShareOutlinedIcon from '@mui/icons-material/ScreenShareOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MicIcon from '@mui/icons-material/Mic';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/landing.module.css';

const FEATURES = [
    {
        icon: <VideocamIcon sx={{ fontSize: '1.75rem', color: '#6366f1' }} />,
        title: 'HD Video Meetings',
        desc: 'Experience fluid, ultra-sharp video with dynamic bandwidth optimization and adaptive framerate scaling on any connection.',
    },
    {
        icon: <ScreenShareOutlinedIcon sx={{ fontSize: '1.75rem', color: '#38bdf8' }} />,
        title: 'One-Click Screen Sharing',
        desc: 'Present slide decks, Figma prototypes, browser tabs, or your complete desktop display smoothly at full 60 FPS.',
    },
    {
        icon: <ChatBubbleOutlineIcon sx={{ fontSize: '1.75rem', color: '#a855f7' }} />,
        title: 'Real-Time In-Call Chat',
        desc: 'Exchange links, documentation, and instant thoughts directly inside the meeting without interrupting speaking participants.',
    },
    {
        icon: <GroupsOutlinedIcon sx={{ fontSize: '1.75rem', color: '#22c55e' }} />,
        title: 'Participant Management',
        desc: 'Active speaker detection, participant rosters, audio level meters, and intuitive media toggle indicators.',
    },
    {
        icon: <LockIcon sx={{ fontSize: '1.75rem', color: '#f59e0b' }} />,
        title: 'Secure Private Rooms',
        desc: 'Unique room identifiers with direct peer-to-peer browser connectivity. Only attendees with your link can join.',
    },
    {
        icon: <DevicesOutlinedIcon sx={{ fontSize: '1.75rem', color: '#ec4899' }} />,
        title: 'Cross-Device Ready',
        desc: 'Engineered responsive layout that operates smoothly across desktops, laptops, tablets, and smartphones without app downloads.',
    },
];

const SECURITY_POINTS = [
    {
        icon: <BoltOutlinedIcon sx={{ fontSize: '1.6rem', color: '#38bdf8' }} />,
        title: 'Direct Peer-to-Peer WebRTC',
        desc: 'Audio and video media streams are transmitted directly between browsers using WebRTC protocols, maximizing throughput and reducing latency.',
    },
    {
        icon: <SecurityOutlinedIcon sx={{ fontSize: '1.6rem', color: '#818cf8' }} />,
        title: 'Unique Room Verification',
        desc: 'Every meeting generates a distinct alphanumeric room identifier. Rooms are ephemeral and created on-demand for total access control.',
    },
    {
        icon: <ShieldOutlinedIcon sx={{ fontSize: '1.6rem', color: '#10b981' }} />,
        title: 'Client-Side Hardware Control',
        desc: 'Hardware camera and microphone track state switches occur locally in your browser sandbox, giving you complete privacy over your devices.',
    },
];

const KPIS = [
    { value: '100%', label: 'PEER-TO-PEER WEBRTC' },
    { value: '< 50ms', label: 'AVERAGE SIGNAL LATENCY' },
    { value: '0 min', label: 'TIME LIMITS ON SESSIONS' },
    { value: '1080p', label: 'ADAPTIVE HD FIDELITY' },
];

function sanitizeDisplayName(user) {
    if (!user) return null;
    const raw = typeof user === 'string' ? user : (user.name || user.username || '');
    const clean = raw.trim();
    if (!clean || ['unknown', 'undefined', 'null'].includes(clean.toLowerCase())) {
        return null;
    }
    return clean;
}

export default function LandingPage() {
    const navigate = useNavigate();
    const { userData } = useContext(AuthContext) || {};
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [roomInput, setRoomInput] = useState('');

    const token = localStorage.getItem('token');
    const isAuthenticated = Boolean(token);
    const safeUserName = sanitizeDisplayName(userData);

    // Close mobile menu on ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [mobileMenuOpen]);

    const handleQuickJoin = (e) => {
        e.preventDefault();
        const code = roomInput.trim();
        if (code) {
            navigate(`/${code}`);
        }
    };

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={styles.landingRoot}>

            {/* ── BACKGROUND AMBIENCE ── */}
            <div className={styles.landingBackground} aria-hidden="true">
                <div className={styles.bgGlowOrb1} />
                <div className={styles.bgGlowOrb2} />
                <div className={styles.bgGlowOrb3} />
                <div className={styles.bgTechGrid} />
            </div>

            {/* ── HEADER & NAVBAR ── */}
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.headerInner}>

                        {/* Brand Logo */}
                        <div className={styles.brand} onClick={() => navigate('/')} role="button" tabIndex={0}>
                            <div className={styles.brandIcon}>
                                <VideoCallIcon sx={{ color: '#ffffff', fontSize: '1.45rem' }} />
                            </div>
                            <span className={styles.brandText}>Connectify</span>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className={styles.desktopNav}>
                            <button className={styles.navLink} onClick={() => scrollToSection('features')}>
                                Features
                            </button>
                            <button className={styles.navLink} onClick={() => scrollToSection('how-it-works')}>
                                How it Works
                            </button>
                            <button className={styles.navLink} onClick={() => scrollToSection('security')}>
                                Security
                            </button>
                        </nav>

                        {/* Desktop Auth Actions */}
                        <div className={styles.headerActions}>
                            {isAuthenticated ? (
                                <>
                                    {safeUserName && (
                                        <div className={styles.userPill}>
                                            <div className={styles.userAvatarMini}>
                                                {safeUserName.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{safeUserName}</span>
                                        </div>
                                    )}
                                    <button className={styles.getStartedBtn} onClick={() => navigate('/home')}>
                                        Dashboard <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className={styles.signInBtn} onClick={() => navigate('/auth')}>
                                        Sign In
                                    </button>
                                    <button className={styles.getStartedBtn} onClick={() => navigate('/auth')}>
                                        Get Started Free
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Hamburger Toggle */}
                        <button 
                            className={styles.mobileMenuToggle} 
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open navigation menu"
                        >
                            <MenuIcon sx={{ fontSize: '1.5rem' }} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MOBILE DRAWER ── */}
            <div 
                className={`${styles.mobileBackdrop} ${mobileMenuOpen ? styles.mobileBackdropOpen : ''}`} 
                onClick={() => setMobileMenuOpen(false)} 
                aria-hidden="true" 
            />
            <aside 
                className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`} 
                aria-label="Mobile Navigation"
            >
                <div className={styles.mobileDrawerHeader}>
                    <div className={styles.brand} onClick={() => { setMobileMenuOpen(false); navigate('/'); }}>
                        <div className={styles.brandIcon}>
                            <VideoCallIcon sx={{ color: '#ffffff', fontSize: '1.3rem' }} />
                        </div>
                        <span className={styles.brandText}>Connectify</span>
                    </div>
                    <button 
                        className={styles.mobileDrawerClose} 
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                    >
                        <CloseIcon sx={{ fontSize: '1.25rem' }} />
                    </button>
                </div>

                <div className={styles.mobileDrawerNav}>
                    <button className={styles.mobileNavLink} onClick={() => scrollToSection('features')}>
                        Features
                    </button>
                    <button className={styles.mobileNavLink} onClick={() => scrollToSection('how-it-works')}>
                        How it Works
                    </button>
                    <button className={styles.mobileNavLink} onClick={() => scrollToSection('security')}>
                        Security & Privacy
                    </button>
                </div>

                <div className={styles.mobileDrawerFooter}>
                    {isAuthenticated ? (
                        <>
                            {safeUserName && (
                                <div className={styles.userPill} style={{ justifySelf: 'center' }}>
                                    <div className={styles.userAvatarMini}>
                                        {safeUserName.charAt(0).toUpperCase()}
                                    </div>
                                    <span>Signed in as {safeUserName}</span>
                                </div>
                            )}
                            <button className={styles.getStartedBtn} style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/home')}>
                                Go to Dashboard
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.signInBtn} style={{ width: '100%', textAlign: 'center' }} onClick={() => navigate('/auth')}>
                                Sign In
                            </button>
                            <button className={styles.getStartedBtn} style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/auth')}>
                                Get Started Free
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {/* ── HERO SECTION (2-COLUMN DESKTOP / FLUID MOBILE STACK) ── */}
            <section className={styles.heroSection}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>

                        {/* Left Column: Hero Content */}
                        <div className={styles.heroContent}>
                            <div className={styles.eyebrowBadge}>
                                <span className={styles.eyebrowPulse} />
                                Next-Gen Peer-to-Peer Video Platform
                            </div>

                            <h1 className={styles.headline}>
                                Video meetings <span className={styles.headlineGradient}>engineered</span> for collaboration.
                            </h1>

                            <p className={styles.heroDescription}>
                                Ultra-low latency HD video conferencing, seamless screen sharing, and real-time chat.
                                Zero downloads, zero clutter, and unlimited meeting minutes built on WebRTC.
                            </p>

                            {/* CTAs */}
                            <div className={styles.heroCtas}>
                                {isAuthenticated ? (
                                    <>
                                        <button className={styles.heroPrimaryBtn} onClick={() => navigate('/home')}>
                                            Start Instant Meeting <ArrowForwardIcon sx={{ fontSize: '1.1rem' }} />
                                        </button>
                                        <button className={styles.heroSecondaryBtn} onClick={() => navigate('/history')}>
                                            Meeting History
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className={styles.heroPrimaryBtn} onClick={() => navigate('/auth')}>
                                            Start Meeting Free <ArrowForwardIcon sx={{ fontSize: '1.1rem' }} />
                                        </button>
                                        <button className={styles.heroSecondaryBtn} onClick={() => navigate('/auth')}>
                                            Sign In to Account
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Quick Room Code Join Form */}
                            <form className={styles.quickJoinBox} onSubmit={handleQuickJoin}>
                                <input
                                    type="text"
                                    className={styles.quickJoinInput}
                                    placeholder="Enter meeting room code..."
                                    value={roomInput}
                                    onChange={(e) => setRoomInput(e.target.value)}
                                    aria-label="Meeting code"
                                />
                                <button type="submit" className={styles.quickJoinBtn}>
                                    Join Room
                                </button>
                            </form>

                            {/* Trust Badges */}
                            <div className={styles.trustBadges}>
                                <div className={styles.trustItem}>
                                    <CheckCircleOutlinedIcon sx={{ fontSize: '1.05rem', color: '#22c55e' }} />
                                    <span>No credit card required</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <CheckCircleOutlinedIcon sx={{ fontSize: '1.05rem', color: '#22c55e' }} />
                                    <span>No downloads or extensions</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <CheckCircleOutlinedIcon sx={{ fontSize: '1.05rem', color: '#22c55e' }} />
                                    <span>Unlimited meeting duration</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Hero Visual Focal Point */}
                        <div className={styles.heroVisual}>
                            <div className={styles.productWindow}>

                                {/* Mock Window Title Bar */}
                                <div className={styles.mockHeader}>
                                    <div className={styles.mockDots}>
                                        <span className={styles.mockDot} style={{ background: '#ef4444' }} />
                                        <span className={styles.mockDot} style={{ background: '#f59e0b' }} />
                                        <span className={styles.mockDot} style={{ background: '#22c55e' }} />
                                    </div>
                                    <div className={styles.mockInfo}>
                                        <span className={styles.mockRoomCode}>Room: engineering-sync</span>
                                        <span className={styles.mockLiveBadge}>Live • 00:24:18</span>
                                    </div>
                                </div>

                                {/* Mock Video Grid */}
                                <div className={styles.mockGrid}>

                                    {/* Tile 1: Active Speaker (Host) */}
                                    <div className={`${styles.mockTile} ${styles.mockTileActive}`}>
                                        <div className={styles.mockAvatar} style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
                                            SP
                                        </div>
                                        <div className={styles.mockTileMeta}>
                                            <span className={styles.mockTileName}>Sujan (Host)</span>
                                            <span className={styles.mockTileSpeaking}>
                                                <span className={styles.mockAudioWave}>
                                                    <span /><span /><span />
                                                </span>
                                                Speaking
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tile 2 */}
                                    <div className={styles.mockTile}>
                                        <div className={styles.mockAvatar} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                                            SJ
                                        </div>
                                        <div className={styles.mockTileMeta}>
                                            <span className={styles.mockTileName}>Sarah Jenkins</span>
                                        </div>
                                    </div>

                                    {/* Tile 3 */}
                                    <div className={styles.mockTile}>
                                        <div className={styles.mockAvatar} style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                                            MC
                                        </div>
                                        <div className={styles.mockTileMeta}>
                                            <span className={styles.mockTileName}>Marcus Chen</span>
                                        </div>
                                    </div>

                                    {/* Tile 4 */}
                                    <div className={styles.mockTile}>
                                        <div className={styles.mockAvatar} style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                                            MP
                                        </div>
                                        <div className={styles.mockTileMeta}>
                                            <span className={styles.mockTileName}>Maya Patel</span>
                                        </div>
                                    </div>

                                    {/* Floating Chat Toast Preview */}
                                    <div className={styles.mockChatToast}>
                                        <div className={styles.mockChatAvatar}>MC</div>
                                        <div className={styles.mockChatText}>
                                            <span className={styles.mockChatAuthor}>Marcus: </span>
                                            Shared the design specs in chat!
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Bottom Meeting Controls */}
                                <div className={styles.mockControls}>
                                    <div className={styles.mockCtrlBtn} title="Microphone Active">
                                        <MicIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                    <div className={styles.mockCtrlBtn} title="Camera Active">
                                        <VideocamIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                    <div className={styles.mockCtrlBtn} title="Screen Sharing">
                                        <ScreenShareOutlinedIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                    <div className={styles.mockCtrlBtn} title="Participants (4)">
                                        <GroupsOutlinedIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                    <div className={styles.mockCtrlBtn} title="In-Call Chat">
                                        <ChatBubbleOutlineIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                    <div className={`${styles.mockCtrlBtn} ${styles.mockCtrlBtnRed}`} title="Leave Call">
                                        <CallEndIcon sx={{ fontSize: '1.15rem' }} />
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── METRIC & TRUST STRIP ── */}
            <div className={styles.metricStrip}>
                <div className={styles.container}>
                    <div className={styles.metricGrid}>
                        {KPIS.map((kpi) => (
                            <div key={kpi.label} className={styles.metricItem}>
                                <span className={styles.metricValue}>{kpi.value}</span>
                                <span className={styles.metricLabel}>{kpi.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FEATURES SECTION (3-COL / 2-COL / 1-COL) ── */}
            <section id="features" className={styles.sectionBlock}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>Engineered for Excellence</span>
                        <h2 className={styles.sectionTitle}>Everything you need to connect.</h2>
                        <p className={styles.sectionSubtitle}>
                            Built on modern WebRTC specifications to deliver low-latency video and audio without bloat or software installation.
                        </p>
                    </div>

                    <div className={styles.featuresGrid}>
                        {FEATURES.map((feat) => (
                            <div key={feat.title} className={styles.featureCard}>
                                <div className={styles.featureIconWrap}>
                                    {feat.icon}
                                </div>
                                <h3 className={styles.featureTitle}>{feat.title}</h3>
                                <p className={styles.featureDesc}>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW CONNECTIFY WORKS (3-STEP TIMELINE) ── */}
            <section id="how-it-works" className={`${styles.sectionBlock} ${styles.howItWorksBlock}`}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>Effortless Flow</span>
                        <h2 className={styles.sectionTitle}>How Connectify works</h2>
                        <p className={styles.sectionSubtitle}>
                            Get up and running in seconds with zero complicated setup.
                        </p>
                    </div>

                    <div className={styles.stepsContainer}>
                        <div className={styles.stepCard}>
                            <div className={styles.stepBadge}>01</div>
                            <h3 className={styles.stepTitle}>Create a Meeting</h3>
                            <p className={styles.stepDesc}>
                                Start an instant meeting room directly from your dashboard or generate a persistent custom room code.
                            </p>
                        </div>

                        <div className={styles.stepConnector} aria-hidden="true" />

                        <div className={styles.stepCard}>
                            <div className={styles.stepBadge}>02</div>
                            <h3 className={styles.stepTitle}>Share the Meeting Link</h3>
                            <p className={styles.stepDesc}>
                                Copy your meeting link or send the alphanumeric room code to teammates, colleagues, or clients.
                            </p>
                        </div>

                        <div className={styles.stepConnector} aria-hidden="true" />

                        <div className={styles.stepCard}>
                            <div className={styles.stepBadge}>03</div>
                            <h3 className={styles.stepTitle}>Start Collaborating</h3>
                            <p className={styles.stepDesc}>
                                Enjoy crisp HD video, low-latency crystal audio, high-framerate screen sharing, and real-time chat.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECURITY SECTION (ACCURATE & TRANSPARENT) ── */}
            <section id="security" className={`${styles.sectionBlock} ${styles.securityBlock}`}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionBadge}>Privacy First</span>
                        <h2 className={styles.sectionTitle}>Built with privacy in mind.</h2>
                        <p className={styles.sectionSubtitle}>
                            Connectify utilizes direct browser-to-browser WebRTC transport architecture.
                        </p>
                    </div>

                    <div className={styles.securityGrid}>
                        {SECURITY_POINTS.map((item) => (
                            <div key={item.title} className={styles.securityCard}>
                                <div className={styles.securityIconWrap}>
                                    {item.icon}
                                </div>
                                <h3 className={styles.securityTitle}>{item.title}</h3>
                                <p className={styles.securityDesc}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CALL TO ACTION BANNER ── */}
            <section className={styles.ctaBannerBlock}>
                <div className={styles.container}>
                    <div className={styles.ctaBannerCard}>
                        <h2 className={styles.ctaTitle}>Ready to connect?</h2>
                        <p className={styles.ctaSubtitle}>
                            Start your next video conference with Connectify today. Free to use, zero downloads, and unlimited duration.
                        </p>
                        <div className={styles.ctaActionGroup}>
                            {isAuthenticated ? (
                                <button className={styles.heroPrimaryBtn} onClick={() => navigate('/home')}>
                                    Open Dashboard <ArrowForwardIcon sx={{ fontSize: '1.1rem' }} />
                                </button>
                            ) : (
                                <>
                                    <button className={styles.heroPrimaryBtn} onClick={() => navigate('/auth')}>
                                        Start Meeting Free <ArrowForwardIcon sx={{ fontSize: '1.1rem' }} />
                                    </button>
                                    <button className={styles.heroSecondaryBtn} onClick={() => navigate('/auth')}>
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerGrid}>

                        {/* Brand Column */}
                        <div className={styles.footerBrandCol}>
                            <div className={styles.brand} onClick={() => navigate('/')}>
                                <div className={styles.brandIcon}>
                                    <VideoCallIcon sx={{ color: '#ffffff', fontSize: '1.35rem' }} />
                                </div>
                                <span className={styles.brandText}>Connectify</span>
                            </div>
                            <p className={styles.footerDesc}>
                                High-performance peer-to-peer video conferencing platform engineered for modern remote teams.
                            </p>
                        </div>

                        {/* Navigation Column */}
                        <div>
                            <h4 className={styles.footerColTitle}>Product</h4>
                            <div className={styles.footerNavList}>
                                <button className={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
                                <button className={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How it Works</button>
                                <button className={styles.footerLink} onClick={() => scrollToSection('security')}>Security</button>
                                <button className={styles.footerLink} onClick={() => navigate(isAuthenticated ? '/home' : '/auth')}>Meetings</button>
                            </div>
                        </div>

                        {/* Security Column */}
                        <div>
                            <h4 className={styles.footerColTitle}>Architecture</h4>
                            <div className={styles.footerNavList}>
                                <button className={styles.footerLink} onClick={() => scrollToSection('security')}>WebRTC P2P</button>
                                <button className={styles.footerLink} onClick={() => scrollToSection('security')}>Ephemeral Rooms</button>
                                <button className={styles.footerLink} onClick={() => scrollToSection('security')}>Media Privacy</button>
                            </div>
                        </div>

                        {/* Account & Company */}
                        <div>
                            <h4 className={styles.footerColTitle}>Account</h4>
                            <div className={styles.footerNavList}>
                                {isAuthenticated ? (
                                    <>
                                        <button className={styles.footerLink} onClick={() => navigate('/home')}>Dashboard</button>
                                        <button className={styles.footerLink} onClick={() => navigate('/history')}>History</button>
                                    </>
                                ) : (
                                    <>
                                        <button className={styles.footerLink} onClick={() => navigate('/auth')}>Sign In</button>
                                        <button className={styles.footerLink} onClick={() => navigate('/auth')}>Register</button>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer Bottom Bar */}
                    <div className={styles.footerBottom}>
                        <span className={styles.footerCopyright}>
                            © {new Date().getFullYear()} Connectify. Production-level video conferencing.
                        </span>
                        <div className={styles.footerBottomLinks}>
                            <span className={styles.footerCopyright}>Peer-to-Peer Encrypted</span>
                            <span className={styles.footerCopyright}>•</span>
                            <span className={styles.footerCopyright}>High-Availability Signaling</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
