import { useState, useContext } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AuthContext } from '../contexts/AuthContext';
import '../App.css';

// MUI sx overrides using brand tokens
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&:hover fieldset': { borderColor: '#6D28D9' },
        '&.Mui-focused fieldset': { borderColor: '#6D28D9' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6D28D9' },
};

export default function Authentication() {
    const [username, setUsername]         = useState('');
    const [password, setPassword]         = useState('');
    const [name, setName]                 = useState('');
    const [error, setError]               = useState('');
    const [message, setMessage]           = useState('');
    const [formState, setFormState]       = useState(0);  // 0=Sign In  1=Sign Up
    const [open, setOpen]                 = useState(false);
    const [loading, setLoading]           = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { handleLogin, handleRegister } = useContext(AuthContext);

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                const result = await handleRegister(name, username, password);
                setMessage(result || 'Account created! You can now sign in.');
                setOpen(true);
                setName(''); setUsername(''); setPassword('');
                setFormState(0);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleAuth(); };
    const switchTab = (tab) => { setFormState(tab); setError(''); };

    return (
        <div className="authContainer">

            {/* ── Left Brand Panel ── */}
            <div className="authBrandPanel">
                <div className="authBrandContent">
                    <div className="authBrandLogo">Connectify</div>
                    <p className="authBrandTagline">
                        Professional video meetings for teams and individuals.
                        HD video, secure codes, and built-in chat — all in one place.
                    </p>
                    <ul className="authBrandFeatures">
                        <li>HD video with adaptive quality</li>
                        <li>Secure, private meeting codes</li>
                        <li>Real-time in-call chat</li>
                        <li>Screen sharing support</li>
                        <li>Instant meetings — no setup</li>
                    </ul>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="authFormPanel">
                <div className="authFormCard">

                    <div className="authFormHeader">
                        <h1 className="authFormTitle">
                            {formState === 0 ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="authFormSubtitle">
                            {formState === 0
                                ? 'Sign in to your Connectify account'
                                : 'Get started with Connectify — free forever'}
                        </p>
                    </div>

                    {/* Tab Toggle */}
                    <div className="authTabRow">
                        <button
                            className={`authTab${formState === 0 ? ' authTabActive' : ''}`}
                            onClick={() => switchTab(0)}
                        >
                            Sign In
                        </button>
                        <button
                            className={`authTab${formState === 1 ? ' authTabActive' : ''}`}
                            onClick={() => switchTab(1)}
                        >
                            Sign Up
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
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
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
                            <p className="authError" role="alert">{error}</p>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleAuth}
                            disabled={loading}
                            sx={{
                                background: '#6D28D9',
                                '&:hover': { background: '#5B21B6' },
                                '&:disabled': { background: '#C4B5FD', color: '#fff' },
                                height: 44,
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(109,40,217,0.35)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            {loading
                                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                                : (formState === 0 ? 'Sign In' : 'Create Account')
                            }
                        </Button>
                    </div>

                    <p className="authToggleText">
                        {formState === 0 ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            className="authToggleLink"
                            onClick={() => switchTab(formState === 0 ? 1 : 0)}
                        >
                            {formState === 0 ? 'Sign Up' : 'Sign In'}
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
