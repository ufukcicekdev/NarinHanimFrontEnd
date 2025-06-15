"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Stack,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Chip
} from "@mui/material";
import {
  LocalHospital as HospitalIcon,
  Login as LoginIcon,
  People as PeopleIcon,
  Visibility as EyeIcon,
  NaturePeople as NatureIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#42a5f5',
    },
    success: {
      main: '#2e7d32',
    },
  },
});

export default function HomePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoggedIn(!!token);
  }, []);

  const handleLoginClick = () => {
    console.log("Login butonuna tıklandı");
    router.push("/login");
  };

  const handlePatientsClick = () => {
    console.log("Hastalar butonuna tıklandı");
    router.push("/patients");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Navigation */}
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <HospitalIcon sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
              <Typography variant="h5" fontWeight="700" color="primary.main">
                Narin Hanım
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {loggedIn && (
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={handlePatientsClick}
                  sx={{ borderRadius: 2 }}
                >
                  Hastalar
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={handleLoginClick}
                sx={{ borderRadius: 2 }}
              >
                Giriş Yap
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip 
              label="🌿 Bitkisel Sağlık Yönetimi" 
              color="success" 
              sx={{ mb: 3, fontSize: '0.9rem', py: 2 }} 
            />
            <Typography 
              variant="h2" 
              fontWeight="800" 
              color="text.primary" 
              gutterBottom
              sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              Narin Hanım Hasta Takip Sistemi
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 6, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}
            >
              Hastalarınızı, ziyaretlerinizi, bitkisel tedavileri ve iris görsellerini 
              kolayca ve güvenle yönetin. Modern teknoloji ile geleneksel şifa buluşuyor.
            </Typography>
            
            {/* Action Buttons */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3} 
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                onClick={handleLoginClick}
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  }
                }}
              >
                Sisteme Giriş Yap
              </Button>
              {loggedIn && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PeopleIcon />}
                  onClick={handlePatientsClick}
                  sx={{
                    py: 2,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    }
                  }}
                >
                  Hastalara Git
                </Button>
              )}
            </Stack>
          </Box>

          {/* Features */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight="700" textAlign="center" mb={6} color="text.primary">
              Özellikler
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4
              }}
            >
              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Hasta Yönetimi
                  </Typography>
                  <Typography color="text.secondary">
                    Hasta bilgilerini güvenle saklayın, ziyaret geçmişlerini takip edin
                  </Typography>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <NatureIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Bitkisel Tedavi
                  </Typography>
                  <Typography color="text.secondary">
                    Bitkisel tedavi reçetelerini kaydedin ve takip edin
                  </Typography>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <EyeIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    İris Analizi
                  </Typography>
                  <Typography color="text.secondary">
                    İris görsellerini yükleyin ve analiz sonuçlarını saklayın
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Security Section */}
          <Card 
            elevation={0} 
            sx={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: 4,
              p: 6,
              textAlign: 'center'
            }}
          >
            <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h5" fontWeight="700" gutterBottom color="text.primary">
              Güvenli ve Gizli
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
              Tüm hasta bilgileri şifrelenerek saklanır. KVKK uyumlu sistem ile 
              hasta mahremiyeti en üst düzeyde korunur.
            </Typography>
          </Card>
        </Container>

        {/* Footer */}
        <Box sx={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', py: 4 }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" textAlign="center">
              © {new Date().getFullYear()} Narin Hanım Hasta Takip Sistemi. Tüm hakları saklıdır.
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
