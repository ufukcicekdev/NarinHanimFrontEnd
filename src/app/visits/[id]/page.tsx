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
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Timeline as TimelineIcon
} from "@mui/icons-material";

interface StageEyeImage {
  id: number;
  image: string;
  description: string;
  created_at: string;
}

interface StageMedicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  created_at: string;
}

interface VisitStage {
  id: number;
  stage_number: number;
  date: string;
  complaint: string;
  notes: string;
  eye_images: StageEyeImage[];
  medicines: StageMedicine[];
  created_at: string;
  updated_at: string;
}

interface Visit {
  id: number;
  patient: number;
  visit_date: string;
  diagnosis: string;
  notes: string;
  document?: string;
  stages: VisitStage[];
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
  
  // Stage management states
  const [stages, setStages] = useState<VisitStage[]>([]);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageComplaint, setNewStageComplaint] = useState("");
  const [newStageNotes, setNewStageNotes] = useState("");
  
  // Edit stage states
  const [editStageModal, setEditStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<VisitStage | null>(null);
  const [editStageComplaint, setEditStageComplaint] = useState("");
  const [editStageNotes, setEditStageNotes] = useState("");
  const [editStageEyeImages, setEditStageEyeImages] = useState<File[]>([]);
  const [editStageMedicines, setEditStageMedicines] = useState<{
    id?: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[]>([]);
  const [updatingStage, setUpdatingStage] = useState(false);
  
  // Eye images states
  const [eyeImages, setEyeImages] = useState<File[]>([]);
  
  // Medicine states
  const [medicines, setMedicines] = useState<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[]>([{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  
  const [addingStage, setAddingStage] = useState(false);
  
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
        setStages(visitData.stages || []);
        
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

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingStage(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const nextStageNumber = Math.max(...stages.map(s => s.stage_number), 0) + 1;
      const now = new Date().toISOString();
      
      // 1. Create stage
      const res = await fetch(`${API_URL}/api/visit-stages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visit: parseInt(id),
          stage_number: nextStageNumber,
          date: now,
          complaint: newStageComplaint,
          notes: newStageNotes,
        }),
      });

      if (!res.ok) {
        setError("Etap eklenemedi.");
        setAddingStage(false);
        return;
      }

      const newStage = await res.json();

      // 2. Upload eye images if any
      if (eyeImages.length > 0) {
        for (const image of eyeImages) {
          const formData = new FormData();
          formData.append('stage', newStage.id.toString());
          formData.append('image', image);
          formData.append('description', 'Göz fotoğrafı');

          await fetch(`${API_URL}/api/stage-eye-images/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        }
      }

      // 3. Add medicines
      for (const medicine of medicines) {
        if (medicine.name.trim()) {
          const medicineData = {
            stage: newStage.id,
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            notes: medicine.notes
          };

          await fetch(`${API_URL}/api/stage-medicines/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(medicineData),
          });
        }
      }

      // 4. Refresh stages and reset form
      setStages([...stages, newStage]);
      setShowAddStageModal(false);
      setNewStageComplaint("");
      setNewStageNotes("");
      setEyeImages([]);
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
      setAddingStage(false);
    } catch {
      setError("Etap eklenemedi.");
      setAddingStage(false);
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updatedMedicines = medicines.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedicines(updatedMedicines);
  };

  // Edit stage functions
  const handleEditStage = (stage: VisitStage) => {
    setEditingStage(stage);
    setEditStageComplaint(stage.complaint);
    setEditStageNotes(stage.notes);
    setEditStageEyeImages([]);
    setEditStageMedicines(stage.medicines.map(med => ({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      notes: med.notes
    })));
    setEditStageModal(true);
  };

  const addEditStageMedicine = () => {
    setEditStageMedicines([...editStageMedicines, { name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  };

  const removeEditStageMedicine = (index: number) => {
    setEditStageMedicines(editStageMedicines.filter((_, i) => i !== index));
  };

  const updateEditStageMedicine = (index: number, field: string, value: string) => {
    const updatedMedicines = editStageMedicines.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setEditStageMedicines(updatedMedicines);
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;
    
    setUpdatingStage(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // 1. Update stage
      const res = await fetch(`${API_URL}/api/visit-stages/${editingStage.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          complaint: editStageComplaint,
          notes: editStageNotes,
        }),
      });

      if (!res.ok) {
        setError("Etap güncellenemedi.");
        setUpdatingStage(false);
        return;
      }

      // 2. Upload new eye images if any
      if (editStageEyeImages.length > 0) {
        for (const image of editStageEyeImages) {
          const formData = new FormData();
          formData.append('stage', editingStage.id.toString());
          formData.append('image', image);
          formData.append('description', 'Göz fotoğrafı');

          await fetch(`${API_URL}/api/stage-eye-images/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        }
      }

      // 3. Update medicines
      for (const medicine of editStageMedicines) {
        if (medicine.name.trim()) {
          const medicineData = {
            stage: editingStage.id,
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            notes: medicine.notes
          };

          if (medicine.id) {
            // Update existing medicine
            await fetch(`${API_URL}/api/stage-medicines/${medicine.id}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(medicineData),
            });
          } else {
            // Create new medicine
            await fetch(`${API_URL}/api/stage-medicines/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(medicineData),
            });
          }
        }
      }

      // 4. Refresh stages
      const visitRes = await fetch(`${API_URL}/api/visits/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (visitRes.ok) {
        const visitData = await visitRes.json();
        setStages(visitData.stages || []);
      }

      setEditStageModal(false);
      setUpdatingStage(false);
    } catch {
      setError("Etap güncellenemedi.");
      setUpdatingStage(false);
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
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/patients')}
            >
              Hastalar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
            {patient && (
              <>
                <Typography 
                  variant="body2" 
                  color="primary" 
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => router.push(`/patients/${visit?.patient}`)}
                >
                  {patient.first_name} {patient.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  /
                </Typography>
              </>
            )}
            <Typography variant="body2" color="text.secondary">
              Ziyaret Detayları
            </Typography>
          </Stack>
        </Box>

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

        {/* Visit Stages */}
        <Card elevation={2} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Enhanced Header with Stats */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight="600" color="primary" sx={{ mb: 1 }}>
                    <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ziyaret Etapları
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {stages.length} Etap
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {stages.reduce((acc, stage) => acc + stage.medicines.length, 0)} İlaç
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {stages.reduce((acc, stage) => acc + stage.eye_images.length, 0)} Fotoğraf
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TimelineIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Timeline Görünümü
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddStageModal(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                      },
                      borderRadius: 2,
                      px: 3
                    }}
                  >
                    Yeni Etap
                  </Button>
                </Stack>
              </Stack>
              
              {/* Progress Timeline */}
              {stages.length > 0 && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {stages.map((stage, index) => (
                      <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => {
                            document.getElementById(`stage-${stage.id}`)?.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                          }}
                        >
                          {stage.stage_number}
                        </Box>
                        {index < stages.length - 1 && (
                          <Box
                            sx={{
                              flex: 1,
                              height: 2,
                              bgcolor: 'primary.light',
                              mx: 1,
                              borderRadius: 1
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {stages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <TimelineIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Henüz etap eklenmemiş
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  İlk etabı eklemek için yukarıdaki butonu kullanın
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddStageModal(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    borderRadius: 2
                  }}
                >
                  İlk Etabı Ekle
                </Button>
              </Box>
            ) : (
              <Stack spacing={3}>
                {stages.map((stage, index) => (
                  <Card 
                    key={stage.id} 
                    id={`stage-${stage.id}`}
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      {/* Stage Header */}
                      <Box
                        sx={{
                          background: `linear-gradient(135deg, ${
                            index % 3 === 0 ? '#e3f2fd 0%, #bbdefb 100%' :
                            index % 3 === 1 ? '#f3e5f5 0%, #e1bee7 100%' :
                            '#e8f5e8 0%, #c8e6c9 100%'
                          })`,
                          p: 3,
                          borderRadius: '12px 12px 0 0'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '1.1rem'
                              }}
                            >
                              {stage.stage_number}
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="600" color="primary">
                                Etap {stage.stage_number}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDateTime(stage.date)}
                              </Typography>
                            </Box>
                          </Stack>
                          
                          <Stack direction="row" spacing={1}>
                            {/* Quick Stats */}
                            {stage.medicines.length > 0 && (
                              <Box
                                sx={{
                                  bgcolor: 'success.light',
                                  color: 'success.dark',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {stage.medicines.length} İlaç
                              </Box>
                            )}
                            {stage.eye_images.length > 0 && (
                              <Box
                                sx={{
                                  bgcolor: 'info.light',
                                  color: 'info.dark',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {stage.eye_images.length} Fotoğraf
                              </Box>
                            )}
                            
                            <IconButton
                              size="small"
                              onClick={() => handleEditStage(stage)}
                              sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                boxShadow: 1,
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  transform: 'scale(1.1)'
                                },
                                width: 36,
                                height: 36,
                                transition: 'all 0.2s'
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>

                      {/* Stage Content */}
                      <Box sx={{ p: 3 }}>
                        {/* Complaint Section */}
                        <Box sx={{ mb: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: 'warning.main'
                              }}
                            />
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                              Şikayet
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              bgcolor: 'grey.50',
                              p: 2,
                              borderRadius: 2,
                              borderLeft: '4px solid',
                              borderLeftColor: 'warning.main'
                            }}
                          >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {stage.complaint}
                            </Typography>
                          </Box>
                        </Box>

                        {stage.notes && (
                          <Box sx={{ mb: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: 'info.main'
                                }}
                              />
                              <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                Notlar
                              </Typography>
                            </Stack>
                            <Box
                              sx={{
                                bgcolor: 'grey.50',
                                p: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderLeftColor: 'info.main'
                              }}
                            >
                              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {stage.notes}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Eye Images */}
                        {stage.eye_images.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: 'info.main'
                                }}
                              />
                              <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                Göz Fotoğrafları
                              </Typography>
                              <Box
                                sx={{
                                  bgcolor: 'info.light',
                                  color: 'info.dark',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {stage.eye_images.length}
                              </Box>
                            </Stack>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: 2,
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 2
                              }}
                            >
                              {stage.eye_images.map((image) => (
                                <Box 
                                  key={image.id} 
                                  sx={{ 
                                    textAlign: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.05)'
                                    }
                                  }}
                                >
                                  <img
                                    src={`${API_URL}${image.image}`}
                                    alt="Göz Fotoğrafı"
                                    style={{
                                      width: 100,
                                      height: 100,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      border: '2px solid white',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      // TODO: Add image preview modal
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Medicines */}
                        {stage.medicines.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: 'success.main'
                                }}
                              />
                              <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                İlaçlar
                              </Typography>
                              <Box
                                sx={{
                                  bgcolor: 'success.light',
                                  color: 'success.dark',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {stage.medicines.length}
                              </Box>
                            </Stack>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: 2
                              }}
                            >
                              {stage.medicines.map((medicine) => (
                                <Box 
                                  key={medicine.id} 
                                  sx={{ 
                                    p: 2.5, 
                                    bgcolor: 'white', 
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: 'success.main',
                                      boxShadow: 1
                                    }
                                  }}
                                >
                                  <Stack spacing={1.5}>
                                    <Typography variant="body1" fontWeight="600" color="success.dark">
                                      💊 {medicine.name}
                                    </Typography>
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                                          Doz:
                                        </Typography>
                                        <Typography variant="body2">
                                          {medicine.dosage}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                                          Sıklık:
                                        </Typography>
                                        <Typography variant="body2">
                                          {medicine.frequency}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                                          Süre:
                                        </Typography>
                                        <Typography variant="body2">
                                          {medicine.duration}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    {medicine.notes && (
                                      <Box
                                        sx={{
                                          bgcolor: 'grey.50',
                                          p: 1.5,
                                          borderRadius: 1,
                                          borderLeft: '3px solid',
                                          borderLeftColor: 'success.main'
                                        }}
                                      >
                                        <Typography variant="body2" color="text.secondary">
                                          {medicine.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Stack>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Add Stage Modal */}
        <Modal
          open={showAddStageModal}
          onClose={() => setShowAddStageModal(false)}
          aria-labelledby="add-stage-modal"
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
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: 'white',
                p: 3,
                borderRadius: '12px 12px 0 0',
                position: 'relative'
              }}
            >
              <Typography variant="h5" fontWeight="600">
                <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Yeni Etap Ekle
              </Typography>
              <IconButton
                onClick={() => setShowAddStageModal(false)}
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

            <Box component="form" onSubmit={handleAddStage} sx={{ p: 4 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Şikayet"
                  multiline
                  rows={4}
                  value={newStageComplaint}
                  onChange={(e) => setNewStageComplaint(e.target.value)}
                  required
                  placeholder="Hastanın bu etaptaki şikayetlerini yazın..."
                  helperText="Bu etapta hastanın belirttiği şikayetler ve semptomlar"
                />
                
                <TextField
                  fullWidth
                  label="Etap Notları"
                  multiline
                  rows={3}
                  value={newStageNotes}
                  onChange={(e) => setNewStageNotes(e.target.value)}
                  placeholder="Bu etap hakkında ek notlar..."
                  helperText="Muayene bulguları, gözlemler ve öneriler (opsiyonel)"
                />

                {/* Eye Images Section */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    📷 Göz Fotoğrafları
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
                    {eyeImages.length > 0 ? `${eyeImages.length} fotoğraf seçildi` : 'Göz fotoğrafları seç'}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setEyeImages(files);
                      }}
                    />
                  </Button>
                  {eyeImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {eyeImages.map(img => img.name).join(', ')}
                    </Typography>
                  )}
                </Box>

                {/* Medicines Section */}
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">
                      💊 İlaçlar
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addMedicine}
                      startIcon={<AddIcon />}
                    >
                      İlaç Ekle
                    </Button>
                  </Stack>
                  
                  {medicines.map((medicine, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" color="primary">
                            İlaç {index + 1}
                          </Typography>
                          {medicines.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => removeMedicine(index)}
                              color="error"
                            >
                              <CloseIcon />
                            </IconButton>
                          )}
                        </Stack>
                        
                        <TextField
                          fullWidth
                          label="İlaç Adı"
                          value={medicine.name}
                          onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                          placeholder="İlaç adını girin..."
                        />
                        
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Doz"
                            value={medicine.dosage}
                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                            placeholder="Örn: 1 tablet"
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="Günlük Kullanım"
                            value={medicine.frequency}
                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                            placeholder="Örn: Günde 2 kez"
                            sx={{ flex: 1 }}
                          />
                        </Stack>
                        
                        <TextField
                          fullWidth
                          label="Süre"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          placeholder="Örn: 7 gün"
                        />
                        
                        <TextField
                          fullWidth
                          label="Notlar"
                          value={medicine.notes}
                          onChange={(e) => updateMedicine(index, 'notes', e.target.value)}
                          placeholder="Ek notlar..."
                          multiline
                          rows={2}
                        />
                      </Stack>
                    </Card>
                  ))}
                </Box>

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => setShowAddStageModal(false)}
                    disabled={addingStage}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={addingStage}
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                      }
                    }}
                  >
                    {addingStage ? "Ekleniyor..." : "Etap Ekle"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Modal>

        {/* Edit Stage Modal */}
        <Modal
          open={editStageModal}
          onClose={() => setEditStageModal(false)}
          aria-labelledby="edit-stage-modal"
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
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                color: 'white',
                p: 3,
                borderRadius: '12px 12px 0 0',
                position: 'relative'
              }}
            >
              <Typography variant="h5" fontWeight="600">
                <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Etap Düzenle
              </Typography>
              <IconButton
                onClick={() => setEditStageModal(false)}
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

            <Box component="form" onSubmit={handleUpdateStage} sx={{ p: 4 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Şikayet"
                  multiline
                  rows={4}
                  value={editStageComplaint}
                  onChange={(e) => setEditStageComplaint(e.target.value)}
                  required
                  placeholder="Hastanın bu etaptaki şikayetlerini yazın..."
                  helperText="Bu etapta hastanın belirttiği şikayetler ve semptomlar"
                />
                
                <TextField
                  fullWidth
                  label="Etap Notları"
                  multiline
                  rows={3}
                  value={editStageNotes}
                  onChange={(e) => setEditStageNotes(e.target.value)}
                  placeholder="Bu etap hakkında ek notlar..."
                  helperText="Muayene bulguları, gözlemler ve öneriler (opsiyonel)"
                />

                {/* Eye Images Section */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    📷 Yeni Göz Fotoğrafları Ekle
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
                    {editStageEyeImages.length > 0 ? `${editStageEyeImages.length} fotoğraf seçildi` : 'Yeni göz fotoğrafları seç'}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setEditStageEyeImages(files);
                      }}
                    />
                  </Button>
                  {editStageEyeImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {editStageEyeImages.map(img => img.name).join(', ')}
                    </Typography>
                  )}
                </Box>

                {/* Medicines Section */}
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">
                      💊 İlaçlar
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addEditStageMedicine}
                      startIcon={<AddIcon />}
                    >
                      İlaç Ekle
                    </Button>
                  </Stack>
                  
                  {editStageMedicines.map((medicine, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" color="primary">
                            İlaç {index + 1}
                          </Typography>
                          {editStageMedicines.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => removeEditStageMedicine(index)}
                              color="error"
                            >
                              <CloseIcon />
                            </IconButton>
                          )}
                        </Stack>
                        
                        <TextField
                          fullWidth
                          label="İlaç Adı"
                          value={medicine.name}
                          onChange={(e) => updateEditStageMedicine(index, 'name', e.target.value)}
                          placeholder="İlaç adını girin..."
                        />
                        
                        <Stack direction="row" spacing={2}>
                          <TextField
                            label="Doz"
                            value={medicine.dosage}
                            onChange={(e) => updateEditStageMedicine(index, 'dosage', e.target.value)}
                            placeholder="Örn: 1 tablet"
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="Günlük Kullanım"
                            value={medicine.frequency}
                            onChange={(e) => updateEditStageMedicine(index, 'frequency', e.target.value)}
                            placeholder="Örn: Günde 2 kez"
                            sx={{ flex: 1 }}
                          />
                        </Stack>
                        
                        <TextField
                          fullWidth
                          label="Süre"
                          value={medicine.duration}
                          onChange={(e) => updateEditStageMedicine(index, 'duration', e.target.value)}
                          placeholder="Örn: 7 gün"
                        />
                        
                        <TextField
                          fullWidth
                          label="Notlar"
                          value={medicine.notes}
                          onChange={(e) => updateEditStageMedicine(index, 'notes', e.target.value)}
                          placeholder="Ek notlar..."
                          multiline
                          rows={2}
                        />
                      </Stack>
                    </Card>
                  ))}
                </Box>

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => setEditStageModal(false)}
                    disabled={updatingStage}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updatingStage}
                    sx={{
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                      }
                    }}
                  >
                    {updatingStage ? "Güncelleniyor..." : "Etap Güncelle"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Modal>

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

        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <Stack spacing={2}>
            {/* Quick Add Stage */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: 6
                }
              }}
              onClick={() => setShowAddStageModal(true)}
            >
              <AddIcon />
            </Box>
            
            {/* Scroll to Top */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'grey.600',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: 4
                }
              }}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              ↑
            </Box>
          </Stack>
        </Box>
      </Container>
    </ClientLayout>
  );
} 