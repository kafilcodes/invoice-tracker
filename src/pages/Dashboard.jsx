import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  PendingActions,
  CheckCircle,
  Cancel,
  Paid,
  ReceiptLong,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getDashboardStats, getRecentActivity } from '../redux/slices/invoiceSlice';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, activity, loading } = useSelector((state) => state.invoices);

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getRecentActivity());
  }, [dispatch]);

  // Return appropriate icon for activity action
  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <ReceiptLong color="primary" />;
      case 'assigned':
      case 'reassigned':
        return <PendingActions color="info" />;
      case 'approved':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Cancel color="error" />;
      case 'paid':
        return <Paid color="secondary" />;
      default:
        return <ReceiptLong />;
    }
  };

  // Return appropriate color for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning.main';
      case 'approved':
        return 'success.main';
      case 'rejected':
        return 'error.main';
      case 'paid':
        return 'info.main';
      default:
        return 'grey.500';
    }
  };

  // Format action message
  const formatActionMessage = (action) => {
    switch (action.action) {
      case 'created':
        return 'Created a new invoice';
      case 'assigned':
        return `Assigned to ${action.assignedTo?.name || 'a reviewer'}`;
      case 'reassigned':
        return `Reassigned to ${action.assignedTo?.name || 'a reviewer'}`;
      case 'approved':
        return 'Approved the invoice';
      case 'rejected':
        return `Rejected the invoice${
          action.reason ? ` - Reason: ${action.reason}` : ''
        }`;
      case 'paid':
        return 'Marked as paid';
      default:
        return action.action;
    }
  };

  // Prepare doughnut chart data
  const doughnutData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Paid'],
    datasets: [
      {
        data: stats && stats.counts
          ? [
              stats.counts.pending || 0,
              stats.counts.approved || 0,
              stats.counts.rejected || 0,
              stats.counts.paid || 0,
            ]
          : [0, 0, 0, 0],
        backgroundColor: ['#ff9800', '#4caf50', '#f44336', '#2196f3'],
        borderWidth: 1,
      },
    ],
  };

  // Prepare monthly chart data
  const prepareMonthlyData = () => {
    if (!stats || !stats.monthly || stats.monthly.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Invoice Count',
            data: [],
            backgroundColor: 'rgba(63, 81, 181, 0.6)',
          },
        ],
      };
    }

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const labels = stats.monthly.map(
      (item) => `${months[item.month - 1]} ${item.year}`
    );

    return {
      labels,
      datasets: [
        {
          label: 'Invoice Count',
          data: stats.monthly.map((item) => item.count),
          backgroundColor: 'rgba(63, 81, 181, 0.6)',
        },
      ],
    };
  };

  if (loading || !stats || !stats.counts) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.name}!
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <PendingActions
                sx={{ fontSize: 48, color: 'warning.main', mb: 1 }}
              />
              <Typography variant="h5" component="div">
                {stats.counts.pending || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Pending
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                ${stats.amounts && stats.amounts.pending ? stats.amounts.pending.toLocaleString() : '0'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <CheckCircle
                sx={{ fontSize: 48, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h5" component="div">
                {stats.counts.approved || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Approved
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                ${stats.amounts && stats.amounts.approved ? stats.amounts.approved.toLocaleString() : '0'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Cancel sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.counts.rejected || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Rejected
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Paid sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" component="div">
                {stats.counts.paid || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Paid
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Activity */}
      <Grid container spacing={3}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Invoice Status"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ height: 240, width: 240 }}>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={6} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Monthly Invoices"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 240 }}>
                <Bar
                  data={prepareMonthlyData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Recent Activity"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  component={RouterLink}
                  to="/invoices"
                  size="small"
                  color="primary"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <List sx={{ p: 0 }}>
              {activity && activity.length > 0 ? (
                activity.map((action) => (
                  <React.Fragment key={action._id}>
                    <ListItem
                      alignItems="flex-start"
                      component={RouterLink}
                      to={`/invoices/${action.invoiceId._id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'background.paper' }}>
                          {getActionIcon(action.action)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {action.invoiceId.vendorName} - $
                            {action.invoiceId.amount.toLocaleString()}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              component="span"
                            >
                              {formatActionMessage(action)}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {action.performedBy?.name} • {' '}
                              {format(
                                new Date(action.timestamp),
                                'MMM d, yyyy h:mm a'
                              )}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent activity" />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 