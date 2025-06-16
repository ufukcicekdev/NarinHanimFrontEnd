"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientLayout from "../../components/ClientLayout";
import Loading from "../../components/Loading";
import API_URL from "../../../config/api";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Paper,
  Modal,
  IconButton
} from "@mui/material";
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as VisitIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";

interface Visit {
  id: number;
  patient: number;
  visit_date: string;
  diagnosis: string;
  notes: string;
  document?: string;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDocument, setEditDocument] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchVisit = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/visits/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Ziyaret bilgileri alınamadı.");
          setLoading(false);
          return;
        }
        const visitData = await res.json();
        setVisit(visitData);
        
        // Fetch patient info
        const patientRes = await fetch(`${API_URL}/api/patients/${visitData.patient}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (patientRes.ok) {
          const patientData = await patientRes.json();
          setPatient(patientData);
        }
        
        setLoading(false);
      } catch {
        setError("Ziyaret bilgileri alınamadı.");
        setLoading(false);
      }
    };
    fetchVisit();
  }, [id, router]);

  const handleEditVisit = () => {
    if (visit) {
      setEditDiagnosis(visit.diagnosis);
      setEditNotes(visit.notes || "");
      setEditDocument(null);
      setEditModalOpen(true);
    }
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('diagnosis', editDiagnosis);
      formData.append('notes', editNotes);
      if (editDocument) {
        formData.append('document', editDocument);
      }

      const res = await fetch(`${API_URL}/api/visits/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        setError("Ziyaret güncellenemedi.");
        setUpdating(false);
        return;
      }
      
      const updatedVisit = await res.json();
      setVisit(updatedVisit);
      setEditModalOpen(false);
      setUpdating(false);
    } catch {
      setError("Ziyaret güncellenemedi.");
      setUpdating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
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

  if (!visit) return null;

  return (
    <ClientLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                <VisitIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Ziyaret Detayları
              </Typography>
              {patient && (
                <Typography variant="h6" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {patient.first_name} {patient.last_name}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
              >
                Geri Dön
              </Button>
              <IconButton
                onClick={handleEditVisit}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  width: 48,
                  height: 48
                }}
              >
                <EditIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="action" />
              <Typography variant="h6">
                <strong>Ziyaret Tarihi:</strong> {formatDateTime(visit.visit_date)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Visit Details */}
        <Stack spacing={4}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="600" color="primary" gutterBottom>
                🩺 Tanı ve Bulgular
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {visit.diagnosis}
              </Typography>
            </CardContent>
          </Card>

          {visit.notes && (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="600" color="primary" gutterBottom>
                  📝 Ziyaret Notları
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {visit.notes}
                </Typography>
              </CardContent>
            </Card>
          )}

          {visit.document && (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="600" color="primary" gutterBottom>
                  📎 Ekli Doküman
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  href={`${API_URL}${visit.document}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    }
                  }}
                >
                  Dokümanı İndir
                </Button>
              </CardContent>
            </Card>
          )}
        </Stack>

        {/* Edit Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-visit-modal"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              maxWidth: 600,
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
                Ziyaret Düzenle
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

            <Box component="form" onSubmit={handleUpdateVisit} sx={{ p: 4 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Tanı"
                  multiline
                  rows={4}
                  value={editDiagnosis}
                  onChange={(e) => setEditDiagnosis(e.target.value)}
                  required
                  placeholder="Hastanın tanısını güncelleyin..."
                />
                
                <TextField
                  fullWidth
                  label="Ziyaret Notları"
                  multiline
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ek notları güncelleyin..."
                />

                <Box>
                  <Typography variant="body2" fontWeight="600" mb={1}>
                    📎 Doküman Güncelle (Opsiyonel)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ 
                      py: 2,
                      borderStyle: 'dashed',
                      '&:hover': { borderStyle: 'dashed' }
                    }}
                  >
                    {editDocument ? `📄 ${editDocument.name}` : '📁 Yeni Dosya Seç'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => setEditDocument(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {editDocument && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Yeni dosya: {editDocument.name} ({(editDocument.size / 1024).toFixed(1)} KB)
                    </Typography>
                  )}
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