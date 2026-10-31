import React from 'react'

/**
 * Navbar.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 * Includes Sign In / User Profile & Sign Out controls
 */
export default function Navbar({
  activeMode,
  setActiveMode,
  bookingsCount,
  currentUser,
  onLogout,
}) {
  const navItems = [
    { id: 'explore', label: 'Explore Chargers' },
    { id: 'passes', label: `My Passes & Sessions (${bookingsCount || 0})` },
    { id: 'host', label: 'Become a Host' },
    { id: 'guard', label: 'Society Gate Check' },
  ]

  return (
    <header className="border-b-2 border-[#111111] bg-[#F5F4F0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Identity */}
        <div
          onClick={() => setActiveMode('explore')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src="/ChargePe24logo.png"
            alt="ChargePe24 Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#111111]"
          />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-[#111111]">
              ChargePe24
            </span>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-full border-2 border-[#111111]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeMode === item.id
                  ? 'bg-[#111111] text-[#F5F4F0]'
                  : 'bg-[#F5F4F0] text-[#111111]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Auth / User Account Area */}
        <div className="flex items-center gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-full border-2 border-[#111111] bg-[#F5F4F0] font-bold text-[#111111]">
                {currentUser.user?.first_name || currentUser.user?.username} ({currentUser.role})
              </div>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-full bg-[#111111] text-[#F5F4F0] font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveMode('auth')}
              className={`px-4 py-2 rounded-full border-2 border-[#111111] font-bold transition ${
                activeMode === 'auth'
                  ? 'bg-[#111111] text-[#F5F4F0]'
                  : 'bg-[#111111] text-[#F5F4F0]'
              }`}
            >
              Sign In / Join
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
