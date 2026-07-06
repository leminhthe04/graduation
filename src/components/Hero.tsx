import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import Confetti from "./Confetti";
import { burstConfetti } from "./Confetti";
import { onHeroImage } from "../firebase/event";

export default function Hero() {
  const { t } = useI18n()
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [heroImage, setHeroImage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onHeroImage(setHeroImage);
    return () => unsub();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            setVisible(true);
          }
        }),
      { threshold: 0.3 },
    );
    [titleRef, imgRef, subtitleRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden pt-[70px]"
      id="hero"
    >
      <Confetti active />

      {/* Fluid blobs background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue/15 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy/10 rounded-full blur-3xl animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue/5 rounded-full blur-3xl animate-blob-3" />
      </div>

      <div className="absolute inset-0 bg-linear-to-br from-blue/[0.03] to-navy/[0.03] pointer-events-none" />

      <div
        className="relative z-10 flex flex-col items-center px-6 mx-auto"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div
          className={`w-50 h-50 max-md:w-40 max-md:h-40 max-[480px]:w-32.5 max-[480px]:h-32.5 fade-up relative overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(20,136,219,0.15)] transition-all duration-700 hover:scale-105 hover:shadow-[0_12px_60px_rgba(20,136,219,0.25)] ${visible ? "visible" : ""}`}
          ref={imgRef as any}
        >
          <div className="absolute inset-0 z-10 bg-linear-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
          <img
            src={heroImage || "/hero-placeholder.jpg"}
            alt="Tốt nghiệp"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            id="hero-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/hero-placeholder.jpg";
            }}
          />
        </div>

        <h1
          className={`text-[clamp(2rem,6vw,3.5rem)] font-black leading-[1.1] fade-up -mt-8 max-md:-mt-6 ${visible ? "visible" : ""}`}
          ref={titleRef as any}
          style={{ transitionDelay: "0.15s" }}
        >
          {t('hero.title.prefix')}<span className="text-navy">{t('hero.title.highlight')}</span>{t('hero.title.suffix')}
        </h1>

        <p
          className={`text-lg text-gray-dark max-w-[500px] fade-up mt-8 ${visible ? "visible" : ""}`}
          ref={subtitleRef as any}
          style={{ transitionDelay: "0.3s" }}
        >
          {t('hero.subtitle')}
        </p>

        <div className={`flex gap-4 flex-wrap justify-center max-[480px]:flex-col max-[480px]:w-full mt-8 fade-up ${visible ? "visible" : ""}`} style={{ transitionDelay: "0.45s" }}>
          <button
            onClick={() => scrollTo("gallery")}
            className="glass-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base"
          >
            {t('hero.viewPhotos')}
          </button>

          <button
            onClick={() => {
              scrollTo("checkin");
              burstConfetti();
            }}
            className="glass-btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base"
          >
            <span className="relative z-10">{t('hero.checkinNow')}</span>
          </button>
        </div>

        <div
          className="mt-25 cursor-pointer text-gray-dark flex flex-col items-center gap-1 group"
          onClick={() => scrollTo("countdown")}
        >
          <span className="text-6xl text-blue/60 group-hover:text-blue transition-all duration-300 inline-block animate-bounce-custom">↓</span>
        </div>
      </div>
    </section>
  );
}
