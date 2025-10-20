import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Grid,
    Chip,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Divider,
    Fade,
    alpha,
    useTheme,
    // NEW IMPORTS for controls
    Slider,
    FormControlLabel,
    Switch,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from '@mui/material';
import {
    PlayArrow,
    AutoAwesome,
    Schedule,
    CheckCircle,
    VideoSettings,
    WarningAmber,
    CreditScore,
    Mic,
    MicOff,
    AccessTime,
    AspectRatio,
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;


// ----------------------------------------------------
// 💰 CREDIT SYSTEM CONFIGURATION (Keep in sync with backend!)
// ----------------------------------------------------
const DEFAULT_DURATION = 6; 
const CREDIT_RATE_WITH_AUDIO = 23;    
const CREDIT_RATE_WITHOUT_AUDIO = 15; 
const ASPECT_RATIO_OPTIONS = [
    { value: '16:9', label: 'Widescreen (16:9)', icon: <AspectRatio /> },
    { value: '1:1', label: 'Square (1:1)', icon: <AspectRatio sx={{ transform: 'rotate(90deg)' }} /> },
    { value: '9:16', label: 'Vertical (9:16)', icon: <AspectRatio /> },
];


// Helper function to calculate cost (client-side matching backend logic)
const calculateVideoCost = (duration, withAudio) => {
    const actualDuration = Math.max(1, duration || DEFAULT_DURATION);
    const rate = withAudio ? CREDIT_RATE_WITH_AUDIO : CREDIT_RATE_WITHOUT_AUDIO;
    // Math.ceil() matches the backend to show the exact cost
    return Math.ceil(actualDuration * rate); 
}


const VideoGenerator = ({ user }) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    // 🔥 NEW STATES for custom generation parameters
    const [duration, setDuration] = useState(DEFAULT_DURATION);
    const [withAudio, setWithAudio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    
    // Dynamic Cost Calculation
    const estimatedCost = useMemo(() => {
        return calculateVideoCost(duration, withAudio);
    }, [duration, withAudio]);


    const steps = [
        'Enter your prompt',
        'AI processing',
        'Video generation',
        'Ready to view'
    ];

    const getActiveStep = () => {
        if (loading) {
            if (status.includes('Sending job request')) return 1;
            if (status.includes('processing')) return 2;
            return 2;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || loading) return;

        setLoading(true);
        setStatus(`Submitting job request for ${estimatedCost} credits...`);
        setError('');

        try {
            const token = await user.getIdToken();

            // 🔥 NEW: Pass all custom parameters in the request body
            const response = await axios.post(`${API_URL}/api/video/generate`, 
                { 
                    prompt, 
                    duration, 
                    withAudio,
                    aspectRatio
                }, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setStatus(`Job submitted successfully! Credits remaining: ${response.data.credits}. Cost: ${response.data.cost} credits.`);
            
            // Show success alert
            setTimeout(() => {
                navigate('/dashboard');
            }, 5000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
            setStatus(`Error: ${errorMessage}`);
            setError(errorMessage);
            console.error('Generation failed:', error);

            if (error.response?.status === 402) {
                setTimeout(() => {
                    navigate('/pay');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    // Glassmorphism style
    const glassmorphismStyle = {
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `inset 0 0 10px ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
    };

    // Gradient style for buttons and chips
    const gradientStyle = {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        transition: 'background 0.5s ease, transform 0.2s ease',
        '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        },
    };

    // Pulsing animation for loading button
    const pulsingAnimation = {
        '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.05)', opacity: 0.9 },
            '100%': { transform: 'scale(1)', opacity: 1 },
        },
        animation: 'pulse 1.5s infinite ease-in-out',
    };

    return (
        <Box sx={{
            width: '100vw',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
            py: 4,
            px: { xs: 2, sm: 4, md: 6 }
        }}>
            <Container maxWidth="xl">
                <Grid container spacing={4}>
                    {/* Left Side - Generator Form */}
                    <Grid item xs={12} md={8}>
                        <Fade in>
                            <Paper 
                                sx={{ 
                                    ...glassmorphismStyle,
                                    p: 4,
                                }}
                            >
                                {/* Header */}
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <AutoAwesome 
                                        sx={{ 
                                            fontSize: 48, 
                                            background: gradientStyle.background,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                            mb: 2 
                                        }} 
                                    />
                                    <Typography 
                                        variant="h4" 
                                        component="h1" 
                                        gutterBottom 
                                        sx={{ 
                                            fontWeight: 700,
                                            background: 'linear-gradient(45deg, #ffffff 30%, #667eea 90%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                        }}
                                    >
                                        AI Video Generator
                                    </Typography>
                                    <Typography 
                                        variant="h6" 
                                        color="text.secondary" 
                                        sx={{ mb: 1, opacity: 0.8 }}
                                    >
                                        Transform your ideas into stunning videos
                                    </Typography>
                                    <Chip 
                                        icon={<CreditScore sx={{ color: 'white !important' }} />} 
                                        label={`${estimatedCost} Credits estimated`} // 🔥 UPDATED label
                                        sx={{
                                            ...gradientStyle,
                                            fontWeight: 600,
                                            '& .MuiChip-icon': {
                                                color: 'white',
                                            },
                                        }}
                                    />
                                </Box>

                                {/* Generation Form */}
                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe your video in detail... 
Example: 'A golden retriever wearing sunglasses skateboarding on a rainbow road through a futuristic city with neon lights'"
                                        variant="outlined"
                                        disabled={loading}
                                        required
                                        sx={{
                                            mb: 3,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                fontSize: '1.1rem',
                                                background: alpha(theme.palette.background.paper, 0.9),
                                                '&:hover fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                '&.Mui-disabled fieldset': {
                                                    borderColor: alpha(theme.palette.divider, 0.3),
                                                },
                                            }
                                        }}
                                    />

                                    {/* 🔥 NEW: Controls for Duration, Aspect Ratio, and Audio */}
                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        {/* Duration Slider */}
                                        <Grid item xs={12} sm={6}>
                                            <Typography gutterBottom variant="subtitle2" component="div" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <AccessTime sx={{ mr: 0.5, fontSize: 18 }} /> Video Length: 
                                                <Chip 
                                                    label={`${duration} seconds`} 
                                                    size="small" 
                                                    color="primary" 
                                                    sx={{ ml: 1 }} 
                                                />
                                            </Typography>
                                            <Slider
                                                value={duration}
                                                onChange={(e, newValue) => setDuration(newValue)}
                                                aria-labelledby="duration-slider"
                                                step={1}
                                                marks
                                                min={3}
                                                max={10}
                                                valueLabelDisplay="auto"
                                                disabled={loading}
                                            />
                                        </Grid>

                                        {/* Aspect Ratio Select */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth disabled={loading}>
                                                <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
                                                <Select
                                                    labelId="aspect-ratio-label"
                                                    value={aspectRatio}
                                                    label="Aspect Ratio"
                                                    onChange={(e) => setAspectRatio(e.target.value)}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    {ASPECT_RATIO_OPTIONS.map(option => (
                                                        <MenuItem key={option.value} value={option.value} sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {option.icon} 
                                                            <Box component="span" sx={{ ml: 1 }}>{option.label}</Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        
                                        {/* Audio Toggle */}
                                        <Grid item xs={12}>
                                            <Card variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: alpha(theme.palette.divider, 0.3), bgcolor: alpha(theme.palette.background.default, 0.2) }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={withAudio}
                                                            onChange={(e) => setWithAudio(e.target.checked)}
                                                            disabled={loading}
                                                            icon={<MicOff />}
                                                            checkedIcon={<Mic />}
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {withAudio ? 'Generate with Audio (23 credits/sec)' : 'Generate without Audio (15 credits/sec)'}
                                                        </Typography>
                                                    }
                                                    sx={{
                                                        width: '100%',
                                                        m: 0,
                                                        justifyContent: 'space-between',
                                                        '& .MuiFormControlLabel-label': { flexGrow: 1, ml: 1 },
                                                    }}
                                                />
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Button
                                        type="submit"
                                        disabled={loading || prompt.length < 5}
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <PlayArrow />}
                                        sx={{
                                            py: 2,
                                            borderRadius: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            ...gradientStyle,
                                            ...(loading && pulsingAnimation),
                                            '&.Mui-disabled': {
                                                background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                                                color: 'white',
                                                cursor: 'not-allowed',
                                            },
                                        }}
                                    >
                                        {loading ? 'Generating Video...' : `Generate Video (${estimatedCost} Credits)`}
                                    </Button>
                                </form>

                                {/* Status & Error Display */}
                                <Fade in={!!status || !!error}>
                                    <Box sx={{ mt: 3 }}>
                                        {error ? (
                                            <Alert 
                                                severity="error" 
                                                icon={<WarningAmber />}
                                                sx={glassmorphismStyle}
                                                action={
                                                    error.includes('credit') && (
                                                        <Button 
                                                            color="inherit" 
                                                            size="small" 
                                                            onClick={() => navigate('/pay')}
                                                            sx={{ ...gradientStyle, py: 1 }}
                                                        >
                                                            Buy Credits
                                                        </Button>
                                                    )
                                                }
                                            >
                                                {error}
                                            </Alert>
                                        ) : status ? (
                                            <Alert 
                                                severity={status.includes('Error') ? 'error' : 'success'}
                                                icon={status.includes('Error') ? <WarningAmber /> : <CheckCircle />}
                                                sx={glassmorphismStyle}
                                            >
                                                {status}
                                            </Alert>
                                        ) : null}
                                    </Box>
                                </Fade>

                                {/* Info Note */}
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ mt: 3, textAlign: 'center', opacity: 0.7 }}
                                >
                                    <Schedule sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                                    The final cost is calculated based on your selections. Check your dashboard for completion.
                                </Typography>
                            </Paper>
                        </Fade>
                    </Grid>

                    {/* Right Side - Instructions & Progress */}
                    {/* (Right side code remains unchanged for brevity, as it only tracks progress) */}
                    <Grid item xs={12} md={4}>
                         {/* Progress Stepper */}
                         <Fade in>
                           <Paper 
                             sx={{ 
                               ...glassmorphismStyle,
                               p: 3,
                               mb: 3,
                               height: '300px',
                               display: 'flex',
                               flexDirection: 'column',
                             }}
                           >
                             <Typography 
                               variant="h6" 
                               gutterBottom 
                               sx={{ 
                                 fontWeight: 600, 
                                 display: 'flex', 
                                 alignItems: 'center',
                                 background: gradientStyle.background,
                                 backgroundClip: 'text',
                                 WebkitBackgroundClip: 'text',
                                 color: 'transparent',
                               }}
                             >
                               <VideoSettings sx={{ mr: 1, color: 'white' }} />
                               Generation Process
                             </Typography>
                             <Stepper 
                               activeStep={getActiveStep()} 
                               orientation="vertical" 
                               sx={{ 
                                 mt: 2,
                                 flex: 1,
                                 '& .MuiStepConnector-line': {
                                   borderColor: alpha(theme.palette.divider, 0.3),
                                 },
                               }}
                             >
                               {steps.map((label, index) => (
                                 <Step key={label}>
                                   <StepLabel 
                                     StepIconComponent={() => (
                                       <Box
                                         sx={{
                                           width: 24,
                                           height: 24,
                                           borderRadius: '50%',
                                           bgcolor: index <= getActiveStep() ? gradientStyle.background : alpha(theme.palette.divider, 0.3),
                                           display: 'flex',
                                           alignItems: 'center',
                                           justifyContent: 'center',
                                           color: 'white',
                                           fontSize: '0.75rem',
                                           fontWeight: 600,
                                           ...(index === getActiveStep() && pulsingAnimation),
                                         }}
                                       >
                                         {index + 1}
                                       </Box>
                                     )}
                                   >
                                     <Typography 
                                       sx={{ 
                                         color: index <= getActiveStep() ? 'white' : 'text.secondary',
                                         fontWeight: index <= getActiveStep() ? 600 : 400,
                                       }}
                                     >
                                       {label}
                                     </Typography>
                                   </StepLabel>
                                   {index === 0 && (
                                     <StepContent>
                                       <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                                         Be creative and descriptive for best results
                                       </Typography>
                                     </StepContent>
                                   )}
                                 </Step>
                               ))}
                             </Stepper>
                           </Paper>
                         </Fade>
     
                         {/* Tips Card */}
                         <Fade in>
                           <Card 
                             sx={{ 
                               ...glassmorphismStyle,
                               height: '300px', 
                               display: 'flex',
                               flexDirection: 'column',
                             }}
                           >
                             <CardContent sx={{ p: 3, flex: 1 }}>
                               <Typography 
                                 variant="h6" 
                                 gutterBottom 
                                 sx={{ 
                                   fontWeight: 600,
                                   background: gradientStyle.background,
                                   backgroundClip: 'text',
                                   WebkitBackgroundClip: 'text',
                                   color: 'transparent',
                                 }}
                               >
                                 💡 Pro Tips
                               </Typography>
                               <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.divider, 0.3) }} />
                               <Box 
                                 component="ul" 
                                 sx={{ 
                                   pl: 2, 
                                   '& li': { mb: 1 },
                                   overflow: 'hidden',
                                 }}
                               >
                                 <Typography 
                                   component="li" 
                                   variant="body2" 
                                   color="text.secondary"
                                   sx={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                   }}
                                 >
                                   Be specific about characters, actions, and settings
                                 </Typography>
                                 <Typography 
                                   component="li" 
                                   variant="body2" 
                                   color="text.secondary"
                                   sx={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                   }}
                                 >
                                   Include visual details like colors, lighting, and style
                                 </Typography>
                                 <Typography 
                                   component="li" 
                                   variant="body2" 
                                   color="text.secondary"
                                   sx={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                   }}
                                 >
                                   Mention camera angles and movement if important
                                 </Typography>
                                 <Typography 
                                   component="li" 
                                   variant="body2" 
                                   color="text.secondary"
                                   sx={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                   }}
                                 >
                                   Keep prompts under 200 characters for best results
                                 </Typography>
                               </Box>
                             </CardContent>
                           </Card>
                         </Fade>
                       </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default VideoGenerator;