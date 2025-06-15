"use client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

interface IrisImage {
  id: number;
  image: string;
  description: string;
  created_at: string;
}

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [images, setImages] = useState<IrisImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchImages = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/visits/${id}/images/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Görseller alınamadı.");
          return;
        }
        const data = await res.json();
        setImages(data);
      } catch {
        setError("Görseller alınamadı.");
      }
    };
    fetchImages();
  }, [id, router]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("description", description);
    try {
      const res = await fetch(`http://localhost:8000/api/visits/${id}/add_iris_image/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        setError("Görsel yüklenemedi.");
        setUploading(false);
        return;
      }
      setFile(null);
      setPreview(null);
      setDescription("");
      // Refresh images
      const refreshed = await fetch(`http://localhost:8000/api/visits/${id}/images/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(await refreshed.json());
      setUploading(false);
    } catch {
      setError("Görsel yüklenemedi.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">İris Görselleri</h1>
      <form onSubmit={handleUpload} className="mb-8 bg-white p-4 rounded shadow space-y-3">
        <div>
          <label className="block mb-1 font-medium">Görsel Seç</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        {preview && (
          <div className="mb-2">
            <img src={preview} alt="Önizleme" className="max-h-48 rounded border" />
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium">Açıklama</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={uploading}
        >
          {uploading ? "Yükleniyor..." : "Görsel Yükle"}
        </button>
      </form>
      <h2 className="text-xl font-semibold mb-2">Yüklenen Görseller</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-gray-50 p-2 rounded shadow">
            <img
              src={`http://localhost:8000${img.image}`}
              alt={img.description || "İris görseli"}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <div className="text-gray-700 text-sm">{img.description}</div>
            <div className="text-gray-400 text-xs">{new Date(img.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 