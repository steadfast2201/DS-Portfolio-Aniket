import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { createHostCharger, fetchHostAnalytics } from '../api'

const monoHostPinIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#111111;color:#F5F4F0;border:2px solid #F5F4F0;outline:2px solid #111111;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;font-family:sans-serif;">PIN</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

/**
 * HostView.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 */
export default function HostView({ currentUser, profiles, onRefreshData }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const hostProfiles = profiles.filter((p) => p.role === 'HOST' || p.role === 'BOTH')
  const [hostAnalytics, setHostAnalytics] = useState([])
  const [feedback, setFeedback] = useState(null)

  const [form, setForm] = useState({
    host: currentUser?.id || hostProfiles[0]?.id || 1,
    segment_type: 'INTRA_SOCIETY',
    title: '',
    society_name: '',
    parking_bay_number: '',
    hardware_tier: 'DUMB_15A',
    connector_type: '15A_SOCKET',
    supported_vehicles: 'ALL_EVS',
    max_power_kw: 3.3,
    rate_per_kwh: 12.0,
    rate_per_hour: 15.0,
    latitude: 18.591271,
    longitude: 73.738901,
  })

  useEffect(() => {
    fetchHostAnalytics().then(setHostAnalytics)
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, { attributionControl: false }).setView([form.latitude, form.longitude], 13)
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
    }).addTo(map)
    setTimeout(() => map.invalidateSize(), 150)

    const marker = L.marker([form.latitude, form.longitude], {
      draggable: true,
      icon: monoHostPinIcon,
    }).addTo(map)
    marker.bindPopup('<b>New Host Charger Pin</b><br/>Click map or drag pin').openPopup()

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setForm((prev) => ({
        ...prev,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      }))
    })

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setForm((prev) => ({
        ...prev,
        latitude: parseFloat(pos.lat.toFixed(6)),
        longitude: parseFloat(pos.lng.toFixed(6)),
      }))
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      host: parseInt(form.host),
      address: `${form.society_name}, Pune`,
      city: 'Pune',
      requires_gate_pass: true,
      is_active: true,
    }
    const { ok, data } = await createHostCharger(payload)
    if (ok) {
      setFeedback({ ok: true, text: `Published "${data.title}" to Google Maps!` })
      onRefreshData()
      fetchHostAnalytics().then(setHostAnalytics)
    } else {
      setFeedback({ ok: false, text: JSON.stringify(data) })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[#111111]">
      {/* Left Column: Host Onboarding Form */}
      <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl p-5">
        <h2 className="font-extrabold text-base mb-1">
          List Your Parking Bay Charger (Host Mode)
        </h2>
        <p className="text-xs font-medium mb-4">
          Click anywhere on the Google Map on the right to auto-fill Latitude & Longitude.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Host Owner</label>
              <select
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              >
                {hostProfiles.map((hp) => (
                  <option key={hp.id} value={hp.id}>
                    {hp.user.first_name || hp.user.username} ({hp.upi_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Market Segment</label>
              <select
                value={form.segment_type}
                onChange={(e) => setForm({ ...form, segment_type: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              >
                <option value="INTRA_SOCIETY">1. Intra-Society P2P (Gated RWA)</option>
                <option value="INDEPENDENT_HOME">2. Independent Home / Bungalow</option>
                <option value="KIRANA_COMMERCIAL">3. Kirana Store / Commercial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Charger Listing Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Blue Ridge Tower 8 — Basement Slot P-42"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Society / Area Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Blue Ridge Township, Hinjewadi"
                value={form.society_name}
                onChange={(e) => setForm({ ...form, society_name: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Parking Bay / Slot No.</label>
              <input
                type="text"
                required
                placeholder="e.g., Basement-2, Bay #42"
                value={form.parking_bay_number}
                onChange={(e) => setForm({ ...form, parking_bay_number: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Hardware Tier</label>
              <select
                value={form.hardware_tier}
                onChange={(e) => setForm({ ...form, hardware_tier: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-2.5 py-2"
              >
                <option value="DUMB_15A">Tier 1: 15A Socket</option>
                <option value="IOT_SMART_PLUG">Tier 2: IoT Smart Plug</option>
                <option value="OCPP_EVSE">Tier 3: OCPP Wallbox</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Connector Type</label>
              <select
                value={form.connector_type}
                onChange={(e) => setForm({ ...form, connector_type: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-2.5 py-2"
              >
                <option value="15A_SOCKET">15A/16A 3-Pin</option>
                <option value="TYPE_2">Type 2 AC</option>
                <option value="BHARAT_AC001">Bharat AC-001</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Supported EVs</label>
              <select
                value={form.supported_vehicles}
                onChange={(e) => setForm({ ...form, supported_vehicles: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-2.5 py-2"
              >
                <option value="ALL_EVS">All EVs (2W/4W)</option>
                <option value="2W_3W_ONLY">2W & 3W Only</option>
                <option value="4W_ONLY">4W Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Max Power (kW)</label>
              <input
                type="number"
                step="0.1"
                value={form.max_power_kw}
                onChange={(e) => setForm({ ...form, max_power_kw: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Rate per kWh (₹)</label>
              <input
                type="number"
                step="0.5"
                value={form.rate_per_kwh}
                onChange={(e) => setForm({ ...form, rate_per_kwh: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Slot Fee / Hr (₹)</label>
              <input
                type="number"
                step="1"
                value={form.rate_per_hour}
                onChange={(e) => setForm({ ...form, rate_per_hour: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Latitude (Click Map →)</label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Longitude (Click Map →)</label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#111111] text-[#F5F4F0] font-bold transition"
          >
            Publish Charger to Community Map
          </button>
        </form>

        {feedback && (
          <div className="mt-3 p-3 rounded-lg text-xs border-2 border-[#111111] bg-[#111111] text-[#F5F4F0] font-bold">
            {feedback.text}
          </div>
        )}
      </div>

      {/* Right Column: Google Map Pin Picker + Host UPI Earnings */}
      <div className="space-y-6">
        <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-[#111111] flex items-center justify-between">
            <h3 className="font-extrabold text-sm">
              Click on Google Map to Set Charger Location
            </h3>
            <span className="text-xs font-bold">Draggable Pin</span>
          </div>
          <div ref={mapContainerRef} className="w-full h-64 z-10" />
        </div>

        <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl p-4">
          <h3 className="font-extrabold text-sm mb-3">
            Host UPI Earnings Breakdown (90% Split)
          </h3>
          <div className="space-y-2 text-xs">
            {hostAnalytics.map((h) => (
              <div
                key={h.host_id}
                className="p-3 rounded-xl bg-[#F5F4F0] border-2 border-[#111111] flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold">
                    {h.host_name} ({h.society_name})
                  </div>
                  <div className="font-medium">
                    UPI: <span className="font-mono font-bold">{h.upi_id}</span> •{' '}
                    {h.chargers_count} Charger(s) • {h.completed_sessions} Paid Session(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold">
                    ₹{parseFloat(h.net_host_earnings_inr).toFixed(2)}
                  </div>
                  <div className="text-[11px] font-bold">90% Net Earnings</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
