import { useI18n } from "../i18n";

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="bg-navy text-white text-center py-8">
      <div className="px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <p>{t('footer.text')}</p>
        <p className="mt-2 opacity-70 italic text-sm">
          {t('footer.quote')}
        </p>
      </div>
    </footer>
  )
}
