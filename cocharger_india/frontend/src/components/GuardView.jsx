import React, { useEffect, useState } from 'react'
import { verifyGatePassPin } from '../api'

/**
 * GuardView.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 * Mobile-friendly & Guard-friendly Gate Check interface with Dropdown Pass Selector,
 * Large PIN Input, and High-Contrast Entry Ticket Card.
 */
export default function GuardView({ bookings, initialPin, onRefreshData }) {
  const [pin, setPin] = useState(initialPin || '')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (initialPin) {
      setPin(initialPin)
      handleVerify(initialPin, false)
    }
  }, [initialPin])

  async function handleVerify(codeToVerify = pin, markArrived = false) {
    if (!codeToVerify) return
    const res = await verifyGatePassPin(codeToVerify, markArrived)
    setResult(res)
    if (markArrived && res.ok) {
      onRefreshData()
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-[#111111] space-y-4">
      <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b-2 border-[#111111]">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold">
              Society Main Gate — EV Guest Verification
            </h2>
            <p className="text-xs font-medium mt-0.5">
              Select a scheduled visitor pass or type the 6-digit Gate PIN shown by the EV driver.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs bg-[#111111] text-[#F5F4F0] font-bold shrink-0">
            Guard Desk Active
          </span>
        </div>

        {/* Clean Dropdown to Select Active Visitor Passes */}
        {bookings.length > 0 && (
          <div>
            <label
              htmlFor="guard-pass-select"
              className="block text-xs font-extrabold uppercase tracking-wider mb-1.5"
            >
              1. Quick-Select Scheduled EV Visitor Pass:
            </label>
            <select
              id="guard-pass-select"
              value={pin}
              onChange={(e) => {
                const selectedCode = e.target.value
                setPin(selectedCode)
                if (selectedCode) {
                  handleVerify(selectedCode, false)
                } else {
                  setResult(null)
                }
              }}
              className="w-full px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#F5F4F0] text-[#111111] border-2 border-[#111111] outline-none cursor-pointer"
            >
              <option value="">-- Tap to Select an Expected Visitor Pass --</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.gate_pass_code}>
                  PIN: {b.gate_pass_code} • {b.vehicle_plate} ({b.chargee_name} -&gt; Bay {b.parking_bay})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Manual 6-Digit PIN Entry */}
        <div>
          <label
            htmlFor="guard-pin-input"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1.5"
          >
            2. Or Enter 6-Digit Gate Pass PIN Manually:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                id="guard-pin-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-4 py-3 text-center sm:text-left text-xl tracking-[0.35em] font-mono font-extrabold text-[#111111] outline-none"
              />
              {pin && (
                <button
                  type="button"
                  onClick={() => {
                    setPin('')
                    setResult(null)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full border border-[#111111] text-[10px] font-bold bg-[#F5F4F0] text-[#111111]"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleVerify(pin, false)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#111111] text-[#F5F4F0] text-sm font-extrabold transition whitespace-nowrap"
            >
              Verify Gate Pass -&gt;
            </button>
          </div>
        </div>

        {/* Verification Result Ticket */}
        {result && (
          <div className="rounded-2xl border-2 border-[#111111] overflow-hidden bg-[#F5F4F0] text-[#111111]">
            {result.ok && result.data.valid ? (
              <>
                {/* Ticket Top Banner */}
                <div className="bg-[#111111] text-[#F5F4F0] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold">
                      Security Gate Pass Verified
                    </div>
                    <div className="text-sm sm:text-base font-extrabold tracking-wide">
                      GATE ENTRY AUTHORIZED
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full border border-[#F5F4F0] text-[#F5F4F0] text-xs font-extrabold">
                    {result.data.status}
                  </span>
                </div>

                {/* Structured Details Grid */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border-2 border-[#111111]">
                      <div className="text-[10px] uppercase font-bold tracking-wider">
                        Visiting EV Number Plate
                      </div>
                      <div className="text-base font-mono font-extrabold mt-0.5">
                        {result.data.vehicle_plate}
                      </div>
                      <div className="text-[11px] font-medium">
                        {result.data.vehicle_model}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border-2 border-[#111111]">
                      <div className="text-[10px] uppercase font-bold tracking-wider">
                        Assigned Parking Bay
                      </div>
                      <div className="text-base font-extrabold mt-0.5">
                        Bay {result.data.parking_bay}
                      </div>
                      <div className="text-[11px] font-medium">
                        {result.data.society_name}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border-2 border-[#111111]">
                      <div className="text-[10px] uppercase font-bold tracking-wider">
                        Visiting Guest Driver
                      </div>
                      <div className="text-sm font-extrabold mt-0.5">
                        {result.data.guest_name}
                      </div>
                      <div className="text-[11px] font-mono">
                        {result.data.guest_phone}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border-2 border-[#111111]">
                      <div className="text-[10px] uppercase font-bold tracking-wider">
                        Society Resident Host
                      </div>
                      <div className="text-sm font-extrabold mt-0.5">
                        {result.data.host_name}
                      </div>
                      <div className="text-[11px] font-medium">
                        Flat / Villa: {result.data.host_flat}
                      </div>
                    </div>
                  </div>

                  {/* Guard Action Button */}
                  {result.data.status_code === 'CONFIRMED' ? (
                    <button
                      type="button"
                      onClick={() => handleVerify(pin, true)}
                      className="w-full py-3.5 px-4 rounded-full bg-[#111111] text-[#F5F4F0] text-xs sm:text-sm font-extrabold transition text-center"
                    >
                      Approve Gate Entry &amp; Start Charging Session -&gt;
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#111111] text-[#F5F4F0] text-center font-extrabold text-xs sm:text-sm">
                      Vehicle is Inside &amp; Charging at Bay {result.data.parking_bay}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 text-center space-y-1">
                <div className="inline-block px-3 py-1 rounded-full bg-[#111111] text-[#F5F4F0] text-xs font-extrabold uppercase tracking-wider">
                  ENTRY DENIED
                </div>
                <div className="pt-1 font-bold text-xs sm:text-sm">
                  {result.data?.message || 'Gate Pass is expired, completed, or invalid.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
