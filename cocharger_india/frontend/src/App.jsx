import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import ChargeeView from './components/ChargeeView'
import PassesView from './components/PassesView'
import HostView from './components/HostView'
import GuardView from './components/GuardView'
import AuthView from './components/AuthView'
import { fetchProfiles, fetchVehicles, fetchBookings } from './api'

/**
 * Main App.jsx — Strict Auth Gate
 * Without signing in, the user ONLY sees the Sign In / Create Account page.
 * Only after signing in do they see the Navbar and application screens.
 */
export default function App() {
  const [activeMode, setActiveMode] = useState('explore')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chargepe24_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [profiles, setProfiles] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [guardPinToTest, setGuardPinToTest] = useState('')

  async function loadAllData() {
    const [profData, vehData, bookData] = await Promise.all([
      fetchProfiles(),
      fetchVehicles(),
      fetchBookings(),
    ])
    setProfiles(profData)
    setVehicles(vehData)
    setBookings(bookData)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  function handleLoginSuccess(profileData) {
    setCurrentUser(profileData)
    localStorage.setItem('chargepe24_user', JSON.stringify(profileData))
    loadAllData()
    setActiveMode('explore')
  }

  function handleLogout() {
    setCurrentUser(null)
    localStorage.removeItem('chargepe24_user')
    setActiveMode('explore')
  }

  function handleJumpToGuardPass(pinCode) {
    setGuardPinToTest(pinCode)
    setActiveMode('guard')
  }

  // STRICT AUTH GATE: If not signed in, render ONLY the Sign In / Create Account screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex flex-col justify-center px-4 py-10">
        <AuthView
          profiles={profiles}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  const visibleBookings = bookings.filter(
    (b) => String(b.chargee) === String(currentUser.id)
  )

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111]">
      <Navbar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        bookingsCount={visibleBookings.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeMode === 'explore' && (
          <ChargeeView
            currentUser={currentUser}
            profiles={profiles}
            vehicles={vehicles}
            onRefreshData={loadAllData}
            onBookingCreated={() => setActiveMode('passes')}
          />
        )}

        {activeMode === 'passes' && (
          <PassesView
            bookings={visibleBookings}
            onRefreshData={loadAllData}
            onJumpToGuardPass={handleJumpToGuardPass}
          />
        )}

        {activeMode === 'host' && (
          <HostView
            currentUser={currentUser}
            profiles={profiles}
            onRefreshData={loadAllData}
          />
        )}

        {activeMode === 'guard' && (
          <GuardView
            bookings={bookings}
            initialPin={guardPinToTest}
            onRefreshData={loadAllData}
          />
        )}
      </main>
    </div>
  )
}
