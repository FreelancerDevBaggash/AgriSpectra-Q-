'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl, MapRef } from 'react-map-gl/maplibre'
import * as maplibregl from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(maplibregl as any).setWorkerUrl?.('/maplibre-gl-worker.mjs')
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MapZone {
  zone_id:           string
  priority_rank?:    number
  rank?:             number
  priority_category: string
  mean_risk:         number
  max_risk:          number
  pixel_count:       number
  approx_area_m2?:   number
  area_m2?:          number
  recommendation?:   string
  centroid_lon?:     number
  centroid_lat?:     number
}

interface ZoneMapProps {
  geojson:  GeoJSON.FeatureCollection | null
  zones:    MapZone[]
  runId:    string
  scene:    string
  height?:  number
}

// ── Risk colour scale ──────────────────────────────────────────────────────────

const RISK_STOPS: [number, string][] = [
  [0.0,  '#22c55e'],
  [0.8,  '#84cc16'],
  [1.4,  '#eab308'],
  [1.9,  '#f97316'],
  [2.4,  '#ef4444'],
  [3.0,  '#b91c1c'],
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function riskColorExpr(): any {
  return ['interpolate', ['linear'], ['get', 'mean_risk'],
    ...RISK_STOPS.flatMap(([v, c]) => [v, c])]
}

function riskColor(val: number): string {
  const clamped = Math.max(0, Math.min(3, val))
  for (let i = RISK_STOPS.length - 1; i >= 0; i--) {
    if (clamped >= RISK_STOPS[i][0]) return RISK_STOPS[i][1]
  }
  return RISK_STOPS[0][1]
}

function priorityCls(cat: string) {
  const c = (cat || '').toLowerCase()
  if (c.includes('high'))   return { badge: 'bg-red-500/15 text-red-400 border-red-500/30',   dot: 'bg-red-500',     ring: 'ring-red-500/40' }
  if (c.includes('medium')) return { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', ring: 'ring-amber-400/40' }
  if (c.includes('low'))    return { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', ring: 'ring-emerald-500/40' }
  return { badge: 'bg-white/10 text-white/60 border-white/20', dot: 'bg-white/40', ring: 'ring-white/20' }
}

// ── Bounds helper ──────────────────────────────────────────────────────────────

function geojsonBounds(gj: GeoJSON.FeatureCollection): [[number,number],[number,number]] | null {
  const lons: number[] = []
  const lats: number[] = []

  function collect(coords: unknown): void {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') { lons.push(coords[0]); lats.push(coords[1]); return }
    for (const c of coords) collect(c)
  }
  for (const f of gj.features) {
    if (f.geometry) collect((f.geometry as GeoJSON.Polygon).coordinates)
  }

  const vl = lons.filter((v, i) => v >= -180 && v <= 180 && lats[i] >= -90 && lats[i] <= 90)
  const vlat = lats.filter((v, i) => v >= -90 && v <= 90 && lons[i] >= -180 && lons[i] <= 180)
  if (vl.length === 0) return null
  return [[Math.min(...vl), Math.min(...vlat)], [Math.max(...vl), Math.max(...vlat)]]
}

// ── Tiny icon helpers ──────────────────────────────────────────────────────────

function IconFit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ZoneMap({ geojson, zones, runId, scene, height = 540 }: ZoneMapProps) {
  const mapRef = useRef<MapRef>(null)

  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [hoveredId,    setHoveredId]    = useState<string | null>(null)
  const [popup,        setPopup]        = useState<{ lng: number; lat: number; zone: MapZone } | null>(null)
  const [mapLoaded,    setMapLoaded]    = useState(false)
  const [legendOpen,   setLegendOpen]   = useState(true)
  const [sidebarZone,  setSidebarZone]  = useState<MapZone | null>(null)

  // ── Initial viewport ──────────────────────────────────────────────────────
  const initialView = useCallback(() => {
    if (!geojson || geojson.features.length === 0) return { longitude: 45, latitude: 20, zoom: 4 }
    const b = geojsonBounds(geojson)
    if (!b) return { longitude: 45, latitude: 20, zoom: 4 }
    return { longitude: (b[0][0] + b[1][0]) / 2, latitude: (b[0][1] + b[1][1]) / 2, zoom: 8 }
  }, [geojson])

  // ── fitBounds ─────────────────────────────────────────────────────────────
  const fitBounds = useCallback(() => {
    if (!geojson || !mapRef.current) return
    const b = geojsonBounds(geojson)
    if (!b) return
    mapRef.current.fitBounds(b, { padding: 52, duration: 900, maxZoom: 14 })
  }, [geojson])

  useEffect(() => {
    if (mapLoaded && geojson) fitBounds()
  }, [mapLoaded, geojson, fitBounds])

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    setHoveredId(feat?.properties?.zone_id ?? null)
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = feat ? 'pointer' : ''
  }, [])

  const onMouseLeave = useCallback(() => {
    setHoveredId(null)
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = ''
  }, [])

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    if (!feat) { setSelectedId(null); setPopup(null); setSidebarZone(null); return }

    const zoneId: string = feat.properties?.zone_id ?? ''
    setSelectedId(zoneId)

    const matched = zones.find(z => z.zone_id === zoneId) ?? null
    setSidebarZone(matched)

    if (matched && e.lngLat) {
      setPopup({ lng: e.lngLat.lng, lat: e.lngLat.lat, zone: matched })
      if (feat.geometry?.type === 'Polygon' && mapRef.current) {
        const coords = (feat.geometry as GeoJSON.Polygon).coordinates[0]
        const lngs = coords.map(c => c[0])
        const lats = coords.map(c => c[1])
        mapRef.current.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 100, duration: 650, maxZoom: 17 }
        )
      }
    }
  }, [zones])

  // ── Layer paint ───────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillColor: any = [
    'case',
    ['==', ['get', 'zone_id'], selectedId ?? ''], '#60a5fa',
    ['==', ['get', 'zone_id'], hoveredId ?? ''],  '#fbbf24',
    riskColorExpr(),
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillOpacity: any = [
    'case',
    ['==', ['get', 'zone_id'], selectedId ?? ''], 0.88,
    ['==', ['get', 'zone_id'], hoveredId ?? ''],  0.78,
    0.60,
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineColor: any = [
    'case',
    ['==', ['get', 'zone_id'], selectedId ?? ''], '#93c5fd',
    ['==', ['get', 'zone_id'], hoveredId ?? ''],  '#fde68a',
    'rgba(255,255,255,0.25)',
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineWidth: any = [
    'case',
    ['==', ['get', 'zone_id'], selectedId ?? ''], 2.5,
    ['==', ['get', 'zone_id'], hoveredId ?? ''],  1.8,
    0.5,
  ]

  const zoneCount = geojson?.features.length ?? 0
  const highCount = zones.filter(z => (z.priority_category || '').toLowerCase().includes('high')).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f1117]"
      style={{ height }}
    >

      {/* ── Empty state overlay ── */}
      {!geojson && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/50">Zone geometry unavailable</p>
            <p className="text-xs text-white/25">zones.geojson was not produced for this run</p>
          </div>
        </div>
      )}

      {/* ── Loading overlay (map tiles) ── */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1117] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-white/40 font-medium">Loading map…</p>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <Map
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        initialViewState={initialView()}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={geojson ? ['zones-fill'] : []}
        onLoad={() => setMapLoaded(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass visualizePitch />
        <ScaleControl position="bottom-right" unit="metric" />

        {geojson && (
          <Source id="zones" type="geojson" data={geojson}>
            <Layer id="zones-fill"    type="fill" paint={{ 'fill-color': fillColor,  'fill-opacity': fillOpacity }} />
            <Layer id="zones-outline" type="line" paint={{ 'line-color': lineColor,  'line-width':   lineWidth   }} />
          </Source>
        )}

        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            closeOnClick={false}
            onClose={() => { setPopup(null); setSelectedId(null); setSidebarZone(null) }}
            maxWidth="280px"
            className="zone-popup-maplibre"
          >
            <MapPopup zone={popup.zone} runId={runId} scene={scene} />
          </Popup>
        )}
      </Map>

      {/* ── TOP-LEFT: fit-bounds + stats bar ── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={fitBounds}
          title="Fit all zones"
          className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/70 hover:text-white rounded-lg transition-all shadow-lg"
        >
          <IconFit />
        </button>

        {geojson && (
          <div className="flex items-center gap-1.5 h-8 px-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white/80 tabular-nums">{zoneCount} zones</span>
            {highCount > 0 && (
              <>
                <span className="text-white/20 mx-0.5">·</span>
                <span className="text-[11px] font-semibold text-red-400 tabular-nums">{highCount} high</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM-LEFT: legend ── */}
      <div className="absolute bottom-10 left-3 z-10">
        <div
          className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden transition-all duration-300"
          style={{ minWidth: 152 }}
        >
          {/* Legend header — clickable to collapse */}
          <button
            onClick={() => setLegendOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Risk Level</span>
            <svg
              className={`w-3 h-3 text-white/30 transition-transform duration-200 ${legendOpen ? 'rotate-0' : '-rotate-90'}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>

          {legendOpen && (
            <div className="px-3 pb-2.5 space-y-1.5 border-t border-white/5">
              {[
                { color: '#22c55e', label: 'Low',      sub: '< 1.0 σ'   },
                { color: '#eab308', label: 'Medium',   sub: '1.0–2.0 σ' },
                { color: '#f97316', label: 'High',     sub: '2.0–2.5 σ' },
                { color: '#ef4444', label: 'Critical', sub: '> 2.5 σ'   },
              ].map(({ color, label, sub }) => (
                <div key={label} className="flex items-center gap-2 pt-1.5">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm" style={{ background: color }} />
                  <span className="text-[11px] text-white/75 leading-none">{label}</span>
                  <span className="text-[10px] text-white/30 ml-auto">{sub}</span>
                </div>
              ))}
              <div className="border-t border-white/5 pt-1.5 mt-0.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-400 flex-shrink-0" />
                  <span className="text-[11px] text-white/75">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
                  <span className="text-[11px] text-white/75">Hovered</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SELECTED ZONE SIDEBAR PANEL ── */}
      {sidebarZone && (
        <ZoneSidebar
          zone={sidebarZone}
          runId={runId}
          scene={scene}
          onClose={() => { setSidebarZone(null); setSelectedId(null); setPopup(null) }}
        />
      )}

    </div>
  )
}

// ── Popup (inside map) ─────────────────────────────────────────────────────────

function MapPopup({ zone, runId, scene }: { zone: MapZone; runId: string; scene: string }) {
  const cls = priorityCls(zone.priority_category)
  const rank = zone.priority_rank ?? zone.rank
  const riskPct = typeof zone.mean_risk === 'number' ? Math.min((zone.mean_risk / 3) * 100, 100) : 0

  return (
    <div className="bg-[#141820] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[220px] max-w-[260px]">
      {/* Header stripe */}
      <div
        className="px-3 py-2 flex items-center gap-2.5"
        style={{ background: `${riskColor(zone.mean_risk)}18`, borderBottom: `1px solid ${riskColor(zone.mean_risk)}30` }}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cls.dot}`} />
        <span className="text-xs font-mono font-bold text-white/90 truncate flex-1">{zone.zone_id}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold flex-shrink-0 ${cls.badge}`}>
          {zone.priority_category || 'Unknown'}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { label: 'Rank',      value: rank != null ? `#${rank}` : '—' },
            { label: 'Mean σ',    value: typeof zone.mean_risk === 'number' ? zone.mean_risk.toFixed(2) : '—' },
            { label: 'Max σ',     value: typeof zone.max_risk  === 'number' ? zone.max_risk.toFixed(2)  : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-lg px-1.5 py-1.5">
              <div className="text-[10px] text-white/35">{label}</div>
              <div className="text-[12px] font-bold text-white/85 tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        {/* Risk bar */}
        <div>
          <div className="flex justify-between text-[9px] text-white/30 mb-1">
            <span>Anomaly intensity</span>
            <span>{riskPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${riskPct}%`,
                background: `linear-gradient(90deg, #22c55e, #eab308, #ef4444)`,
              }}
            />
          </div>
        </div>

        {/* Footer link */}
        <a
          href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group"
        >
          <span className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors">View spectral evidence</span>
          <IconArrow />
        </a>
      </div>
    </div>
  )
}

// ── Zone sidebar panel (right side) ───────────────────────────────────────────

function ZoneSidebar({ zone, runId, scene, onClose }: {
  zone:    MapZone
  runId:   string
  scene:   string
  onClose: () => void
}) {
  const cls  = priorityCls(zone.priority_category)
  const rank = zone.priority_rank ?? zone.rank
  const area = zone.approx_area_m2 ?? zone.area_m2
  const isHigh = (zone.priority_category || '').toLowerCase().includes('high')
  const riskPct = typeof zone.mean_risk === 'number' ? Math.min((zone.mean_risk / 3) * 100, 100) : 0

  return (
    <div className="absolute top-3 right-3 bottom-10 z-10 w-64 flex flex-col bg-black/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-right">

      {/* Header */}
      <div
        className="flex items-start justify-between gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: `${riskColor(zone.mean_risk)}18`, borderBottom: `1px solid ${riskColor(zone.mean_risk)}25` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cls.dot} ring-2 ${cls.ring}`} />
            <span className="text-[10px] font-mono text-white/50 truncate">{zone.zone_id}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls.badge}`}>
              {zone.priority_category || 'Unknown'}
            </span>
            {isHigh && (
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide animate-pulse">
                ⚠ Inspect First
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
        >
          <IconClose />
        </button>
      </div>

      {/* Stats grid */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2 flex-shrink-0 border-b border-white/5">
        {[
          { label: 'Priority Rank',  value: rank != null ? `#${rank}` : '—' },
          { label: 'Mean Risk',      value: typeof zone.mean_risk === 'number' ? `${zone.mean_risk.toFixed(3)} σ` : '—' },
          { label: 'Max Risk',       value: typeof zone.max_risk  === 'number' ? `${zone.max_risk.toFixed(3)} σ`  : '—' },
          { label: 'Pixels',         value: zone.pixel_count?.toLocaleString() ?? '—' },
          ...(area != null ? [{ label: 'Area', value: `${(area / 10000).toFixed(2)} ha` }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl px-3 py-2">
            <div className="text-[9px] font-medium uppercase tracking-widest text-white/30 mb-0.5">{label}</div>
            <div className="text-[13px] font-bold text-white/85 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Anomaly intensity bar */}
      <div className="px-4 py-3 flex-shrink-0 border-b border-white/5">
        <div className="flex justify-between text-[9px] text-white/30 mb-1.5">
          <span className="uppercase tracking-widest font-medium">Anomaly Intensity</span>
          <span className="font-bold text-white/50">{riskPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${riskPct}%`,
              background: 'linear-gradient(90deg, #22c55e 0%, #eab308 45%, #ef4444 100%)',
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/20 mt-1">
          <span>Low</span><span>Critical</span>
        </div>
      </div>

      {/* Recommendation */}
      {zone.recommendation && (
        <div className="px-4 py-3 flex-1 overflow-y-auto border-b border-white/5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Recommendation</p>
          <p className="text-[11px] text-white/55 leading-relaxed">{zone.recommendation}</p>
        </div>
      )}

      {/* Warning notice */}
      <div className="px-4 py-2 flex-shrink-0 bg-amber-500/8 border-t border-amber-500/15">
        <p className="text-[9px] text-amber-400/80 font-medium leading-relaxed">
          ⚠ Field verification required — spectral signal only, not a confirmed diagnosis.
        </p>
      </div>

      {/* CTA */}
      <div className="px-3 py-3 flex-shrink-0">
        <a
          href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-semibold text-[12px] text-white transition-all group"
          style={{ background: `${riskColor(zone.mean_risk)}cc` }}
        >
          <span>View Spectral Evidence</span>
          <IconArrow />
        </a>
      </div>

    </div>
  )
}
