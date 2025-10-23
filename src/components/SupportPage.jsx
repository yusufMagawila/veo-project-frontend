// src/components/SupportPage.jsx
import React from 'react';
import { Container, Typography, Box, Link, Paper } from '@mui/material';

const SupportPage = ({ user }) => {
    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Contact Support 🧑‍🔧
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Hi **{user.email}**, we're here to help! Please use the options below to get assistance.
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Email Support
                    </Typography>
                    <Typography variant="body1">
                        For questions about your account, billing, or technical issues, email us directly:
                    </Typography>
                    <Link 
                        href="mailto:support@veoapp.com?subject=Veo%20Support%20Request" 
                        variant="body1" 
                        display="block" 
                        sx={{ fontWeight: 600, mt: 1 }}
                    >
                        support@veoapp.com
                    </Link>
                </Box>
                <Divider />
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        FAQ / Knowledge Base
                    </Typography>
                    <Typography variant="body1">
                        Find instant answers to common questions by checking our knowledge base.
                    </Typography>
                    <Button 
                        variant="contained" 
                        sx={{ mt: 2 }} 
                        // You would replace this with your actual FAQ link
                        onClick={() => window.open('https://yourwebsite.com/faq', '_blank')}
                    >
                        View FAQ
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default SupportPage;