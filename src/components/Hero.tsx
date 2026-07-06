import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import Confetti from "./Confetti";
import { burstConfetti } from "./Confetti";
import { onHeroImage } from "../firebase/event";

export default function Hero() {
  const { t } = useI18n()
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    const unsub = onHeroImage(setHeroImage);
    return () => unsub();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex items-center justify-center text-center relative overflow-hidden pt-[70px]" id="hero">
      <Confetti active />

      {/* Animated blob background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue/15 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-navy/10 rounded-full blur-3xl animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue/5 rounded-full blur-3xl animate-blob-3" />
      </div>

      <div className="absolute inset-0 bg-linear-to-br from-blue/[0.03] to-navy/[0.03] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 mx-auto" style={{ maxWidth: "var(--container-max)" }}>
        {/* Avatar */}
        <div className="w-50 h-50 max-md:w-40 max-md:h-40 max-[480px]:w-32.5 max-[480px]:h-32.5 relative overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(20,136,219,0.12)] elastic-reveal">
          <img
            src={heroImage || "/hero-placeholder.jpg"}
            alt="Tốt nghiệp"
            className="w-full h-full object-cover"
            id="hero-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/hero-placeholder.jpg";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-white pointer-events-none" />
        </div>

        {/* Title — overlaps bottom of avatar */}
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-black leading-[1.1] -mt-8 max-md:-mt-6 flex flex-wrap justify-center gap-x-4 relative z-20 stagger-children">
          <span className="hover-lift">{t('hero.title.prefix')}</span>
          <span className="text-navy hover-text-glow">{t('hero.title.highlight')}</span>
          <span className="hover-lift">{t('hero.title.suffix')}</span>
        </h1>

        <p className="text-lg text-gray-dark max-w-[500px] mt-6 fade-up">
          {t('hero.subtitle')}
        </p>

        <div className="flex gap-4 flex-wrap justify-center max-[480px]:flex-col max-[480px]:w-full mt-8 stagger-children">
          <button onClick={() => scrollTo("gallery")} className="glass-btn hover-glow hover-lift inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base ripple-click">
            {t('hero.viewPhotos')}
          </button>
          <button onClick={() => { scrollTo("checkin"); burstConfetti(); }} className="glass-btn-primary hover-glow-strong inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base ripple-click">
            <span className="relative z-10">{t('hero.checkinNow')}</span>
          </button>
        </div>

        <div className="mt-16 cursor-pointer text-gray-dark flex flex-col items-center gap-1 group" onClick={() => scrollTo("countdown")}>
          <span className="text-6xl text-blue/60 group-hover:text-blue transition-all duration-300 inline-block animate-bounce-custom group-hover:animate-heartbeat">↓</span>
        </div>
      </div>
    </section>
  );
}