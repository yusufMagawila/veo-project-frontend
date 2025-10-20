import React, { useState } from 'react';
import axios from 'axios';
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
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Fade,
  InputAdornment,
  Radio
} from '@mui/material';
import {
  CreditCard,
  PhoneAndroid,
  CheckCircle,
  LocalAtm,
  Security,
  FlashOn,
  TrendingUp,
  Receipt
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;


// ➡️ UPDATED TO TZS (USING 1 USD = 2500 TZS)
const CREDIT_PACKAGES = {
  'starter': { 
    credits: 1000, 
    amount: 25000,  
    label: 'Starter Pack',
    description: 'Perfect for trying out the platform',
    popular: false,
  },
  'pro': { 
    credits: 2700, 
    amount: 62500,  
    label: 'Pro Pack',
    description: 'Best value for regular creators',
    popular: true,
  },
  'business': { 
    credits: 5500, 
    amount: 125000,  
    label: 'Business Pack',
    description: 'For high-volume AI video generation',
    popular: false,
  },
  'studio': { 
    credits: 11500, 
    amount: 250000,  
    label: 'Studio Pack',
    description: 'Maximum savings for professionals',
    popular: false,
  },
};

const PaymentPage = ({ user }) => {
  const [selectedPackageId, setSelectedPackageId] = useState('starter');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || loading) return;

    const selectedPackage = CREDIT_PACKAGES[selectedPackageId];

    // --- ZenoPay/Backend requires TZS amount in the request body ---
    const email = user.email;
    const name = user.displayName || user.email.split('@')[0] || 'Unknown User'; 

    if (!phoneNumber || !selectedPackage || !email || !name) {
      setStatus("Error: Please select a package, enter a phone number, and ensure your user profile is complete.");
      return;
    }

    setLoading(true);
    setStatus('Initiating payment...');

    try {
      const token = await user.getIdToken();

      // Send the TZS amount to the backend
      const response = await axios.post(`${API_URL}/api/payment/initiate`, 
        { 
          amount: selectedPackage.amount,  // THIS IS THE TZS AMOUNT
          phoneNumber: phoneNumber, 
          credits: selectedPackage.credits,
          email: email, 
          name: name,
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
       
      setStatus(response.data.message + " Check your phone!");
       
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Payment initiation failed.';
      setStatus(`Error: ${errorMessage}`);
      console.error('Payment initiation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = CREDIT_PACKAGES[selectedPackageId];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Side - Payment Form */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
            }}
          >
            <form onSubmit={handleSubmit}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CreditCard sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Purchase Credits
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Buy credits and unlock AI video generation
              </Typography>
            </Box>

            {/* Package Selection */}
            <FormControl component="fieldset" sx={{ width: '100%', mb: 4 }}>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600, fontSize: '1.1rem' }}>
                Select Your Package
              </FormLabel>
              <RadioGroup
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                sx={{ gap: 2 }}
              >
                {Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
                  <Card 
                    key={id}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      border: selectedPackageId === id ? '2px solid' : '1px solid',
                      borderColor: selectedPackageId === id ? 'primary.main' : 'divider',
                      transition: 'all 0.2s ease-in-out',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 1
                      }
                    }}
                  >
                    {pkg.popular && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: 16,
                          bgcolor: 'secondary.main',
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        MOST POPULAR
                      </Box>
                    )}
                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                      <FormControlLabel
                        value={id}
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                              {pkg.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {pkg.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalAtm color="primary" sx={{ fontSize: 20 }} />
                              <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {pkg.credits.toLocaleString()} Credits
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {pkg.amount.toLocaleString()} TZS 
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </FormControl>

            {/* Phone Number Input */}
            <TextField
              fullWidth
              label="Mobile Money Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07XXXXXXXX"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroid color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            {/* Payment Button */}
            <Button
              type="submit"
              disabled={loading || !phoneNumber}
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
              sx={{
                py: 2,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: loading 
                  ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                  : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                '&:hover': {
                  background: loading 
                    ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                    : 'linear-gradient(135deg, #20c997 0%, #28a745 100%)',
                }
              }}
            >
              {loading ? 'Processing Payment...' : `Pay ${selectedPackage.amount.toLocaleString()} TZS`}
            </Button>

            {/* Status Display */}
            <Fade in={!!status}>
              <Box sx={{ mt: 3 }}>
                <Alert 
                  severity={status.startsWith('Error') ? 'error' : 'success'}
                  icon={status.startsWith('Error') ? <Receipt /> : <CheckCircle />}
                >
                  {status}
                </Alert>
              </Box>
            </Fade>

            {/* Security Note */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Security color="action" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Your payment is secure and encrypted. We use industry-standard security measures.
              </Typography>
            </Box>
            </form>
          </Paper>
        </Grid>

        {/* Right Side - Package Benefits */}
        <Grid item xs={12} md={4}>
          {/* Selected Package Summary */}
          <Card elevation={1} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <LocalAtm sx={{ mr: 1 }} />
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Package
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedPackage.label}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Credits
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {selectedPackage.credits.toLocaleString()} Credits
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {selectedPackage.amount.toLocaleString()} TZS
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🚀 What You Get
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ '& > div': { mb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <FlashOn color="primary" sx={{ mr: 1.5, mt: 0.25, fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Instant Access
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Credits added immediately after payment
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <TrendingUp color="primary" sx={{ mr: 1.5, mt: 0.25, fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Better Value
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      More credits per shilling with larger packs
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircle color="primary" sx={{ mr: 1.5, mt: 0.25, fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      No Expiry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use your credits whenever you want
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentPage;