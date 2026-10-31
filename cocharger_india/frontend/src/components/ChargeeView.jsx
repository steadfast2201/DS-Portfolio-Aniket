import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { fetchChargers, createBooking } from '../api'

// Custom Two-Color Pin Marker (Black #111111 & Pale White #F5F4F0 only — no blue Leaflet icon)
const monoPinIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#111111;color:#F5F4F0;border:2px solid #F5F4F0;outline:2px solid #111111;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;font-family:sans-serif;">EV</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

/**
 * ChargeeView.jsx — Strict Two-Color Palette: Pale White (#F5F4F0) & Black (#111111)
 */
export default function ChargeeView({
  currentUser,
  profiles,
  vehicles,
  onRefreshData,
  onBookingCreated,
  onRequireAuth,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const markersByIdRef = useRef({})

  const [chargers, setChargers] = useState([])
  const [activePill, setActivePill] = useState('ALL')
  const [selectedCharger, setSelectedCharger] = useState(null)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  const [selectedChargee, setSelectedChargee] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [bookingType, setBookingType] = useState('RECURRING_WEEKLY')
  const [estimatedKwh, setEstimatedKwh] = useState(6.0)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getTime() + 2 * 3600 * 1000)
    const end = new Date(start.getTime() + 4 * 3600 * 1000)
    const fmt = (d) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setStartTime(fmt(start))
    setEndTime(fmt(end))
  }, [])

  useEffect(() => {
    if (currentUser) {
      setSelectedChargee(currentUser.id)
      if (currentUser.vehicles?.length) {
        setSelectedVehicle(currentUser.vehicles[0].id)
      } else if (vehicles.length) {
        setSelectedVehicle(vehicles[0].id)
      }
    } else {
      if (profiles.length && !selectedChargee) setSelectedChargee(profiles[0].id)
      if (vehicles.length && !selectedVehicle) setSelectedVehicle(vehicles[0].id)
    }
  }, [currentUser, profiles, vehicles])

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, { attributionControl: false }).setView([18.5204, 73.8567], 12)
    const googleStreets = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
      }
    )
    googleStreets.addTo(map)

    markersLayerRef.current = L.layerGroup().addTo(map)
    mapInstanceRef.current = map
    setTimeout(() => map.invalidateSize(), 150)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const filters = {}
    if (activePill === '15A') filters.connector = '15A_SOCKET'
    if (activePill === 'TYPE2') filters.connector = 'TYPE_2'
    if (activePill === 'SOCIETY') filters.segment = 'INTRA_SOCIETY'
    if (activePill === 'HOME') filters.segment = 'INDEPENDENT_HOME'
    if (activePill === 'KIRANA') filters.segment = 'KIRANA_COMMERCIAL'

    fetchChargers(filters).then((data) => {
      setChargers(data)
      if (!markersLayerRef.current || !mapInstanceRef.current) return

      markersLayerRef.current.clearLayers()
      markersByIdRef.current = {}
      const bounds = []

      data.forEach((c) => {
        const lat = parseFloat(c.latitude)
        const lng = parseFloat(c.longitude)
        bounds.push([lat, lng])

        const marker = L.marker([lat, lng], { icon: monoPinIcon }).addTo(
          markersLayerRef.current
        )
        markersByIdRef.current[c.id] = { marker, lat, lng }
        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

        marker.bindPopup(`
          <div style="min-width:190px;color:#111111;background:#F5F4F0">
            <b>${c.title}</b><br/>
            <span>Bay: <b>${c.parking_bay_number}</b></span><br/>
            <span><b>Rs.${c.rate_per_kwh}/kWh</b> + Rs.${c.rate_per_hour}/hr</span><br/>
            <a href="${gmapsUrl}" target="_blank" style="display:inline-block;margin-top:6px;color:#111111;font-weight:700;text-decoration:underline;">
              Open Directions in Google Maps ->
            </a>
          </div>
        `)
        marker.on('click', () => focusChargerOnMap(c))
      })

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    })
  }, [activePill])

  function focusChargerOnMap(charger) {
    setSelectedCharger(charger)
    const item = markersByIdRef.current[charger.id]
    if (item && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 15, { duration: 0.7 })
      item.marker.openPopup()
    }
  }

  function openBookingModal(charger) {
    focusChargerOnMap(charger)
    if (!currentUser && onRequireAuth) {
      onRequireAuth()
      return
    }
    setErrorMsg('')
    setBookingModalOpen(true)
  }

  const rateKwh = selectedCharger ? parseFloat(selectedCharger.rate_per_kwh) : 12.0
  const rateHr = selectedCharger ? parseFloat(selectedCharger.rate_per_hour) : 15.0
  const durationHours = (() => {
    const hrs = (new Date(endTime) - new Date(startTime)) / 3600000
    return isNaN(hrs) || hrs <= 0 ? 4.0 : hrs
  })()
  const estTotal = parseFloat(estimatedKwh || 0) * rateKwh + durationHours * rateHr

  async function handleConfirmBooking(e) {
    e.preventDefault()
    if (!selectedCharger) return
    const payload = {
      chargee: parseInt(selectedChargee),
      vehicle: parseInt(selectedVehicle),
      charger: selectedCharger.id,
      booking_type: bookingType,
      estimated_kwh: parseFloat(estimatedKwh),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
    }
    const { ok, data } = await createBooking(payload)
    if (ok) {
      setBookingModalOpen(false)
      onRefreshData()
      onBookingCreated()
    } else {
      setErrorMsg(JSON.stringify(data))
    }
  }

  const filterPills = [
    { id: 'ALL', label: 'All Chargers' },
    { id: 'SOCIETY', label: 'RWA Gated Societies' },
    { id: 'HOME', label: 'Independent Villas' },
    { id: 'KIRANA', label: 'Kirana & Shops' },
    { id: '15A', label: '15A Socket (2W/4W)' },
    { id: 'TYPE2', label: 'Type 2 Fast AC' },
  ]

  return (
    <div className="space-y-5">
      {/* Category Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b-2 border-[#111111]">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActivePill(pill.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 border-[#111111] transition whitespace-nowrap ${
                activePill === pill.id
                  ? 'bg-[#111111] text-[#F5F4F0]'
                  : 'bg-[#F5F4F0] text-[#111111]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-extrabold text-[#111111]">
          {chargers.length} Neighbour Chargers Available
        </span>
      </div>

      {/* Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Cards */}
        <div className="lg:col-span-6 space-y-4">
          {chargers.map((c) => {
            const isSelected = selectedCharger?.id === c.id
            return (
              <div
                key={c.id}
                onClick={() => focusChargerOnMap(c)}
                className={`rounded-2xl p-5 transition cursor-pointer border-2 border-[#111111] ${
                  isSelected
                    ? 'bg-[#111111] text-[#F5F4F0]'
                    : 'bg-[#F5F4F0] text-[#111111]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-current mb-2`}
                    >
                      {c.segment_display.split('(')[0]}
                    </span>
                    <h3 className="text-base font-extrabold leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs mt-0.5">
                      {c.society_name || c.address} • Parking Bay:{' '}
                      <strong>{c.parking_bay_number}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold">
                      ₹{c.rate_per_kwh}
                      <span className="text-xs font-normal">/kWh</span>
                    </div>
                    <div className="text-[11px]">+ ₹{c.rate_per_hour}/hr slot</div>
                  </div>
                </div>

                {/* Specs Pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg border border-current">
                    {c.max_power_kw} kW
                  </span>
                  <span className="px-3 py-1 rounded-lg border border-current">
                    {c.connector_display}
                  </span>
                  <span className="px-3 py-1 rounded-lg border border-current">
                    Host: {c.host_name}
                  </span>
                </div>

                {/* Bottom Action Row */}
                <div className="mt-4 pt-3.5 border-t border-current flex items-center justify-between">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold underline"
                  >
                    Directions in Google Maps -&gt;
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openBookingModal(c)
                    }}
                    className={`px-5 py-2 rounded-full text-xs font-bold border-2 ${
                      isSelected
                        ? 'bg-[#F5F4F0] text-[#111111] border-[#F5F4F0]'
                        : 'bg-[#111111] text-[#F5F4F0] border-[#111111]'
                    }`}
                  >
                    Reserve Slot -&gt;
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right 6 Columns: Sticky Map */}
        <div className="lg:col-span-6 lg:sticky lg:top-20">
          <div className="bg-[#F5F4F0] border-2 border-[#111111] rounded-2xl overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-[560px] z-10" />
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && selectedCharger && (
        <div className="fixed inset-0 bg-[#111111]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#F5F4F0] text-[#111111] border-2 border-[#111111] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-[#111111]">
                  Instant Slot Reservation
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  {selectedCharger.title}
                </h3>
                <p className="text-xs">
                  Bay {selectedCharger.parking_bay_number} • ₹{selectedCharger.rate_per_kwh}/kWh
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#111111] text-[#F5F4F0] font-bold text-sm"
              >
                X
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Signed-In Driver</label>
                {currentUser ? (
                  <div className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2.5 text-[#111111] font-extrabold">
                    {currentUser.user?.first_name || currentUser.user?.username} ({currentUser.phone})
                  </div>
                ) : (
                  <select
                    value={selectedChargee}
                    onChange={(e) => setSelectedChargee(e.target.value)}
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2.5 text-[#111111]"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user.first_name || p.user.username} ({p.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">Your EV</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2.5 text-[#111111]"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make_model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Arrive At</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-2.5 py-2 text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Depart At</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-2.5 py-2 text-[#111111]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Routine Type</label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2 text-[#111111]"
                  >
                    <option value="RECURRING_WEEKLY">Weekly Neighbour Routine</option>
                    <option value="ONE_OFF">One-Time Charge</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Energy Needed (kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estimatedKwh}
                    onChange={(e) => setEstimatedKwh(e.target.value)}
                    className="w-full bg-[#F5F4F0] border-2 border-[#111111] rounded-xl px-3 py-2 text-[#111111]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F4F0] border-2 border-[#111111] flex items-center justify-between">
                <div>
                  <div className="font-bold">Total Estimated Fare ({durationHours.toFixed(1)}h)</div>
                  <div className="text-[11px]">Includes RWA Gate Pass & Host Split</div>
                </div>
                <div className="text-lg font-extrabold">₹{estTotal.toFixed(2)}</div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-[#111111] text-[#F5F4F0] text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#111111] text-[#F5F4F0] font-bold text-sm"
              >
                Confirm & Get 6-Digit Society Gate Pass
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
