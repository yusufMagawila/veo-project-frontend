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
  CircularProgress
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
    
    // Replace '0695764537' with your actual WhatsApp phone number (with country code, e.g., 18001234567)
    const phoneNumber = '+255659823172'; 
    let prefilledMessage = "Hello, I need support for my Veo account.";
    
    // ⭐ SAFEGUARD: Check if user and user.email exist before trying to access it
    if (user && user.email) {
        prefilledMessage = `Hello, I need support for my Veo account. My user ID is: ${user.email}.`;
    } else {
        // Log error if user data is unexpectedly missing
        console.warn("User data incomplete when attempting to open WhatsApp support.");
    }
    
    const encodedMessage = encodeURIComponent(prefilledMessage);
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open the link in a new tab
    window.open(whatsappLink, '_blank');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Navigation items for authenticated users (main desktop/mobile buttons)
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard sx={{ mr: 1 }} /> },
    { path: '/generate', label: 'Generator', icon: <VideoSettings sx={{ mr: 1 }} /> },
    { path: '/pay', label: 'Buy Credits', icon: <CreditCard sx={{ mr: 1 }} /> },
    { path: '/referral', label: 'Referrals', icon: <People sx={{ mr: 1 }} /> }, 
  ];

  if (!user) {
    return (
      <HideOnScroll>
        <AppBar 
          position="sticky" 
          elevation={2}
          sx={{ 
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
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
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🎬 Veo Generator
            </Typography>

            {/* Auth Button */}
            <Button
              component={Link}
              to="/auth"
              variant="contained"
              sx={{
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
        elevation={1}
        sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
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
              color: 'primary.main',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1
            }}
          >
            🎬 Veo App
          </Typography>

          {/* Mobile Menu Button */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenu}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Menu */}
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleClose}
            sx={{ display: { md: 'none' } }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                onClick={handleClose}
                selected={isActiveRoute(item.path)}
              >
                {item.icon}
                {item.label}
              </MenuItem>
            ))}
            <Divider />
            {/* Mobile Credit Display */}
            <MenuItem sx={{ pointerEvents: 'none' }}>
              <CreditCard sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Credits: {credits !== null ? credits : <CircularProgress size={15} sx={{ ml: 1 }} />}
              </Typography>
            </MenuItem>
            {/* MOBILE WHATSAPP SUPPORT ITEM */}
            <MenuItem onClick={handleWhatsAppSupport}>
                <SupportAgent sx={{ mr: 1 }} />
                Contact Support (WhatsApp)
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
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
                  bgcolor: isActiveRoute(item.path) ? 'primary.main' : 'transparent',
                  color: isActiveRoute(item.path) ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActiveRoute(item.path) ? 'primary.dark' : 'action.hover',
                  }
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
            variant="outlined" 
            color="success" 
            sx={{
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
                color="primary"
                sx={{ 
                    bgcolor: 'primary.light', 
                    fontWeight: 700, 
                    cursor: 'default',
                    display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Tooltip>

            {/* User Info - Hidden on mobile */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Chip
                avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{user.email[0].toUpperCase()}</Avatar>}
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.email}
                  </Typography>
                }
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Desktop User Menu Button */}
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                border: '1px solid',
                borderColor: 'divider'
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
                minWidth: 'auto'
              }}
            >
              Logout
            </Button>
          </Box>

          {/* User Menu Dropdown (Cleaned up) */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2
              }
            }}
          >
            <MenuItem sx={{ pointerEvents: 'none', opacity: 0.7 }}>
              <Typography variant="body2">
                Signed in as
              </Typography>
            </MenuItem>
            <MenuItem sx={{ pointerEvents: 'none' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default NavBar;