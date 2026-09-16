import { useNavigate } from 'react-router-dom';
import VideocamIcon from '@mui/icons-material/Videocam';
import LockIcon from '@mui/icons-material/Lock';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ScreenShareOutlinedIcon from '@mui/icons-material/ScreenShareOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import '../App.css';

const FEATURES = [
    {
        icon: <VideocamIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'HD Video Calls',
        desc: 'Crystal-clear video with adaptive quality. Every participant in sharp detail, no matter the network.',
    },
    {
        icon: <LockIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'Private Meetings',
        desc: 'Secure meeting codes ensure only invited participants can join your calls.',
    },
    {
        icon: <ChatBubbleOutlineIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'Real-time Chat',
        desc: 'Share ideas, links, and notes in the built-in chat without interrupting the conversation.',
    },
    {
        icon: <ScreenShareOutlinedIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'Screen Sharing',
        desc: 'Present your work instantly. Share your entire screen or a specific window.',
    },
    {
        icon: <GroupsOutlinedIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'Multi-participant',
        desc: 'Invite multiple participants. The video grid adapts automatically to everyone in the call.',
    },
    {
        icon: <SpeedOutlinedIcon sx={{ fontSize: '1.6rem', color: '#6D28D9' }} />,
        title: 'Instant Meetings',
        desc: 'Create a meeting code, share it, and you\'re live. No scheduling required.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landingPageContainer">

            {/* ── NAVBAR ── */}
            <nav className="landingNav">
                <div className="landingNavBrand">
                    <span className="brandName">Connectify</span>
                </div>
                <div className="landingNavLinks">
                    <button className="navLinkBtn" onClick={() => navigate('/auth')}>
                        Sign In
                    </button>
                    <button className="navCtaBtn" onClick={() => navigate('/auth')}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="heroSection">
                <div className="heroContent">
                    <div className="heroEyebrow">
                        ✦ Built for real collaboration
                    </div>
                    <h1 className="heroTitle">
                        Video meetings{' '}
                        <span className="heroHighlight">your way</span>
                    </h1>
                    <p className="heroSubtitle">
                        Connectify gives you high-quality video calls, built-in chat,
                        and screen sharing — without the friction. Start a meeting in seconds.
                    </p>
                    <div className="heroCtas">
                        <button className="primaryCta" onClick={() => navigate('/auth')}>
                            Start for Free
                        </button>
                        <button className="secondaryCta" onClick={() => navigate('/auth')}>
                            Sign In
                        </button>
                    </div>
                </div>
                <div className="heroVisual">
                    <div className="heroMockCard">
                        <div className="heroMockHeader">
                            <span className="heroMockDot" style={{background:'#EF4444'}} />
                            <span className="heroMockDot" style={{background:'#F59E0B'}} />
                            <span className="heroMockDot" style={{background:'#22C55E'}} />
                            <span className="heroMockTitle">My Meeting</span>
                        </div>
                        <div className="heroMockGrid">
                            <div className="heroMockTile heroMockTileActive">
                                <div className="heroMockAvatar" style={{background:'linear-gradient(135deg,#6D28D9,#A855F7)'}}>S</div>
                                <span className="heroMockName">You</span>
                            </div>
                            <div className="heroMockTile">
                                <div className="heroMockAvatar" style={{background:'linear-gradient(135deg,#F97360,#FBBF24)'}}>A</div>
                                <span className="heroMockName">Alex</span>
                            </div>
                            <div className="heroMockTile">
                                <div className="heroMockAvatar" style={{background:'linear-gradient(135deg,#0EA5E9,#6D28D9)'}}>R</div>
                                <span className="heroMockName">Riya</span>
                            </div>
                            <div className="heroMockTile">
                                <div className="heroMockAvatar" style={{background:'linear-gradient(135deg,#22C55E,#0EA5E9)'}}>M</div>
                                <span className="heroMockName">Max</span>
                            </div>
                        </div>
                        <div className="heroMockControls">
                            <div className="heroMockBtn heroMockBtnRed" title="End call">✕</div>
                            <div className="heroMockBtn" title="Mute">🎤</div>
                            <div className="heroMockBtn" title="Camera">📷</div>
                            <div className="heroMockBtn" title="Chat">💬</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="featuresSection">
                <div className="featuresInner">
                    <h2 className="sectionTitle">Everything you need</h2>
                    <p className="sectionSubtitle">
                        No unnecessary complexity. Just the features that matter for great meetings.
                    </p>
                    <div className="featuresGrid">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="featureCard">
                                <div className="featureIcon">{f.icon}</div>
                                <h3 className="featureTitle">{f.title}</h3>
                                <p className="featureDesc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="howItWorksSection">
                <div className="howItWorksInner">
                    <h2 className="sectionTitle">Up and running in minutes</h2>
                    <p className="sectionSubtitle">Three steps to your first meeting.</p>
                    <div className="stepsRow">
                        <div className="stepItem">
                            <div className="stepNumber">1</div>
                            <h3 className="stepTitle">Create your account</h3>
                            <p className="stepDesc">Sign up in seconds. No payment details required.</p>
                        </div>
                        <div className="stepDivider" aria-hidden="true" />
                        <div className="stepItem">
                            <div className="stepNumber">2</div>
                            <h3 className="stepTitle">Start or join a meeting</h3>
                            <p className="stepDesc">Generate a meeting code and share it, or enter one to join.</p>
                        </div>
                        <div className="stepDivider" aria-hidden="true" />
                        <div className="stepItem">
                            <div className="stepNumber">3</div>
                            <h3 className="stepTitle">Collaborate</h3>
                            <p className="stepDesc">Talk, share your screen, and chat — all in one place.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="ctaBannerSection">
                <h2 className="ctaBannerTitle">Your next meeting starts here</h2>
                <p className="ctaBannerSubtitle">
                    Join Connectify today. Free to use, with no time limits on meetings.
                </p>
                <button className="ctaBannerBtn" onClick={() => navigate('/auth')}>
                    Create Your Free Account
                </button>
            </section>

            {/* ── FOOTER ── */}
            <footer className="landingFooter">
                <div className="footerInner">
                    <div className="footerLeft">
                        <span className="footerBrand">Connectify</span>
                        <span className="footerTagline">Professional video meetings</span>
                    </div>
                    <div className="footerLinks">
                        <button className="footerNavLink" onClick={() => navigate('/auth')}>Sign In</button>
                        <button className="footerNavLink" onClick={() => navigate('/auth')}>Sign Up</button>
                    </div>
                    <span className="footerCopy">© 2024 Connectify. All rights reserved.</span>
                </div>
            </footer>

        </div>
    );
}
