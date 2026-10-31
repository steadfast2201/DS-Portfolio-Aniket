import React, { useState } from 'react'
import { loginUser, registerUser } from '../api'

/**
 * AuthView.jsx — Sign In & Sign Up Screen
 * Strictly Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 */
export default function AuthView({ profiles, onLoginSuccess }) {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [error, setError] = useState('')

  // Sign In form state
  const [identifier, setIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('demo123')

  // Sign Up form state
  const [regForm, setRegForm] = useState({
    full_name: '',
    phone: '+91',
    password: '',
    role: 'BOTH',
    society_name: '',
    flat_or_house_no: '',
    city: 'Pune',
    upi_id: '',
    vehicle_reg_number: '',
    vehicle_make_model: '',
    vehicle_category: '2W',
    vehicle_connector: '15A_SOCKET',
  })

  async function handleLoginSubmit(e) {
    e.preventDefault()
    setError('')
    const { ok, data } = await loginUser(identifier, loginPassword)
    if (ok) {
      onLoginSuccess(data)
    } else {
      setError(data.error || 'Sign in failed.')
    }
  }

  async function handleQuickDemoLogin(phone) {
    setError('')
    const { ok, data } = await loginUser(phone, 'demo123')
    if (ok) {
      onLoginSuccess(data)
    } else {
      setError(data.error || 'Demo login failed.')
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    setError('')
    const { ok, data } = await registerUser(regForm)
    if (ok) {
      onLoginSuccess(data)
    } else {
      setError(data.error || 'Registration failed.')
    }
  }

  return (
    <div className="max-w-lg w-full mx-auto text-[#111111] space-y-6">
      {/* Brand Header on Login Screen */}
      <div className="flex flex-col items-center text-center space-y-2">
        <img
          src="/ChargePe24logo.png"
          alt="ChargePe24 Logo"
          className="w-20 h-20 rounded-full object-cover border-2 border-[#111111]"
        />
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
          ChargePe24
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-[#111111]">
          Community Peer-to-Peer EV Charging Network
        </p>
      </div>

      <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl overflow-hidden">
        {/* Top Mode Toggle: Sign In vs Create Account */}
        <div className="grid grid-cols-2 border-b-2 border-[#111111] text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError('')
            }}
            className={`py-3.5 uppercase tracking-wider transition ${
              tab === 'login'
                ? 'bg-[#111111] text-[#F5F4F0]'
                : 'bg-[#F5F4F0] text-[#111111]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register')
              setError('')
            }}
            className={`py-3.5 uppercase tracking-wider transition ${
              tab === 'register'
                ? 'bg-[#111111] text-[#F5F4F0]'
                : 'bg-[#F5F4F0] text-[#111111]'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[#111111] text-[#F5F4F0] text-xs font-bold">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <>
              <div>
                <h2 className="text-lg font-extrabold">Welcome back to ChargePe24</h2>
                <p className="text-xs font-medium mt-0.5">
                  Sign in with your registered Indian mobile number or username.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">
                    Mobile Number or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., +919822011223 or rohan_host"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3.5 py-2.5 text-[#111111] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3.5 py-2.5 text-[#111111] font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#111111] text-[#F5F4F0] font-bold text-sm"
                >
                  Sign In to ChargePe24 -&gt;
                </button>
              </form>

              {/* One-Click Demo Accounts for Quick Testing */}
              <div className="pt-4 border-t-2 border-[#111111] space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider">
                  Instant Demo Accounts (1-Click Sign In):
                </div>
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(p.phone)}
                      className="w-full p-3 rounded-xl border-2 border-[#111111] bg-[#F5F4F0] hover:bg-[#111111] hover:text-[#F5F4F0] transition flex items-center justify-between text-left text-xs"
                    >
                      <div>
                        <div className="font-extrabold">
                          {p.user.first_name || p.user.username}
                        </div>
                        <div className="text-[11px] font-mono">
                          {p.phone} • {p.society_name}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full border border-current font-bold text-[10px] uppercase">
                        {p.role_display}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-extrabold">Join ChargePe24</h2>
                <p className="text-xs font-medium mt-0.5">
                  Create an account to book neighbour chargers or monetize your own parking bay.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Aniket Patil"
                      value={regForm.full_name}
                      onChange={(e) =>
                        setRegForm({ ...regForm, full_name: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+919800000000"
                      value={regForm.phone}
                      onChange={(e) =>
                        setRegForm({ ...regForm, phone: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Create password"
                      value={regForm.password}
                      onChange={(e) =>
                        setRegForm({ ...regForm, password: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Account Role</label>
                    <select
                      value={regForm.role}
                      onChange={(e) =>
                        setRegForm({ ...regForm, role: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2"
                    >
                      <option value="BOTH">Both (Driver & Host)</option>
                      <option value="CHARGEE">EV Driver (Chargee Only)</option>
                      <option value="HOST">Charger Host (Owner Only)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Society / Layout Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Magarpatta City"
                      value={regForm.society_name}
                      onChange={(e) =>
                        setRegForm({ ...regForm, society_name: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Flat / House No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Tower C - 504"
                      value={regForm.flat_or_house_no}
                      onChange={(e) =>
                        setRegForm({ ...regForm, flat_or_house_no: e.target.value })
                      }
                      className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    UPI ID (For 90% Host Earnings Settlement)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., aniket@okaxis"
                    value={regForm.upi_id}
                    onChange={(e) =>
                      setRegForm({ ...regForm, upi_id: e.target.value })
                    }
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                {/* Optional EV Registration Block */}
                <div className="p-3.5 rounded-xl border-2 border-[#111111] space-y-2.5">
                  <div className="font-extrabold uppercase text-[10px] tracking-wider">
                    Optional: Add Your EV (For Drivers)
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1">EV Number Plate</label>
                      <input
                        type="text"
                        placeholder="e.g., MH-12-EV-7788"
                        value={regForm.vehicle_reg_number}
                        onChange={(e) =>
                          setRegForm({
                            ...regForm,
                            vehicle_reg_number: e.target.value,
                          })
                        }
                        className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">EV Make & Model</label>
                      <input
                        type="text"
                        placeholder="e.g., Ola S1 Pro / Nexon EV"
                        value={regForm.vehicle_make_model}
                        onChange={(e) =>
                          setRegForm({
                            ...regForm,
                            vehicle_make_model: e.target.value,
                          })
                        }
                        className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#111111] text-[#F5F4F0] font-bold text-sm"
                >
                  Create Account & Sign In -&gt;
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

