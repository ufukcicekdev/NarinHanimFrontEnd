"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Alert,
  Container,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  LocalFlorist,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import API_URL from "../../config/api";

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#10b981',
    },
  },
});

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Kullanıcı adı veya şifre hatalı.");
        return;
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      router.push("/patients");
    } catch {
      setError("Giriş başarısız. Lütfen tekrar deneyin.");
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Card sx={{ border: 'none', boxShadow: 'none' }}>
              <CardContent sx={{ padding: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                                     <Avatar
                     sx={{
                       width: 80,
                       height: 80,
                       backgroundColor: 'primary.main',
                       marginBottom: 2,
                       background: 'linear-gradient(135deg, #2563eb, #10b981)',
                     }}
                   >
                     <LocalFlorist sx={{ fontSize: 40 }} />
                   </Avatar>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      marginBottom: 1,
                    }}
                  >
                    Giriş Yap
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Lütfen giriş bilgilerinizi girin
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Kullanıcı Adı"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{ marginBottom: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Şifre"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{ marginBottom: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ marginBottom: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                      },
                    }}
                  >
                    Giriş Yap
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}