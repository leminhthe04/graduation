import { useI18n } from "../i18n";

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="relative overflow-hidden pt-6 pb-4">
      <div className="absolute inset-0 bg-linear-to-b from-navy via-navy/95 to-[#020270]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue/15 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue/8 rounded-full blur-3xl animate-blob-3" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue/40 to-transparent" />

      <div className="relative z-10 px-6 mx-auto text-center" style={{ maxWidth: 'var(--container-max)' }}>
        <p className="text-sm font-semibold text-white/80 hover-lift">{t('footer.text')}</p>
        <p className="text-xs text-blue/90 italic mt-1 max-w-md mx-auto leading-relaxed hover-text-glow">"{t('footer.quote')}"</p>
        <div className="mt-4 w-24 h-0.5 mx-auto bg-linear-to-r from-transparent via-blue/50 to-transparent grow-line-center" />
      </div>
    </footer>
  )
}
