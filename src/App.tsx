import { useState } from 'react'
import { I18nProvider } from './i18n'
import Header from './components/Header'
import LeftNav from './components/LeftNav'
import Hero from './components/Hero'
import Countdown from './components/Countdown'
import Gallery from './components/Gallery'
import CheckinForm from './components/CheckinForm'
import AdminModal from './components/AdminModal'
import Footer from './components/Footer'

export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <I18nProvider>
      <Header onAdminClick={() => setAdminOpen(true)} />
      <LeftNav />
      <main>
        <Hero />
        <Countdown />
        <CheckinForm />
        <Gallery />
      </main>
      <Footer />
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </I18nProvider>
  )
}
