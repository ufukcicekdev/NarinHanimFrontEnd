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
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar
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
  Timeline as TimelineIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Brush as BrushIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Palette as PaletteIcon
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
  production_orders?: ProductionOrder[];
}

interface ProductionOrder {
  id: number;
  status: string;
  created_at: string;
  completed_at?: string;
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
  const [editStageEyeImagePreviews, setEditStageEyeImagePreviews] = useState<string[]>([]);
  const [editStageExistingImages, setEditStageExistingImages] = useState<StageEyeImage[]>([]);
  const [editStageMedicines, setEditStageMedicines] = useState<{
    id?: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[]>([]);
  const [updatingStage, setUpdatingStage] = useState(false);
  
  // Timeline view state
  const [timelineView, setTimelineView] = useState(false);
  
  // Image viewer states
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Eye images states
  const [eyeImages, setEyeImages] = useState<File[]>([]);
  const [eyeImagePreviews, setEyeImagePreviews] = useState<string[]>([]);
  
  // Medicine states
  const [medicines, setMedicines] = useState<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[]>([{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  
  const [addingStage, setAddingStage] = useState(false);
  
  // Snackbar states for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
  
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
      // Clean up preview URLs
      eyeImagePreviews.forEach(url => URL.revokeObjectURL(url));
      setEyeImages([]);
      setEyeImagePreviews([]);
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

  // Eye images helper functions
  const handleEyeImagesChange = (files: File[]) => {
    setEyeImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setEyeImagePreviews(previews);
  };

  const removeEyeImage = (index: number) => {
    const newImages = eyeImages.filter((_, i) => i !== index);
    const newPreviews = eyeImagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(eyeImagePreviews[index]);
    
    setEyeImages(newImages);
    setEyeImagePreviews(newPreviews);
  };

  const addMoreEyeImages = (newFiles: File[]) => {
    const combinedFiles = [...eyeImages, ...newFiles];
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    const combinedPreviews = [...eyeImagePreviews, ...newPreviews];
    
    setEyeImages(combinedFiles);
    setEyeImagePreviews(combinedPreviews);
  };

  // Edit stage eye images helper functions
  const handleEditStageEyeImagesChange = (files: File[]) => {
    setEditStageEyeImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setEditStageEyeImagePreviews(previews);
  };

  const removeEditStageEyeImage = (index: number) => {
    const newImages = editStageEyeImages.filter((_, i) => i !== index);
    const newPreviews = editStageEyeImagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(editStageEyeImagePreviews[index]);
    
    setEditStageEyeImages(newImages);
    setEditStageEyeImagePreviews(newPreviews);
  };

  const addMoreEditStageEyeImages = (newFiles: File[]) => {
    const combinedFiles = [...editStageEyeImages, ...newFiles];
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    const combinedPreviews = [...editStageEyeImagePreviews, ...newPreviews];
    
    setEditStageEyeImages(combinedFiles);
    setEditStageEyeImagePreviews(combinedPreviews);
  };

  const removeExistingEyeImage = async (imageId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/stage-eye-images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from state
        setEditStageExistingImages(editStageExistingImages.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
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
    setEditStageEyeImagePreviews([]);
    setEditStageExistingImages(stage.eye_images || []);
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

  const handleCreateProductionOrder = async (medicineId: number, status: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/stage-medicines/${medicineId}/create_production_order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const statusText = status === 'package_prepare' ? 'Paketi Hazırla' :
                          status === 'send_production' ? 'Üretime Gönder' :
                          'Kargoyu Hazırla';
        
        // Success notification göster
        showNotification(`🎉 ${statusText} işlemi başarıyla oluşturuldu! Lojistik ekibi bilgilendirildi.`, "success");
        
        // Refresh visit data to update button states
        const visitRes = await fetch(`${API_URL}/api/visits/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (visitRes.ok) {
          const visitData = await visitRes.json();
          setStages(visitData.stages || []);
        }
      } else {
        showNotification('❌ İşlem oluşturulamadı. Lütfen tekrar deneyin.', "error");
      }
    } catch {
      showNotification('❌ Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.', "error");
    }
  };

  // Check if a medicine has a specific production order status
  const getMedicineProductionStatus = (medicine: StageMedicine): string | null => {
    if (!medicine.production_orders || medicine.production_orders.length === 0) {
      return null;
    }
    
    // Get the latest status based on created_at
    const latestOrder = medicine.production_orders.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });
    
    return latestOrder.status;
  };

  // Check if a button should be disabled
  const isButtonDisabled = (medicine: StageMedicine, buttonStatus: string): boolean => {
    const currentStatus = getMedicineProductionStatus(medicine);
    
    if (!currentStatus) return false; // No orders yet, all buttons enabled
    
    // Status grupları
    const packageStatuses = ['package_requested', 'package_preparing', 'package_ready'];
    const productionStatuses = ['production_requested', 'production_preparing', 'production_sent', 'production_completed'];
    const cargoStatuses = ['cargo_requested', 'cargo_preparing', 'cargo_ready', 'cargo_shipped'];
    
    // Eğer tamamlandıysa tüm butonlar disabled
    if (currentStatus === 'completed') return true;
    
    // Hangi aşamada olduğumuzu kontrol et
    if (buttonStatus === 'package_prepare') {
      return packageStatuses.includes(currentStatus) || 
             productionStatuses.includes(currentStatus) || 
             cargoStatuses.includes(currentStatus);
    }
    
    if (buttonStatus === 'send_production') {
      return productionStatuses.includes(currentStatus) || 
             cargoStatuses.includes(currentStatus);
    }
    
    if (buttonStatus === 'prepare_cargo') {
      return cargoStatuses.includes(currentStatus);
    }
    
    return false;
  };

  // Get status display text
  const getStatusDisplayText = (medicine: StageMedicine): string => {
    const status = getMedicineProductionStatus(medicine);
    if (!status) return '';
    
    const statusTexts = {
      // Paket Hazırlama
      'package_requested': '📦 Paket Hazırlama Talep Edildi', 
      'package_preparing': '⏳ Paket Hazırlanıyor',
      'package_ready': '✅ Paket Hazırlandı',
      
      // Üretim
      'production_requested': '🏭 Üretime Gönderme Talep Edildi',
      'production_preparing': '⏳ Üretime Hazırlanıyor', 
      'production_sent': '🚀 Üretime Gönderildi',
      'production_completed': '✅ Üretim Tamamlandı',
      
      // Kargo
      'cargo_requested': '🚚 Kargo Hazırlama Talep Edildi',
      'cargo_preparing': '⏳ Kargo Hazırlanıyor',
      'cargo_ready': '📦 Kargo Hazırlandı', 
      'cargo_shipped': '🚛 Kargoya Verildi',
      
      // Tamamlama
      'completed': '🎉 Tamamlandı'
    };
    
    return statusTexts[status as keyof typeof statusTexts] || '';
  };

  const showNotification = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Image viewer functions
  const openImageViewer = (imageUrl: string, imageId?: number) => {
    setCurrentImage(imageUrl);
    setCurrentImageId(imageId || null);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setDrawingMode(false);
    setHasDrawn(false);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    if (hasDrawn) {
      setSaveDialogOpen(true);
    } else {
      setImageViewerOpen(false);
      resetImageViewer();
    }
  };

  const resetImageViewer = () => {
    setCurrentImage("");
    setCurrentImageId(null);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setDrawingMode(false);
    setHasDrawn(false);
    setCanvasRef(null);
  };

  const zoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageScale > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!drawingMode) {
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  };

  // Drawing functions
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    if (!drawingMode) {
      // Entering drawing mode - disable zoom and pan
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      // Canvas will be initialized when image loads and canvas ref is set
    }
  };

  // Initialize canvas when it's created and we have an image
  const initializeCanvas = (canvas: HTMLCanvasElement, img: HTMLImageElement, shouldClear: boolean = false) => {
    if (!canvas || !img) {
      console.log('Cannot initialize canvas:', { canvas, img });
      return;
    }
    
    console.log('initializeCanvas called with shouldClear:', shouldClear);
    console.log('Initializing canvas with image:', {
      imgWidth: img.offsetWidth,
      imgHeight: img.offsetHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
    
    // Check if canvas dimensions need to change (this clears the canvas!)
    const needsResize = canvas.width !== img.offsetWidth || canvas.height !== img.offsetHeight;
    console.log('Canvas needs resize:', needsResize, {
      currentWidth: canvas.width,
      newWidth: img.offsetWidth,
      currentHeight: canvas.height,
      newHeight: img.offsetHeight
    });
    
    // Only set dimensions if they actually changed (since this clears the canvas)
    if (needsResize || shouldClear) {
      console.log('Resizing canvas - this will clear existing drawings!');
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      canvas.style.width = img.offsetWidth + 'px';
      canvas.style.height = img.offsetHeight + 'px';
      
      console.log('Canvas resized:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height
      });
    } else {
      console.log('Canvas dimensions unchanged - preserving existing drawings');
    }
    
    // Additional clear if requested
    if (shouldClear && !needsResize) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas explicitly cleared');
      }
    }
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      console.log('Canvas context ready');
    } else {
      console.log('Failed to get canvas context');
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef) {
      console.log('Cannot start drawing:', { drawingMode, canvasRef });
      return;
    }
    
    setIsDrawing(true);
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Starting drawing at:', { x, y, brushColor, brushSize });
    
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      // Set up drawing properties
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      
      // Start a new path and move to starting position
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      console.log('Drawing setup complete:', { 
        strokeStyle: ctx.strokeStyle, 
        lineWidth: ctx.lineWidth
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode || !canvasRef) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      console.log('Before drawing - canvas data exists:', ctx.getImageData(0, 0, 10, 10).data.some(d => d > 0));
      
      // Make sure drawing properties are maintained
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Add line to current path and stroke it
      ctx.lineTo(x, y);
      ctx.stroke();
      
      console.log('After drawing - canvas data exists:', ctx.getImageData(0, 0, 10, 10).data.some(d => d > 0));
      console.log('Drawing line to:', { x, y, color: ctx.strokeStyle, size: ctx.lineWidth });
      
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    console.log('Stopping drawing, isDrawing was:', isDrawing);
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    console.log('clearDrawing called - this will remove all drawings!');
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      setHasDrawn(false);
      console.log('Canvas cleared');
    }
  };

  const saveAnnotatedImage = async () => {
    if (!canvasRef || !currentImageId || !currentImage) return;

    try {
      // Create a new canvas for compositing
      const compositeCanvas = document.createElement('canvas');
      const compositeCtx = compositeCanvas.getContext('2d');
      if (!compositeCtx) return;

      // Set canvas size to match original
      compositeCanvas.width = canvasRef.width;
      compositeCanvas.height = canvasRef.height;

      // First, draw the original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        // Draw original image to composite canvas
        compositeCtx.drawImage(img, 0, 0, compositeCanvas.width, compositeCanvas.height);
        
        // Then draw the annotations on top
        compositeCtx.drawImage(canvasRef, 0, 0);
        
        console.log('Composite image created with both original image and annotations');

        // Convert composite canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          compositeCanvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/png');
        });

        // Create form data
        const formData = new FormData();
        formData.append('image', blob, 'annotated_image.png');
        formData.append('description', 'İşaretlenmiş göz fotoğrafı');

        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Delete old image
        await fetch(`${API_URL}/api/stage-eye-images/${currentImageId}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Upload new annotated image
        const stageId = stages.find(stage => 
          stage.eye_images.some(img => img.id === currentImageId)
        )?.id;

        if (stageId) {
          formData.append('stage', stageId.toString());
          
          await fetch(`${API_URL}/api/stage-eye-images/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          // Refresh stages
          const visitRes = await fetch(`${API_URL}/api/visits/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (visitRes.ok) {
            const visitData = await visitRes.json();
            setStages(visitData.stages || []);
          }
        }

        setSaveDialogOpen(false);
        setImageViewerOpen(false);
        resetImageViewer();
      };

      img.onerror = () => {
        console.error('Failed to load original image for compositing');
      };

      // Load the original image
      img.src = currentImage;
      
    } catch (error) {
      console.error('Error saving annotated image:', error);
    }
  };

  const discardChanges = () => {
    setSaveDialogOpen(false);
    setImageViewerOpen(false);
    resetImageViewer();
  };

  // Initialize canvas when drawing mode is enabled
  useEffect(() => {
    if (drawingMode && canvasRef && currentImage) {
      // Find the image element
      const img = canvasRef.previousElementSibling as HTMLImageElement;
      if (img && img.complete) {
        // Only clear canvas when first entering drawing mode
        initializeCanvas(canvasRef, img, true);
      }
    }
  }, [drawingMode, currentImage]); // Removed canvasRef, brushColor, brushSize dependencies

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
                    onClick={() => setTimelineView(!timelineView)}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: timelineView ? 'primary.light' : 'transparent',
                      color: timelineView ? 'primary.dark' : 'primary.main'
                    }}
                  >
                    {timelineView ? 'Kart Görünümü' : 'Timeline Görünümü'}
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
            ) : timelineView ? (
              // Timeline View
              <Box sx={{ position: 'relative', pl: 4 }}>
                {/* Timeline Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 20,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: 'primary.light'
                  }}
                />
                
                {stages.map((stage) => {
                  const stageDate = new Date(stage.date);
                  const isToday = new Date().toDateString() === stageDate.toDateString();
                  
                  return (
                    <Box key={stage.id} sx={{ position: 'relative', mb: 4 }}>
                      {/* Timeline Node */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: -32,
                          top: 16,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: isToday ? 'success.main' : 'primary.main',
                          border: '3px solid white',
                          boxShadow: 2,
                          zIndex: 1
                        }}
                      />
                      
                      {/* Date Badge */}
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            bgcolor: isToday ? 'success.light' : 'grey.100',
                            color: isToday ? 'success.dark' : 'text.secondary',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          📅 {stageDate.toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })} - {stageDate.toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {isToday && <Box component="span" sx={{ ml: 1 }}>🟢</Box>}
                        </Box>
                      </Box>
                      
                      {/* Timeline Card */}
                      <Card
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: isToday ? 'success.main' : 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2,
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Stage Header */}
                          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                            <Stack direction="row" alignItems="center" spacing={2}>
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
                                  fontWeight: 600,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {stage.stage_number}
                              </Box>
                              <Typography variant="h6" fontWeight="600" color="primary">
                                Etap {stage.stage_number}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" spacing={1}>
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
                                  💊 {stage.medicines.length}
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
                                  📷 {stage.eye_images.length}
                                </Box>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleEditStage(stage)}
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.dark',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                  },
                                  width: 28,
                                  height: 28
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                          
                          {/* Compact Content */}
                          <Stack spacing={2}>
                            {/* Complaint - Always show */}
                            <Box>
                              <Typography variant="body2" fontWeight="600" color="warning.dark" gutterBottom>
                                🗣️ Şikayet
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  bgcolor: 'warning.light',
                                  color: 'warning.dark',
                                  p: 1.5,
                                  borderRadius: 1,
                                  borderLeft: '3px solid',
                                  borderLeftColor: 'warning.main'
                                }}
                              >
                                {stage.complaint}
                              </Typography>
                            </Box>
                            
                            {/* Notes - If exists */}
                            {stage.notes && (
                              <Box>
                                <Typography variant="body2" fontWeight="600" color="info.dark" gutterBottom>
                                  📝 Notlar
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    bgcolor: 'info.light',
                                    color: 'info.dark',
                                    p: 1.5,
                                    borderRadius: 1,
                                    borderLeft: '3px solid',
                                    borderLeftColor: 'info.main'
                                  }}
                                >
                                  {stage.notes}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Quick Medicine Summary */}
                            {stage.medicines.length > 0 && (
                              <Box>
                                <Typography variant="body2" fontWeight="600" color="success.dark" gutterBottom>
                                  💊 İlaçlar ({stage.medicines.length})
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {stage.medicines.slice(0, 3).map((medicine, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        bgcolor: 'success.light',
                                        color: 'success.dark',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                      }}
                                    >
                                      {medicine.name}
                                    </Box>
                                  ))}
                                  {stage.medicines.length > 3 && (
                                    <Box
                                      sx={{
                                        bgcolor: 'grey.200',
                                        color: 'text.secondary',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                      }}
                                    >
                                      +{stage.medicines.length - 3} daha
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                            )}
                            
                            {/* Photo Thumbnails */}
                            {stage.eye_images.length > 0 && (
                              <Box>
                                <Typography variant="body2" fontWeight="600" color="info.dark" gutterBottom>
                                  📷 Fotoğraflar ({stage.eye_images.length})
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  {stage.eye_images.slice(0, 4).map((image, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        border: '2px solid white',
                                        boxShadow: 1
                                      }}
                                    >
                                      <img
                                        src={image.image.startsWith('http') ? image.image : `${API_URL}${image.image}`}
                                        alt="Göz"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          cursor: 'pointer'
                                        }}
                                                                                 onClick={() => {
                                           const imageUrl = image.image.startsWith('http') ? image.image : `${API_URL}${image.image}`;
                                           openImageViewer(imageUrl, image.id);
                                         }}
                                      />
                                    </Box>
                                  ))}
                                  {stage.eye_images.length > 4 && (
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: 'grey.200',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'text.secondary'
                                      }}
                                    >
                                      +{stage.eye_images.length - 4}
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              // Card View (Default)
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
                                    src={image.image.startsWith('http') ? image.image : `${API_URL}${image.image}`}
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
                                      const imageUrl = image.image.startsWith('http') ? image.image : `${API_URL}${image.image}`;
                                      openImageViewer(imageUrl, image.id);
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
                                    
                                    {/* Durum Göstergesi */}
                                    {getStatusDisplayText(medicine) && (
                                      <Box sx={{ 
                                        mt: 1, 
                                        p: 1, 
                                        bgcolor: 'success.50', 
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'success.200'
                                      }}>
                                        <Typography variant="caption" fontWeight="600" color="success.dark">
                                          {getStatusDisplayText(medicine)}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Lojistik İşlem Butonları */}
                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                                      <Button
                                        size="small"
                                        variant={isButtonDisabled(medicine, 'package_prepare') ? 'contained' : 'outlined'}
                                        color="primary"
                                        disabled={isButtonDisabled(medicine, 'package_prepare')}
                                        onClick={() => handleCreateProductionOrder(medicine.id, 'package_prepare')}
                                        sx={{ 
                                          fontSize: '0.75rem',
                                          opacity: isButtonDisabled(medicine, 'package_prepare') ? 0.7 : 1
                                        }}
                                      >
                                        📦 Paketi Hazırla
                                      </Button>
                                      <Button
                                        size="small"
                                        variant={isButtonDisabled(medicine, 'send_production') ? 'contained' : 'outlined'}
                                        color="warning"
                                        disabled={isButtonDisabled(medicine, 'send_production')}
                                        onClick={() => handleCreateProductionOrder(medicine.id, 'send_production')}
                                        sx={{ 
                                          fontSize: '0.75rem',
                                          opacity: isButtonDisabled(medicine, 'send_production') ? 0.7 : 1
                                        }}
                                      >
                                        🏭 Üretime Gönder
                                      </Button>
                                      <Button
                                        size="small"
                                        variant={isButtonDisabled(medicine, 'prepare_cargo') ? 'contained' : 'outlined'}
                                        color="success"
                                        disabled={isButtonDisabled(medicine, 'prepare_cargo')}
                                        onClick={() => handleCreateProductionOrder(medicine.id, 'prepare_cargo')}
                                        sx={{ 
                                          fontSize: '0.75rem',
                                          opacity: isButtonDisabled(medicine, 'prepare_cargo') ? 0.7 : 1
                                        }}
                                      >
                                        🚚 Kargoyu Hazırla
                                      </Button>
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
          onClose={() => {
            setShowAddStageModal(false);
            // Clean up preview URLs
            eyeImagePreviews.forEach(url => URL.revokeObjectURL(url));
            setEyeImages([]);
            setEyeImagePreviews([]);
            setNewStageComplaint("");
            setNewStageNotes("");
            setMedicines([{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
          }}
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
                  
                  {/* Image Preview Grid */}
                  {eyeImages.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: 2,
                          mb: 2
                        }}
                      >
                        {eyeImagePreviews.map((preview, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '2px solid',
                              borderColor: 'primary.light',
                              '&:hover .delete-btn': {
                                opacity: 1
                              }
                            }}
                          >
                            <img
                              src={preview}
                              alt={`Göz fotoğrafı ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              className="delete-btn"
                              onClick={() => removeEyeImage(index)}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'error.main',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  bgcolor: 'error.dark'
                                },
                                width: 24,
                                height: 24
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                p: 0.5,
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}
                            >
                              {eyeImages[index]?.name.length > 15 
                                ? eyeImages[index]?.name.substring(0, 15) + '...'
                                : eyeImages[index]?.name
                              }
                            </Box>
                          </Box>
                        ))}
                        
                        {/* Add More Button */}
                        <Box
                          sx={{
                            aspectRatio: '1',
                            border: '2px dashed',
                            borderColor: 'primary.light',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'primary.50'
                            }
                          }}
                          component="label"
                        >
                          <AddIcon sx={{ fontSize: 32, color: 'primary.light', mb: 1 }} />
                          <Typography variant="caption" color="primary.light" textAlign="center">
                            Daha Fazla<br />Ekle
                          </Typography>
                          <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                addMoreEyeImages(files);
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Initial Upload Button */}
                  {eyeImages.length === 0 && (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadIcon />}
                      sx={{ 
                        py: 3,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        '&:hover': { 
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          bgcolor: 'primary.50'
                        }
                      }}
                    >
                      Göz fotoğrafları seç
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            handleEyeImagesChange(files);
                          }
                        }}
                      />
                    </Button>
                  )}
                  
                  {eyeImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Toplam {eyeImages.length} fotoğraf seçildi
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
          onClose={() => {
            setEditStageModal(false);
            // Clean up preview URLs
            editStageEyeImagePreviews.forEach(url => URL.revokeObjectURL(url));
            setEditStageEyeImages([]);
            setEditStageEyeImagePreviews([]);
            setEditStageExistingImages([]);
          }}
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
                    📷 Göz Fotoğrafları
                  </Typography>
                  
                  {/* Existing Images Grid */}
                  {editStageExistingImages.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Mevcut Fotoğraflar
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: 2,
                          mb: 2
                        }}
                      >
                        {editStageExistingImages.map((image, index) => (
                          <Box
                            key={image.id}
                            sx={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '2px solid',
                              borderColor: 'success.light',
                              '&:hover .delete-btn': {
                                opacity: 1
                              }
                            }}
                          >
                            <img
                              src={image.image}
                              alt={`Mevcut göz fotoğrafı ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              className="delete-btn"
                              onClick={() => removeExistingEyeImage(image.id)}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'error.main',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  bgcolor: 'error.dark'
                                },
                                width: 24,
                                height: 24
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                p: 0.5,
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}
                            >
                              Mevcut
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* New Images Section */}
                  {(editStageEyeImages.length > 0 || editStageExistingImages.length > 0) && (
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Yeni Fotoğraflar Ekle
                    </Typography>
                  )}
                  
                  {/* New Image Preview Grid */}
                  {editStageEyeImages.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: 2,
                          mb: 2
                        }}
                      >
                        {editStageEyeImagePreviews.map((preview, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '2px solid',
                              borderColor: 'warning.light',
                              '&:hover .delete-btn': {
                                opacity: 1
                              }
                            }}
                          >
                            <img
                              src={preview}
                              alt={`Göz fotoğrafı ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              className="delete-btn"
                              onClick={() => removeEditStageEyeImage(index)}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'error.main',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  bgcolor: 'error.dark'
                                },
                                width: 24,
                                height: 24
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                p: 0.5,
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}
                            >
                              {editStageEyeImages[index]?.name.length > 15 
                                ? editStageEyeImages[index]?.name.substring(0, 15) + '...'
                                : editStageEyeImages[index]?.name
                              }
                            </Box>
                          </Box>
                        ))}
                        
                        {/* Add More Button */}
                        <Box
                          sx={{
                            aspectRatio: '1',
                            border: '2px dashed',
                            borderColor: 'warning.light',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'warning.main',
                              bgcolor: 'warning.50'
                            }
                          }}
                          component="label"
                        >
                          <AddIcon sx={{ fontSize: 32, color: 'warning.light', mb: 1 }} />
                          <Typography variant="caption" color="warning.light" textAlign="center">
                            Daha Fazla<br />Ekle
                          </Typography>
                          <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                addMoreEditStageEyeImages(files);
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Initial Upload Button */}
                  {editStageEyeImages.length === 0 && (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadIcon />}
                      sx={{ 
                        py: 3,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        '&:hover': { 
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          bgcolor: 'warning.50'
                        }
                      }}
                    >
                      {editStageExistingImages.length > 0 ? 'Yeni fotoğraflar ekle' : 'Göz fotoğrafları seç'}
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            handleEditStageEyeImagesChange(files);
                          }
                        }}
                      />
                    </Button>
                  )}
                  
                  {editStageEyeImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Toplam {editStageEyeImages.length} yeni fotoğraf seçildi
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

        {/* Image Viewer Modal */}
        <Modal
          open={imageViewerOpen}
          onClose={closeImageViewer}
          aria-labelledby="image-viewer-modal"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.9)'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '95vh',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseDown={!drawingMode ? handleMouseDown : undefined}
            onMouseMove={!drawingMode ? handleMouseMove : undefined}
            onMouseUp={!drawingMode ? handleMouseUp : undefined}
            onMouseLeave={!drawingMode ? handleMouseUp : undefined}
            onWheel={!drawingMode ? handleWheel : undefined}
          >
            {/* Image Container */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={currentImage}
                alt="Büyütülmüş Göz Fotoğrafı"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: drawingMode ? 'none' : `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  cursor: drawingMode ? 'crosshair' : (imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'),
                  userSelect: 'none',
                  pointerEvents: drawingMode ? 'none' : 'auto',
                  display: 'block'
                }}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (drawingMode && canvasRef) {
                    initializeCanvas(canvasRef, img, false); // Don't clear on image load
                  }
                }}
              />
              
              {/* Drawing Canvas */}
              {drawingMode && (
                <canvas
                  ref={(ref) => {
                    setCanvasRef(ref);
                    if (ref) {
                      // Initialize canvas when ref is set
                      const img = ref.previousElementSibling as HTMLImageElement;
                      if (img && img.complete) {
                        console.log('Initializing canvas from ref callback');
                        initializeCanvas(ref, img, false); // Don't clear on ref set
                      }
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    cursor: 'crosshair',
                    pointerEvents: 'auto',
                    zIndex: 10
                  }}
                  onMouseDown={(e) => {
                    console.log('Canvas mouse down event');
                    startDrawing(e);
                  }}
                  onMouseMove={(e) => {
                    if (isDrawing) console.log('Drawing...');
                    draw(e);
                  }}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              )}
            </Box>

            {/* Control Buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                zIndex: 20 // Higher than canvas z-index
              }}
            >
              {/* Top Row - Main Controls */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!drawingMode && (
                  <>
                    <IconButton
                      onClick={zoomOut}
                      disabled={imageScale <= 0.5}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'black',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'white', cursor: 'pointer' },
                        '&:disabled': { bgcolor: 'rgba(255, 255, 255, 0.5)', cursor: 'not-allowed' }
                      }}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                    
                    <IconButton
                      onClick={resetZoom}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'black',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'white', cursor: 'pointer' }
                      }}
                    >
                      <FullscreenIcon />
                    </IconButton>
                    
                    <IconButton
                      onClick={zoomIn}
                      disabled={imageScale >= 3}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'black',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'white', cursor: 'pointer' },
                        '&:disabled': { bgcolor: 'rgba(255, 255, 255, 0.5)', cursor: 'not-allowed' }
                      }}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </>
                )}
                
                <Tooltip 
                  title={drawingMode ? 'İşaretleme modundan çık (tekrar tıklayın)' : 'İşaretleme moduna geç'}
                  placement="left"
                >
                  <IconButton
                    onClick={toggleDrawingMode}
                    sx={{
                      bgcolor: drawingMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      color: drawingMode ? 'white' : 'black',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: drawingMode ? 'rgba(255, 0, 0, 1)' : 'white',
                        cursor: 'pointer'
                      },
                      border: drawingMode ? '2px solid #ffffff' : 'none'
                    }}
                  >
                    <BrushIcon />
                  </IconButton>
                </Tooltip>
                
                <IconButton
                  onClick={closeImageViewer}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    color: 'black',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'white', cursor: 'pointer' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Drawing Controls */}
              {drawingMode && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Color Picker */}
                  <IconButton
                    onClick={(e) => setColorMenuAnchor(e.currentTarget)}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      color: 'black',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'white', cursor: 'pointer' }
                    }}
                  >
                    <PaletteIcon />
                  </IconButton>
                  
                  {/* Clear Drawing */}
                  <IconButton
                    onClick={clearDrawing}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      color: 'black',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'white', cursor: 'pointer' }
                    }}
                  >
                    <UndoIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Color Menu */}
            <Menu
              anchorEl={colorMenuAnchor}
              open={Boolean(colorMenuAnchor)}
              onClose={() => setColorMenuAnchor(null)}
            >
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map((color) => (
                <MenuItem
                  key={color}
                  onClick={() => {
                    setBrushColor(color);
                    setColorMenuAnchor(null);
                  }}
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: color,
                      border: '2px solid',
                      borderColor: color === brushColor ? 'primary.main' : 'grey.300',
                      borderRadius: 1
                    }}
                  />
                </MenuItem>
              ))}
            </Menu>

            {/* Brush Size Control */}
            {drawingMode && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  minWidth: 200
                }}
              >
                <Typography variant="caption" color="black" fontWeight="600">
                  Fırça Boyutu: {brushSize}px
                </Typography>
                <Slider
                  value={brushSize}
                  onChange={(_, value) => setBrushSize(value as number)}
                  min={1}
                  max={20}
                  size="small"
                  sx={{ color: 'primary.main' }}
                />
              </Box>
            )}

            {/* Zoom Info */}
            {!drawingMode && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  color: 'black',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {Math.round(imageScale * 100)}% - Mouse tekerleği ile yakınlaştır/uzaklaştır
              </Box>
            )}

            {/* Drawing Mode Info */}
            {drawingMode && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  color: 'black',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                İşaretleme Modu Aktif - Çizim için mouse kullanın • Çıkmak için fırça butonuna tekrar tıklayın
              </Box>
            )}
          </Box>
        </Modal>

        {/* Save Drawing Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          aria-labelledby="save-dialog-title"
        >
          <DialogTitle id="save-dialog-title">
            <SaveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            İşaretlenmiş Fotoğrafı Kaydet
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Fotoğraf üzerinde yaptığınız işaretlemeler var. Bu değişiklikleri kaydetmek istiyor musunuz?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Kaydet: Eski fotoğraf silinir, işaretlenmiş fotoğraf kaydedilir
              <br />
              • Kaydetme: Değişiklikler kaybolur, orijinal fotoğraf korunur
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={discardChanges}
              color="inherit"
              variant="outlined"
            >
              Kaydetme
            </Button>
            <Button
              onClick={saveAnnotatedImage}
              color="primary"
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

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

        {/* Notification Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity}
            sx={{ 
              width: '100%',
              fontSize: '1rem',
              fontWeight: 'medium'
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ClientLayout>
  );
} 