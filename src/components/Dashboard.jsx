import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  CircularProgress,
  alpha,
  useTheme,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  ErrorOutline,
  AccountBalanceWallet,
  VideoLibrary,
  Download,
  AutoAwesome,
  Close,
  Fullscreen,
  PlayArrow,
  Delete,
  AccessTime
} from '@mui/icons-material';

// FIX: Reverting to import.meta.env for Vite projects as requested by the user.
// Using VITE_API_URL if available, otherwise defaulting to '/api'.
const API_URL = import.meta.env.VITE_API_URL || '/api'; 

const parseVideoTimestamp = (timestamp) => {
  if (!timestamp) return new Date();

  // Case 1: Real Firestore Timestamp (has toDate method)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Case 2: Firestore format with _seconds + _nanoseconds (from JSON)
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000));
  }

  // Case 3: Regular timestamp object with seconds
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }

  // Case 4: ISO string or anything else
  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

// HUMAN READABLE FORMAT (e.g. "2h ago", "3d ago", "17 Nov 2025")
const formatDate = (timestamp) => {
  const date = parseVideoTimestamp(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
};
// 🆕 Video Loading Skeleton Component with Progress
const VideoLoadingSkeleton = ({ status, progress }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(45deg, #2d2d2d, #3d3d3d)',
      padding: 2,
      color: 'white'
    }}>
      <CircularProgress 
        size={40} 
        thickness={4}
        sx={{ 
          color: theme.palette.primary.main,
          mb: 2 
        }} 
      />
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
        {status === 'generating' ? 'Generating Video' : 
         status === 'processing' ? 'Processing' :
         status === 'in_progress' ? 'In Progress' :
         status === 'in_queue' ? 'In Queue' : 'Loading'}
      </Typography>
      
      {/* Progress bar with percentage */}
      <Box sx={{ width: '80%', mb: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={progress || 0}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(135deg, #FF4757 0%, #FF7B54 100%)',
              borderRadius: 3,
            }
          }}
        />
      </Box>
      
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        {progress || 0}% Complete
      </Typography>
    </Box>
  );
};

// 🆕 Collapsible Prompt Component
const CollapsiblePrompt = ({ prompt, maxLines = 2 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useTheme();
  
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          mb: 1,
          height: isExpanded ? 'auto' : '36px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'none' : maxLines,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.2,
          color: theme.palette.text.primary,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {prompt}
      </Typography>
      
      {/* Show expand/collapse hint on mobile for long prompts */}
      {prompt && prompt.length > 80 && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.primary.main,
            cursor: 'pointer',
            fontWeight: 600,
            display: { xs: 'block', md: 'none' }
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Typography>
      )}
    </Box>
  );
};

// 🆕 Native HTML5 Video Player Component for the Dialog
const DialogVideoPlayer = ({ url, isReady }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && isReady) {
            // Attempt to play only when the modal is fully open (isReady is true)
            videoRef.current.play().catch(error => {
                // Safari often throws an AbortError if user interaction is needed, which is expected.
                if (error.name !== "AbortError") {
                    // Suppressing console error logs as requested, only outputting a general failure if not an AbortError
                    // console.error("Video playback attempt failed:", error); 
                }
            });
        }
    }, [isReady, url]);

    return (
        <video
            ref={videoRef}
            src={url}
            controls
            playsInline // CRUCIAL for iOS Safari to play within the browser context
            autoPlay // Best effort attempt to start playback
            muted={false} // Allow sound (user interaction may still be required by browser policy)
            width="100%"
            height="100%"
            style={{ objectFit: 'cover', display: 'block' }}
        />
    );
};

const Dashboard = ({ user }) => {
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [isDialogPlayerReady, setIsDialogPlayerReady] = useState(false); 
  const theme = useTheme();

  // 🆕 Polling state
  const [pollingInterval, setPollingInterval] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // New color scheme based on the KedeSh logo description
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

  // 🆕 Function to check for video updates
  const checkForVideoUpdates = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/api/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const rawHistory = response.data.history || [];
      const sortedHistory = rawHistory.sort((a, b) => {
        const getTime = (item) => {
          if (!item || !item.timestamp) return 0;
          if (item.timestamp.toDate) {
            return item.timestamp.toDate().getTime();
          }
          return new Date(item.timestamp).getTime();
        };
        return getTime(b) - getTime(a);
      });

      // Check if there are any changes in video status or new videos
      const currentVideoIds = history.map(video => video.id);
      const newVideoIds = sortedHistory.map(video => video.id);
      
      // If videos changed, update the state
      if (JSON.stringify(currentVideoIds) !== JSON.stringify(newVideoIds)) {
        setHistory(sortedHistory);
        setLastUpdate(Date.now());
      } else {
        // Check individual video status changes
        const hasStatusChange = sortedHistory.some((newVideo, index) => {
          const currentVideo = history[index];
          return currentVideo && 
                 (newVideo.status !== currentVideo.status || 
                  newVideo.url !== currentVideo.url);
        });
        
        if (hasStatusChange) {
          setHistory(sortedHistory);
          setLastUpdate(Date.now());
        }
      }

      // Update credits if changed
      if (response.data.credits !== credits) {
        setCredits(response.data.credits);
      }

    } catch (err) {
      // Suppress error logs for polling
      console.debug('Polling update failed:', err.message);
    }
  };

  // 🆕 Start polling for video updates
  const startPolling = () => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start new polling interval (every 10 seconds)
    const interval = setInterval(() => {
      checkForVideoUpdates();
    }, 10000); // 10 seconds

    setPollingInterval(interval);
  };

  // 🆕 Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // 🆕 Check if there are any pending videos that need polling
  const hasPendingVideos = () => {
    return history.some(video => 
      !video.url && 
      (video.status === 'processing' || 
       video.status === 'generating' || 
       video.status === 'in_progress' || 
       video.status === 'in_queue' ||
       video.status === 'pending')
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Simple check to ensure API_URL is present before continuing
        if (!API_URL) {
            setError("Configuration error: API service URL is missing.");
            setLoading(false);
            return;
        }

        const token = await user.getIdToken();
        const response = await axios.get(`${API_URL}/api/user/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        setCredits(response.data.credits);

        const rawHistory = response.data.history || [];
        const sortedHistory = rawHistory.sort((a, b) => {
          const getTime = (item) => {
            if (!item || !item.timestamp) return 0;
            if (item.timestamp.toDate) {
              return item.timestamp.toDate().getTime();
            }
            return new Date(item.timestamp).getTime();
          };
          return getTime(b) - getTime(a);
        });

        setHistory(sortedHistory);
      } catch (err) {
        // Intentionally suppressing console error logs here as per user request
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // 🆕 Start/stop polling based on video status
  useEffect(() => {
    if (hasPendingVideos()) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [history, user]);

  // 🆕 Effect to restart polling when user comes back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasPendingVideos()) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [history, user]);

const handleDeleteVideo = async (videoId, e) => {
  e?.stopPropagation(); 
  if (!user) return;

  try {
    const token = await user.getIdToken();

    // ✅ Correct endpoint (singular, matches backend)
    await axios.delete(`${API_URL}/api/video/${videoId}`, { 
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    });

    console.log('Video deleted successfully!');

    // ✅ Update local state immediately
    setHistory(history.filter((video) => video.id !== videoId));

    // ✅ Close dialog if current video was deleted
    if (selectedVideo?.id === videoId) {
      closeVideoDialog();
    }
  } catch (err) {
    // ✅ Corrected error message
    setError(
      `Failed to delete video (Error: ${err.response?.status || 'N/A'} - ${err.message}). Please ensure your backend DELETE route is defined at '/api/video/:id'.`
    );
  }
};

  const openVideoDialog = (video) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
    // Reset state when opening
    setIsDialogPlayerReady(false); 
  };

  const closeVideoDialog = () => {
    setVideoDialogOpen(false);
    setSelectedVideo(null);
    // Reset state when closing
    setIsDialogPlayerReady(false); 
  };

  const handleDownload = async (url, filename, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Failed to download video. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle sx={{ color: colorScheme.coolPrimary }} />;
      case 'processing':
      case 'generating':
      case 'in_progress':
      case 'in_queue':
        return <CircularProgress size={20} sx={{ color: colorScheme.warmPrimary }} />;
      case 'pending':
        return <Schedule sx={{ color: colorScheme.warmSecondary }} />;
      case 'failed':
      case 'expired':
        return <ErrorOutline sx={{ color: colorScheme.warmPrimary }} />;
      default:
        return <PlayArrow sx={{ color: colorScheme.coolPrimary }} />;
    }
  };

  const statusGradients = {
    completed: colorScheme.coolGradient,
    processing: colorScheme.warmGradient,
    pending: `linear-gradient(45deg, ${colorScheme.warmSecondary}, #FFA726)`,
    failed: `linear-gradient(45deg, ${colorScheme.warmPrimary}, #D32F2F)`,
    default: colorScheme.vibrantGradient,
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { background: statusGradients.completed, color: 'white' };
      case 'processing':
      case 'generating':
      case 'in_progress':
      case 'in_queue':
        return { background: statusGradients.processing, color: 'white' };
      case 'pending':
        return { background: statusGradients.pending, color: 'white' };
      case 'failed':
      case 'expired':
        return { background: statusGradients.failed, color: 'white' };
      default:
        return { background: statusGradients.default, color: 'white' };
    }
  };

  const glassmorphismStyle = {
    background: `rgba(40, 40, 40, 0.6)`,
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
    borderRadius: 3,
  };

  const gradientCardStyle = {
    background: colorScheme.warmGradient,
    color: 'white',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${colorScheme.warmSecondary} 0%, ${colorScheme.warmPrimary} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 28px ${alpha(colorScheme.warmPrimary, 0.4)}`,
    },
  };

  const coolGradientCardStyle = {
    background: colorScheme.coolGradient,
    color: 'white',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${colorScheme.coolSecondary} 0%, ${colorScheme.coolPrimary} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 28px ${alpha(colorScheme.coolPrimary, 0.4)}`,
    },
  };

  const vibrantGradientCardStyle = {
    background: colorScheme.vibrantGradient,
    color: 'white',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${colorScheme.vibrantSecondary} 0%, ${colorScheme.vibrantPrimary} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 28px ${alpha(colorScheme.vibrantPrimary, 0.4)}`,
    },
  };

  const videoCardStyle = {
    ...glassmorphismStyle,
    borderRadius: 3,
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    cursor: 'pointer',
    width: '300px',
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 32px rgba(0,0,0,0.4)`,
      border: `1px solid ${alpha(colorScheme.coolPrimary, 0.3)}`,
    },
  };

  const pulsingAnimation = {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 0.9 },
      '50%': { transform: 'scale(1.05)', opacity: 0.7 },
      '100%': { transform: 'scale(1)', opacity: 0.9 },
    },
    animation: 'pulse 2s infinite ease-in-out',
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: colorScheme.darkBackground,
        position: 'fixed',
        top: 0,
        left: 0,
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: colorScheme.warmGradient,
              animation: 'spin 1.5s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              mb: 2,
            }}
          />
          <Typography variant="h6" color="white">
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        width: '100vw',
        minHeight: '100vh',
        background: colorScheme.darkBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            ...glassmorphismStyle,
            maxWidth: '400px',
            color: colorScheme.textPrimary,
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100vw',
      minHeight: '100vh',
      background: colorScheme.darkBackground,
      py: 6,
      px: { xs: 2, sm: 3, md: 4 },
      color: colorScheme.textPrimary,
    }}>
      {/* 🆕 Auto-update indicator */}
      {hasPendingVideos() && (
        <Box sx={{ 
          textAlign: 'center', 
          mb: 2,
          animation: 'fadeInOut 2s infinite',
          '@keyframes fadeInOut': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 },
          }
        }}>
          <Chip
            icon={<CircularProgress size={16} sx={{ color: 'white' }} />}
            label="Auto-updating videos..."
            size="small"
            sx={{
              background: colorScheme.warmGradient,
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>
      )}

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: colorScheme.warmGradient,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: { xs: '2rem', sm: '2.5rem' },
          }}
        >
          KedeSh AI Studio
        </Typography>
        <Typography
          variant="body1"
          sx={{ 
            opacity: 0.8,
            color: colorScheme.textSecondary 
          }}
        >
          Your creative hub for AI-generated videos
        </Typography>
      </Box>
      <Grid container spacing={2} sx={{ mb: 4, maxWidth: '1200px', mx: 'auto' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              ...gradientCardStyle,
              height: '120px',
            }}
          >
            <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet sx={{ fontSize: 36, mr: 1.5, opacity: 0.9 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Available Credits
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {credits !== null ? credits : '0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              ...coolGradientCardStyle,
              height: '120px',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VideoLibrary
                  sx={{
                    fontSize: 36,
                    mr: 1.5,
                    opacity: 0.9,
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Videos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {history.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              ...vibrantGradientCardStyle,
              height: '120px',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle
                  sx={{
                    fontSize: 36,
                    mr: 1.5,
                    opacity: 0.9,
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {history.filter(video => video.status?.toLowerCase() === 'completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Container maxWidth="lg">
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            ...glassmorphismStyle,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideoLibrary
                sx={{
                  mr: 1.5,
                  background: colorScheme.coolGradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: 24,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Video Gallery
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasPendingVideos() && (
                <CircularProgress size={20} sx={{ color: colorScheme.warmPrimary }} />
              )}
              <Chip
                label="Sorted by: Newest First"
                size="small"
                sx={{
                  background: colorScheme.coolGradient,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <VideoLibrary
                sx={{
                  fontSize: 48,
                  color: colorScheme.textSecondary,
                  mb: 2,
                  opacity: 0.6,
                }}
              />
              <Typography variant="h6" sx={{ color: colorScheme.textSecondary }} gutterBottom>
                No videos generated yet
              </Typography>
              <Typography variant="body2" sx={{ color: colorScheme.textSecondary, mb: 2, opacity: 0.7 }}>
                Start creating amazing videos with AI!
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: colorScheme.warmGradient,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(colorScheme.warmPrimary, 0.4)}`,
                    background: `linear-gradient(135deg, ${colorScheme.warmSecondary} 0%, ${colorScheme.warmPrimary} 100%)`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <AutoAwesome sx={{ mr: 1 }} />
                Create Your First Video
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} justifyContent="center">
              {history.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <Card
                    sx={videoCardStyle}
                    onClick={() => video.url && openVideoDialog(video)}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '180px',
                        background: video.url ? `linear-gradient(45deg, #1a1a1a, #2d2d2d)` : `linear-gradient(45deg, #2d2d2d, #3d3d3d)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {video.url ? (
                        // Native <video> element for completed videos
                        <video
                            src={video.url}
                            controls
                            playsInline // Essential for iOS Safari
                            muted // Start muted so playback is less restricted
                            width="100%"
                            height="100%"
                            style={{ objectFit: 'cover' }}
                        >
                            Your browser does not support the video tag.
                        </video>
                      ) : (
                        // 🆕 Use the new loading skeleton with progress
                        <VideoLoadingSkeleton 
                          status={video.status} 
                          progress={video.progress || 
                            (video.status === 'completed' ? 100 : 
                             video.status === 'processing' ? 50 : 
                             video.status === 'generating' ? 30 : 10)}
                        />
                      )}
                      
                      {video.url && (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(0,0,0,0.6)',
                              borderRadius: '50%',
                              width: 48,
                              height: 48,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: alpha(colorScheme.coolPrimary, 0.7),
                                transform: 'translate(-50%, -50%) scale(1.1)',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideoDialog(video);
                            }}
                          >
                            <Fullscreen sx={{ color: 'white', fontSize: 22 }} />
                          </Box>
                        </Box>
                      )}
                      <Chip
                        label={video.status}
                        size="small"
                        sx={{
                          ...getStatusColor(video.status),
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 600,
                          backdropFilter: 'blur(8px)',
                          fontSize: '0.65rem',
                          ...(video.status === 'processing' && pulsingAnimation),
                        }}
                      />
                    </Box>
                    <CardContent
                      sx={{
                        p: 1.5,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '140px',
                      }}
                    >
                      {/* 🆕 Replace the old prompt with collapsible version */}
                      <CollapsiblePrompt prompt={video.prompt} maxLines={2} />
                      
                      {(video.status === 'pending' ||
                        video.status === 'generating' ||
                        video.status === 'in_progress' ||
                        video.status === 'in_queue') && (
                        <LinearProgress
                          sx={{
                            height: 3,
                            borderRadius: 2,
                            mb: 1,
                            background: alpha(colorScheme.warmPrimary, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: statusGradients.processing,
                              borderRadius: 2,
                            },
                          }}
                        />
                      )}
                      <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {video.url && (
                            <>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openVideoDialog(video);
                                }}
                                sx={{
                                  background: colorScheme.coolGradient,
                                  color: 'white',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    boxShadow: `0 4px 12px ${alpha(colorScheme.coolPrimary, 0.3)}`,
                                  },
                                }}
                              >
                                <Fullscreen fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDownload(video.url, `video-${video.id}.mp4`, e)}
                                sx={{
                                  background: alpha(colorScheme.coolPrimary, 0.1),
                                  color: colorScheme.coolPrimary,
                                  '&:hover': {
                                    background: alpha(colorScheme.coolPrimary, 0.2),
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteVideo(video.id, e)}
                            sx={{
                              background: alpha(colorScheme.warmPrimary, 0.1),
                              color: colorScheme.warmPrimary,
                              '&:hover': {
                                background: alpha(colorScheme.warmPrimary, 0.2),
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                        {video.timestamp && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              opacity: 0.7,
                              fontSize: '0.65rem',
                              color: colorScheme.textSecondary,
                            }}
                          >
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.8 }}>
  <AccessTime fontSize="small" />
  {formatDate(video.timestamp)}
</Typography>
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
      <Dialog
        open={videoDialogOpen}
        onClose={closeVideoDialog}
        maxWidth="lg"
        fullWidth
        // Auto-play Fix: Use TransitionProps to set play state AFTER the dialog opens
        TransitionProps={{
          onEntered: () => setIsDialogPlayerReady(true),
        }}
        sx={{
          '& .MuiDialog-paper': {
            background: colorScheme.darkBackground,
            borderRadius: 3,
            ...glassmorphismStyle,
            animation: 'fadeIn 0.4s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'scale(0.95)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          },
        }}
      >
        <DialogTitle 
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${alpha('#fff', 0.1)}`,
            pb: 1.5,
            color: colorScheme.textPrimary,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedVideo?.prompt}
          </Typography>
          <IconButton onClick={closeVideoDialog} sx={{ color: colorScheme.textPrimary }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          overflow: 'hidden',
        }}>
          {selectedVideo?.url && (
            // Using the native component, optimized for iOS/Safari
            <DialogVideoPlayer url={selectedVideo.url} isReady={isDialogPlayerReady} />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => handleDownload(selectedVideo?.url, `video-${selectedVideo?.id}.mp4`, e)}
            startIcon={<Download />}
            sx={{
              background: colorScheme.coolGradient,
              color: 'white',
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: `linear-gradient(135deg, ${colorScheme.coolSecondary} 0%, ${colorScheme.coolPrimary} 100%)`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            Download
          </Button>
          <Button
            onClick={(e) => handleDeleteVideo(selectedVideo?.id, e)}
            startIcon={<Delete />}
            sx={{
              background: alpha(colorScheme.warmPrimary, 0.1),
              color: colorScheme.warmPrimary,
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: alpha(colorScheme.warmPrimary, 0.2),
                transform: 'translateY(-1px)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;