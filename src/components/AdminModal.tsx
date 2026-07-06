import { useState, useEffect, useRef } from "react";
import { useI18n } from "../i18n";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase/config";
import {
  onEventSettings,
  saveEventSettings,
  getEventDefault,
  onHeroImage,
  saveHeroImage,
  clearOldHeroImage,
} from "../firebase/event";
import type { EventSettings } from "../firebase/event";
import { verifyAdmin, updateAdminPassword } from "../utils/auth";

interface Checkin {
  id: string;
  nickname: string;
  email: string;
  code: string;
  confirmed: boolean;
}

interface Photo {
  id: string;
  url: string;
  caption: string;
  public: boolean;
}

interface Code {
  id: string;
  code: string;
  used: boolean;
  assignedTo: string | null;
  email: string | null;
}

type Tab = "checkins" | "photos" | "codes" | "event" | "password" | "hero";

const btn =
  "inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold font-sans text-sm cursor-pointer transition-all duration-300 relative overflow-hidden active:scale-95";
const btnPrimary = `${btn} bg-blue text-white hover:bg-navy hover:shadow-[0_6px_20px_rgba(20,136,219,.4)] hover:-translate-y-0.5`;
const btnOutline = `${btn} bg-transparent text-blue border-2 border-blue hover:bg-blue hover:text-white hover:shadow-[0_6px_20px_rgba(20,136,219,.25)] hover:-translate-y-0.5`;
const btnDanger = `${btn} bg-[#e74c3c] text-white hover:bg-[#c0392b] hover:shadow-[0_6px_20px_rgba(231,76,60,.4)] hover:-translate-y-0.5`;
const inputCls =
  "px-4 py-2.5 border-2 border-gray-200 rounded-2xl font-sans text-sm outline-none transition-all duration-300 focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)] bg-white";

export default function AdminModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n()
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState<Tab>("checkins");
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [bulkCount, setBulkCount] = useState(5);
  const [eventSettings, setEventSettings] =
    useState<EventSettings>(getEventDefault());
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroDragOver, setHeroDragOver] = useState(false);
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewIds, setPreviewIds] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectRect, setSelectRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const selectStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const previewIdsRef = useRef<Set<string>>(new Set());
  const shiftHeldRef = useRef(false);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    const unsub1 = onSnapshot(
      query(collection(db, "checkins"), orderBy("timestamp", "desc")),
      (snap) =>
        setCheckins(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Checkin),
        ),
    );
    const unsub2 = onSnapshot(
      query(collection(db, "photos"), orderBy("uploadedAt", "desc")),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Photo,
        );
        items.sort((a, b) => {
          if (a.public && !b.public) return -1;
          if (!a.public && b.public) return 1;
          return 0;
        });
        setPhotos(items);
      },
    );
    const unsub3 = onSnapshot(
      query(collection(db, "secret_codes"), orderBy("code")),
      (snap) =>
        setCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Code)),
    );
    const unsub4 = onEventSettings((s) => setEventSettings(s));
    const unsub5 = onHeroImage(setHeroImageUrl);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [authed]);

  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setPass("");
      setSelectedIds(new Set());
      setLastClickedId(null);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIds(new Set());
    setLastClickedId(null);
  }, [tab]);

  const [changingPass, setChangingPass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleLogin = async () => {
    const ok = await verifyAdmin(pass);
    if (ok) setAuthed(true);
    else alert(t('admin.wrongPass'));
    setPass("");
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      alert(t('admin.passTooShort'));
      return;
    }
    if (newPass !== confirmPass) {
      alert(t('admin.passMismatch'));
      return;
    }
    await updateAdminPassword(newPass);
    alert(t('admin.passChanged'));
    setChangingPass(false);
    setNewPass("");
    setConfirmPass("");
  };

  const handleConfirm = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "checkins", id), { confirmed: !current });
  };

  const handleDeletePhoto = async (id: string, url: string) => {
    await deleteDoc(doc(db, "photos", id));
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch {}
  };

  const handleTogglePublic = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "photos", id), { public: !current });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    selectStartRef.current = { x: e.clientX, y: e.clientY };
    shiftHeldRef.current = e.shiftKey;
    setSelectRect({
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
      width: 0,
      height: 0,
    });

    const handleMove = (ev: MouseEvent) => {
      const start = selectStartRef.current;
      if (!start || !gridRef.current) return;
      const r = gridRef.current.getBoundingClientRect();
      const left = Math.min(start.x, ev.clientX) - r.left;
      const top = Math.min(start.y, ev.clientY) - r.top;
      const width = Math.abs(ev.clientX - start.x);
      const height = Math.abs(ev.clientY - start.y);
      setSelectRect({ left, top, width, height });

      if (Math.abs(ev.clientX - start.x) > 5 || Math.abs(ev.clientY - start.y) > 5) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          if (!shiftHeldRef.current) setSelectedIds(new Set());
        }
        const sel = {
          left: Math.min(start.x, ev.clientX),
          top: Math.min(start.y, ev.clientY),
          right: Math.max(start.x, ev.clientX),
          bottom: Math.max(start.y, ev.clientY),
        };
        const ids: string[] = [];
        gridRef.current.querySelectorAll("[data-photo-id]").forEach((el) => {
          const pr = el.getBoundingClientRect();
          if (pr.left < sel.right && pr.right > sel.left && pr.top < sel.bottom && pr.bottom > sel.top) {
            ids.push(el.getAttribute("data-photo-id")!);
          }
        });
        setPreviewIds(new Set(ids));
        previewIdsRef.current = new Set(ids);
      }
    };

    const handleUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);

      const start = selectStartRef.current;
      if (!start || !gridRef.current) {
        setSelectRect(null);
        selectStartRef.current = null;
        return;
      }

      if (Math.abs(ev.clientX - start.x) <= 5 && Math.abs(ev.clientY - start.y) <= 5) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const photoEl = el?.closest("[data-photo-id]");
        if (photoEl) {
          const id = photoEl.getAttribute("data-photo-id")!;
          if (ev.shiftKey && lastClickedId && lastClickedId !== id) {
            const index1 = photos.findIndex(p => p.id === lastClickedId);
            const index2 = photos.findIndex(p => p.id === id);
            if (index1 !== -1 && index2 !== -1) {
              const s = Math.min(index1, index2);
              const e = Math.max(index1, index2);
              const rangeIds = photos.slice(s, e + 1).map(p => p.id);
              setSelectedIds((prev) => {
                const next = new Set(prev);
                rangeIds.forEach((rid) => next.add(rid));
                return next;
              });
            }
          } else {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }
          setLastClickedId(id);
        } else {
          clearSelection();
          setLastClickedId(null);
        }
      } else {
        const newIds = previewIdsRef.current;
        if (shiftHeldRef.current) {
          setSelectedIds((prev) => {
            if (newIds.size === 0) return prev;
            const merged = new Set(prev);
            newIds.forEach((id) => merged.add(id));
            return merged;
          });
        } else if (newIds.size > 0) {
          setSelectedIds(new Set(newIds));
        }
      }

      setSelectRect(null);
      selectStartRef.current = null;
      isDraggingRef.current = false;
      setPreviewIds(new Set());
      previewIdsRef.current = new Set();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleBulkApprove = async () => {
    const promises = [...selectedIds].map(id => updateDoc(doc(db, "photos", id), { public: true }));
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleBulkHide = async () => {
    const promises = [...selectedIds].map(id => updateDoc(doc(db, "photos", id), { public: false }));
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.size} ảnh đã chọn?`)) return;
    const promises = [...selectedIds].map(async id => {
      const p = photos.find(x => x.id === id);
      if (p) {
        await deleteDoc(doc(db, "photos", id));
        try {
          const storageRef = ref(storage, p.url);
          await deleteObject(storageRef);
        } catch {}
      }
    });
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const WORDS = [
    // 🐾 Animals
    "PANDA",
    "KOALA",
    "OTTER",
    "FOX",
    "OWL",
    "BUNNY",
    "PUPPY",
    "KITTEN",
    "HEDGEHOG",
    "DOLPHIN",
    "PENGUIN",
    "SLOTH",
    "RACCOON",
    "FLAMINGO",
    "CAPYBARA",
    "MEERKAT",
    "NARWHAL",
    "PLATYPUS",
    "REDPANDA",
    "SEAL",
    "SQUIRREL",
    "ALPACA",
    "LLAMA",
    "FENNEC",
    // 🎮 Fun / random
    "CHEEMS",
    "GIGACHAD",
    "YEET",
    "SUS",
    "POGGERS",
    "VIBING",
    "SLAY",
    "BASED",
    "CAPPUCCINO",
    "NOODLE",
    "WAFFLE",
    "BACON",
    "MOCHI",
    "BUBBLE",
    "PIXEL",
    "ZIGZAG",
    "BOING",
    "PLONK",
    // 🎨 Colors
    "LIME",
    "AZURE",
    "CORAL",
    "VIOLET",
    "CRIMSON",
    "PEACH",
    "MINT",
    "LAVENDER",
    "SALMON",
    "COBALT",
    "PLUM",
    "JADE",
    // 🍔 Food
    "PIZZA",
    "TACO",
    "SUSHI",
    "RAMEN",
    "DONUT",
    "BACON",
    "WAFFLE",
    "PANCAKE",
    "KIMCHI",
    "MATCHA",
    "CHEESE",
    "BACON",
    // 🌍 Misc funny
    "SNAZZY",
    "GOBLIN",
    "GREMLIN",
    "WAFFLE",
    "BLORP",
    "FLUFFY",
    "SPARKLE",
    "BOOP",
    "DINGUS",
    "SCHMEEP",
    "BLOOP",
    "ZONK",
    "WIZARD",
    "GOOFY",
    "CHONKY",
    "SPROING",
    "FLIBBERT",
  ];

  const generateCode = () => {
    const prefix = "GRAD-KHOAI-";
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${prefix}${word}${num}`;
  };

  const handleGenerateCodes = async () => {
    for (let i = 0; i < bulkCount; i++) {
      await addDoc(collection(db, "secret_codes"), {
        code: generateCode(),
        used: false,
        assignedTo: null,
        email: null,
        createdAt: Timestamp.now(),
      });
    }
    alert(t('admin.codesGenerated', { count: bulkCount }));
  };

  const handleSaveEvent = async () => {
    setSaving(true);
    await saveEventSettings(eventSettings);
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] pointer-events-none">
      <div
        className="fixed inset-x-0 bottom-0 bg-black/60 pointer-events-auto animate-fade-in"
        style={{ top: '70px' }}
        onClick={onClose}
      />
      <div className="relative z-10 flex items-center justify-center p-4 w-full h-full pointer-events-none">
        <div
          className="bg-white rounded-3xl w-full max-w-[900px] max-h-[85vh] overflow-y-auto animate-scale-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pb-0">
          <h2 className="text-xl font-black text-navy">
            {t('admin.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {!authed ? (
          <div className="p-6 text-center">
            <div className="mt-4">
              <input
                type="password"
                placeholder={t('admin.passPlaceholder')}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className={`${inputCls} max-w-[280px] mb-4`}
              />
              <br />
              <button className={btnPrimary} onClick={handleLogin}>
                {t('admin.login')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              <button
                className={`${tab === "event" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("event")}
              >
                {t('admin.tab.event')}
              </button>
              <button
                className={`${tab === "hero" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("hero")}
              >
                {t('admin.tab.hero')}
              </button>
              <button
                className={`${tab === "checkins" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("checkins")}
              >
                {t('admin.tab.checkins')} ({checkins.length})
              </button>
              <button
                className={`${tab === "photos" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("photos")}
              >
                {t('admin.tab.photos')} ({photos.length})
              </button>
              <button
                className={`${tab === "codes" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("codes")}
              >
                {t('admin.tab.codes')} ({codes.length})
              </button>
              <button
                className={`${tab === "password" ? btnPrimary : btnOutline}`}
                onClick={() => setTab("password")}
              >
                {t('admin.tab.password')}
              </button>
            </div>

            {tab === "event" && (
              <div className="max-w-lg mx-auto space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-sm font-black text-navy mb-2">🎓 {t('admin.eventName')}</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Tiếng Việt (VI) *</label>
                      <input
                        value={eventSettings.title?.vi || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            title: { ...p.title, vi: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">English (EN - {t('admin.optional')})</label>
                      <input
                        value={eventSettings.title?.en || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            title: { ...p.title, en: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Français (FR - {t('admin.optional')})</label>
                      <input
                        value={eventSettings.title?.fr || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            title: { ...p.title, fr: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-sm font-black text-navy mb-2">📍 {t('admin.location')}</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Tiếng Việt (VI) *</label>
                      <input
                        value={eventSettings.location?.vi || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            location: { ...p.location, vi: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">English (EN - {t('admin.optional')})</label>
                      <input
                        value={eventSettings.location?.en || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            location: { ...p.location, en: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Français (FR - {t('admin.optional')})</label>
                      <input
                        value={eventSettings.location?.fr || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            location: { ...p.location, fr: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full`}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-sm font-black text-navy mb-2">📝 {t('admin.notes')}</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Tiếng Việt (VI) *</label>
                      <textarea
                        value={eventSettings.notes?.vi || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            notes: { ...p.notes, vi: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full resize-none`}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">English (EN - {t('admin.optional')})</label>
                      <textarea
                        value={eventSettings.notes?.en || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            notes: { ...p.notes, en: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full resize-none`}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-dark mb-1">Français (FR - {t('admin.optional')})</label>
                      <textarea
                        value={eventSettings.notes?.fr || ''}
                        onChange={(e) =>
                          setEventSettings((p) => ({
                            ...p,
                            notes: { ...p.notes, fr: e.target.value }
                          }))
                        }
                        className={`${inputCls} w-full resize-none`}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    {t('admin.date')}
                  </label>
                  <input
                    type="date"
                    value={eventSettings.date}
                    onChange={(e) =>
                      setEventSettings((p) => ({ ...p, date: e.target.value }))
                    }
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    {t('admin.time')}
                  </label>
                  <input
                    type="time"
                    value={eventSettings.time}
                    onChange={(e) =>
                      setEventSettings((p) => ({ ...p, time: e.target.value }))
                    }
                    className={`${inputCls} w-full`}
                  />
                </div>

                <div className="text-center pt-2">
                  <button
                    className={btnPrimary}
                    onClick={handleSaveEvent}
                    disabled={saving}
                  >
                    {saving ? t('admin.saving') : t('admin.save')}
                  </button>
                </div>
              </div>
            )}

            {tab === "hero" && (
              <div className="max-w-lg mx-auto space-y-4">
                <h3 className="text-lg font-bold text-navy text-center">{t('admin.heroTitle')}</h3>
                <p className="text-sm text-gray-dark text-center">
                  {t('admin.heroDesc')}
                </p>

                <div className="flex justify-center">
                  <div
                    className={`w-[180px] h-[180px] overflow-hidden shadow-md rounded-xl relative group cursor-pointer transition-all duration-300 ${
                      heroDragOver ? 'ring-4 ring-blue scale-105 brightness-110' : ''
                    }`}
                    onClick={() => document.getElementById("hero-file-input")?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setHeroDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setHeroDragOver(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHeroDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) setHeroFile(file);
                    }}
                  >
                    <img
                      src={
                        heroFile
                          ? URL.createObjectURL(heroFile)
                          : heroImageUrl || "/hero-placeholder.jpg"
                      }
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/hero-placeholder.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg">
                        📤
                      </span>
                    </div>
                    {heroSuccess && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                          <span className="text-white text-3xl font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <input
                  id="hero-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                />

                {heroUploading && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue transition-all duration-300 rounded-full"
                        style={{ width: `${heroProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <button
                    className={btnPrimary}
                    disabled={!heroFile || heroUploading}
                    onClick={async () => {
                      if (!heroFile) return;
                      setHeroUploading(true);
                      setHeroProgress(0);
                      try {
                        const safeName = heroFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
                        const storageRef = ref(storage, `hero/${Date.now()}_${safeName}`);
                        const task = uploadBytesResumable(storageRef, heroFile);
                        task.on("state_changed", (snap) => {
                          setHeroProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
                        });
                        await task;
                        const url = await getDownloadURL(storageRef);
                        await saveHeroImage(url);
                        await clearOldHeroImage();
                        setHeroImageUrl(url);
                        setHeroFile(null);
                        setHeroSuccess(true);
                        setTimeout(() => setHeroSuccess(false), 2000);
                      } catch {}
                      setHeroUploading(false);
                    }}
                  >
                    {heroUploading ? `${t('admin.heroUploading')} ${heroProgress}%` : t('admin.heroUpload')}
                  </button>

                  {heroImageUrl && (
                    <button
                      className={btnDanger}
                      onClick={async () => {
                        if (!confirm(t('admin.heroConfirmDelete'))) return;
                        try {
                          const storageRef = ref(storage, heroImageUrl);
                          await deleteObject(storageRef);
                        } catch {}
                        await saveHeroImage("");
                        setHeroImageUrl("");
                      }}
                    >
                      {t('admin.heroDelete')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === "checkins" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-light">
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                        Nickname
                      </th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                        Email
                      </th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                        Code
                      </th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                        Confirmed
                      </th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((c) => (
                      <tr key={c.id} className="hover:bg-blue/[0.04]">
                        <td className="p-3 border-b border-gray-100">
                          {c.nickname}
                        </td>
                        <td className="p-3 border-b border-gray-100">
                          {c.email}
                        </td>
                        <td className="p-3 border-b border-gray-100 font-mono font-bold tracking-[1px] text-navy">
                          {c.code}
                        </td>
                        <td className="p-3 border-b border-gray-100">
                          {c.confirmed ? "✅" : "❌"}
                        </td>
                        <td className="p-3 border-b border-gray-100">
                          <button
                            className={btnOutline}
                            style={{
                              padding: ".3rem .7rem",
                              fontSize: ".8rem",
                            }}
                            onClick={() => handleConfirm(c.id, c.confirmed)}
                          >
                            {c.confirmed ? "Hoàn tác" : "Xác nhận"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "photos" && (
              <div>
                {/* Bulk action bar */}
                {(selectedIds.size > 0 || previewIds.size > 0) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-blue/10 border border-blue/20 rounded-2xl p-4 mb-5 animate-slide-up">
                    <span className="text-navy font-bold text-sm">
                      {previewIds.size > 0
                        ? `⚡ Đang chọn ${previewIds.size} ảnh`
                        : `⚡ Đã chọn ${selectedIds.size} ảnh`}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleBulkApprove}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-green-500 hover:bg-green-600 text-white cursor-pointer border-none active:scale-95 transition-all"
                      >
                        ✅ Duyệt hàng loạt
                      </button>
                      <button
                        onClick={handleBulkHide}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer border-none active:scale-95 transition-all"
                      >
                        🔒 Ẩn hàng loạt
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-600 text-white cursor-pointer border-none active:scale-95 transition-all"
                      >
                        🗑 Xóa hàng loạt
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer border-none active:scale-95 transition-all"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                )}

                <div
                  ref={gridRef}
                  className="flex flex-wrap gap-3 relative select-none"
                  onMouseDown={handleGridMouseDown}
                >
                  {photos.map((p) => {
                    const selected = selectedIds.has(p.id);
                    const previewed = previewIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        data-photo-id={p.id}
                        className={`relative rounded-xl overflow-hidden shadow-md group flex-shrink-0 transition-all cursor-pointer ${
                          selected
                            ? "ring-4 ring-blue scale-[0.98] brightness-[0.85]"
                            : previewed
                            ? "ring-2 ring-blue/50"
                            : "hover:scale-[1.01]"
                        } ${!p.public && !selected && !previewed ? "opacity-70" : ""}`}
                      >
                        <img
                          src={p.url}
                          alt={p.caption}
                          draggable={false}
                          className="h-44 w-auto max-w-none pointer-events-none"
                        />
                        
                        {/* Checkbox indicator */}
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold ${
                            selected
                              ? "bg-blue border-blue text-white shadow-md scale-110"
                              : "bg-black/40 border-white/60 text-transparent opacity-0 group-hover:opacity-100"
                          }`}>
                            ✓
                          </div>
                        </div>

                        <div className="absolute top-2 left-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.public ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}
                          >
                            {p.public ? "Public" : "Pending"}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-semibold flex flex-wrap gap-1">
                          <span className="w-full truncate">{p.caption || "Không có chú thích"}</span>
                          <button
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border-none cursor-pointer transition-all ${p.public ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-green-500 text-white hover:bg-green-600"}`}
                            onClick={(e) => { e.stopPropagation(); handleTogglePublic(p.id, p.public); }}
                          >
                            {p.public ? "🔒 Ẩn" : "✅ Duyệt"}
                          </button>
                          <button
                            className={btnDanger}
                            style={{ padding: ".2rem .5rem", fontSize: ".7rem" }}
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id, p.url); }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {selectRect && (
                    <div
                      className="absolute bg-blue/20 border-2 border-blue rounded-lg pointer-events-none z-50"
                      style={{
                        left: selectRect.left,
                        top: selectRect.top,
                        width: selectRect.width,
                        height: selectRect.height,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {tab === "password" && (
              <div className="max-w-md mx-auto text-center space-y-4 py-4">
                <h3 className="text-lg font-bold text-navy">🔐 Đổi mật khẩu admin</h3>
                {!changingPass ? (
                  <button className={btnOutline} onClick={() => setChangingPass(true)}>
                    Đổi mật khẩu
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Mật khẩu mới (≥6 ký tự)"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className={`${inputCls} w-full`}
                    />
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className={`${inputCls} w-full`}
                    />
                    <div className="flex gap-2 justify-center">
                      <button className={btnPrimary} onClick={handleChangePassword}>
                        Xác nhận
                      </button>
                      <button
                        className={btnOutline}
                        onClick={() => {
                          setChangingPass(false)
                          setNewPass("")
                          setConfirmPass("")
                        }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "codes" && (
              <div>
                <div className="text-center mb-6">
                  <label className="mr-2 text-sm">Số lượng mã: </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))}
                    className={`${inputCls} w-20 inline mx-2`}
                  />
                  <button className={btnPrimary} onClick={handleGenerateCodes}>
                    🎲 Tạo mã
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-light">
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                          Code
                        </th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                          Status
                        </th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                          Assigned To
                        </th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => (
                        <tr
                          key={c.id}
                          className={`hover:bg-blue/[0.04] ${c.used ? "opacity-50" : ""}`}
                        >
                          <td className="p-3 border-b border-gray-100 font-mono font-bold tracking-[1px] text-navy">
                            {c.code}
                          </td>
                          <td className="p-3 border-b border-gray-100">
                            {c.used ? "🔴 Used" : "🟢 Available"}
                          </td>
                          <td className="p-3 border-b border-gray-100">
                            {c.assignedTo || "-"}
                          </td>
                          <td className="p-3 border-b border-gray-100">
                            {c.email || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
