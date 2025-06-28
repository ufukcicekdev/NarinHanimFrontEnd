"use client";
import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Modal,
  Paper,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone,
  Circle,
  CheckCircle,
  Assignment,
  LocalShipping,
  Close as CloseIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { useRouter } from 'next/navigation';
import API_URL from '../../config/api';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: number;
    title: string;
    message: string;
    notification_type: string;
    medicine_name?: string;
    patient_name?: string;
    production_order_id?: number;
    created_at: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    medicine_name?: string;
    patient_name?: string;
    production_order_id?: number;
    created_at: string;
  }) => {
    setSelectedNotification(notification);
    setModalOpen(true);
    markAsRead(notification.id);
    handleClose();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNotification(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleNavigateFromModal = () => {
    if (selectedNotification?.notification_type === 'package_request' || 
        selectedNotification?.notification_type === 'production_request' || 
        selectedNotification?.notification_type === 'cargo_request') {
      router.push('/logistic');
    } else if (selectedNotification?.notification_type === 'status_update' || selectedNotification?.notification_type === 'production_complete') {
      router.push('/patients');
    }
    handleCloseModal();
  };

  const handleDirectAction = async () => {
    if (!selectedNotification?.production_order_id) return;

    try {
      const token = localStorage.getItem('access_token');
      
      if (selectedNotification.notification_type === 'package_request') {
        // Paket hazırlamaya başla
        await fetch(`${API_URL}/api/production-orders/${selectedNotification.production_order_id}/update_status/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'package_preparing' }),
        });
        showSnackbar('✅ Paket hazırlamaya başlandı!', 'success');
        
      } else if (selectedNotification.notification_type === 'production_request') {
        // Üretime gönder
        await fetch(`${API_URL}/api/production-orders/${selectedNotification.production_order_id}/update_status/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'production_preparing' }),
        });
        showSnackbar('✅ Üretime gönderildi!', 'success');
        
      } else if (selectedNotification.notification_type === 'cargo_request') {
        // PDF indir
        const response = await fetch(`${API_URL}/api/production-orders/${selectedNotification.production_order_id}/download_pdf/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `kargo-${selectedNotification.medicine_name}-${selectedNotification.patient_name}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Kargo hazırlamaya başla
          await fetch(`${API_URL}/api/production-orders/${selectedNotification.production_order_id}/update_status/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cargo_preparing' }),
          });
          showSnackbar('✅ PDF indirildi ve kargo hazırlamaya başlandı!', 'success');
        }
      }
      
      handleCloseModal();
      
    } catch (error) {
      console.error('Aksiyon hatası:', error);
      showSnackbar('❌ İşlem sırasında hata oluştu', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'package_request':
        return <Assignment color="primary" />;
      case 'production_request':
        return <Assignment color="secondary" />;
      case 'cargo_request':
        return <LocalShipping color="primary" />;
      case 'status_update':
        return <LocalShipping color="warning" />;
      case 'production_complete':
        return <CheckCircle color="success" />;
      default:
        return <Circle color="info" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="600">
              Bildirimler
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => {
                  markAllAsRead();
                  handleClose();
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Tümünü Okundu İşaretle
              </Button>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unreadCount} okunmamış bildirim
            </Typography>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Henüz bildirim yok
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      backgroundColor: notification.is_read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.12)',
                    },
                    py: 2
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.notification_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        component="div"
                        sx={{ 
                          fontSize: '0.875rem',
                          fontWeight: notification.is_read ? 400 : 600,
                          mb: 0.5
                        }}
                      >
                        {notification.title}
                      </Box>
                    }
                    secondary={
                      <Box component="div">
                        <Box
                          component="div"
                          sx={{ 
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                            mb: 0.5 
                          }}
                        >
                          {notification.message}
                        </Box>
                        <Box
                          component="div"
                          sx={{ 
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        >
                          {formatTime(notification.created_at)}
                        </Box>
                      </Box>
                    }
                  />
                  {!notification.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        ml: 1
                      }}
                    />
                  )}
                </ListItemButton>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>

      {/* Bildirim Detay Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="notification-detail-title"
        sx={{
          zIndex: 1300,
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1301,
          outline: 'none'
        }}>
          <Paper elevation={8} sx={{ borderRadius: 3 }}>
            {/* Header */}
            <Box sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              borderRadius: '12px 12px 0 0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedNotification && getNotificationIcon(selectedNotification.notification_type)}
                <Typography variant="h6" fontWeight="600">
                  Bildirim Detayı
                </Typography>
              </Box>
              <IconButton 
                onClick={handleCloseModal}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content */}
            {selectedNotification && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {selectedNotification.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedNotification.message}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={selectedNotification.notification_type === 'package_request' ? 'Paket Hazırlama Talebi' :
                             selectedNotification.notification_type === 'production_request' ? 'Üretim Talebi' :
                             selectedNotification.notification_type === 'cargo_request' ? 'Kargo Hazırlama Talebi' :
                             selectedNotification.notification_type === 'status_update' ? 'Durum Güncellendi' :
                             selectedNotification.notification_type === 'production_complete' ? 'İşlem Tamamlandı' : 'Bildirim'}
                      color={selectedNotification.notification_type === 'package_request' ? 'primary' :
                             selectedNotification.notification_type === 'production_request' ? 'secondary' :
                             selectedNotification.notification_type === 'cargo_request' ? 'info' :
                             selectedNotification.notification_type === 'status_update' ? 'warning' : 'success'}
                      size="small"
                    />
                    <Chip 
                      label={formatTime(selectedNotification.created_at)}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {selectedNotification.medicine_name && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        💊 İlaç Bilgisi
                      </Typography>
                      <Typography variant="body2">
                        <strong>İlaç:</strong> {selectedNotification.medicine_name}
                      </Typography>
                      {selectedNotification.patient_name && (
                        <Typography variant="body2">
                          <strong>Hasta:</strong> {selectedNotification.patient_name}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCloseModal}
                  >
                    Kapat
                  </Button>
                  
                  {/* Direkt Aksiyon Butonu */}
                  {selectedNotification.production_order_id && (
                    <Button
                      variant="contained"
                      color={selectedNotification.notification_type === 'package_request' ? 'primary' :
                             selectedNotification.notification_type === 'production_request' ? 'secondary' : 'info'}
                      onClick={handleDirectAction}
                      sx={{ mr: 1 }}
                    >
                      {selectedNotification.notification_type === 'package_request' ? '📦 Hazırlamaya Başla' :
                       selectedNotification.notification_type === 'production_request' ? '🏭 Üretime Gönder' :
                       selectedNotification.notification_type === 'cargo_request' ? '🚚 PDF İndir & Hazırla' : 'İşlem Yap'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<LaunchIcon />}
                    onClick={handleNavigateFromModal}
                  >
                    Dashboard&apos;a Git
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationBell; 