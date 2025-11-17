import React, { useState, useMemo, useEffect,useCallback} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
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
    Divider,
    Fade,
    alpha,
    useTheme,
    Slider,
    FormControlLabel,
    Switch,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Avatar,
    IconButton,
    Tooltip,
    Zoom,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
     LinearProgress,
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
    Palette,
    RocketLaunch,
    Psychology,
    Lightbulb,
    Wallpaper,CloudUpload, Image as ImageIcon, Close
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;

// New color scheme based on KedeSh logo
const colorScheme = {
    // Warm Red/Orange Gradient
    warmPrimary: '#FF4757', // Bright red
    warmSecondary: '#FF7B54', // Soft orange/coral
    warmGradient: 'linear-gradient(135deg, #FF4757 0%, #FF7B54 100%)',
    
    // Cool Green/Teal Gradient
    coolPrimary: '#00D2A8', // Emerald green
    coolSecondary: '#009688', // Dark teal
    coolGradient: 'linear-gradient(135deg, #00D2A8 0%, #009688 100%)',
    
    // Vibrant Magenta/Violet Gradient
    vibrantPrimary: '#9C27B0', // Deep magenta
    vibrantSecondary: '#673AB7', // Dark violet
    vibrantGradient: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
    
    // Background and text colors
    darkBackground: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)',
    cardBackground: 'rgba(30, 30, 30, 0.7)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
};

// Updated GIF Configuration with space theme
const SPACE_GIF_URLS = [
    'https://cdn.pixabay.com/animation/2024/09/24/13/50/13-50-18-262_256.gif', 
    'https://cdn.pixabay.com/animation/2025/02/25/14/44/14-44-04-910_512.gif',
    'https://cdn.pixabay.com/animation/2025/02/25/14/19/14-19-26-650_512.gif', 
    'https://cdn.pixabay.com/animation/2024/02/26/08/23/08-23-49-231_512.gif',
    'https://cdn.pixabay.com/animation/2023/01/24/23/10/23-10-04-56_512.gif', 
];

const getRandomGif = (currentGif) => {
    let newGif;
    do {
        newGif = SPACE_GIF_URLS[Math.floor(Math.random() * SPACE_GIF_URLS.length)];
    } while (newGif === currentGif && SPACE_GIF_URLS.length > 1);
    return newGif;
};

// Credit System Configuration
const DEFAULT_DURATION = 6; 
const CREDIT_RATE_WITH_AUDIO = 23;    
const CREDIT_RATE_WITHOUT_AUDIO = 15; 
const MIN_DURATION = 4;
const MAX_DURATION = 8;

const ASPECT_RATIO_OPTIONS = [
    { value: '16:9', label: 'Widescreen (16:9)', icon: <AspectRatio /> },
    { value: '1:1', label: 'Square (1:1)', icon: <AspectRatio sx={{ transform: 'rotate(90deg)' }} /> },
    { value: '9:16', label: 'Vertical (9:16)', icon: <AspectRatio /> },
];

// Updated background options with new color scheme
const BACKGROUND_OPTIONS = [
    {
        id: 'gif-shuffling-space',
        name: 'Shuffling Space GIF',
        type: 'gif',
        value: 'shuffling',
        thumbnail: '🌠' 
    },
    {
        id: 'gradient-warm',
        name: 'Warm Energy',
        type: 'gradient',
        value: colorScheme.warmGradient,
        thumbnail: '🔥'
    },
    {
        id: 'gradient-cool',
        name: 'Cool Balance',
        type: 'gradient',
        value: colorScheme.coolGradient,
        thumbnail: '💧'
    },
    {
        id: 'gradient-vibrant',
        name: 'Vibrant Creative',
        type: 'gradient',
        value: colorScheme.vibrantGradient,
        thumbnail: '🎨'
    },
    {
        id: 'gradient-deep',
        name: 'Deep Space',
        type: 'gradient',
        value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        thumbnail: '🌌'
    },
    {
        id: 'gradient-sunset',
        name: 'Sunset Glow',
        type: 'gradient',
        value: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #ffecb3 100%)',
        thumbnail: '🌅'
    },
    {
        id: 'solid-dark',
        name: 'Dark Mode',
        type: 'solid',
        value: '#0a0a0a',
        thumbnail: '⚫'
    },
    {
        id: 'solid-rich',
        name: 'Rich Black',
        type: 'solid',
        value: '#121212',
        thumbnail: '🖤'
    },
];

const calculateVideoCost = (duration, withAudio) => {
    const actualDuration = Math.max(1, duration || DEFAULT_DURATION);
    const rate = withAudio ? CREDIT_RATE_WITH_AUDIO : CREDIT_RATE_WITHOUT_AUDIO;
    return Math.ceil(actualDuration * rate); 
};

const ensureEvenNumber = (value) => {
    return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(value / 2) * 2));
};

const VideoGenerator = ({ user }) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    const [duration, setDuration] = useState(DEFAULT_DURATION);
    const [withAudio, setWithAudio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [currentGifBackground, setCurrentGifBackground] = useState(getRandomGif());
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null); // Raw file preview
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const estimatedCost = useMemo(() => {
        return calculateVideoCost(duration, withAudio);
    }, [duration, withAudio]);

    useEffect(() => {
        if (selectedBackground.type === 'gif') {
            const shuffleInterval = setInterval(() => {
                setCurrentGifBackground(prevGif => getRandomGif(prevGif));
            }, 15000);
            return () => clearInterval(shuffleInterval);
        }
        return () => {};
    }, [selectedBackground.type]);

    const steps = [
        'Craft your vision ✨',
        'AI processing magic 🧠',
        'Video generation 🎬',
        'Ready to share! 🚀'
    ];

    const getActiveStep = () => {
        if (loading) {
            if (status.includes('Sending job request')) return 1;
            if (status.includes('processing')) return 2;
            return 2;
        }
        return 0;
    };
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
}, []);

// NEW: Create cropped image and upload
const createCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = URL.createObjectURL(imageToCrop);

    await new Promise((resolve) => { image.onload = resolve; });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
    );

    canvas.toBlob(async (blob) => {
        const croppedFile = new File([blob], "starting_frame.jpg", { type: "image/jpeg" });
        await handleImageUpload(croppedFile); // Reuse your existing upload function!
        setShowCropper(false);
        setImageToCrop(null);
    }, 'image/jpeg', 0.95);
};

    const handleDurationChange = (newValue) => {
        setDuration(ensureEvenNumber(newValue));
    };

    const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = await user.getIdToken();
        const res = await axios.post(
            `${API_URL}/api/upload/image`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // REMOVE THIS LINE COMPLETELY:
                    // 'Content-Type': 'multipart/form-data'
                    // → Axios + FormData auto-adds correct boundary!
                },
                timeout: 30000, // Optional: prevent hanging
            }
        );

        if (res.data?.url) {
            setUploadedImage(res.data.url);
            setError(''); // Clear any previous errors
        } else {
            throw new Error('No URL returned from server');
        }
    } catch (err) {
        console.error('Image upload failed:', err);
        const msg = err.response?.data?.error || err.message || 'Upload failed. Try again.';
        setError(msg);
    } finally {
        setUploadingImage(false);
    }
};
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || loading) return;

        setLoading(true);
        setStatus(`Submitting job request for ${estimatedCost} credits...`);
        setError('');

        try {
            const token = await user.getIdToken();
            const response = await axios.post(`${API_URL}/api/video/generate`, 
                { 
                    prompt, 
                    duration, 
                    withAudio,
                    aspectRatio,
                    imageUrl: uploadedImage
                }, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setStatus(`Job submitted successfully! Credits remaining: ${response.data.credits}. Cost: ${response.data.cost} credits.`);
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

    const glassmorphismStyle = {
        background: `rgba(40, 40, 40, 0.6)`,
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
        borderRadius: 4,
    };

    const warmGradientStyle = {
        background: colorScheme.warmGradient,
        color: 'white',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: `linear-gradient(135deg, ${colorScheme.warmSecondary} 0%, ${colorScheme.warmPrimary} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(colorScheme.warmPrimary, 0.5)}`,
        },
    };

    const coolGradientStyle = {
        background: colorScheme.coolGradient,
        color: 'white',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: `linear-gradient(135deg, ${colorScheme.coolSecondary} 0%, ${colorScheme.coolPrimary} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(colorScheme.coolPrimary, 0.5)}`,
        },
    };

    const vibrantGradientStyle = {
        background: colorScheme.vibrantGradient,
        color: 'white',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: `linear-gradient(135deg, ${colorScheme.vibrantSecondary} 0%, ${colorScheme.vibrantPrimary} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(colorScheme.vibrantPrimary, 0.5)}`,
        },
    };

    const pulsingAnimation = {
        '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.9 },
            '50%': { transform: 'scale(1.03)', opacity: 0.7 },
            '100%': { transform: 'scale(1)', opacity: 0.9 },
        },
        animation: 'pulse 2.5s infinite ease-in-out',
    };

    const backgroundStyle = useMemo(() => {
        if (selectedBackground.type === 'gif') {
            return {
                backgroundImage: `url(${currentGifBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                transition: 'background-image 1.2s ease-in-out',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }
            };
        }
        return {
            background: selectedBackground.value,
            transition: 'background 0.6s ease-in-out',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 80%, rgba(255, 71, 87, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 210, 168, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none',
            }
        };
    }, [selectedBackground.type, currentGifBackground, selectedBackground.value]);

    const BackgroundPickerDialog = () => (
        <Dialog 
            open={showBackgroundPicker} 
            onClose={() => setShowBackgroundPicker(false)}
            maxWidth="sm"
            PaperProps={{
                sx: {
                    ...glassmorphismStyle,
                    background: alpha(theme.palette.background.paper, 0.3),
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center',
                background: colorScheme.warmGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
            }}>
                <Wallpaper sx={{ mr: 1 }} />
                Choose Background
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    {BACKGROUND_OPTIONS.map((bg) => (
                        <Grid item xs={6} key={bg.id}>
                            <Card 
                                sx={{
                                    cursor: 'pointer',
                                    border: selectedBackground.id === bg.id ? `2px solid ${colorScheme.coolPrimary}` : '1px solid transparent',
                                    transition: 'all 0.4s ease',
                                    transform: selectedBackground.id === bg.id ? 'scale(1.03)' : 'scale(1)',
                                    '&:hover': {
                                        transform: 'scale(1.03)',
                                        border: `1px solid ${colorScheme.coolPrimary}`,
                                    },
                                    background: alpha(theme.palette.background.paper, 0.1),
                                }}
                                onClick={() => {
                                    setSelectedBackground(bg);
                                    setShowBackgroundPicker(false);
                                }}
                            >
                                <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 60,
                                            background: bg.type === 'gif' ? `url(${currentGifBackground})` : bg.value,
                                            backgroundSize: bg.type === 'gif' ? 'cover' : 'auto',
                                            backgroundPosition: 'center',
                                            borderRadius: 2,
                                            mb: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}
                                    >
                                        {bg.thumbnail}
                                    </Box>
                                    <Typography variant="caption" fontWeight="600" sx={{ color: colorScheme.textPrimary }}>
                                        {bg.name}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowBackgroundPicker(false)} sx={{ ...coolGradientStyle, py: 1 }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box sx={{
            width: '100vw',
            minHeight: '100vh',
            ...backgroundStyle,
            backgroundAttachment: 'fixed',
            py: 6,
            px: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            color: colorScheme.textPrimary,
            '& > *': {
                position: 'relative',
                zIndex: 1,
            }
        }}>
            <BackgroundPickerDialog />
            <Container maxWidth="md">
                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={8}>
                        <Zoom in timeout={1000}>
                            <Paper 
                                sx={{ 
                                    ...glassmorphismStyle,
                                    p: { xs: 2, sm: 3 },
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '3px',
                                        background: colorScheme.warmGradient,
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Box sx={{ 
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        background: colorScheme.warmGradient,
                                        mb: 2,
                                        boxShadow: `0 6px 20px ${alpha(colorScheme.warmPrimary, 0.4)}`,
                                    }}>
                                        <RocketLaunch sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 800,
                                            background: colorScheme.warmGradient,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
                                        }}
                                    >
                                        KedeSh AI Generator
                                    </Typography>
                                    <Typography 
                                        variant="body1" 
                                        sx={{ mb: 2, opacity: 0.8, color: colorScheme.textSecondary }}
                                    >
                                        Create stunning videos with AI magic
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                                        <Chip 
                                            icon={<CreditScore sx={{ color: 'white !important' }} />} 
                                            label={`${estimatedCost} Credits`}
                                            sx={{
                                                ...coolGradientStyle,
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                            }}
                                        />
                                        <Tooltip title={`Current: ${selectedBackground.name}`}>
                                            <IconButton 
                                                onClick={() => setShowBackgroundPicker(true)}
                                                sx={{
                                                    background: alpha(colorScheme.coolPrimary, 0.1),
                                                    backdropFilter: 'blur(8px)',
                                                    color: colorScheme.coolPrimary,
                                                    '&:hover': {
                                                        background: alpha(colorScheme.coolPrimary, 0.2),
                                                    }
                                                }}
                                            >
                                                <Palette />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                                <Grid item xs={12}>
    <Card sx={{ p: 2, ...glassmorphismStyle, position: 'relative', overflow: 'hidden' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: colorScheme.textPrimary }}>
            <ImageIcon sx={{ mr: 1, color: colorScheme.warmPrimary }} />
            Starting Image • Bofya ili kuchagua sehemu unayopenda (VEO 3.1)
        </Typography>

        {/* UPLOADED + FINAL PREVIEW */}
        {uploadedImage && !showCropper && (
            <Box sx={{ position: 'relative' }}>
                <img src={uploadedImage} alt="Final frame" style={{ width: '100%', borderRadius: 12, border: `3px solid ${colorScheme.coolPrimary}` }} />
                <Chip
                    label="VEO 3.1 • Tayari!"
                    sx={{ position: 'absolute', top: 10, right: 10, background: colorScheme.coolGradient, color: 'white', fontWeight: 700 }}
                />
                <IconButton onClick={() => { setUploadedImage(null); setImageToCrop(null); }} sx={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>
        )}

        {/* CROPPER MODE */}
        {showCropper && (
            <Box sx={{ height: 400, position: 'relative', background: '#000', borderRadius: 3, overflow: 'hidden' }}>
                <Cropper
                    image={URL.createObjectURL(imageToCrop)}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9} // Matches your default aspect ratio
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{ containerStyle: { borderRadius: 12 } }}
                />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, background: 'linear-gradient(transparent, black)', color: 'white' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Zoom & Move • Chagua sehemu bora</Typography>
                    <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_, z) => setZoom(z)} sx={{ color: colorScheme.warmPrimary }} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button onClick={() => { setShowCropper(false); setImageToCrop(null); }} sx={{ flex: 1, background: '#333', color: 'white' }}>
                            Ghairi
                        </Button>
                        <Button onClick={createCroppedImage} variant="contained" sx={{ flex: 2, ...warmGradientStyle }}>
                            Tumia Sehemu Hii
                        </Button>
                    </Box>
                </Box>
            </Box>
        )}

        {/* INITIAL UPLOAD STATE */}
        {!uploadedImage && !showCropper && (
            <Box
                sx={{
                    border: '3px dashed rgba(255,255,255,0.3)',
                    borderRadius: 3,
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    '&:hover': { borderColor: colorScheme.coolPrimary, background: alpha(colorScheme.coolPrimary, 0.08) }
                }}
                onClick={() => document.getElementById('image-upload').click()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith('image/')) {
                        setImageToCrop(file);
                        setShowCropper(true);
                    }
                }}
                onDragOver={(e) => e.preventDefault()}
            >
                <CloudUpload sx={{ fontSize: 64, color: colorScheme.textSecondary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colorScheme.textPrimary, fontWeight: 600 }}>
                    Bofya au Buruta Picha Hapa
                </Typography>
                <Typography variant="body2" sx={{ color: colorScheme.textSecondary, mt: 1 }}>
                    Chagua sehemu unayopenda • Matokeo bora zaidi na VEO 3.1
                </Typography>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setImageToCrop(file);
                            setShowCropper(true);
                        }
                    }}
                />
            </Box>
        )}

        {uploadingImage && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} color="secondary" />}
    </Card>
</Grid>
                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="mfano(example)[USER INSTRUCTIONS]: Create a short ad script for our solar lamp product.  
[USER VOICEOVER]: Taa zetu za jua ni nafuu, zenye kudumu, na rafiki kwa mazingira. Zinaboresha maisha ya familia za Kitanzania."
                                        variant="outlined"
                                        disabled={loading}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Psychology sx={{ color: colorScheme.coolPrimary }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                fontSize: '1rem',
                                                background: alpha(theme.palette.background.paper, 0.2),
                                                transition: 'all 0.4s ease',
                                                color: colorScheme.textPrimary,
                                                '&:hover fieldset': {
                                                    borderColor: colorScheme.coolPrimary,
                                                    boxShadow: `0 0 0 3px ${alpha(colorScheme.coolPrimary, 0.1)}`,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: colorScheme.coolPrimary,
                                                    boxShadow: `0 0 0 3px ${alpha(colorScheme.coolPrimary, 0.2)}`,
                                                },
                                            }
                                        }}
                                    />

                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={12} sm={6}>
                                            <Card sx={{ p: 1.5, ...glassmorphismStyle }}>
                                                <Typography gutterBottom variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: colorScheme.textPrimary }}>
                                                    <AccessTime sx={{ mr: 1, color: colorScheme.warmPrimary }} /> 
                                                    Video Length
                                                    <Chip 
                                                        label={`${duration}s`} 
                                                        size="small" 
                                                        sx={{ 
                                                            ml: 'auto', 
                                                            fontWeight: 600,
                                                            background: colorScheme.warmGradient,
                                                            color: 'white'
                                                        }} 
                                                    />
                                                </Typography>
                                                <Slider
                                                    value={duration}
                                                    onChange={(e, newValue) => handleDurationChange(newValue)}
                                                    step={2}
                                                    marks={[
                                                        { value: 4, label: '4s' },
                                                        { value: 6, label: '6s' },
                                                        { value: 8, label: '8s' },
                                                    ]}
                                                    min={MIN_DURATION}
                                                    max={MAX_DURATION}
                                                    valueLabelDisplay="auto"
                                                    disabled={loading}
                                                    sx={{
                                                        color: colorScheme.warmPrimary,
                                                        '& .MuiSlider-markLabel': {
                                                            color: colorScheme.textSecondary,
                                                            fontWeight: 500,
                                                        }
                                                    }}
                                                />
                                            </Card>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <Card sx={{ p: 1.5, ...glassmorphismStyle }}>
                                                <FormControl fullWidth disabled={loading}>
                                                    <InputLabel id="aspect-ratio-label" sx={{ fontWeight: 600, color: colorScheme.textPrimary }}>Aspect Ratio</InputLabel>
                                                    <Select
                                                        labelId="aspect-ratio-label"
                                                        value={aspectRatio}
                                                        label="Aspect Ratio"
                                                        onChange={(e) => setAspectRatio(e.target.value)}
                                                        sx={{ 
                                                            borderRadius: 2,
                                                            color: colorScheme.textPrimary,
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: alpha(colorScheme.textSecondary, 0.3),
                                                            }
                                                        }}
                                                    >
                                                        {ASPECT_RATIO_OPTIONS.map(option => (
                                                            <MenuItem key={option.value} value={option.value} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                                                                {option.icon} 
                                                                <Typography variant="body2" sx={{ ml: 1.5, fontWeight: 500, color: colorScheme.textPrimary }}>
                                                                    {option.label}
                                                                </Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Card>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Card sx={{ p: 1.5, ...glassmorphismStyle }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={withAudio}
                                                            onChange={(e) => setWithAudio(e.target.checked)}
                                                            disabled={loading}
                                                            icon={<MicOff />}
                                                            checkedIcon={<Mic />}
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: colorScheme.coolPrimary,
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: colorScheme.coolPrimary,
                                                                },
                                                            }}
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: colorScheme.textPrimary }}>
                                                                {withAudio ? 'With Audio' : 'Without Audio'}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: colorScheme.textSecondary }}>
                                                                {withAudio ? '23 credits/sec' : '15 credits/sec'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        width: '100%',
                                                        m: 0,
                                                        justifyContent: 'space-between',
                                                        '& .MuiFormControlLabel-label': { flexGrow: 1, ml: 1.5 },
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
                                        startIcon={loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PlayArrow />}
                                        sx={{
                                            py: 2,
                                            borderRadius: 2,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            ...warmGradientStyle,
                                            ...(loading && pulsingAnimation),
                                            '&.Mui-disabled': {
                                                background: 'linear-gradient(135deg, #666 0%, #999 100%)',
                                                color: 'white',
                                                transform: 'none',
                                                boxShadow: 'none',
                                            },
                                        }}
                                    >
                                        {loading ? 'Creating...' : `Generate Video - ${estimatedCost} Credits`}
                                    </Button>
                                </form>

                                <Fade in={!!status || !!error}>
                                    <Box sx={{ mt: 2 }}>
                                        {error ? (
                                            <Alert 
                                                severity="error" 
                                                icon={<WarningAmber />}
                                                sx={{
                                                    ...glassmorphismStyle,
                                                    '& .MuiAlert-message': { fontWeight: 500, color: colorScheme.textPrimary }
                                                }}
                                                action={
                                                    error.includes('credit') && (
                                                        <Button 
                                                            color="inherit" 
                                                            size="small" 
                                                            onClick={() => navigate('/pay')}
                                                            sx={{ ...coolGradientStyle, py: 0.5 }}
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
                                                sx={{
                                                    ...glassmorphismStyle,
                                                    '& .MuiAlert-message': { fontWeight: 500, color: colorScheme.textPrimary }
                                                }}
                                            >
                                                {status}
                                            </Alert>
                                        ) : null}
                                    </Box>
                                </Fade>
                            </Paper>
                        </Zoom>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Fade in timeout={1200}>
                            <Card 
                                sx={{ 
                                    ...glassmorphismStyle,
                                    p: 2,
                                    mb: 2,
                                }}
                            >
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        fontWeight: 700, 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        background: colorScheme.coolGradient,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        color: 'transparent',
                                    }}
                                >
                                    <VideoSettings sx={{ mr: 1 }} />
                                    Creation Journey
                                </Typography>
                                <Stepper 
                                    activeStep={getActiveStep()} 
                                    orientation="vertical" 
                                    sx={{ 
                                        mt: 2,
                                        '& .MuiStepConnector-line': {
                                            borderColor: alpha(colorScheme.textSecondary, 0.2),
                                        },
                                    }}
                                >
                                    {steps.map((label, index) => (
                                        <Step key={label}>
                                            <StepLabel 
                                                StepIconComponent={() => (
                                                    <Box
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '50%',
                                                            bgcolor: index <= getActiveStep() ? colorScheme.warmGradient : alpha(colorScheme.textSecondary, 0.2),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            boxShadow: index <= getActiveStep() ? `0 4px 12px ${alpha(colorScheme.warmPrimary, 0.3)}` : 'none',
                                                            ...(index === getActiveStep() && pulsingAnimation),
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </Box>
                                                )}
                                            >
                                                <Typography 
                                                    sx={{ 
                                                        color: index <= getActiveStep() ? colorScheme.textPrimary : colorScheme.textSecondary,
                                                        fontWeight: index <= getActiveStep() ? 600 : 500,
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {label}
                                                </Typography>
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Card>
                        </Fade>

                        <Fade in timeout={1400}>
                            <Card 
                                sx={{ 
                                    ...glassmorphismStyle,
                                    p: 2,
                                }}
                            >
                                <CardContent sx={{ p: 2 }}>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: colorScheme.vibrantGradient,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                        }}
                                    >
                                        <Lightbulb sx={{ mr: 1 }} />
                                        Pro Tips
                                    </Typography>
                                    <Divider sx={{ my: 2, borderColor: alpha(colorScheme.textSecondary, 0.2) }} />
                                    <Box 
                                        component="ul" 
                                        sx={{ 
                                            pl: 2, 
                                            '& li': { mb: 1.5 },
                                        }}
                                    >
                                        {[
                                            "🎯 Be specific with details",
                                            "🌈 Use vivid colors and styles",
                                            "🎥 Add camera angles",
                                            "⚡ Keep prompts concise",
                                            "✨ Use descriptive adjectives"
                                        ].map((tip, index) => (
                                            <Typography 
                                                key={index}
                                                component="li" 
                                                variant="caption" 
                                                sx={{
                                                    fontWeight: 500,
                                                    lineHeight: 1.5,
                                                    color: colorScheme.textSecondary,
                                                }}
                                            >
                                                {tip}
                                            </Typography>
                                        ))}
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