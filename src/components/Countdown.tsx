import { useState, useEffect, useRef } from "react";
import { useI18n } from "../i18n";
import { getField } from "../firebase/event";
import type { TranslatableField } from "../firebase/event";

const DEFAULT_DATE = "2026-08-15";
const DEFAULT_TIME = "08:00";

function parseDate(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).getTime();
}

function calc(ms: number) {
  const diff = ms - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: false,
  };
}

export default function Countdown() {
  const { t, lang } = useI18n();
  const [dateStr, setDateStr] = useState(DEFAULT_DATE);
  const [timeStr, setTimeStr] = useState(DEFAULT_TIME);
  const [location, setLocation] = useState<TranslatableField>({ vi: "" });
  const [notes, setNotes] = useState<TranslatableField>({ vi: "" });
  const [timer, setTimer] = useState(() =>
    calc(parseDate(DEFAULT_DATE, DEFAULT_TIME)),
  );

  const targetMsRef = useRef(parseDate(dateStr, timeStr));

  // sync from firebase
  useEffect(() => {
    import("../firebase/event")
      .then(({ onEventSettings }) => {
        onEventSettings((s) => {
          setDateStr(s.date);
          setTimeStr(s.time);
          setLocation(s.location);
          setNotes(s.notes);
        });
      })
      .catch(() => {});
  }, []);

  // update target when date/time change
  useEffect(() => {
    targetMsRef.current = parseDate(dateStr, timeStr);
    setTimer(calc(targetMsRef.current));
  }, [dateStr, timeStr]);

  // tick every second
  useEffect(() => {
    setTimer(calc(targetMsRef.current));
    const id = setInterval(() => setTimer(calc(targetMsRef.current)), 1000);
    return () => clearInterval(id);
  }, []);

  if (timer.done) {
    return (
      <section className="py-20 relative overflow-hidden" id="countdown">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 -left-40 w-72 h-72 bg-blue/10 rounded-full blur-3xl animate-blob-1" />
          <div className="absolute bottom-0 -right-40 w-80 h-80 bg-navy/8 rounded-full blur-3xl animate-blob-2" />
        </div>
        <div className="px-6 mx-auto text-center" style={{ maxWidth: "var(--container-max)" }}>
          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-navy mb-2 animate-text-shimmer">
            {t("countdown.ongoingTitle")}
          </h2>
          <p className="text-gray-dark text-lg mb-6 bounce-reveal">
            {t("countdown.doneMessage")}
          </p>
          <EventDetails
            date={dateStr}
            time={timeStr}
            location={getField(location, lang)}
            notes={getField(notes, lang)}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative overflow-hidden" id="countdown">
      {/* Blob background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-72 h-72 bg-blue/10 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-navy/8 rounded-full blur-3xl animate-blob-2" />
      </div>

      <div className="flex-col px-6 mx-auto text-center" style={{ maxWidth: "var(--container-max)" }}>
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-navy mb-2 blur-reveal">
          {t("countdown.remaining")}
        </h2>

          <div className="flex gap-6 justify-center flex-wrap mt-10 stagger-children">
            {[
              { key: "countdown.days", label: t("countdown.days"), value: timer.days },
              { key: "countdown.hours", label: t("countdown.hours"), value: timer.hours },
              { key: "countdown.minutes", label: t("countdown.minutes"), value: timer.minutes },
              { key: "countdown.seconds", label: t("countdown.seconds"), value: timer.seconds },
            ].map((b) => (
              <div
                key={b.label}
                className="glass-card rounded-3xl p-6 max-md:p-4 w-[100px] max-md:w-[70px] flex flex-col items-center hover-float"
              >
                <span className="text-5xl max-md:text-3xl font-black text-blue leading-none">
                  {String(b.value).padStart(2, "0")}
                </span>
                <span className="text-xs text-gray-dark uppercase tracking-widest mt-2">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-navy mb-2 mt-10 fade-up">
            {t("countdown.upcomingTitle")}
          </h2>

          <div className="mt-12 slide-up">
            <EventDetails
              date={dateStr}
              time={timeStr}
              location={getField(location, lang)}
              notes={getField(notes, lang)}
            />
          </div>
        </div>
    </section>
  );
}

function EventDetails({
  date,
  time,
  location,
  notes,
}: {
  date: string;
  time: string;
  location: string;
  notes: string;
}) {
  return (
    <div className="glass-panel inline-flex flex-col sm:flex-row gap-4 sm:gap-8 items-center justify-center rounded-3xl px-7 py-5 mx-auto fade-up">
      <div className="flex items-center gap-2">
        <span className="text-xl animate-wave">📅</span>
        <span className="font-semibold text-sm">
          {date} • {time}
        </span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-white/30" />
      <div className="flex items-center gap-1 max-w-[70%]">
        <span className="text-xl animate-wave" style={{ animationDelay: '-0.5s' }}>📍</span>
        <span className="font-semibold text-sm whitespace-pre-wrap break-words">{location}</span>
      </div>
      {notes && (
        <>
          <div className="hidden sm:block w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <span className="text-xl animate-wave" style={{ animationDelay: '-1s' }}>📞</span>
            <span className="font-semibold text-sm">{notes}</span>
          </div>
        </>
      )}
    </div>
  );
}
