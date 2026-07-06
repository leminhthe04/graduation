import { useI18n } from "../i18n";

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="bg-navy text-white text-center py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue/20 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue/10 rounded-full blur-3xl animate-blob-3" />
      </div>
      <div className="relative z-10 px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <p>{t('footer.text')}</p>
        <p className="mt-2 opacity-70 italic text-sm">
          {t('footer.quote')}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
    </footer>
  )
}
