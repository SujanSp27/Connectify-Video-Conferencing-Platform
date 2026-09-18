import { useState, useContext } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

// MUI input styling for dark theme
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        color: '#f8fafc',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
        '&:hover fieldset': { borderColor: '#6366f1' },
        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.5)',
        '&.Mui-focused': { color: '#818cf8' },
    },
    '& .MuiInputBase-input': {
        color: '#f8fafc',
    },
};

export default function Authentication() {
    const [username, setUsername]         = useState('');
    const [password, setPassword]         = useState('');
    const [name, setName]                 = useState('');
    const [error, setError]               = useState('');
    const [message, setMessage]           = useState('');
    const [formState, setFormState]       = useState(0);  // 0 = Sign In, 1 = Sign Up
    const [open, setOpen]                 = useState(false);
    const [loading, setLoading]           = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { handleLogin, handleRegister } = useContext(AuthContext);

    const handleAuth = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please fill in all required fields');
            return;
        }
        if (formState === 1 && !name.trim()) {
            setError('Please provide your full name');
            return;
        }

        setError('');
        setLoading(true);
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                const result = await handleRegister(name, username, password);
                setMessage(result || 'Account created successfully! You can now sign in.');
                setOpen(true);
                setName(''); setUsername(''); setPassword('');
                setFormState(0);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { 
        if (e.key === 'Enter') handleAuth(); 
    };

    const switchTab = (tab) => { 
        setFormState(tab); 
        setError(''); 
    };

    return (
        <div className="authContainer">

            {/* ── Left Brand Panel ── */}
            <div className="authBrandPanel">
                <div className="authBrandContent">
                    <div className="authBrandLogoWrap">
                        <div className="authBrandLogoIcon">
                            <VideoCallIcon sx={{ color: '#fff', fontSize: '1.8rem' }} />
                        </div>
                        <span className="authBrandLogo">Connectify</span>
                    </div>

                    <h2 className="authBrandHeadline">
                        Ultra-reliable video meetings for modern teams.
                    </h2>

                    <p className="authBrandTagline">
                        Experience high-performance peer-to-peer conferencing with real-time encrypted communication,
                        crystal-clear audio/video, and seamless screen sharing.
                    </p>

                    <div className="authBrandFeatures">
                        <div className="authFeatureRow">
                            <CheckCircleOutlinedIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                            <span>100% Peer-to-Peer direct encrypted streams</span>
                        </div>
                        <div className="authFeatureRow">
                            <CheckCircleOutlinedIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                            <span>Adaptive multi-participant responsive layout</span>
                        </div>
                        <div className="authFeatureRow">
                            <CheckCircleOutlinedIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                            <span>Full 60 FPS screen presentation capability</span>
                        </div>
                        <div className="authFeatureRow">
                            <CheckCircleOutlinedIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                            <span>In-call instant messaging and live reactions</span>
                        </div>
                    </div>

                    <div className="authTestimonial">
                        <p className="testimonialQuote">
                            "Connectify gives us instant, hassle-free meetings with the reliability of enterprise video platforms."
                        </p>
                        <span className="testimonialAuthor">Sujan S. • Lead Architect</span>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="authFormPanel">
                <div className="authFormCard">

                    <div className="authFormHeader">
                        <h1 className="authFormTitle">
                            {formState === 0 ? 'Sign In to Connectify' : 'Create Free Account'}
                        </h1>
                        <p className="authFormSubtitle">
                            {formState === 0
                                ? 'Welcome back! Enter your details to access your workspace.'
                                : 'Get started in seconds. No credit card required.'}
                        </p>
                    </div>

                    {/* Tab Toggle */}
                    <div className="authTabRow">
                        <button
                            type="button"
                            className={`authTab${formState === 0 ? ' authTabActive' : ''}`}
                            onClick={() => switchTab(0)}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`authTab${formState === 1 ? ' authTabActive' : ''}`}
                            onClick={() => switchTab(1)}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="authFormFields">
                        {formState === 1 && (
                            <TextField
                                label="Full Name"
                                variant="outlined"
                                fullWidth
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoComplete="name"
                                disabled={loading}
                                size="small"
                                sx={fieldSx}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BadgeOutlinedIcon sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}

                        <TextField
                            label="Username"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                            disabled={loading}
                            size="small"
                            sx={fieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlinedIcon sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Password"
                            variant="outlined"
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete={formState === 0 ? 'current-password' : 'new-password'}
                            disabled={loading}
                            size="small"
                            sx={fieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: 'rgba(255,255,255,0.5)' }}
                                        >
                                            {showPassword
                                                ? <VisibilityOff fontSize="small" />
                                                : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {error && (
                            <div className="authError" role="alert">
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleAuth}
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' },
                                '&:disabled': { background: 'rgba(99, 102, 241, 0.4)', color: '#ffffff' },
                                height: 46,
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '10px',
                                boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)',
                                mt: 1,
                            }}
                        >
                            {loading
                                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                                : (formState === 0 ? 'Sign In to Workspace' : 'Create Free Account')
                            }
                        </Button>
                    </div>

                    <p className="authToggleText">
                        {formState === 0 ? "Don't have an account yet? " : 'Already registered? '}
                        <button
                            type="button"
                            className="authToggleLink"
                            onClick={() => switchTab(formState === 0 ? 1 : 0)}
                        >
                            {formState === 0 ? 'Create account' : 'Sign in here'}
                        </button>
                    </p>

                </div>
            </div>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
                onClose={() => setOpen(false)}
            />
        </div>
    );
}
