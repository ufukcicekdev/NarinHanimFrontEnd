"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API_URL from "../../config/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Button,
  Paper,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import {
  LocalShipping,
  Inventory,
  Assessment,
  People,
  TrendingUp,
  Notifications,
  Settings,
  ExitToApp,
  PlayArrow,
  CheckCircle,
  Schedule,
  LocalShippingOutlined,
  GetApp,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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

export default function LogisticDashboard() {
  const [username, setUsername] = useState("");
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      total_patients: number;
      total_visits: number;
      this_month_visits: number;
      today_visits: number;
      new_patients_last_month: number;
      total_orders: number;
      pending_orders: number;
      completed_orders: number;
      today_orders: number;
    };
    recent_activities: Array<{
      activity: string;
      time: string;
      type: string;
    }>;
    production_orders: Array<{
      id: number;
      medicine_name: string;
      status: string;
      status_display: string;
      patient_name: string;
      created_at: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userType = localStorage.getItem("user_type");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userType !== "logistic") {
      router.push("/patients");
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Gerçek veri çek
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/logistic-stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Veri çekme hatası');
      }
    } catch (error) {
      console.error('API hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Production order status güncelleme
  const updateProductionOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/production-orders/${orderId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Başarılı olursa dashboard'ı yenile
        fetchDashboardData();
      } else {
        console.error('Status güncelleme hatası');
      }
    } catch (error) {
      console.error('API hatası:', error);
    }
  };

  // Status için sonraki adımı belirle
  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      'package_requested': 'package_preparing',
      'package_preparing': 'package_ready',
      'package_ready': 'production_requested',
      'production_requested': 'production_preparing',
      'production_preparing': 'production_sent',
      'production_sent': 'production_completed',
      'production_completed': 'cargo_requested',
      'cargo_requested': 'cargo_preparing',
      'cargo_preparing': 'cargo_ready',
      'cargo_ready': 'cargo_shipped',
      'cargo_shipped': 'completed',
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  // Status için button text ve icon
  const getStatusButtonProps = (status: string) => {
    const statusProps = {
      'package_requested': { text: 'Hazırlamaya Başla', icon: PlayArrow, color: 'primary' as const },
      'package_preparing': { text: 'Hazırlandı', icon: CheckCircle, color: 'success' as const },
      'package_ready': { text: 'Üretime Gönder', icon: LocalShippingOutlined, color: 'warning' as const },
      'production_requested': { text: 'Hazırlamaya Başla', icon: PlayArrow, color: 'primary' as const },
      'production_preparing': { text: 'Gönderildi', icon: CheckCircle, color: 'success' as const },
      'production_sent': { text: 'Tamamlandı', icon: CheckCircle, color: 'success' as const },
      'production_completed': { text: 'Kargo Hazırla', icon: LocalShipping, color: 'info' as const },
      'cargo_requested': { text: 'Hazırlamaya Başla', icon: PlayArrow, color: 'primary' as const },
      'cargo_preparing': { text: 'Hazırlandı', icon: CheckCircle, color: 'success' as const },
      'cargo_ready': { text: 'Kargoya Ver', icon: LocalShipping, color: 'warning' as const },
      'cargo_shipped': { text: 'Tamamla', icon: CheckCircle, color: 'success' as const },
    };
    
    return statusProps[status as keyof typeof statusProps] || { text: 'İlerle', icon: Schedule, color: 'primary' as const };
  };

  // PDF indirme fonksiyonu
  const downloadPDF = async (orderId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/production-orders/${orderId}/download_pdf/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `uretim_emri_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('PDF indirme hatası');
      }
    } catch (error) {
      console.error('PDF indirme hatası:', error);
    }
  };

  // Gerçek verilerden istatistikler oluştur
  const getStats = () => {
    if (!dashboardData) return [];
    
    const { stats } = dashboardData;
    return [
      { 
        title: "Toplam Hasta", 
        value: stats.total_patients.toString(), 
        icon: People, 
        color: "#2563eb" 
      },
      { 
        title: "Bekleyen İşlemler", 
        value: stats.pending_orders.toString(), 
        icon: LocalShipping, 
        color: "#f59e0b" 
      },
      { 
        title: "Tamamlanan", 
        value: stats.completed_orders.toString(), 
        icon: Assessment, 
        color: "#10b981" 
      },
      { 
        title: "Bugünkü İşlemler", 
        value: stats.today_orders.toString(), 
        icon: Inventory, 
        color: "#ef4444" 
      },
    ];
  };

  const quickActions = [
    { title: "Yeni Hasta", icon: People },
    { title: "Hasta Listesi", icon: Assessment },
    { title: "Raporlar", icon: LocalShipping },
    { title: "Ayarlar", icon: Settings },
  ];

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Typography>Veriler yükleniyor...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Header */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white'
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Lojistik Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Hoş geldiniz, {username}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Çıkış Yap
              </Button>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="xl">
          <Stack spacing={3}>
            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {getStats().map((stat, index) => (
                <Card 
                  key={index}
                  elevation={2}
                  sx={{ 
                    flex: '1 1 250px',
                    minWidth: 250,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color={stat.color}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                        <stat.icon fontSize="large" />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Content Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              {/* Quick Actions */}
              <Card elevation={2} sx={{ flex: '2 1 400px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="primary" />
                    Hızlı İşlemler
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outlined"
                        startIcon={<action.icon />}
                        sx={{ flex: '1 1 200px', py: 2 }}
                      >
                        {action.title}
                      </Button>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card elevation={2} sx={{ flex: '1 1 300px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications color="primary" />
                    Son Aktiviteler
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {dashboardData?.recent_activities?.map((activity, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24,
                            bgcolor: activity.type === 'success' ? '#10b981' : 
                                    activity.type === 'warning' ? '#f59e0b' : '#2563eb'
                          }}
                        >
                          •
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.activity}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Production Orders */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShipping color="primary" />
                  Bekleyen Üretim İşlemleri
                </Typography>
                
                {dashboardData?.production_orders && dashboardData.production_orders.length > 0 ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {dashboardData.production_orders.map((order) => {
                      const nextStatus = getNextStatus(order.status);
                      const buttonProps = nextStatus ? getStatusButtonProps(order.status) : null;
                      
                      return (
                        <Paper 
                          key={order.id} 
                          variant="outlined" 
                          sx={{ p: 2, borderRadius: 2 }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                💊 {order.medicine_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                👤 Hasta: {order.patient_name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip 
                                  label={order.status_display}
                                  size="small"
                                  color={
                                    order.status.includes('package') ? 'primary' :
                                    order.status.includes('production') ? 'warning' :
                                    order.status.includes('cargo') ? 'info' :
                                    'success'
                                  }
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                </Typography>
                              </Box>
                              
                              {/* Action Buttons */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                {buttonProps && nextStatus && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color={buttonProps.color}
                                    startIcon={<buttonProps.icon />}
                                    onClick={() => updateProductionOrderStatus(order.id, nextStatus)}
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      textTransform: 'none'
                                    }}
                                  >
                                    {buttonProps.text}
                                  </Button>
                                )}
                                
                                {/* PDF İndirme Butonu */}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  startIcon={<GetApp />}
                                  onClick={() => downloadPDF(order.id)}
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    textTransform: 'none'
                                  }}
                                >
                                  PDF İndir
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', py: 4 }}>
                    Henüz bekleyen işlem yok
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sistem Durumu
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label="Sunucu: Aktif" color="success" />
                  <Chip label="Veritabanı: Aktif" color="success" />
                  <Chip label="API: Aktif" color="success" />
                  <Chip label="Son Yedekleme: 2 saat önce" color="info" />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
} 