import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "../i18n";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { LayoutGrid, GalleryHorizontal } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  caption: string;
  uploadedAt?: { seconds: number };
  nickname?: string;
  feedback?: string;
}

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

let _idCounter = 0;

export default function Gallery() {
  const { t } = useI18n();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Photo | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggedRef = useRef(false);
  const [hiding, setHiding] = useState(false);
  const [uploadNickname, setUploadNickname] = useState("");
  const [uploadFeedback, setUploadFeedback] = useState("");

  useEffect(() => {
    const q = query(collection(db, "photos"), where("public", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Photo,
        );
        items.sort(
          (a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0),
        );
        setPhotos(items);
      },
      (err) => console.error("Gallery query error:", err),
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 },
    );
    const children = gridRef.current.querySelectorAll(".fade-up");
    children.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [photos, uploadFiles]);

  // ── Upload handlers ──

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const newFiles: UploadFile[] = arr.map((f) => ({
      id: String(++_idCounter),
      file: f,
      preview: URL.createObjectURL(f),
      progress: 0,
      uploading: false,
      uploaded: false,
    }));
    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSelect = () => inputRef.current?.click();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (uf: UploadFile) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === uf.id
          ? { ...f, uploading: true, progress: 0, error: undefined }
          : f,
      ),
    );
    try {
      const path = `uploads/${Date.now()}_${uf.file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, uf.file);

      task.on("state_changed", (snap) => {
        const progress = Math.round(
          (snap.bytesTransferred / snap.totalBytes) * 100,
        );
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, progress } : f)),
        );
      });

      await task;
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "photos"), {
        url,
        caption: "",
        public: false,
        uploadedAt: Timestamp.now(),
        nickname: uploadNickname || "",
        feedback: uploadFeedback || "",
      });

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uf.id
            ? { ...f, uploading: false, uploaded: true, progress: 100 }
            : f,
        ),
      );
    } catch (err: any) {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uf.id ? { ...f, uploading: false, error: err.message } : f,
        ),
      );
    }
  };

  const uploadAll = async () => {
    const pending = uploadFiles.filter((f) => !f.uploaded && !f.uploading);
    await Promise.all(pending.map((f) => uploadFile(f)));
  };

  const pendingCount = uploadFiles.filter(
    (f) => !f.uploaded && !f.uploading,
  ).length;

  const allUploaded =
    uploadFiles.length > 0 && uploadFiles.every((f) => f.uploaded);

  useEffect(() => {
    if (allUploaded) {
      const t1 = setTimeout(() => setHiding(true), 2000);
      const t2 = setTimeout(() => {
        setUploadFiles([]);
        setUploadNickname("");
        setUploadFeedback("");
        setHiding(false);
      }, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [allUploaded]);

  return (
    <section className="py-20 bg-gray-light" id="gallery" style={{ scrollMarginTop: 70 }}>
      <div
        className="px-6 mx-auto"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="text-center mb-8">
          <h1 className="text-[clamp(2rem,6vw,3rem)] font-black text-navy">
            {t("gallery.title")}
          </h1>
          <p className="text-gray-dark text-lg max-w-[600px] mx-auto mt-1">
            {t("gallery.subtitle")}
          </p>
          <p className="text-gray-dark/70 text-base max-w-[2000px] mx-auto mt-1">
            {t("gallery.uploadPrompt")}
          </p>
        </div>

        {/* ── Upload zone ── */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelect}
          className={`relative border-2 border-dashed rounded-3xl p-4 text-center cursor-pointer transition-all duration-300 mb-10 max-w-2xl mx-auto bg-white ${
            dragging
              ? "border-blue bg-blue/10 scale-[1.01]"
              : "border-gray-400 hover:border-blue hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="text-4xl mb-3">📸</div>
          <p className="text-base font-semibold text-navy mb-1">
            {t("gallery.dropHere")}
          </p>
          <p className="text-sm text-gray-dark">{t("gallery.clickToSelect")}</p>
        </div>

        {/* ── Upload previews ── */}

        {uploadFiles.length > 0 && (
          <div
            className={`max-w-5xl mx-auto mb-12 transition-all duration-500 ${hiding ? "opacity-0 translate-y-4" : ""}`}
          >
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-dark tracking-wider pl-1">
                  {t("gallery.nicknameLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("gallery.nicknamePlaceholder")}
                  value={uploadNickname}
                  onChange={(e) => setUploadNickname(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-full font-sans text-sm outline-none transition-all duration-300 bg-white focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)] max-w-[220px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-dark tracking-wider pl-1">
                  {t("gallery.feedbackLabel")}
                </label>
                <textarea
                  placeholder={t("gallery.feedbackPlaceholder")}
                  value={uploadFeedback}
                  onChange={(e) => setUploadFeedback(e.target.value)}
                  rows={1}
                  className="px-4 py-2 border-2 border-gray-200 rounded-full font-sans text-sm outline-none transition-all duration-300 bg-white focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)] w-[500px] resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-dark">
                {t("gallery.photosCount", { count: uploadFiles.length })}
                {pendingCount > 0 &&
                  ` ${t("gallery.pending", { count: pendingCount })}`}
              </p>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold font-sans text-sm cursor-pointer transition-all duration-300 bg-blue text-white hover:bg-navy hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(20,136,219,.35)] active:scale-95 border-none"
                >
                  {t("gallery.uploadAll")}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {uploadFiles.map((uf) => (
                <div
                  key={uf.id}
                  className={`relative rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group flex-shrink-0 ${
                    uf.uploaded ? "ring-2 ring-green-400" : ""
                  }`}
                >
                  <img
                    src={uf.preview}
                    alt=""
                    className="h-40 w-auto max-w-none"
                  />

                  {uf.uploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50">
                      <div
                        className="h-full bg-blue transition-all duration-300"
                        style={{ width: `${uf.progress}%` }}
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                    {!uf.uploaded && !uf.uploading && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            uploadFile(uf);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-full bg-white/90 text-sm font-semibold text-navy hover:bg-white active:scale-90 border-none cursor-pointer"
                        >
                          {t("gallery.uploadBtn")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(uf.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-full bg-white/90 text-sm font-semibold text-red-500 hover:bg-white active:scale-90 border-none cursor-pointer"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>

                  {uf.uploading && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm drop-shadow-md">
                      {uf.progress}%
                    </div>
                  )}

                  {uf.uploaded && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      ✓
                    </div>
                  )}

                  {uf.error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-[10px] p-1.5 text-center leading-tight">
                      {uf.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {allUploaded && (
              <div
                className={`mt-6 text-center transition-all duration-500 ${hiding ? "opacity-0 translate-y-4" : "animate-slide-up"}`}
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                  {t("gallery.thanks")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("carousel")}
            className={`w-9 h-9 flex items-center justify-center rounded-md border transition-all duration-300 cursor-pointer ${
              viewMode === "carousel"
                ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                : "bg-white/80 border-gray-300 text-gray-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50"
            }`}
            title={t("gallery.carousel")}
          >
            <GalleryHorizontal size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`w-9 h-9 flex items-center justify-center rounded-md border transition-all duration-300 cursor-pointer ${
              viewMode === "grid"
                ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                : "bg-white/80 border-gray-300 text-gray-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50"
            }`}
            title={t("gallery.grid")}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      )}

      {photos.length > 0 && viewMode === "carousel" && (
        <div className="relative group/carousel px-6">
          <div
            ref={gridRef}
            className="flex gap-8 overflow-x-auto pb-8 select-none"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#1488DB #e5e7eb",
              cursor: "grab",
            }}
            onMouseDown={(e) => {
              const el = gridRef.current;
              if (!el) return;
              draggedRef.current = false;
              const startX = e.pageX;
              const scrollLeft = el.scrollLeft;
              el.style.cursor = "grabbing";
              el.style.scrollBehavior = "auto";

              const onMove = (ev: MouseEvent) => {
                ev.preventDefault();
                el.scrollLeft = scrollLeft + (startX - ev.pageX);
                if (Math.abs(startX - ev.pageX) > 8) draggedRef.current = true;
              };

              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
                el.style.cursor = "";
              };

              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl cursor-pointer flex-shrink-0 shadow-md transition-all duration-400 group snap-start z-0 hover:z-10"
                onClick={() => {
                  if (!draggedRef.current) setSelected(p);
                }}
              >
                <img
                  src={p.url}
                  alt={p.caption}
                  loading="lazy"
                  draggable={false}
                  className="h-[35vh] max-h-[260px] w-auto rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl"
                />
                {p.nickname && (
                  <div className="mt-1 text-xs text-center text-gray-dark">
                    tải từ <strong>{p.nickname}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const el = gridRef.current;
              if (el) el.scrollBy({ left: -320, behavior: "smooth" });
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 rounded-full bg-white shadow-lg border-none flex items-center justify-center text-lg cursor-pointer transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-90"
          >
            ‹
          </button>
          <button
            onClick={() => {
              const el = gridRef.current;
              if (el) el.scrollBy({ left: 320, behavior: "smooth" });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 rounded-full bg-white shadow-lg border-none flex items-center justify-center text-lg cursor-pointer transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-90"
          >
            ›
          </button>
        </div>
      )}
      {photos.length > 0 && viewMode === "grid" && (
        <div className="flex flex-wrap justify-center">
          {photos.map((p) => (
            <div
              key={p.id}
              className="cursor-pointer relative z-0 hover:z-20 transition-all duration-200"
              onClick={() => setSelected(p)}
            >
              <img
                src={p.url}
                alt={p.caption}
                loading="lazy"
                draggable={false}
                className="max-h-[30vh] w-auto transition-transform duration-200 hover:scale-[1.1] hover:shadow-2xl"
              />
              {p.nickname && (
                <div className="text-xs text-center text-gray-dark pb-1">
                  tải từ <strong>{p.nickname}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {photos.length === 0 && (
        <p className="text-center text-gray-dark px-6">
          {t("gallery.noPhotos")}
        </p>
      )}

      {/* ── Lightbox ── */}
      {selected && (
        <div
          className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-w-[800px] w-full bg-white rounded-2xl overflow-hidden relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 bg-black/50 text-white border-none rounded-full w-10 h-10 text-lg cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-black/80 hover:scale-110 active:scale-90 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <img
              src={selected.url}
              alt={selected.caption}
              className="w-full max-h-[70vh] object-contain"
            />
            <p className="px-6 py-4 font-semibold text-center">
              {selected.caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
