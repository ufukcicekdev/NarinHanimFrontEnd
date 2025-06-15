"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  LocalHospital as HospitalIcon,
} from "@mui/icons-material";

const drawerWidth = 280;

export default function Sidebar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Client-side media query check
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleAddPatient = () => {
    window.dispatchEvent(new CustomEvent('openAddPatientModal'));
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      text: "Hastalar",
      icon: <PeopleIcon />,
      href: "/patients",
      color: "primary"
    },
    {
      text: "Yeni Hasta Ekle",
      icon: <PersonAddIcon />,
      onClick: handleAddPatient,
      color: "success"
    }
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <HospitalIcon sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" fontWeight="700">
            Narin Hanım
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Hasta Takip Sistemi
        </Typography>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            {item.href ? (
              <Link href={item.href} style={{ width: '100%', textDecoration: 'none' }}>
                <ListItemButton
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: item.color === 'primary' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: item.color === 'primary' ? '#1976d2' : '#2e7d32', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                  />
                </ListItemButton>
              </Link>
            ) : (
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  backgroundColor: item.color === 'success' ? '#2e7d32' : 'transparent',
                  color: item.color === 'success' ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: item.color === 'success' ? '#1b5e20' : 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: item.color === 'success' ? 'white' : '#2e7d32',
                  minWidth: 40 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      {/* Logout Button */}
      <List sx={{ px: 2, py: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <ListItemIcon sx={{ color: '#d32f2f', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Çıkış Yap"
              primaryTypographyProps={{
                fontWeight: 600,
                color: '#d32f2f'
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Narin Hanım
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: 1300 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <HospitalIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div">
              Narin Hanım
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
} 