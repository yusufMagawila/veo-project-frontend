// src/components/AuthForm.jsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // ⭐ 1. Import hook to read URL parameters
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore'; // ⭐ 2. Import Firestore functions
import { db } from '../firebaseConfig'; // ⭐ 3. Import the Firestore instance

import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Fade,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  AccountCircle,
  Login,
  PersonAdd,
  AutoAwesome
} from '@mui/icons-material';

// ⭐ HELPER FUNCTION: Create the user's initial record in Firestore
// This is called ONLY on sign-up (not login)
const createUserRecord = async (userAuth, referrerUid) => {
    const userRef = doc(db, "users", userAuth.uid);
    await setDoc(userRef, {
        uid: userAuth.uid,
        email: userAuth.email,
        // ⭐ IMPLEMENTING 70 FREE CREDITS
        credits: 70, 
        // ⭐ IMPLEMENTING REFERRAL TRACKING
        referred_by_uid: referrerUid || null,
        commission_balance: 0.0, // For the referrer's earnings
        createdAt: new Date(),
    }, { merge: true });
};

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // ⭐ 4. Read the referral code from the URL: /auth?ref=...
    const [searchParams] = useSearchParams();
    const referrerUid = searchParams.get('ref'); 

    // Adjust the initial state based on the referral link (Optional UX improvement)
    // If a ref code exists, default to the signup form
    useState(() => {
        if (referrerUid) {
            setIsLogin(false); 
        }
    }, [referrerUid]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // --- LOGIC FOR SIGN IN ---
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // --- LOGIC FOR SIGN UP ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // ⭐ 5. Call the function to create the Firestore record with credits/referral data
                await createUserRecord(userCredential.user, referrerUid);
            }
        } catch (err) {
            console.error(err);
            // ... (error handling logic remains the same)
            let errorMessage = 'An error occurred during authentication.';
            
            if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else {
                errorMessage = err.message || 'Authentication failed. Please try again.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setPassword('');
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Container 
            // ... (MUI Container props)
        >
            <Paper
                // ... (MUI Paper props)
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        {isLogin 
                         ? 'Sign in to your Veo AI account' 
                         : `Join Veo AI and start creating amazing videos${referrerUid ? ' (Referred by a friend!)' : ''}` // ⭐ Referral message
                        }
                    </Typography>
                </Box>

                {/* Auth Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    {/* ... (Email and Password TextFields remain the same) */}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Error Alert */}
                    <Fade in={!!error}>
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    </Fade>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : (isLogin ? <Login /> : <PersonAdd />)}
                        // ... (MUI styles remain the same)
                        sx={{ 
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            }
                        }}
                    >
                        {loading ? 'Please Wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>

                    {/* Toggle Auth Mode */}
                    {/* ... (Toggle button logic remains the same) */}

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Divider sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                or
                            </Typography>
                        </Divider>
                        <Button
                            onClick={handleToggleAuthMode}
                            startIcon={isLogin ? <PersonAdd /> : <AccountCircle />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: 'primary.main'
                            }}
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </Button>
                    </Box>

                </Box>

                {/* Features List */}
                <Fade in={!isLogin} timeout={500}>
                    <Box sx={{ mt: 4, display: isLogin ? 'none' : 'block' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
                            🎉 Get Started With
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                {/* ⭐ UPDATED to 70 Credits */}
                                <AutoAwesome sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                                **70 Free Credits**
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AutoAwesome sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                AI Video Generation
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AutoAwesome sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                Instant Access
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AutoAwesome sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                No Credit Card
                            </Typography>
                        </Box>
                    </Box>
                </Fade>
            </Paper>
        </Container>
    );
};

export default AuthForm;
