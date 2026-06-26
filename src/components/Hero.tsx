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
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    const unsub = onHeroImage(setHeroImage);
    return () => unsub();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
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
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden pt-[70px]"
      id="hero"
    >
      <Confetti active />

      <div className="absolute inset-0 bg-linear-to-br from-blue/[0.05] to-navy/[0.05] pointer-events-none" />

      <div
        className="relative z-10 flex flex-col items-center px-6 mx-auto"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div
          className="w-50 h-50 max-md:w-40 max-md:h-40 max-[480px]:w-32.5 max-[480px]:h-32.5 fade-up relative overflow-hidden rounded-xl shadow-lg"
          ref={imgRef as any}
        >
          <img
            src={heroImage || "/hero-placeholder.jpg"}
            alt="Tốt nghiệp"
            className="w-full h-full object-cover"
            id="hero-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/hero-placeholder.jpg";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent via-0% to-white" />
        </div>

        <h1
          className="text-[clamp(2rem,6vw,3.5rem)] font-black leading-[1.1] fade-up -mt-8 max-md:-mt-6"
          ref={titleRef as any}
        >
          {t('hero.title.prefix')}<span className="text-navy">{t('hero.title.highlight')}</span>{t('hero.title.suffix')}
        </h1>

        <p
          className="text-lg text-gray-dark max-w-[500px] fade-up mt-8"
          ref={subtitleRef as any}
        >
          {t('hero.subtitle')}
        </p>

        <div className="flex gap-4 flex-wrap justify-center max-[480px]:flex-col max-[480px]:w-full mt-8">
          <button
            onClick={() => scrollTo("gallery")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base cursor-pointer transition-all duration-300 bg-white text-blue border-2 border-blue hover:bg-blue hover:text-white hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(20,136,219,.3)] active:scale-95"
          >
            {t('hero.viewPhotos')}
          </button>

          <button
            onClick={() => {
              scrollTo("checkin");
              burstConfetti();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold font-sans text-base cursor-pointer transition-all duration-300 bg-blue text-white hover:bg-navy hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(20,136,219,.45)] active:scale-95 border-none relative overflow-hidden"
          >
            <span className="relative z-10">{t('hero.checkinNow')}</span>
          </button>
        </div>

        <div
          className="mt-25 animate-bounce-custom cursor-pointer text-gray-dark flex flex-col items-center gap-1"
          onClick={() => scrollTo("countdown")}
        >
          <span className="text-6xl text-blue">↓</span>
        </div>
      </div>
    </section>
  );
}
