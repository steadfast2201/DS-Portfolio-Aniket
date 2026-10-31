import React, { useEffect, useState } from 'react'
import { verifyGatePassPin } from '../api'

/**
 * GuardView.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
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
    <div className="max-w-2xl mx-auto text-[#111111]">
      <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold">
              Society Main Gate — EV Guest Verification
            </h2>
            <p className="text-xs font-medium">
              Enter the 6-digit ChargePe24 Gate Pass PIN shown by the visiting EV driver.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs bg-[#111111] text-[#F5F4F0] font-bold">
            Guard Desk Active
          </span>
        </div>

        {/* Quick-test buttons for existing bookings */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold">Quick-test active passes:</span>
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setPin(b.gate_pass_code)
                handleVerify(b.gate_pass_code, false)
              }}
              className="font-mono px-3 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-[#F5F4F0] text-[#111111] border-2 border-[#111111] transition font-bold"
            >
              {b.gate_pass_code} ({b.vehicle_plate})
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 6-digit PIN (e.g. 482910)"
            className="flex-1 bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-4 py-3 text-lg tracking-widest font-mono text-[#111111] outline-none"
          />
          <button
            onClick={() => handleVerify(pin, false)}
            className="px-6 py-3 rounded-xl bg-[#111111] text-[#F5F4F0] text-sm font-bold transition"
          >
            Verify Gate Pass
          </button>
        </div>

        {result && (
          <div className="mt-4 p-5 rounded-xl text-xs border-2 border-[#111111] bg-[#F5F4F0] text-[#111111] space-y-2">
            {result.ok && result.data.valid ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold">
                    GATE ENTRY AUTHORIZED
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#111111] text-[#F5F4F0] font-bold">
                    {result.data.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-[#111111]">
                  <div>
                    <span className="font-bold">Visiting EV Plate:</span>
                    <br />
                    <strong className="text-sm font-mono">
                      {result.data.vehicle_plate}
                    </strong>{' '}
                    ({result.data.vehicle_model})
                  </div>
                  <div>
                    <span className="font-bold">Assigned Parking Bay:</span>
                    <br />
                    <strong className="text-sm">{result.data.parking_bay}</strong> (
                    {result.data.society_name})
                  </div>
                  <div>
                    <span className="font-bold">Guest Driver:</span>
                    <br />
                    <strong>{result.data.guest_name}</strong> ({result.data.guest_phone})
                  </div>
                  <div>
                    <span className="font-bold">Society Host:</span>
                    <br />
                    <strong>{result.data.host_name}</strong> ({result.data.host_flat})
                  </div>
                </div>
                {result.data.status_code === 'CONFIRMED' ? (
                  <button
                    onClick={() => handleVerify(pin, true)}
                    className="mt-3 w-full py-2.5 rounded-full bg-[#111111] text-[#F5F4F0] font-bold transition"
                  >
                    Mark Vehicle Entered at Gate & Start Charging Session
                  </button>
                ) : (
                  <div className="pt-2 font-extrabold">
                    Vehicle is currently inside & charging at Bay {result.data.parking_bay}.
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="font-extrabold text-sm">ENTRY DENIED</div>
                <div className="mt-1 font-medium">
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
