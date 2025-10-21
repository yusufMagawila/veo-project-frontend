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
} from '@mui/icons-material';

// FIX: Reverting to import.meta.env for Vite projects as requested by the user.
// Using VITE_API_URL if available, otherwise defaulting to '/api'.
const API_URL = import.meta.env.VITE_API_URL || '/api'; 

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
        return <CheckCircle color="success" />;
      case 'processing':
      case 'generating':
      case 'in_progress':
      case 'in_queue':
        return <CircularProgress size={20} />;
      case 'pending':
        return <Schedule color="warning" />;
      case 'failed':
      case 'expired':
        return <ErrorOutline color="error" />;
      default:
        return <PlayArrow color="primary" />;
    }
  };

  const statusGradients = {
    completed: 'linear-gradient(45deg, #4caf50, #8bc34a)',
    processing: 'linear-gradient(45deg, #667eea, #764ba2)',
    pending: 'linear-gradient(45deg, #ffa726, #ff6b6b)',
    failed: 'linear-gradient(45deg, #d32f2f, #b71c1c)',
    default: 'linear-gradient(45deg, #667eea, #764ba2)',
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
    background: alpha(theme.palette.background.paper, 0.3),
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 4px 24px ${alpha('#000', 0.15)}`,
    borderRadius: 3,
  };

  const gradientCardStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.5)',
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
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
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
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
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
              background: gradientCardStyle.background,
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
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
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
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
      py: 6,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: gradientCardStyle.background,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: { xs: '2rem', sm: '2.5rem' },
          }}
        >
          AI Video Studio
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ opacity: 0.8 }}
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
              ...glassmorphismStyle,
              height: '120px',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VideoLibrary
                  sx={{
                    fontSize: 36,
                    mr: 1.5,
                    background: statusGradients.default,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                />
                <Box>
                  <Typography color="text.secondary" variant="body2">
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
              ...glassmorphismStyle,
              height: '120px',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle
                  sx={{
                    fontSize: 36,
                    mr: 1.5,
                    background: statusGradients.completed,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                />
                <Box>
                  <Typography color="text.secondary" variant="body2">
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
                  background: statusGradients.default,
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
            <Chip
              label="Sorted by: Newest First"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <VideoLibrary
                sx={{
                  fontSize: 48,
                  color: 'text.secondary',
                  mb: 2,
                  opacity: 0.6,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No videos generated yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, opacity: 0.7 }}>
                Start creating amazing videos with AI!
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: gradientCardStyle.background,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    background: gradientCardStyle['&:hover'].background,
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
                        // Native <video> element
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
                        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                          {getStatusIcon(video.status)}
                          <Typography variant="caption" sx={{ mt: 1 }}>
                            {video.status}
                          </Typography>
                        </Box>
                      )}
                      {!video.url ? null : (
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
                                background: 'rgba(102, 126, 234, 0.7)',
                                transform: 'translate(-50%, -50%) scale(1.1)',
                              },
                            }}
                            // The primary action is now opening the modal on the card click
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          height: '36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2,
                        }}
                      >
                        {video.prompt}
                      </Typography>
                      {(video.status === 'pending' ||
                        video.status === 'generating' ||
                        video.status === 'in_progress' ||
                        video.status === 'in_queue') && (
                        <LinearProgress
                          sx={{
                            height: 3,
                            borderRadius: 2,
                            mb: 1,
                            background: alpha(theme.palette.primary.main, 0.1),
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
                                  background: gradientCardStyle.background,
                                  color: 'white',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                  },
                                }}
                              >
                                <Fullscreen fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDownload(video.url, `video-${video.id}.mp4`, e)}
                                sx={{
                                  background: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                  '&:hover': {
                                    background: alpha(theme.palette.primary.main, 0.2),
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
                              background: alpha(theme.palette.error.main, 0.1),
                              color: 'error.main',
                              '&:hover': {
                                background: alpha(theme.palette.error.main, 0.2),
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
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              opacity: 0.7,
                              fontSize: '0.65rem',
                            }}
                          >
                            {new Date(video.timestamp.toDate ? video.timestamp.toDate() : video.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
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
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedVideo?.prompt}
          </Typography>
          <IconButton onClick={closeVideoDialog} sx={{ color: 'white' }}>
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
              background: gradientCardStyle.background,
              color: 'white',
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: gradientCardStyle['&:hover'].background,
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
              background: alpha(theme.palette.error.main, 0.1),
              color: 'error.main',
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: alpha(theme.palette.error.main, 0.2),
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
