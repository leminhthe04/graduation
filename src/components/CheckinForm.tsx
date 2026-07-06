import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "../i18n";
import { getField } from "../firebase/event";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  onEventSettings,
  getEventSettings,
  getEventDefault,
} from "../firebase/event";
import type { EventSettings } from "../firebase/event";
import emailjs from "@emailjs/browser";
import { burstConfetti } from "./Confetti";

export default function CheckinForm() {
  const { t, lang } = useI18n()
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code: string;
    settings: EventSettings;
  } | null>(null);
  const [error, setError] = useState<{ key: string; vars?: Record<string, string> } | null>(null);
  const [settings, setSettings] = useState<EventSettings>(getEventDefault());
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onEventSettings((s) => setSettings(s));
    return unsub;
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          } else {
            e.target.classList.remove("visible");
          }
        }),
      { threshold: 0.2 },
    );
    const children = formRef.current.querySelectorAll(".fade-up");
    children.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !email.trim()) {
      setError({ key: 'checkin.errorRequired' });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const emailTrim = email.trim();

      const existingQ = query(
        collection(db, "secret_codes"),
        where("email", "==", emailTrim),
        limit(1),
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        setError({ key: 'checkin.emailExists', vars: { email: emailTrim } });
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "secret_codes"),
        where("used", "==", false),
        limit(1),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError({ key: 'checkin.errorNoCode' });
        setLoading(false);
        return;
      }

      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();
      const code = codeData.code;

      await updateDoc(doc(db, "secret_codes", codeDoc.id), {
        used: true,
        assignedTo: nickname.trim(),
        email: emailTrim,
      });

      await addDoc(collection(db, "checkins"), {
        nickname: nickname.trim(),
        email: emailTrim,
        code,
        confirmed: false,
        timestamp: Timestamp.now(),
      });

      const evt = settings || (await getEventSettings());

      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: emailTrim,
            to_name: nickname.trim(),
            secret_code: code,
            event_date: evt.date,
            event_time: evt.time,
            event_location: evt.location,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        );
      } catch (e) {
        console.error("EmailJS error:", e);
      }

      setResult({ code, settings: evt });
      burstConfetti();
    } catch (err) {
      setError({ key: 'checkin.errorGeneric', vars: { msg: (err as any).message } });
    }
    setLoading(false);
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result!.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [result]);

  if (result) {
    return (
      <section className="py-20" id="checkin" ref={formRef}>
        <div
          className="px-6 mx-auto text-center"
          style={{ maxWidth: "var(--container-max)" }}
        >
          <div className="max-w-[520px] mx-auto glass-panel-heavy rounded-3xl p-9 max-md:p-8 fade-in visible">
            <div className="text-6xl mb-4 animate-pop-in animate-heartbeat">🎉</div>
            <h2 className="text-2xl font-black mb-4 text-gradient">{t('checkin.success')}</h2>
            <p className="mb-4">{t('checkin.yourCode')}</p>
            <div className="relative text-2xl font-black tracking-[4px] text-navy bg-white/70 backdrop-blur-sm p-4 pr-11 rounded-2xl my-4 font-mono select-all text-left border border-white/40 hover-glow">
              {result.code}
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-lg transition-all duration-300 active:scale-90 hover:bg-white/70 hover-pop"
                title={t('checkin.copyTitle')}
              >
                {copied ? (
                  <span className="text-green-600 animate-pop-in">✓</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="text-gray-dark text-sm leading-relaxed">
              {t('checkin.emailSent')}
              <br />
              {t('checkin.bringCode', { title: getField(result.settings.title, lang) })}
            </p>
            <div className="mt-6 pt-6 border-t border-white/30 font-semibold text-blue space-y-1">
              <p>
                📅 {result.settings.date} • ⏰ {result.settings.time}
              </p>
              <p className="whitespace-pre-wrap">📍 {getField(result.settings.location, lang)}</p>
              {getField(result.settings.notes, lang) && (
                <p className="text-sm text-gray-dark whitespace-pre-wrap">
                  📌 {getField(result.settings.notes, lang)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" id="checkin" ref={formRef}>
      <div
        className="px-6 mx-auto "
        style={{ maxWidth: "var(--container-max)" }}
      >
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-center text-navy mb-2 slide-up">
          {t('checkin.title')}
        </h2>
        <p className="text-center text-gray-dark text-lg mb-12 slide-up">
          {t('checkin.description')}
        </p>

        {/* {settings && (
          <div className="text-center mb-8 fade-up">
            <div className="glass-panel inline-flex flex-wrap gap-4 items-center justify-center rounded-2xl px-6 py-3 text-sm">
              <span>
                📅 {settings.date} • {settings.time}
              </span>
              <span className="hidden sm:inline w-px h-4 bg-white/30" />
              <span className="whitespace-pre-wrap">📍 {getField(settings.location, lang)}</span>
              {getField(settings.notes, lang) && (
                <>
                  <span className="hidden sm:inline w-px h-4 bg-white/30" />
                  <span className="whitespace-pre-wrap">📞 {getField(settings.notes, lang)}</span>
                </>
              )}
            </div>
          </div>
        )} */}

        <form
          className="max-w-[480px] mx-auto glass-panel-heavy rounded-2xl p-10 max-md:p-6 scale-reveal"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-[#fee] text-[#c00] p-3 rounded-xl mb-4 font-medium text-sm animate-shake">
              {t(error.key, error.vars)}
            </div>
          )}

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-navy">{t('checkin.nickname')}</label>
              <input
                type="text"
                placeholder={t('checkin.nicknamePlaceholder')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-full font-sans text-base outline-none transition-all duration-300 glass-input input-glow"
              />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-navy">
              {t('checkin.emailLabel')}
            </label>
              <input
                type="email"
                placeholder={t('checkin.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full font-sans text-base outline-none transition-all duration-300 glass-input input-glow"
              />
          </div>

          <button
            type="submit"
            className="glass-btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base disabled:opacity-50 disabled:pointer-events-none hover-glow-strong btn-press"
            disabled={loading}
          >
            {loading ? t('checkin.loading') : t('checkin.getCode')}
          </button>

          <p className="mt-4 text-xs text-gray-dark text-center">
            {t('checkin.security')}
          </p>
        </form>
      </div>
    </section>
  );
}
