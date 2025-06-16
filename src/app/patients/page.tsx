"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import Loading from "../components/Loading";
import ClientLayout from "../components/ClientLayout";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Stack,
  Paper,
  Alert,
  Divider,
  Container,
  Card,
  CardContent,
  Avatar,
  Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import API_URL from "../../config/api";

interface Patient {
  id: number;
  patient_code: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  phone: string;
  email: string;
  tc_no: string;
  city: string;
  district: string;
  address: string;
  blood_type: string;
  allergies: string;
  notes: string;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 600 },
  maxHeight: '90vh',
  overflow: 'auto',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patient_code: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    gender: "",
    phone: "",
    email: "",
    tc_no: "",
    city: "",
    district: "",
    address: "",
    blood_type: "",
    allergies: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/patients/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Hastalar alınamadı.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPatients(data);
        setFiltered(data);
        setLoading(false);
      } catch {
        setError("Hastalar alınamadı.");
        setLoading(false);
      }
    };
    fetchPatients();
  }, [router]);

  useEffect(() => {
    if (!search) {
      setFiltered(patients);
    } else {
      const searchTerm = search.toLowerCase();
              setFiltered(
          patients.filter((p) => {
            const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
            const patientCode = (p.patient_code || '').toLowerCase();
            const phone = (p.phone || '').toLowerCase();
            const email = (p.email || '').toLowerCase();
            const tcNo = (p.tc_no || '').toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   patientCode.includes(searchTerm) || 
                   phone.includes(searchTerm) ||
                   email.includes(searchTerm) ||
                   tcNo.includes(searchTerm);
          })
        );
    }
  }, [search, patients]);

  useEffect(() => {
    const openModal = () => {
      console.log('Modal açılıyor...'); // Debug için
      setShowModal(true);
    };
    window.addEventListener('openAddPatientModal', openModal);
    return () => window.removeEventListener('openAddPatientModal', openModal);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/patients/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setFormError("Hasta eklenemedi. Lütfen bilgileri kontrol edin.");
        setFormLoading(false);
        return;
      }
      const newPatient = await res.json();
      setPatients([newPatient, ...patients]);
      setFiltered([newPatient, ...filtered]);
      setShowModal(false);
      setForm({
        patient_code: "",
        first_name: "",
        last_name: "",
        birth_date: "",
        gender: "",
        phone: "",
        email: "",
        tc_no: "",
        city: "",
        district: "",
        address: "",
        blood_type: "",
        allergies: "",
        notes: "",
      });
      setFormLoading(false);
    } catch {
      setFormError("Hasta eklenemedi. Sunucu hatası.");
      setFormLoading(false);
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'M': return 'Erkek';
      case 'F': return 'Kadın';
      case 'O': return 'Diğer';
      default: return gender;
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'M': return 'primary';
      case 'F': return 'secondary';
      case 'O': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ClientLayout>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Container>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Beautiful MUI Modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          aria-labelledby="modal-title"
        >
          <Box sx={modalStyle}>
            <Paper elevation={8} sx={{ borderRadius: 3 }}>
              {/* Header */}
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                borderRadius: '12px 12px 0 0',
                color: 'white'
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonAddIcon sx={{ fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="600">
                      Yeni Hasta Ekle
                    </Typography>
                  </Stack>
                  <IconButton 
                    onClick={() => setShowModal(false)}
                    sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Box>

              {/* Form Content */}
              <Box sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleAddPatient}>
                  <Stack spacing={4}>
                    {/* Kişisel Bilgiler */}
                    <Box>
                      <Typography variant="h6" fontWeight="600" color="primary" gutterBottom>
                        👤 Kişisel Bilgiler
                      </Typography>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="Hasta Kodu"
                          name="patient_code"
                          value={form.patient_code}
                          onChange={handleFormChange}
                          variant="outlined"
                          placeholder="Örn: HST-2024-001 (opsiyonel, manuel girilir)"
                          inputProps={{ maxLength: 30 }}
                          helperText="Manuel hasta kodu - 30 karaktere kadar (opsiyonel)"
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="Ad"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleFormChange}
                            required
                            variant="outlined"
                          />
                          <TextField
                            fullWidth
                            label="Soyad"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleFormChange}
                            required
                            variant="outlined"
                          />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="Doğum Tarihi"
                            name="birth_date"
                            type="date"
                            value={form.birth_date}
                            onChange={handleFormChange}
                            required
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                          />
                          <FormControl fullWidth required>
                            <InputLabel>Cinsiyet</InputLabel>
                            <Select
                              value={form.gender}
                              label="Cinsiyet"
                              onChange={(e) => handleSelectChange('gender', e.target.value)}
                            >
                              <MenuItem value="M">👨 Erkek</MenuItem>
                              <MenuItem value="F">👩 Kadın</MenuItem>
                              <MenuItem value="O">⚧ Diğer</MenuItem>
                            </Select>
                          </FormControl>
                        </Stack>

                        <TextField
                          fullWidth
                          label="TC Kimlik No"
                          name="tc_no"
                          value={form.tc_no}
                          onChange={handleFormChange}
                          variant="outlined"
                          placeholder="11 haneli TC kimlik numarası (opsiyonel)"
                          inputProps={{ maxLength: 11 }}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="Telefon"
                            name="phone"
                            value={form.phone}
                            onChange={handleFormChange}
                            variant="outlined"
                            placeholder="0555 123 45 67 (opsiyonel)"
                          />
                          <TextField
                            fullWidth
                            label="E-posta"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleFormChange}
                            variant="outlined"
                            placeholder="ornek@email.com (opsiyonel)"
                          />
                        </Stack>
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Adres Bilgileri */}
                    <Box>
                      <Typography variant="h6" fontWeight="600" color="primary" gutterBottom>
                        🏠 Adres Bilgileri
                      </Typography>
                      <Stack spacing={3}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            label="İl"
                            name="city"
                            value={form.city}
                            onChange={handleFormChange}
                            variant="outlined"
                            placeholder="Örn: İstanbul"
                          />
                          <TextField
                            fullWidth
                            label="İlçe"
                            name="district"
                            value={form.district}
                            onChange={handleFormChange}
                            variant="outlined"
                            placeholder="Örn: Kadıköy"
                          />
                        </Stack>

                        <TextField
                          fullWidth
                          label="Adres"
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                          multiline
                          rows={2}
                          variant="outlined"
                          placeholder="Mahalle, sokak, bina no, daire no"
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Tıbbi Bilgiler */}
                    <Box>
                      <Typography variant="h6" fontWeight="600" color="primary" gutterBottom>
                        🩸 Tıbbi Bilgiler
                      </Typography>
                      <Stack spacing={3}>
                        <FormControl fullWidth>
                          <InputLabel>Kan Grubu</InputLabel>
                          <Select
                            value={form.blood_type}
                            label="Kan Grubu"
                            onChange={(e) => handleSelectChange('blood_type', e.target.value)}
                          >
                            <MenuItem value="">Bilinmiyor</MenuItem>
                            <MenuItem value="A+">🅰️ A Rh+</MenuItem>
                            <MenuItem value="A-">🅰️ A Rh-</MenuItem>
                            <MenuItem value="B+">🅱️ B Rh+</MenuItem>
                            <MenuItem value="B-">🅱️ B Rh-</MenuItem>
                            <MenuItem value="AB+">🆎 AB Rh+</MenuItem>
                            <MenuItem value="AB-">🆎 AB Rh-</MenuItem>
                            <MenuItem value="O+">🅾️ O Rh+</MenuItem>
                            <MenuItem value="O-">🅾️ O Rh-</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label="Alerjiler"
                          name="allergies"
                          value={form.allergies}
                          onChange={handleFormChange}
                          multiline
                          rows={2}
                          variant="outlined"
                          placeholder="Bilinen alerjileri yazın (ilaç, besin, çevre vs.)"
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Notlar */}
                    <Box>
                      <Typography variant="h6" fontWeight="600" color="primary" gutterBottom>
                        📝 Ek Notlar
                      </Typography>
                      <TextField
                        fullWidth
                        label="Notlar"
                        name="notes"
                        value={form.notes}
                        onChange={handleFormChange}
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Hasta hakkında ek notlar (opsiyonel)"
                      />
                    </Box>

                    {/* Error Alert */}
                    {formError && (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {formError}
                      </Alert>
                    )}

                    <Divider />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={formLoading}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                        },
                        '&:disabled': {
                          background: '#ccc',
                        }
                      }}
                    >
                      {formLoading ? "💾 Kaydediliyor..." : "✅ Hastayı Kaydet"}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Modal>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" color="primary" gutterBottom>
            Hastalar
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ mt: 3, maxWidth: 400 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Hasta ara... (ad, kod, telefon, email, TC)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: search && (
                  <IconButton
                    size="small"
                    onClick={() => setSearch('')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'white',
                }
              }}
            />
          </Box>
        </Box>

        {/* Summary Info */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {patients.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Toplam Hasta
              </Typography>
            </Box>
            
            {search && (
              <>
                <Box sx={{ width: { xs: '100%', sm: '1px' }, height: { xs: '1px', sm: '40px' }, bgcolor: 'divider' }} />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {filtered.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Arama Sonucu
                  </Typography>
                </Box>
              </>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                💡 Hasta bulmak için arama yapın
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ad, kod, telefon, email veya TC ile arayabilirsiniz
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Patients Grid */}
        {!search ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Hasta aramak için yukarıdaki arama kutusunu kullanın
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ad, soyad, hasta kodu, telefon, email veya TC kimlik numarası ile arama yapabilirsiniz
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                         <Typography variant="h6" color="text.secondary" gutterBottom>
               &quot;{search}&quot; için sonuç bulunamadı
             </Typography>
            <Typography variant="body2" color="text.secondary">
              Farklı bir arama terimi deneyin
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3
            }}
          >
            {filtered.map((patient) => (
              <Card
                key={patient.id}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  borderRadius: 3,
                }}
                onClick={() => router.push(`/patients/${patient.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Patient Header */}
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 48,
                          height: 48,
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {patient.first_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="600">
                          {patient.first_name} {patient.last_name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            label={getGenderText(patient.gender)}
                            color={getGenderColor(patient.gender) as 'primary' | 'secondary' | 'default'}
                            size="small"
                          />
                          {patient.blood_type && (
                            <Chip
                              label={patient.blood_type}
                              variant="outlined"
                              size="small"
                              color="error"
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider />

                    {/* Patient Details */}
                    <Stack spacing={1}>
                      {patient.patient_code && (
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          <strong>Kod:</strong> {patient.patient_code}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        <strong>Doğum Tarihi:</strong> {patient.birth_date}
                      </Typography>
                      {(patient.phone || patient.email) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>İletişim:</strong> {[patient.phone, patient.email].filter(Boolean).join(' • ')}
                        </Typography>
                      )}
                      {patient.tc_no && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>TC:</strong> {patient.tc_no}
                        </Typography>
                      )}
                      {(patient.city || patient.district) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Adres:</strong> {patient.district && `${patient.district}, `}{patient.city}
                        </Typography>
                      )}
                      {patient.allergies && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          <strong>Alerjiler:</strong> {patient.allergies.length > 30 
                            ? `${patient.allergies.substring(0, 30)}...` 
                            : patient.allergies}
                        </Typography>
                      )}
                      {patient.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          <strong>Not:</strong> {patient.notes.length > 50 
                            ? `${patient.notes.substring(0, 50)}...` 
                            : patient.notes}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </ClientLayout>
  );
} 