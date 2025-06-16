import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error' | 'info';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Evet",
  cancelText = "İptal",
  onConfirm,
  onCancel,
  severity = 'warning'
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <DeleteIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
      default:
        return <WarningIcon sx={{ fontSize: 48, color: 'info.main' }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1
        }
      }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Typography variant="h5" fontWeight="600" color="text.primary">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', px: 3 }}>
        <DialogContentText 
          id="confirm-dialog-description"
          sx={{ 
            fontSize: '1.1rem',
            color: 'text.primary',
            lineHeight: 1.6
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size="large"
          sx={{ 
            minWidth: 100,
            borderRadius: 2
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          size="large"
          sx={{ 
            minWidth: 100,
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 