import { useState, useEffect, useRef } from "react";

const DEFAULT_DATE = "2026-08-15";
const DEFAULT_TIME = "08:00";
const DEFAULT_LOCATION = "Nhà hát lớn Hà Nội";
const DEFAULT_TITLE = "Lễ Tốt Nghiệp";
const DEFAULT_NOTES = "Hãy mang mã code để nhận quà bất ngờ! 🎁";

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
  const [dateStr, setDateStr] = useState(DEFAULT_DATE);
  const [timeStr, setTimeStr] = useState(DEFAULT_TIME);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [t, setT] = useState(() => calc(parseDate(DEFAULT_DATE, DEFAULT_TIME)));

  const targetMsRef = useRef(parseDate(dateStr, timeStr));

  // sync from firebase
  useEffect(() => {
    import("../firebase/event")
      .then(({ onEventSettings }) => {
        onEventSettings((s) => {
          setDateStr(s.date);
          setTimeStr(s.time);
          setLocation(s.location);
          setTitle(s.title);
          setNotes(s.notes);
        });
      })
      .catch(() => {});
  }, []);

  // update target when date/time change
  useEffect(() => {
    targetMsRef.current = parseDate(dateStr, timeStr);
    setT(calc(targetMsRef.current));
  }, [dateStr, timeStr]);

  // tick every second
  useEffect(() => {
    setT(calc(targetMsRef.current));
    const id = setInterval(() => setT(calc(targetMsRef.current)), 1000);
    return () => clearInterval(id);
  }, []);

  if (t.done) {
    return (
      <section className="py-20 bg-gray-light" id="countdown">
        <div
          className="px-6 mx-auto text-center"
          style={{ maxWidth: "var(--container-max)" }}
        >
          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-navy mb-2">
            🎉 {title} ĐÃ DIỄN RA! 🎉
          </h2>
          <p className="text-gray-dark text-lg mb-6">
            Cảm ơn mọi người đã đến chúc mừng!
          </p>
          <EventDetails
            date={dateStr}
            time={timeStr}
            location={location}
            notes={notes}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-light" id="countdown">
      <div
        className="flex-col px-6 mx-auto text-center"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-navy mb-2">
          ⏳ Còn
        </h2>

        <div className="flex gap-6 justify-center flex-wrap mt-10">
          {[
            { label: "Ngày", value: t.days },
            { label: "Giờ", value: t.hours },
            { label: "Phút", value: t.minutes },
            { label: "Giây", value: t.seconds },
          ].map((b) => (
            <div
              key={b.label}
              className="bg-white rounded-2xl p-6 max-md:p-4 max-md:min-w-[70px] min-w-[100px] shadow-sm flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(20,136,219,.15)]"
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

        <p className="text-gray-dark text-lg mb-10 mt-10">
          đến <strong>{title}</strong>!
        </p>

        <div className="mt-12">
          <EventDetails
            date={dateStr}
            time={timeStr}
            location={location}
            notes={""}
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
    <div className="inline-flex flex-col sm:flex-row gap-4 sm:gap-8 items-center justify-center bg-white rounded-2xl px-8 py-5 shadow-sm mx-auto">
      <div className="flex items-center gap-2">
        <span className="text-xl">📅</span>
        <span className="font-semibold text-sm">
          {date} • {time}
        </span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-gray-200" />
      <div className="flex items-center gap-2">
        <span className="text-xl">📍</span>
        <span className="font-semibold text-sm">{location}</span>
      </div>
      {notes && (
        <>
          <div className="hidden sm:block w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xl">📌</span>
            <span className="text-sm text-gray-dark">{notes}</span>
          </div>
        </>
      )}
    </div>
  );
}
