import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Swal from 'sweetalert2';

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
  const [referrerData, setReferrerData] = useState({ commission_balance: 0.0, commission_transactions: [] });
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isMounted = useRef(true);

  const userReferralCode = user ? user.uid : 'NO_UID';
  const referralLink = `${window.location.origin}/auth?ref=${userReferralCode}`;

  const formatTZS = (amount) => {
    if (typeof amount === 'number' || (typeof amount === 'string' && !isNaN(parseFloat(amount)))) {
      return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return '0.00';
  };

  const formatDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    return 'N/A';
  };

  useEffect(() => {
    console.log("[ReferralPage DEBUG] useEffect triggered. User:", user?.uid, "DB available:", !!db);

    if (!user || !db) {
      if (!user) console.warn("[ReferralPage DEBUG] Missing user object.");
      if (!db) console.error("[ReferralPage DEBUG] Firebase DB missing.");
      setLoading(false);
      return;
    }

    let unsubscribeListener = null;
    isMounted.current = true;

    const fetchAllData = async () => {
      console.log(`[ReferralPage DEBUG] Starting fetchAllData for UID: ${user.uid}`);

      // A) Fetch referred users
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
            status: (data.commission_transactions && data.commission_transactions.length > 0)
              ? 'Made a Purchase'
              : 'Signed Up',
          };
        });

        if (isMounted.current) {
          setReferredUsers(referredList);
          console.log(`[ReferralPage DEBUG] Found ${referredList.length} referred users.`);
        }
      } catch (error) {
        console.error("[ReferralPage DEBUG] Error fetching referred users:", error);
      }

      // B) Real-time referrer data listener
      const userRef = doc(db, 'users', user.uid);
      let initialSnapshotReceived = false;

      console.log(`[ReferralPage DEBUG] Setting up listener for users/${user.uid}`);
      unsubscribeListener = onSnapshot(userRef, (docSnap) => {
        if (!isMounted.current) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          setReferrerData(data);
          console.log(`[ReferralPage DEBUG] Snapshot received. Balance: ${data.commission_balance}`);
        } else {
          console.warn(`[ReferralPage DEBUG] User doc missing for ${user.uid}`);
          setReferrerData({ commission_balance: 0.0, commission_transactions: [] });
        }

        if (!initialSnapshotReceived) {
          initialSnapshotReceived = true;
          if (isMounted.current) {
            setLoading(false);
            console.log("[ReferralPage DEBUG] Loading cleared (snapshot received).");
          }
        }
      }, (error) => {
        console.error("[ReferralPage DEBUG] Snapshot listener error:", error);
        if (!initialSnapshotReceived && isMounted.current) {
          setLoading(false);
          console.log("[ReferralPage DEBUG] Loading cleared due to listener error.");
        }
      });
    };

    // Execute async fetch
    (async () => {
      await fetchAllData();
    })();

    // Cleanup
    return () => {
      console.log("[ReferralPage DEBUG] Cleanup triggered: Unsubscribing listener.");
      isMounted.current = false;
      if (typeof unsubscribeListener === 'function') {
        unsubscribeListener();
      }
    };
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Referral link copied to clipboard!',
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

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

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.dark', mb: 4 }}>
        <PeopleAlt sx={{ fontSize: 40, mr: 1, verticalAlign: 'middle' }} /> Refer & Earn Commission
      </Typography>

      {/* Commission Balance Card */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4, bgcolor: '#e8f5e9' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoney color="success" sx={{ mr: 1 }} /> Commission Balance
        </Typography>
        <Typography variant="h4" color="success.dark" sx={{ fontWeight: 800, mb: 2 }}>
          TZS {formatTZS(referrerData.commission_balance)}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You earn <strong>10%</strong> of every payment made by users you refer, credited instantly to your balance.
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
            Your referral code: <code style={{ fontWeight: 'bold' }}>{userReferralCode}</code>
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Your Unique Referral Link"
          value={referralLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip title="Copy to clipboard">
                <Button
                  onClick={handleCopy}
                  variant="contained"
                  color="primary"
                  startIcon={<ContentCopy />}
                  size="small"
                >
                  Copy
                </Button>
              </Tooltip>
            ),
          }}
          sx={{
            '& .MuiInputBase-root': { pr: 1, bgcolor: '#f5f5f5' },
          }}
        />
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          <strong>New Users:</strong> Sign up through this link to instantly receive <strong>70 Free Credits</strong>!
        </Alert>
      </Paper>

      {/* Transaction History */}
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
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount (TZS)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.payerId?.substring(0, 10)}...</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                      + TZS {formatTZS(tx.amount)}
                    </TableCell>
                    <TableCell>{tx.orderId?.substring(0, 8)}...</TableCell>
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

      {/* Referred Users */}
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
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
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
