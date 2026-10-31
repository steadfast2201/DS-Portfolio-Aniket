import React from 'react'

/**
 * Navbar.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 * Responsive mobile & desktop layout with zero horizontal overflow.
 */
export default function Navbar({
  activeMode,
  setActiveMode,
  bookingsCount,
  currentUser,
  onLogout,
}) {
  const navItems = [
    { id: 'explore', label: 'Explore Chargers', shortLabel: 'Explore' },
    { id: 'passes', label: `My Passes & Sessions (${bookingsCount || 0})`, shortLabel: `Passes (${bookingsCount || 0})` },
    { id: 'host', label: 'Become a Host', shortLabel: 'Host' },
    { id: 'guard', label: 'Society Gate Check', shortLabel: 'Gate Check' },
  ]

  return (
    <header className="border-b-2 border-[#111111] bg-[#F5F4F0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        {/* Top Row on Mobile: Brand Identity + User Account Controls */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto">
          <div
            onClick={() => setActiveMode('explore')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <img
              src="/ChargePe24logo.png"
              alt="ChargePe24 Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#111111]"
            />
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#111111]">
              ChargePe24
            </span>
          </div>

          {/* Mobile Auth / User Account Area */}
          <div className="flex md:hidden items-center gap-1.5 text-xs shrink-0">
            {currentUser ? (
              <>
                <div className="px-2.5 py-1 rounded-full border-2 border-[#111111] bg-[#F5F4F0] font-bold text-[#111111] max-w-[140px] truncate">
                  {currentUser.user?.first_name || currentUser.user?.username}
                </div>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded-full bg-[#111111] text-[#F5F4F0] font-bold whitespace-nowrap"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveMode('auth')}
                className="px-3 py-1.5 rounded-full border-2 border-[#111111] bg-[#111111] text-[#F5F4F0] font-bold whitespace-nowrap"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Navigation Pills — Full-width 4-tab bar on mobile, pill container on desktop */}
        <nav className="grid grid-cols-4 md:flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-2xl md:rounded-full border-2 border-[#111111] w-full md:w-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              className={`px-2 md:px-4 py-1.5 rounded-xl md:rounded-full text-[11px] sm:text-xs font-bold transition-all text-center whitespace-nowrap ${
                activeMode === item.id
                  ? 'bg-[#111111] text-[#F5F4F0]'
                  : 'bg-[#F5F4F0] text-[#111111]'
              }`}
            >
              <span className="md:hidden">{item.shortLabel}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Right Auth / User Account Area */}
        <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
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
              className="px-4 py-2 rounded-full border-2 border-[#111111] bg-[#111111] text-[#F5F4F0] font-bold transition"
            >
              Sign In / Join
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
