import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';

const defaultTheme = createTheme();

export default function Authentication() {

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");

    // 0 -> Login
    // 1 -> Register
    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false);

    const { handleLogin, handleRegister } =
        React.useContext(AuthContext);

    const handleAuth = async () => {
        try {

            setError("");

            // LOGIN
            if (formState === 0) {
                await handleLogin(username, password);
            }

            // REGISTER
            else {
                const result = await handleRegister(
                    name,
                    username,
                    password
                );

                setMessage(result);
                setOpen(true);

                setName("");
                setUsername("");
                setPassword("");

                // Move back to login page
                setFormState(0);
            }

        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Something went wrong";

            setError(message);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid
                container
                component="main"
                sx={{ height: '100vh' }}
            >
                <CssBaseline />

                {/* Left Side Image */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage:
                            'url(https://picsum.photos/1200/900)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Right Side Form */}
                <Grid
                    item
                    xs={12}
                    sm={8}
                    md={5}
                    component={Paper}
                    elevation={6}
                    square
                >
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar
                            sx={{
                                m: 1,
                                bgcolor: 'secondary.main'
                            }}
                        >
                            <LockOutlinedIcon />
                        </Avatar>

                        {/* Toggle Buttons */}
                        <div>
                            <Button
                                variant={
                                    formState === 0
                                        ? "contained"
                                        : "text"
                                }
                                onClick={() => setFormState(0)}
                            >
                                Sign In
                            </Button>

                            <Button
                                variant={
                                    formState === 1
                                        ? "contained"
                                        : "text"
                                }
                                onClick={() => setFormState(1)}
                            >
                                Sign Up
                            </Button>
                        </div>

                        <Box
                            component="form"
                            noValidate
                            sx={{ mt: 1 }}
                        >

                            {/* Full Name Field */}
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />
                            )}

                            {/* Username */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                            />

                            {/* Password */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                            />

                            {/* Error Message */}
                            <p
                                style={{
                                    color: "red",
                                    textAlign: "center"
                                }}
                            >
                                {error}
                            </p>

                            {/* Submit Button */}
                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleAuth}
                            >
                                {
                                    formState === 0
                                        ? "LOGIN"
                                        : "REGISTER"
                                }
                            </Button>

                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Success Message */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
                onClose={() => setOpen(false)}
            />
        </ThemeProvider>
    );
}