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
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Modal,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  LocalShipping,
  Inventory,
  Assessment,
  People,
  Notifications,
  ExitToApp,
  PlayArrow,
  CheckCircle,
  Schedule,
  LocalShippingOutlined,
  GetApp,
  LocalHospital,
  CalendarToday,
  Clear,
  Close,
  Phone,
  Email,
  MoreVert,
  Done,
  Refresh,
} from "@mui/icons-material";
import NotificationBell from '../components/NotificationBell';
import Loading from '../components/Loading';
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
    patients: Array<{
      id: number;
      patient_code: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      gender: string;
      phone: string;
      email: string;
      created_at: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [filteredOrders, setFilteredOrders] = useState<Array<{
    id: number;
    medicine_name: string;
    status: string;
    status_display: string;
    patient_name: string;
    created_at: string;
  }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: number;
    patient_code: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    phone: string;
    email: string;
    created_at: string;
  } | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    id: number;
    medicine_name: string;
    status: string;
    status_display: string;
    patient_name: string;
    created_at: string;
  } | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
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

  // Filtreler değiştiğinde otomatik uygula
  useEffect(() => {
    applyFilters();
  }, [selectedFilter, selectedDate, dashboardData]);

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
        console.log('🔍 Dashboard Data:', data);
        console.log('📊 Stats:', data.stats);
        console.log('👥 Total Patients:', data.stats.total_patients);
        setDashboardData(data);
        setFilteredOrders(data.production_orders);
      } else {
        console.error('Veri çekme hatası');
      }
    } catch (error) {
      console.error('API hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!dashboardData) return;
    
    let filtered = [...dashboardData.production_orders];
    const today = new Date().toISOString().split('T')[0];
    
    // Status filtresi
    if (selectedFilter) {
      switch (selectedFilter) {
        case 'total':
          filtered = dashboardData.production_orders;
          break;
        case 'pending':
          filtered = filtered.filter(order => 
            !['completed', 'delivered'].includes(order.status)
          );
          break;
        case 'completed':
          filtered = filtered.filter(order => 
            ['completed', 'delivered'].includes(order.status)
          );
          break;
        case 'today':
          filtered = filtered.filter(order => 
            order.created_at.startsWith(today)
          );
          break;
      }
    }
    
    // Tarih filtresi
    if (selectedDate) {
      filtered = filtered.filter(order => 
        order.created_at.startsWith(selectedDate)
      );
    }
    
    setFilteredOrders(filtered);
  };

  const handleFilterClick = (filterType: string) => {
    setSelectedFilter(filterType);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const clearAllFilters = () => {
    setSelectedFilter(null);
    setSelectedDate("");
    setFilteredOrders(dashboardData?.production_orders || []);
  };

  const handlePatientClick = (patient: {
    id: number;
    patient_code: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    phone: string;
    email: string;
    created_at: string;
  }) => {
    setSelectedPatient(patient);
    setPatientModalOpen(true);
  };

  const handleClosePatientModal = () => {
    setPatientModalOpen(false);
    setSelectedPatient(null);
  };

  const handleOrderClick = (order: {
    id: number;
    medicine_name: string;
    status: string;
    status_display: string;
    patient_name: string;
    created_at: string;
  }) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Tüm statüler ve Türkçe karşılıkları
  const getAllStatuses = () => [
    { value: 'package_requested', label: '📦 Paket Hazırlama Talebi' },
    { value: 'package_preparing', label: '📦 Paket Hazırlanıyor' },
    { value: 'package_ready', label: '✅ Paket Hazır' },
    { value: 'production_requested', label: '🏭 Üretim Talebi' },
    { value: 'production_preparing', label: '🏭 Üretim Hazırlanıyor' },
    { value: 'production_sent', label: '🚀 Üretime Gönderildi' },
    { value: 'production_completed', label: '✅ Üretim Tamamlandı' },
    { value: 'cargo_requested', label: '🚚 Kargo Hazırlama Talebi' },
    { value: 'cargo_preparing', label: '🚚 Kargo Hazırlanıyor' },
    { value: 'cargo_ready', label: '✅ Kargo Hazır' },
    { value: 'cargo_shipped', label: '🚛 Kargoya Verildi' },
    { value: 'completed', label: '🎉 Tamamlandı' },
    { value: 'delivered', label: '📬 Teslim Edildi' }
  ];

  // Statü menüsü açma
  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  // Statü menüsü kapatma
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  // Statü değiştirme
  const handleStatusChange = async (newStatus: string) => {
    if (selectedOrder) {
      await updateProductionOrderStatus(selectedOrder.id, newStatus);
      setStatusMenuAnchor(null);
      // Modal'ı kapat ve verileri yenile
      setOrderModalOpen(false);
      fetchDashboardData();
    }
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
    if (!dashboardData) {
      console.log('⚠️ dashboardData yok!');
      return [];
    }
    
    const { stats } = dashboardData;
    console.log('📈 getStats çalışıyor, stats:', stats);
    console.log('👥 total_patients değeri:', stats.total_patients);
    
    return [
      { 
        title: "Toplam Hasta", 
        value: stats.total_patients.toString(), 
        icon: People, 
        color: "#2563eb",
        filterType: "total"
      },
      { 
        title: "Bekleyen İşlemler", 
        value: stats.pending_orders.toString(), 
        icon: LocalShipping, 
        color: "#f59e0b",
        filterType: "pending"
      },
      { 
        title: "Tamamlanan", 
        value: stats.completed_orders.toString(), 
        icon: Assessment, 
        color: "#10b981",
        filterType: "completed"
      },
      { 
        title: "Bugünkü İşlemler", 
        value: stats.today_orders.toString(), 
        icon: Inventory, 
        color: "#ef4444",
        filterType: "today"
      },
    ];
  };



  if (loading) {
    return <Loading />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Header */}
        <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <Toolbar>
            <LocalHospital sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Narin Hanım - Lojistik Dashboard
            </Typography>
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
              {username}
            </Typography>
            <NotificationBell />
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 2 }}
            >
              <ExitToApp />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 3 }}>
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
                    cursor: 'pointer',
                    border: selectedFilter === stat.filterType ? '2px solid' : '1px solid transparent',
                    borderColor: selectedFilter === stat.filterType ? stat.color : 'transparent',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                  onClick={() => handleFilterClick(stat.filterType)}
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
              {/* Production Orders - Moved up */}
              <Card elevation={2} sx={{ flex: '2 1 600px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedFilter === 'total' ? (
                        <>
                          <People color="primary" />
                          Tüm Hastalar
                        </>
                      ) : (
                        <>
                          <LocalShipping color="primary" />
                          {selectedFilter === 'pending' ? 'Bekleyen Üretim İşlemleri' :
                           selectedFilter === 'completed' ? 'Tamamlanan Üretim İşlemleri' :
                           selectedFilter === 'today' ? 'Bugünkü Üretim İşlemleri' :
                           'Bugünkü Üretim İşlemleri'}
                        </>
                      )}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Tarih Seçici */}
                      <TextField
                        type="date"
                        size="small"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ minWidth: 180 }}
                      />
                      
                      {/* Filtreleri Temizle */}
                      {(selectedFilter || selectedDate) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Clear />}
                          onClick={clearAllFilters}
                        >
                          Filtreleri Temizle
                        </Button>
                      )}
                    </Box>
                  </Box>
                  
                  {selectedFilter === 'total' ? (
                    // Hasta Listesi
                    dashboardData?.patients && dashboardData.patients.length > 0 ? (
                      <Stack spacing={2} sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto' }}>
                        {dashboardData.patients.slice(0, 8).map((patient) => (
                          <Paper 
                            key={patient.id} 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => handlePatientClick(patient)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                {patient.first_name[0]}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                  👤 {patient.first_name} {patient.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {patient.patient_code && `Kod: ${patient.patient_code} • `}
                                  {patient.phone && `📞 ${patient.phone} • `}
                                  Kayıt: {new Date(patient.created_at).toLocaleDateString('tr-TR')}
                                </Typography>
                              </Box>
                              <Chip 
                                label={patient.gender === 'M' ? 'Erkek' : patient.gender === 'F' ? 'Kadın' : 'Diğer'}
                                size="small"
                                color={patient.gender === 'M' ? 'primary' : 'secondary'}
                              />
                            </Box>
                          </Paper>
                        ))}
                        {dashboardData.patients.length > 8 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                            ve {dashboardData.patients.length - 8} hasta daha...
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          Henüz hasta kaydı yok
                        </Typography>
                      </Box>
                    )
                  ) : (
                    // Üretim İşlemleri Listesi
                    filteredOrders && filteredOrders.length > 0 ? (
                      <Stack spacing={2} sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredOrders.slice(0, 5).map((order) => {
                        const nextStatus = getNextStatus(order.status);
                        const buttonProps = nextStatus ? getStatusButtonProps(order.status) : null;
                        
                        return (
                          <Paper 
                            key={order.id} 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => handleOrderClick(order)}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateProductionOrderStatus(order.id, nextStatus);
                                      }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadPDF(order.id);
                                    }}
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
                      {filteredOrders.length > 5 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                          ve {filteredOrders.length - 5} tane daha...
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <LocalShipping sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {selectedFilter === 'pending' ? 'Bekleyen işlem bulunamadı' :
                         selectedFilter === 'completed' ? 'Tamamlanan işlem bulunamadı' :
                         selectedFilter === 'today' ? 'Bugün hiç işlem yapılmamış' :
                         selectedFilter === 'total' ? 'Hiç işlem bulunamadı' :
                         'Bugün henüz işlem yok'}
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {selectedFilter ? 'Farklı bir filtre deneyin' : 'Yeni işlemler burada görünecek'}
                      </Typography>
                    </Box>
                  )
                )}
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

        {/* Hasta Detay Modal */}
        <Modal
          open={patientModalOpen}
          onClose={handleClosePatientModal}
          aria-labelledby="patient-modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            outline: 'none'
          }}>
            {selectedPatient && (
              <>
                {/* Modal Header */}
                <Box sx={{ 
                  p: 3, 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50, fontSize: '1.2rem' }}>
                      {selectedPatient.first_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </Typography>
                      {selectedPatient.patient_code && (
                        <Typography variant="body2" color="text.secondary">
                          Hasta Kodu: {selectedPatient.patient_code}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <IconButton onClick={handleClosePatientModal} size="small">
                    <Close />
                  </IconButton>
                </Box>

                {/* Modal Content */}
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Temel Bilgiler */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        👤 Temel Bilgiler
                      </Typography>
                                             <Stack spacing={1.5}>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Typography variant="body1" color="text.primary" sx={{ minWidth: 100, fontWeight: 500 }}>
                             Doğum Tarihi:
                           </Typography>
                           <Typography variant="body1" color="text.primary" fontWeight="medium">
                             {new Date(selectedPatient.birth_date).toLocaleDateString('tr-TR')}
                           </Typography>
                         </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Typography variant="body1" color="text.primary" sx={{ minWidth: 100, fontWeight: 500 }}>
                             Cinsiyet:
                           </Typography>
                           <Chip 
                             label={selectedPatient.gender === 'M' ? 'Erkek' : selectedPatient.gender === 'F' ? 'Kadın' : 'Diğer'}
                             size="medium"
                             color={selectedPatient.gender === 'M' ? 'primary' : 'secondary'}
                             sx={{ fontWeight: 'bold' }}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Typography variant="body1" color="text.primary" sx={{ minWidth: 100, fontWeight: 500 }}>
                             Kayıt Tarihi:
                           </Typography>
                           <Typography variant="body1" color="text.primary" fontWeight="medium">
                             {new Date(selectedPatient.created_at).toLocaleDateString('tr-TR')}
                           </Typography>
                         </Box>
                       </Stack>
                    </Box>

                    <Divider />

                    {/* İletişim Bilgileri */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        📞 İletişim Bilgileri
                      </Typography>
                                             <Stack spacing={1.5}>
                         {selectedPatient.phone && (
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Phone fontSize="medium" color="primary" />
                             <Typography variant="body1" color="text.primary" fontWeight="medium">
                               {selectedPatient.phone}
                             </Typography>
                           </Box>
                         )}
                         {selectedPatient.email && (
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Email fontSize="medium" color="primary" />
                             <Typography variant="body1" color="text.primary" fontWeight="medium">
                               {selectedPatient.email}
                             </Typography>
                           </Box>
                         )}
                         {!selectedPatient.phone && !selectedPatient.email && (
                           <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                             İletişim bilgisi bulunmuyor
                           </Typography>
                         )}
                       </Stack>
                    </Box>
                  </Stack>

                                     {/* Modal Footer */}
                   <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Stack direction="row" justifyContent="flex-end">
                       <Button variant="contained" onClick={handleClosePatientModal}>
                         Kapat
                       </Button>
                     </Stack>
                   </Box>
                </Box>
              </>
            )}
                     </Box>
         </Modal>

         {/* Üretim İşlemi Detay Modal */}
         <Modal
           open={orderModalOpen}
           onClose={handleCloseOrderModal}
           aria-labelledby="order-modal-title"
         >
           <Box sx={{
             position: 'absolute',
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
             width: { xs: '90%', sm: 600 },
             bgcolor: 'background.paper',
             borderRadius: 3,
             boxShadow: 24,
             p: 0,
             outline: 'none'
           }}>
             {selectedOrder && (
               <>
                 {/* Modal Header */}
                 <Box sx={{ 
                   p: 3, 
                   borderBottom: '1px solid',
                   borderColor: 'divider',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between'
                 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Avatar sx={{ bgcolor: 'warning.main', width: 50, height: 50 }}>
                       💊
                     </Avatar>
                     <Box>
                       <Typography variant="h6" fontWeight="bold" color="primary">
                         {selectedOrder.medicine_name}
                       </Typography>
                       <Typography variant="body2" color="text.secondary">
                         Üretim Emri #{selectedOrder.id}
                       </Typography>
                     </Box>
                   </Box>
                   <IconButton onClick={handleCloseOrderModal} size="small">
                     <Close />
                   </IconButton>
                 </Box>

                 {/* Modal Content */}
                 <Box sx={{ p: 3 }}>
                   <Stack spacing={3}>
                     {/* Temel Bilgiler */}
                     <Box>
                       <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                         📋 Sipariş Bilgileri
                       </Typography>
                                               <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" color="text.primary" sx={{ minWidth: 120, fontWeight: 500 }}>
                              İlaç Adı:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="text.primary">
                              💊 {selectedOrder.medicine_name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" color="text.primary" sx={{ minWidth: 120, fontWeight: 500 }}>
                              Hasta:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="text.primary">
                              👤 {selectedOrder.patient_name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" color="text.primary" sx={{ minWidth: 120, fontWeight: 500 }}>
                              Sipariş Tarihi:
                            </Typography>
                            <Typography variant="body1" color="text.primary" fontWeight="medium">
                              📅 {new Date(selectedOrder.created_at).toLocaleDateString('tr-TR')} - {new Date(selectedOrder.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" color="text.primary" sx={{ minWidth: 120, fontWeight: 500 }}>
                              Durum:
                            </Typography>
                            <Chip 
                              label={selectedOrder.status_display}
                              size="medium"
                              color={
                                selectedOrder.status.includes('package') ? 'primary' :
                                selectedOrder.status.includes('production') ? 'warning' :
                                selectedOrder.status.includes('cargo') ? 'info' :
                                'success'
                              }
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        </Stack>
                     </Box>

                     <Divider />

                     {/* İşlem Geçmişi */}
                     <Box>
                       <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                         🔄 İşlem Durumu
                       </Typography>
                                               <Box sx={{ pl: 2 }}>
                          <Stack spacing={1.5}>
                            <Typography variant="body1" sx={{ 
                              color: selectedOrder.status.includes('package') || selectedOrder.status === 'completed' ? 'success.main' : 'text.secondary',
                              fontWeight: selectedOrder.status.includes('package') ? 'bold' : 'medium',
                              fontSize: '1rem'
                            }}>
                              📦 Paket Hazırlama {selectedOrder.status.includes('package') ? '(Aktif)' : ''}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: selectedOrder.status.includes('production') || selectedOrder.status === 'completed' ? 'success.main' : 'text.secondary',
                              fontWeight: selectedOrder.status.includes('production') ? 'bold' : 'medium',
                              fontSize: '1rem'
                            }}>
                              🏭 Üretim {selectedOrder.status.includes('production') ? '(Aktif)' : ''}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: selectedOrder.status.includes('cargo') || selectedOrder.status === 'completed' ? 'success.main' : 'text.secondary',
                              fontWeight: selectedOrder.status.includes('cargo') ? 'bold' : 'medium',
                              fontSize: '1rem'
                            }}>
                              🚚 Kargo Hazırlama {selectedOrder.status.includes('cargo') ? '(Aktif)' : ''}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: selectedOrder.status === 'completed' ? 'success.main' : 'text.secondary',
                              fontWeight: selectedOrder.status === 'completed' ? 'bold' : 'medium',
                              fontSize: '1rem'
                            }}>
                              ✅ Tamamlandı {selectedOrder.status === 'completed' ? '(Aktif)' : ''}
                            </Typography>
                          </Stack>
                        </Box>
                     </Box>

                     {/* Action Buttons */}
                     <Box>
                       <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                         ⚡ Hızlı İşlemler
                       </Typography>
                       <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                         {(() => {
                           const nextStatus = getNextStatus(selectedOrder.status);
                           const buttonProps = nextStatus ? getStatusButtonProps(selectedOrder.status) : null;
                           
                           return (
                             <>
                               {buttonProps && nextStatus && (
                                 <Button
                                   variant="contained"
                                   color={buttonProps.color}
                                   startIcon={<buttonProps.icon />}
                                   onClick={() => {
                                     updateProductionOrderStatus(selectedOrder.id, nextStatus);
                                     handleCloseOrderModal();
                                   }}
                                   sx={{ textTransform: 'none' }}
                                 >
                                   {buttonProps.text}
                                 </Button>
                               )}

                               {/* Statü Değiştirme Dropdown */}
                               <Button
                                 variant="outlined"
                                 color="secondary"
                                 startIcon={<MoreVert />}
                                 onClick={handleStatusMenuOpen}
                                 sx={{ textTransform: 'none' }}
                               >
                                 Statü Değiştir
                               </Button>
                               
                               <Button
                                 variant="outlined"
                                 color="info"
                                 startIcon={<GetApp />}
                                 onClick={() => {
                                   downloadPDF(selectedOrder.id);
                                   handleCloseOrderModal();
                                 }}
                                 sx={{ textTransform: 'none' }}
                               >
                                 PDF İndir
                               </Button>
                             </>
                           );
                         })()}
                       </Stack>
                     </Box>

                     {/* Statü Değiştirme Menüsü */}
                     <Menu
                       anchorEl={statusMenuAnchor}
                       open={Boolean(statusMenuAnchor)}
                       onClose={handleStatusMenuClose}
                       PaperProps={{
                         sx: {
                           maxHeight: 400,
                           width: '300px',
                         }
                       }}
                     >
                       {getAllStatuses().map((status) => (
                         <MenuItem
                           key={status.value}
                           onClick={() => handleStatusChange(status.value)}
                           selected={selectedOrder.status === status.value}
                           sx={{
                             py: 1.5,
                             px: 2,
                             '&.Mui-selected': {
                               backgroundColor: 'primary.light',
                               color: 'primary.contrastText',
                               '&:hover': {
                                 backgroundColor: 'primary.main',
                               }
                             }
                           }}
                         >
                           <ListItemIcon sx={{ minWidth: 36 }}>
                             {selectedOrder.status === status.value ? <Done color="primary" /> : <Refresh />}
                           </ListItemIcon>
                           <ListItemText 
                             primary={status.label}
                             primaryTypographyProps={{
                               fontWeight: selectedOrder.status === status.value ? 'bold' : 'normal',
                               fontSize: '0.95rem'
                             }}
                           />
                         </MenuItem>
                       ))}
                     </Menu>
                   </Stack>

                   {/* Modal Footer */}
                   <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Stack direction="row" justifyContent="flex-end">
                       <Button variant="contained" onClick={handleCloseOrderModal}>
                         Kapat
                       </Button>
                     </Stack>
                   </Box>
                 </Box>
               </>
             )}
           </Box>
         </Modal>
       </Box>
     </ThemeProvider>
   );
 } 