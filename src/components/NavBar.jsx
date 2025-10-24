// src/components/NavBar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebaseConfig'; 
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Divider,
  useScrollTrigger,
  Slide,
  Tooltip,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  Dashboard,
  VideoSettings,
  CreditCard,
  Menu as MenuIcon,
  People,
  SupportAgent
} from '@mui/icons-material';

// Hide AppBar on scroll
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// KedeSh Color Scheme
const colorScheme = {
  // Warm Red/Orange Gradient
  warmPrimary: '#FF4757',
  warmSecondary: '#FF7B54',
  warmGradient: 'linear-gradient(135deg, #FF4757 0%, #FF7B54 100%)',
  
  // Cool Green/Teal Gradient
  coolPrimary: '#00D2A8',
  coolSecondary: '#009688',
  coolGradient: 'linear-gradient(135deg, #00D2A8 0%, #009688 100%)',
  
  // Vibrant Magenta/Violet Gradient
  vibrantPrimary: '#9C27B0',
  vibrantSecondary: '#673AB7',
  vibrantGradient: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
};

const NavBar = ({ user, handleLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [credits, setCredits] = useState(null); 
  const location = useLocation();

  // EFFECT TO FETCH REAL-TIME USER DATA (CREDITS)
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setCredits(userData.credits || 0); 
        } else {
          setCredits(0);
        }
      }, (error) => {
        console.error("Error fetching user data in NavBar:", error);
        setCredits(0);
      });

      return () => unsubscribe();
    } else {
      setCredits(null); 
    }
  }, [user]); 

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };
  
  // ⭐ PATCHED HANDLER TO OPEN WHATSAPP CHAT WITH NULL CHECK
  const handleWhatsAppSupport = () => {
    handleClose(); 
    
    const phoneNumber = '+255659823172'; 
    let prefilledMessage = "Hello, I need support for my kedeshlabs account.";
    
    if (user && user.email) {
        prefilledMessage = `Hello, I need support for my kedeshlabs account. My user ID is: ${user.email}.`;
    } else {
        console.warn("User data incomplete when attempting to open WhatsApp support.");
    }
    
    const encodedMessage = encodeURIComponent(prefilledMessage);
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappLink, '_blank');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Navigation items for authenticated users
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard sx={{ mr: 1 }} /> },
    { path: '/generate', label: 'Generator', icon: <VideoSettings sx={{ mr: 1 }} /> },
    { path: '/pay', label: 'Buy Credits', icon: <CreditCard sx={{ mr: 1 }} /> },
    { path: '/referral', label: 'Referrals', icon: <People sx={{ mr: 1 }} /> }, 
  ];

  // Clean white background style
  const whiteBackgroundStyle = {
    background: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  };

  // Active tab styles with impressive colors
  const activeTabStyle = {
    background: colorScheme.coolGradient,
    color: 'white',
    boxShadow: `0 4px 16px ${alpha(colorScheme.coolPrimary, 0.3)}`,
    transform: 'translateY(-1px)',
    '&:hover': {
      background: `linear-gradient(135deg, ${colorScheme.coolSecondary} 0%, ${colorScheme.coolPrimary} 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 20px ${alpha(colorScheme.coolPrimary, 0.4)}`,
    },
  };

  // Inactive tab style
  const inactiveTabStyle = {
    background: 'transparent',
    color: '#666666',
    border: '1px solid #e0e0e0',
    '&:hover': {
      background: alpha(colorScheme.coolPrimary, 0.08),
      color: colorScheme.coolPrimary,
      borderColor: colorScheme.coolPrimary,
      transform: 'translateY(-1px)',
    },
  };

  // Support button style
  const supportButtonStyle = {
    background: colorScheme.warmGradient,
    color: 'white',
    '&:hover': {
      background: `linear-gradient(135deg, ${colorScheme.warmSecondary} 0%, ${colorScheme.warmPrimary} 100%)`,
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 16px ${alpha(colorScheme.warmPrimary, 0.3)}`,
    },
  };

  // Credits chip style
  const creditsChipStyle = {
    background: colorScheme.vibrantGradient,
    color: 'white',
    fontWeight: 700,
    boxShadow: `0 2px 8px ${alpha(colorScheme.vibrantPrimary, 0.3)}`,
  };

  if (!user) {
    return (
      <HideOnScroll>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={whiteBackgroundStyle}
        >
          <Toolbar>
            {/* Logo/Brand */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                textDecoration: 'none',
                background: colorScheme.warmGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="img"
                src="/kedesh logo.png"
                alt="kedeshlabs"
                sx={{ width: 32, height: 32 }}
              />
              KedeSh Labs
            </Typography>

            {/* Auth Button */}
            <Button
              component={Link}
              to="/auth"
              variant="contained"
              sx={{
                ...supportButtonStyle,
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Login / Sign Up
            </Button>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
    );
  }

  return (
    <HideOnScroll>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={whiteBackgroundStyle}
      >
        <Toolbar>
          {/* Logo/Brand */}
          <Typography
            variant="h6"
            component={Link}
            to="/dashboard"
            sx={{
              mr: 4,
              fontWeight: 700,
              textDecoration: 'none',
              background: colorScheme.warmGradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              component="img"
              src="/kedesh logo.png"
              alt=""
              sx={{ width: 32, height: 32 }}
            />
            KedeSh Labs
          </Typography>

          {/* Mobile Menu Button */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenu}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: '#666666'
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Menu */}
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleClose}
            sx={{ display: { md: 'none' } }}
            PaperProps={{
              sx: {
                background: '#ffffff',
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e0e0e0'
              }
            }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={handleClose}
                sx={{
                  color: isActiveRoute(item.path) ? colorScheme.coolPrimary : '#666666',
                  bgcolor: isActiveRoute(item.path) ? alpha(colorScheme.coolPrimary, 0.1) : 'transparent',
                  fontWeight: isActiveRoute(item.path) ? 600 : 400,
                  '&:hover': {
                    bgcolor: alpha(colorScheme.coolPrimary, 0.08),
                  }
                }}
              >
                {item.icon}
                {item.label}
              </MenuItem>
            ))}
            <Divider sx={{ borderColor: '#e0e0e0' }} />
            {/* Mobile Credit Display */}
            <MenuItem sx={{ pointerEvents: 'none', opacity: 0.8 }}>
              <CreditCard sx={{ mr: 1, color: colorScheme.vibrantPrimary }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666666' }}>
                Credits: {credits !== null ? credits : <CircularProgress size={15} sx={{ ml: 1 }} />}
              </Typography>
            </MenuItem>
            {/* MOBILE WHATSAPP SUPPORT ITEM */}
            <MenuItem onClick={handleWhatsAppSupport}>
                <SupportAgent sx={{ mr: 1, color: colorScheme.warmPrimary }} />
                <Typography sx={{ color: '#666666' }}>
                  Contact Support
                </Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#e0e0e0' }} />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1, color: '#666666' }} />
              <Typography sx={{ color: '#666666' }}>
                Logout
              </Typography>
            </MenuItem>
          </Menu>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={React.cloneElement(item.icon, { sx: { mr: 0 } })}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  transition: 'all 0.3s ease',
                  ...(isActiveRoute(item.path) ? activeTabStyle : inactiveTabStyle)
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          
          {/* PROMINENT WHATSAPP SUPPORT BUTTON FOR DESKTOP */}
          <Button
            onClick={handleWhatsAppSupport}
            startIcon={<SupportAgent />}
            variant="contained"
            sx={{
                ...supportButtonStyle,
                mx: 1, 
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                display: { xs: 'none', md: 'flex' } 
            }}
          >
            Support Chat
          </Button>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Info & Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* DESKTOP CREDIT CHIP DISPLAY */}
            <Tooltip title="Your remaining video generation credits">
              <Chip
                icon={credits !== null ? <CreditCard /> : <CircularProgress size={16} />}
                label={credits !== null ? `${credits} Credits` : 'Loading...'}
                variant="filled"
                sx={{ 
                    ...creditsChipStyle,
                    cursor: 'default',
                    display: { xs: 'none', sm: 'flex' },
                }}
              />
            </Tooltip>

            {/* User Info - Hidden on mobile */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Chip
                avatar={
                  <Avatar sx={{ 
                    bgcolor: colorScheme.coolGradient,
                    fontWeight: 600,
                    color: 'white'
                  }}>
                    {user.email[0].toUpperCase()}
                  </Avatar>
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#666666' }}>
                    {user.email.split('@')[0]}
                  </Typography>
                }
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#e0e0e0',
                  color: '#666666'
                }}
              />
            </Box>

            {/* Desktop User Menu Button */}
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                border: '1px solid #e0e0e0',
                color: '#666666',
                '&:hover': {
                  bgcolor: alpha(colorScheme.coolPrimary, 0.08),
                  borderColor: colorScheme.coolPrimary,
                  color: colorScheme.coolPrimary,
                }
              }}
            >
              <AccountCircle />
            </IconButton>

            {/* Mobile Logout Button */}
            <Button
              onClick={handleLogout}
              startIcon={<ExitToApp />}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                textTransform: 'none',
                minWidth: 'auto',
                color: '#666666',
                '&:hover': {
                  bgcolor: alpha(colorScheme.warmPrimary, 0.08),
                  color: colorScheme.warmPrimary,
                }
              }}
            >
              Logout
            </Button>
          </Box>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                background: '#ffffff',
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e0e0e0'
              }
            }}
          >
            <MenuItem sx={{ pointerEvents: 'none', opacity: 0.7 }}>
              <Typography variant="body2" sx={{ color: '#999999' }}>
                Signed in as
              </Typography>
            </MenuItem>
            <MenuItem sx={{ pointerEvents: 'none' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333333' }}>
                {user.email}
              </Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#e0e0e0' }} />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1.5, color: '#666666' }} />
              <Typography sx={{ color: '#666666' }}>
                Logout
              </Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default NavBar;