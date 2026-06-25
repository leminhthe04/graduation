import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Countdown from './components/Countdown'
import Gallery from './components/Gallery'
import CheckinForm from './components/CheckinForm'
import AdminModal from './components/AdminModal'
import Footer from './components/Footer'

export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <>
      <Header onAdminClick={() => setAdminOpen(true)} />
      <main>
        <Hero />
        <Countdown />
        <Gallery />
        <CheckinForm />
      </main>
      <Footer />
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  )
}
