import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
// Using window.db as the global Firebase instance provided by the environment.
const db = window.db; 
import {
    Container,
    Typography,
    Paper,
    Box,
    Button,
    CircularProgress,
    Alert,
    Tooltip,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider
} from '@mui/material';
import { Share, AttachMoney, PeopleAlt, ContentCopy, CheckCircle, History } from '@mui/icons-material';

const ReferralPage = ({ user }) => {
    // Initialize commission_balance to 0.0 and commission_transactions as an empty array
    const [referrerData, setReferrerData] = useState({ commission_balance: 0.0, commission_transactions: [] });
    const [referredUsers, setReferredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const location = useLocation();

    const isMounted = useRef(true); // Ref to track if the component is mounted

    // Construct the unique referral link
    const userReferralCode = user ? user.uid : 'NO_UID';
    const referralLink = `${window.location.origin}/auth?ref=${userReferralCode}`;
    
    // Helper function to format TZS amount
    const formatTZS = (amount) => {
        if (typeof amount === 'number' || (typeof amount === 'string' && !isNaN(parseFloat(amount)))) {
            return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        return '0.00';
    };

    // Helper to process Firestore Timestamp
    const formatDate = (timestamp) => {
        if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        return 'N/A';
    };

    // 1. Fetch real-time commission balance, transactions, and referred users
    useEffect(() => {
        console.log("[ReferralPage DEBUG] useEffect triggered. User:", user?.uid, "DB available:", !!db);
        if (!user || !db) {
            if (!user) console.warn("[ReferralPage DEBUG] User object is null/undefined. Cannot proceed with fetching.");
            if (!db) console.error("[ReferralPage DEBUG] Firebase DB instance is not available on window.db.");
            setLoading(false); // Set to false if requirements are missing
            return;
        } 
        
        // --- Core Data Fetching Function ---
        const fetchAllData = async () => {
            console.log(`[ReferralPage DEBUG] Starting fetchAllData for UID: ${user.uid}`);

            // A) Fetch Referred Users List (One-time query)
            try {
                console.log("[ReferralPage DEBUG] Querying referred users...");
                const q = query(collection(db, 'users'), where('referred_by_uid', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                const referredList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        email: data.email || doc.id.substring(0, 10) + '...',
                        createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A',
                        status: (data.commission_transactions && data.commission_transactions.length > 0) ? 'Made a Purchase' : 'Signed Up', 
                    };
                });
                
                if (isMounted.current) {
                    setReferredUsers(referredList);
                    console.log(`[ReferralPage DEBUG] Successfully fetched ${referredList.length} referred users.`);
                }
            } catch (error) {
                console.error("[ReferralPage DEBUG] ERROR fetching referred users (getDocs):", error);
                // If this fails, the app should still load, but with an empty list.
            }
            
            // B) Setup Referrer's Data Listener (Real-time snapshot)
            const userRef = doc(db, 'users', user.uid);
            let initialSnapshotReceived = false;

            console.log(`[ReferralPage DEBUG] Setting up real-time listener on user document: users/${user.uid}`);

            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (!isMounted.current) return;

                if (docSnap.exists()) {
                    setReferrerData(docSnap.data());
                    console.log(`[ReferralPage DEBUG] Snapshot received (EXISTS). Commission Balance: ${docSnap.data().commission_balance}`);
                } else {
                    console.warn(`[ReferralPage DEBUG] Snapshot received (DOES NOT EXIST). Document path: users/${user.uid}`);
                    setReferrerData({ commission_balance: 0.0, commission_transactions: [] });
                }

                // Crucial: Only set loading to false after the very first snapshot is received
                if (!initialSnapshotReceived) {
                    initialSnapshotReceived = true;
                    if (isMounted.current) {
                        setLoading(false);
                        console.log("[ReferralPage DEBUG] SUCCESSFULLY CLEARED LOADING STATE (Initial Snapshot Received).");
                    }
                }
            }, (error) => {
                // This error path is critical for catching permission errors
                console.error("[ReferralPage DEBUG] ERROR in onSnapshot listener:", error);
                if (!initialSnapshotReceived && isMounted.current) {
                    setLoading(false); // Clear loading even on immediate failure
                    console.log("[ReferralPage DEBUG] CLEARED LOADING STATE due to listener ERROR.");
                }
            });

            return unsubscribe; // Return the cleanup function for the snapshot listener
        };

        const cleanupFunction = fetchAllData();

        // Cleanup function for the whole effect
        return () => {
            console.log("[ReferralPage DEBUG] Component cleanup: Detaching listener and marking unmounted.");
            isMounted.current = false; // Mark component as unmounted
            if (typeof cleanupFunction === 'function') {
                cleanupFunction(); // Unsubscribe from the snapshot listener
            }
        };
    }, [user]);

    // Function to handle link copy
    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy'); 
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    };

    // Safely retrieve and reverse-sort transactions (newest first)
    const transactions = Array.isArray(referrerData.commission_transactions)
        ? [...referrerData.commission_transactions].sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
            const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
            return dateB - dateA; 
        })
        : [];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress color="primary" size={60} />
                <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
                    Loading referral program data...
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.disabled' }}>
                    Current User ID: {user?.uid || 'N/A (User not yet authenticated)'}
                </Typography>
            </Box>
        );
    }

    // Main Component Render
    return (
        <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.dark', mb: 4 }}>
                <PeopleAlt sx={{ fontSize: 40, mr: 1, verticalAlign: 'middle' }} /> Refer & Earn Commission
            </Typography>
            
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4, bgcolor: '#e8f5e9' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <AttachMoney color="success" sx={{ mr: 1 }} /> Commission Balance
                </Typography>
                <Typography variant="h4" color="success.dark" sx={{ fontWeight: 800, mb: 2 }}>
                    TZS {formatTZS(referrerData.commission_balance)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    You earn **10%** of the payment made by every user you refer, credited instantly to this balance.
                </Typography>
                <Button 
                    variant="contained" 
                    disabled 
                    sx={{ mt: 2, bgcolor: 'success.dark', '&:hover': { bgcolor: 'success.main' } }}
                >
                    Request Payout (Coming Soon)
                </Button>
            </Paper>

            {/* Referral Link Card */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Share color="primary" sx={{ mr: 1 }} /> Share Your Link
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Your unique referral code is: <code style={{ fontWeight: 'bold' }}>{userReferralCode}</code>
                    </Typography>
                </Box>
                
                <TextField
                    fullWidth
                    label="Your Unique Referral Link"
                    value={referralLink}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
                                <Button 
                                    onClick={handleCopy} 
                                    variant="contained"
                                    color={copySuccess ? "success" : "primary"}
                                    startIcon={copySuccess ? <CheckCircle /> : <ContentCopy />}
                                    size="small"
                                >
                                    {copySuccess ? "Copied!" : "Copy"}
                                </Button>
                            </Tooltip>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            pr: 1, 
                            bgcolor: '#f5f5f5',
                        }
                    }}
                />
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    **New Users:** Sign up through this link to instantly receive **70 Free Credits**!
                </Alert>
            </Paper>

            {/* Commission Transaction History Table */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <History color="secondary" sx={{ mr: 1 }} /> Commission Transaction History ({transactions.length})
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Payer ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount Earned (TZS)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length > 0 ? (
                                transactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{formatDate(tx.date)}</TableCell>
                                        <TableCell>{tx.payerId.substring(0, 10)}...</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                            + TZS {formatTZS(tx.amount)}
                                        </TableCell>
                                        <TableCell>{tx.orderId.substring(0, 8)}...</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No commissions earned yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* Referred Users Table (Kept for tracking sign-ups) */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Referred Users Signed Up ({referredUsers.length})
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Signed Up Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Current Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {referredUsers.length > 0 ? (
                                referredUsers.map((refUser) => (
                                    <TableRow key={refUser.id}>
                                        <TableCell>{refUser.email}</TableCell>
                                        <TableCell>{refUser.createdAt}</TableCell>
                                        <TableCell>
                                            <span style={{ color: refUser.status.includes('Purchase') ? 'green' : 'orange' }}>
                                                {refUser.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No users referred yet. Start sharing your link!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default ReferralPage;
