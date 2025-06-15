"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientLayout from "../../components/ClientLayout";
import Loading from "../../components/Loading";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  Divider,
  Paper,
  Avatar,
  Modal,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from "@mui/material";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Bloodtype as BloodIcon,
  Warning as AllergyIcon,
  Add as AddIcon,
  Visibility as VisitIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import API_URL from "../../../config/api";

interface Visit {
  id: number;
  visit_date: string;
  diagnosis: string;
  notes: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  contact_info: string;
  city: string;
  district: string;
  address: string;
  blood_type: string;
  allergies: string;
  notes: string;
  visits: Visit[];
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  
  // Edit patient states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editContactInfo, setEditContactInfo] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBloodType, setEditBloodType] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchPatient = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/patients/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Hasta bilgileri alınamadı.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPatient(data);
        setLoading(false);
      } catch {
        setError("Hasta bilgileri alınamadı.");
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, router]);

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/visits/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient: id,
          visit_date: visitDate,
          diagnosis,
          notes,
        }),
      });
      if (!res.ok) {
        setError("Ziyaret eklenemedi.");
        setAdding(false);
        return;
      }
      setVisitDate("");
      setDiagnosis("");
      setNotes("");
      // Refresh patient data
      const updated = await fetch(`${API_URL}/api/patients/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatient(await updated.json());
      setAdding(false);
    } catch {
      setError("Ziyaret eklenemedi.");
      setAdding(false);
    }
  };

  const handleEditPatient = () => {
    if (patient) {
      setEditFirstName(patient.first_name);
      setEditLastName(patient.last_name);
      setEditBirthDate(patient.birth_date);
      setEditGender(patient.gender);
      setEditContactInfo(patient.contact_info);
      setEditCity(patient.city || "");
      setEditDistrict(patient.district || "");
      setEditAddress(patient.address || "");
      setEditBloodType(patient.blood_type || "");
      setEditAllergies(patient.allergies || "");
      setEditNotes(patient.notes || "");
      setEditModalOpen(true);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
             const res = await fetch(`${API_URL}/api/patients/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          birth_date: editBirthDate,
          gender: editGender,
          contact_info: editContactInfo,
          city: editCity,
          district: editDistrict,
          address: editAddress,
          blood_type: editBloodType,
          allergies: editAllergies,
          notes: editNotes,
        }),
      });
      if (!res.ok) {
        setError("Hasta bilgileri güncellenemedi.");
        setUpdating(false);
        return;
      }
      const updatedPatient = await res.json();
      setPatient(updatedPatient);
      setEditModalOpen(false);
      setUpdating(false);
    } catch {
      setError("Hasta bilgileri güncellenemedi.");
      setUpdating(false);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ClientLayout>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </ClientLayout>
    );
  }

  if (!patient) return null;

  return (
    <ClientLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Patient Header */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}
              >
                {patient.first_name[0]}
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {patient.first_name} {patient.last_name}
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    label={getGenderText(patient.gender)}
                    color="primary"
                    variant="outlined"
                  />
                  {patient.blood_type && (
                    <Chip
                      label={patient.blood_type}
                      color="error"
                      variant="outlined"
                      icon={<BloodIcon />}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
            <IconButton
              onClick={handleEditPatient}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                width: 56,
                height: 56
              }}
            >
              <EditIcon />
            </IconButton>
          </Stack>

          {/* Patient Info */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Stack spacing={2} flex={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="action" />
                <Typography variant="body1">
                  <strong>Doğum Tarihi:</strong> {patient.birth_date}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" />
                <Typography variant="body1">
                  <strong>İletişim:</strong> {patient.contact_info}
                </Typography>
              </Box>
              {(patient.city || patient.district || patient.address) && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon color="action" />
                  <Box>
                    <Typography variant="body1">
                      <strong>Adres:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.address && `${patient.address}, `}
                      {patient.district && `${patient.district}, `}
                      {patient.city}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
            <Stack spacing={2} flex={1}>
              {patient.allergies && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <AllergyIcon color="warning" />
                  <Box>
                    <Typography variant="body1">
                      <strong>Alerjiler:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.allergies}
                    </Typography>
                  </Box>
                </Box>
              )}
              {patient.notes && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="body1">
                      <strong>Notlar:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.notes}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
          {/* Add Visit Form */}
          <Box sx={{ flex: { lg: '0 0 40%' } }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="600" color="primary" gutterBottom>
                  <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Yeni Ziyaret Ekle
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box component="form" onSubmit={handleAddVisit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Ziyaret Tarihi ve Saati"
                      type="datetime-local"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Tanı"
                      multiline
                      rows={3}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                      placeholder="Hasta tanısını yazın..."
                    />
                    
                    <TextField
                      fullWidth
                      label="Ziyaret Notları"
                      multiline
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ek notlar (opsiyonel)"
                    />
                    
                    {error && (
                      <Alert severity="error">{error}</Alert>
                    )}
                    
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={adding}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                      }}
                    >
                      {adding ? "Ekleniyor..." : "Ziyaret Ekle"}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Visit History */}
          <Box sx={{ flex: 1 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="600" color="primary" gutterBottom>
                  <VisitIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ziyaret Geçmişi ({patient.visits.length})
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {patient.visits.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <VisitIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Henüz ziyaret kaydı yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İlk ziyareti eklemek için sol taraftaki formu kullanın
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {patient.visits.map((visit) => (
                      <Card key={visit.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" fontWeight="600" color="primary" gutterBottom>
                            {formatDateTime(visit.visit_date)}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Tanı:</strong> {visit.diagnosis}
                          </Typography>
                          {visit.notes && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Notlar:</strong> {visit.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>

        {/* Edit Patient Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-patient-modal"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: 800,
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              p: 0,
            }}
          >
            <Paper
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 3,
                borderRadius: '12px 12px 0 0',
                position: 'relative'
              }}
            >
              <Typography variant="h5" fontWeight="600">
                <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Hasta Bilgilerini Düzenle
              </Typography>
              <IconButton
                onClick={() => setEditModalOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Paper>

            <Box component="form" onSubmit={handleUpdatePatient} sx={{ p: 4 }}>
              <Stack spacing={3}>
                {/* Personal Information */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👤 Kişisel Bilgiler
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        fullWidth
                        label="Ad"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        required
                      />
                      <TextField
                        fullWidth
                        label="Soyad"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        required
                      />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        fullWidth
                        label="Doğum Tarihi"
                        type="date"
                        value={editBirthDate}
                        onChange={(e) => setEditBirthDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                      <FormControl fullWidth required>
                        <InputLabel>Cinsiyet</InputLabel>
                        <Select
                          value={editGender}
                          label="Cinsiyet"
                          onChange={(e) => setEditGender(e.target.value)}
                        >
                          <MenuItem value="M">👨 Erkek</MenuItem>
                          <MenuItem value="F">👩 Kadın</MenuItem>
                          <MenuItem value="O">⚧ Diğer</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    <TextField
                      fullWidth
                      label="İletişim Bilgisi"
                      value={editContactInfo}
                      onChange={(e) => setEditContactInfo(e.target.value)}
                      required
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Address Information */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏠 Adres Bilgileri
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        fullWidth
                        label="Şehir"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                      />
                      <TextField
                        fullWidth
                        label="İlçe"
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                      />
                    </Stack>
                    <TextField
                      fullWidth
                      label="Detaylı Adres"
                      multiline
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Medical Information */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🩸 Tıbbi Bilgiler
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Kan Grubu</InputLabel>
                      <Select
                        value={editBloodType}
                        label="Kan Grubu"
                        onChange={(e) => setEditBloodType(e.target.value)}
                      >
                        <MenuItem value="">Bilinmiyor</MenuItem>
                        <MenuItem value="A+">🅰️ A+</MenuItem>
                        <MenuItem value="A-">🅰️ A-</MenuItem>
                        <MenuItem value="B+">🅱️ B+</MenuItem>
                        <MenuItem value="B-">🅱️ B-</MenuItem>
                        <MenuItem value="AB+">🆎 AB+</MenuItem>
                        <MenuItem value="AB-">🆎 AB-</MenuItem>
                        <MenuItem value="O+">🅾️ O+</MenuItem>
                        <MenuItem value="O-">🅾️ O-</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Alerjiler"
                      multiline
                      rows={2}
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                      placeholder="Bilinen alerjileri yazın..."
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Additional Notes */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Ek Notlar
                  </Typography>
                  <TextField
                    fullWidth
                    label="Notlar"
                    multiline
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Hasta hakkında ek notlar..."
                  />
                </Box>

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => setEditModalOpen(false)}
                    disabled={updating}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updating}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    {updating ? "Güncelleniyor..." : "Güncelle"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Modal>
      </Container>
    </ClientLayout>
  );
} 