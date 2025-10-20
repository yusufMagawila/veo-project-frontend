// src/components/NavBar.jsx
import React, { useState, useEffect } from 'react'; // ⭐ Added useEffect for Firestore listener
import { Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore'; // ⭐ Added Firestore imports
import { db } from '../firebaseConfig'; // ⭐ Import the Firestore DB instance
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
  Tooltip, // ⭐ Added Tooltip for credits
  CircularProgress
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  Dashboard,
  VideoSettings,
  CreditCard,
  Menu as MenuIcon,
  People // ⭐ Added People icon for Referrals
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
  const [credits, setCredits] = useState(null); // ⭐ State to hold real-time credits (null initially)
  const location = useLocation();

  // ⭐ EFFECT TO FETCH REAL-TIME USER DATA (CREDITS)
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      
      // Set up a real-time listener
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Set the credit state. This will be 70 for new users!
          setCredits(userData.credits || 0); 
        } else {
          // If the user doc doesn't exist yet (e.g., just signed up), default to 0
          setCredits(0);
        }
      }, (error) => {
        console.error("Error fetching user data in NavBar:", error);
        setCredits(0);
      });

      // Cleanup function to detach the listener when the component unmounts
      return () => unsubscribe();
    } else {
      setCredits(null); // Reset when user logs out
    }
  }, [user]); // Re-run effect when the user object changes

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

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Navigation items for authenticated users
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard sx={{ mr: 1 }} /> },
    { path: '/generate', label: 'Generator', icon: <VideoSettings sx={{ mr: 1 }} /> },
    { path: '/pay', label: 'Buy Credits', icon: <CreditCard sx={{ mr: 1 }} /> },
    // ⭐ ADDED NEW REFERRAL ROUTE
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
            {/* ⭐ Mobile Credit Display */}
            <MenuItem sx={{ pointerEvents: 'none' }}>
                <CreditCard sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Credits: {credits !== null ? credits : <CircularProgress size={15} sx={{ ml: 1 }} />}
                </Typography>
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

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Info & Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* ⭐ DESKTOP CREDIT CHIP DISPLAY */}
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

            {/* Desktop User Menu */}
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

          {/* User Menu Dropdown */}
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