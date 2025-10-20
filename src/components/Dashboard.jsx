import React, { useState, useEffect } from 'react';
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
  DialogTitle
} from '@mui/material';
import {
  PlayCircleOutline,
  CheckCircle,
  Schedule,
  ErrorOutline,
  AccountBalanceWallet,
  VideoLibrary,
  Download,
  AutoAwesome,
  Close,
  Fullscreen,
  PlayArrow
} from '@mui/icons-material';

// Define your backend URL (must match the port in backend/.env)
const API_URL = import.meta.env.VITE_API_URL;


const Dashboard = ({ user }) => {
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const token = await user.getIdToken();
        const response = await axios.get(`${API_URL}/api/user/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setCredits(response.data.credits);

        const rawHistory = response.data.history || [];
        
        // Sort by timestamp (newest first)
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
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleVideoPlay = (video) => {
    setPlayingVideo(video.id);
  };

  const handleVideoPause = () => {
    setPlayingVideo(null);
  };

  const openVideoDialog = (video) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
  };

  const closeVideoDialog = () => {
    setVideoDialogOpen(false);
    setSelectedVideo(null);
    setPlayingVideo(null);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
      case 'generating':
      case 'in_progress':
        return <CircularProgress size={20} />;
      case 'pending':
      case 'in_queue':
        return <Schedule color="warning" />;
      case 'failed':
      case 'expired':
        return <ErrorOutline color="error" />;
      default:
        return <PlayCircleOutline color="primary" />;
    }
  };

  const statusGradients = {
    completed: 'linear-gradient(45deg, #4caf50, #8bc34a)',
    processing: 'linear-gradient(45deg, #667eea, #764ba2)',
    pending: 'linear-gradient(45deg, #ffa726, #ff6b6b)',
    failed: 'linear-gradient(45deg, #d32f2f, #b71c1c)',
    default: 'linear-gradient(45deg, #667eea, #764ba2)'
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { background: statusGradients.completed, color: 'white' };
      case 'processing':
      case 'generating':
      case 'in_progress':
        return { background: statusGradients.processing, color: 'white' };
      case 'pending':
      case 'in_queue':
        return { background: statusGradients.pending, color: 'white' };
      case 'failed':
      case 'expired':
        return { background: statusGradients.failed, color: 'white' };
      default:
        return { background: statusGradients.default, color: 'white' };
    }
  };

  // Glassmorphism style with inner shadow
  const glassmorphismStyle = {
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `inset 0 0 10px ${alpha(theme.palette.divider, 0.1)}`,
  };

  // Gradient card style with hover animation
  const gradientCardStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.5s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 100%)',
      pointerEvents: 'none',
    }
  };

  // Video card style with fixed dimensions
  const videoCardStyle = {
    ...glassmorphismStyle,
    borderRadius: 2,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '320px',
    width: '100%',
    maxWidth: '300px', // Ensure consistent width
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
    }
  };

  // Pulsing animation for processing status
  const pulsingAnimation = {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.1)', opacity: 0.8 },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
    animation: 'pulse 1.5s infinite ease-in-out',
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
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
        justifyContent: 'center'
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            ...glassmorphismStyle,
            maxWidth: '400px'
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
      py: 4,
      px: { xs: 2, sm: 4, md: 6 }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
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
          AI Video Studio
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            opacity: 0.8
          }}
        >
          Transform your ideas into stunning videos with AI
        </Typography>
      </Box>

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              ...gradientCardStyle,
              height: '140px'
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                <Box>
                  <Typography variant="body2" component="div" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Available Credits
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                    {credits !== null ? credits : '0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              ...glassmorphismStyle,
              height: '140px',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VideoLibrary 
                  color="primary" 
                  sx={{ 
                    fontSize: 40, 
                    mr: 2,
                    background: statusGradients.default,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }} 
                />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Videos
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {history.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              ...glassmorphismStyle,
              height: '140px',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle 
                  sx={{ 
                    fontSize: 40, 
                    mr: 2,
                    background: statusGradients.completed,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }} 
                />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {history.filter(video => video.status?.toLowerCase() === 'completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              ...glassmorphismStyle,
              height: '140px',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoAwesome 
                  sx={{ 
                    fontSize: 40, 
                    mr: 2,
                    background: statusGradients.processing,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }} 
                />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {history.filter(video => 
                      ['processing', 'generating', 'in_progress', 'pending', 'in_queue'].includes(video.status?.toLowerCase())
                    ).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Video Gallery Section */}
      <Container maxWidth="xl">
        <Box 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            ...glassmorphismStyle,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideoLibrary 
                sx={{ 
                  mr: 2, 
                  background: statusGradients.default,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: 28
                }} 
              />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                Video Gallery
              </Typography>
            </Box>
            <Chip 
              label={`Sorted by: Newest First`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <VideoLibrary 
                sx={{ 
                  fontSize: 64, 
                  color: 'text.secondary', 
                  mb: 2,
                  opacity: 0.5
                }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No videos generated yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
                Start creating amazing videos with AI!
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                sx={{
                  background: statusGradients.default,
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    background: 'linear-gradient(135deg, #764ba2, #667eea)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <AutoAwesome sx={{ mr: 1 }} />
                Create Your First Video
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {history.map((video) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={video.id}>
                  <Card 
                    sx={videoCardStyle}
                    onClick={() => video.url && openVideoDialog(video)}
                  >
                    {/* Video Thumbnail/Player */}
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
                        flexShrink: 0
                      }}
                    >
                      {video.url ? (
                        <>
                          <video
                            src={video.url}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: playingVideo === video.id ? 'block' : 'none'
                            }}
                            onPlay={() => handleVideoPlay(video)}
                            onPause={handleVideoPause}
                            controls={playingVideo === video.id}
                          />
                          {playingVideo !== video.id && (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  background: 'rgba(0,0,0,0.7)',
                                  borderRadius: '50%',
                                  width: 50,
                                  height: 50,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    background: 'rgba(102, 126, 234, 0.8)',
                                    transform: 'translate(-50%, -50%) scale(1.1)'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVideoPlay(video);
                                }}
                              >
                                <PlayArrow sx={{ color: 'white', fontSize: 24 }} />
                              </Box>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                          {getStatusIcon(video.status)}
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {video.status}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Status Badge */}
                      <Chip
                        label={video.status}
                        size="small"
                        sx={{
                          ...getStatusColor(video.status),
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 600,
                          backdropFilter: 'blur(10px)',
                          fontSize: '0.7rem',
                          ...(video.status === 'processing' && pulsingAnimation),
                        }}
                      />
                    </Box>

                    {/* Card Content */}
                    <CardContent sx={{ 
                      p: 2, 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      height: '140px'
                    }}>
                      {/* Prompt Text */}
                      <Typography 
                        variant="body2" 
                        component="div"
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          height: '40px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2
                        }}
                      >
                        {video.prompt}
                      </Typography>

                      {/* Progress bar for pending/generating */}
                      {(video.status === 'pending' || video.status === 'generating' || video.status === 'in_progress' || video.status === 'in_queue') && (
                        <LinearProgress 
                          sx={{ 
                            height: 4, 
                            borderRadius: 2, 
                            mb: 1,
                            background: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: statusGradients.processing,
                              borderRadius: 2
                            }
                          }} 
                        />
                      )}

                      {/* Action Buttons and Timestamp */}
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
                                  background: statusGradients.default,
                                  color: 'white',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                  }
                                }}
                              >
                                <Fullscreen fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                href={video.url}
                                download={`video-${video.id}.mp4`}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  background: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                  '&:hover': {
                                    background: alpha(theme.palette.primary.main, 0.2),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>

                        {video.timestamp && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              display: 'block',
                              opacity: 0.7,
                              fontSize: '0.7rem'
                            }}
                          >
                            {new Date(video.timestamp.toDate ? video.timestamp.toDate() : video.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
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

      {/* Video Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={closeVideoDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: 2,
            width: '90vw',
            height: '90vh',
            ...glassmorphismStyle,
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'scale(0.95)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 2
        }}>
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
          position: 'relative'
        }}>
          {selectedVideo?.url && (
            <video
              src={selectedVideo.url}
              controls
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard;