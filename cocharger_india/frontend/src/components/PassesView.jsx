import React from 'react'
import { startChargingSession, stopChargingSession } from '../api'

/**
 * PassesView.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 */
export default function PassesView({
  bookings,
  onRefreshData,
  onJumpToGuardPass,
}) {
  async function handleStart(id) {
    await startChargingSession(id)
    onRefreshData()
  }

  async function handleStop(id, kwh) {
    await stopChargingSession(id, kwh)
    onRefreshData()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111]">
            My Society Gate Passes & Charging Sessions
          </h2>
          <p className="text-xs font-medium text-[#111111]">
            Show your 6-digit Gate Pass ticket at the apartment security gate to enter the basement bay.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            {/* Top Boarding Pass Header */}
            <div className="bg-[#111111] text-[#F5F4F0] px-5 py-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest">
                  Society Gate Pass Ticket
                </div>
                <div className="text-sm font-bold">{b.charger_title}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest">
                  Gate PIN
                </div>
                <div className="text-lg font-mono font-extrabold tracking-widest">
                  {b.gate_pass_code}
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-5 space-y-3 text-xs text-[#111111]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="uppercase text-[10px] font-bold">EV Driver</span>
                  <div className="font-extrabold">{b.chargee_name}</div>
                </div>
                <div>
                  <span className="uppercase text-[10px] font-bold">Assigned Bay</span>
                  <div className="font-extrabold">{b.parking_bay}</div>
                </div>
                <div>
                  <span className="uppercase text-[10px] font-bold">Vehicle</span>
                  <div className="font-extrabold">
                    {b.vehicle_plate} ({b.vehicle_model})
                  </div>
                </div>
                <div>
                  <span className="uppercase text-[10px] font-bold">Session Status</span>
                  <div className="font-extrabold">{b.status_display}</div>
                </div>
              </div>

              {/* Billing Box */}
              <div className="p-3 rounded-xl bg-[#F5F4F0] border-2 border-[#111111] flex items-center justify-between">
                {b.session && b.session.invoice ? (
                  <>
                    <div>
                      <div className="font-extrabold">
                        Paid via UPI • {b.session.invoice.upi_transaction_ref}
                      </div>
                      <div className="text-[11px] font-medium">
                        Host 90%: ₹{b.session.invoice.host_payout_amount} • Platform 10%: ₹
                        {b.session.invoice.platform_fee}
                      </div>
                    </div>
                    <div className="text-base font-extrabold">
                      ₹{b.session.invoice.total_amount}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold">
                      Estimated Fare ({b.estimated_kwh} kWh • {b.duration_hours}h)
                    </div>
                    <div className="text-base font-extrabold">
                      ₹{b.estimated_total_inr}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ticket Footer Controls */}
            <div className="px-5 py-3 bg-[#F5F4F0] border-t-2 border-[#111111] flex items-center justify-between text-xs">
              <button
                onClick={() => onJumpToGuardPass(b.gate_pass_code)}
                className="font-extrabold text-[#111111] underline"
              >
                Verify at Guard Desk →
              </button>

              <div className="flex gap-2">
                {b.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStart(b.id)}
                    className="px-3.5 py-1.5 rounded-full bg-[#F5F4F0] text-[#111111] border-2 border-[#111111] font-bold"
                  >
                    Start Charging
                  </button>
                )}
                {b.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStop(b.id, b.estimated_kwh)}
                    className="px-4 py-1.5 rounded-full bg-[#111111] text-[#F5F4F0] font-bold"
                  >
                    Complete & Pay UPI
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
