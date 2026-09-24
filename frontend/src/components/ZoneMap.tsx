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

// ── Design tokens (single source of truth) ────────────────────────────────────

const C = {
  bg:        '#0d1117',   // map container bg
  surface:   '#161b22',   // card / panel bg
  surfaceHi: '#1c2330',   // hover / elevated surface
  border:    'rgba(255,255,255,0.10)',
  borderHi:  'rgba(255,255,255,0.18)',
  text:      'rgba(255,255,255,0.95)',
  textMid:   'rgba(255,255,255,0.65)',
  textLow:   'rgba(255,255,255,0.40)',
  textXlow:  'rgba(255,255,255,0.22)',
} as const

// ── Risk scale ─────────────────────────────────────────────────────────────────

const RISK: [number, string][] = [
  [0.0, '#22c55e'],   // green  — low
  [0.8, '#84cc16'],   // lime
  [1.4, '#eab308'],   // yellow — medium
  [1.9, '#f97316'],   // orange
  [2.4, '#ef4444'],   // red    — high
  [3.0, '#b91c1c'],   // deep red — critical
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const riskColorExpr = (): any =>
  ['interpolate', ['linear'], ['get', 'mean_risk'], ...RISK.flatMap(([v, c]) => [v, c])]

function riskHex(val: number): string {
  const v = Math.max(0, Math.min(3, val ?? 0))
  for (let i = RISK.length - 1; i >= 0; i--) if (v >= RISK[i][0]) return RISK[i][1]
  return RISK[0][1]
}

function riskLabel(val: number): string {
  if (val >= 2.4) return 'Critical'
  if (val >= 1.9) return 'High'
  if (val >= 1.4) return 'Medium'
  return 'Low'
}

// ── Priority helpers ───────────────────────────────────────────────────────────

function priCls(cat: string) {
  const c = (cat || '').toLowerCase()
  if (c.includes('high'))   return { dot: '#ef4444', badge: 'rgba(239,68,68,.15)',   text: '#f87171', border: 'rgba(239,68,68,.3)'   }
  if (c.includes('medium')) return { dot: '#f59e0b', badge: 'rgba(245,158,11,.15)',  text: '#fbbf24', border: 'rgba(245,158,11,.3)'  }
  if (c.includes('low'))    return { dot: '#22c55e', badge: 'rgba(34,197,94,.15)',   text: '#4ade80', border: 'rgba(34,197,94,.3)'   }
  return                           { dot: '#94a3b8', badge: 'rgba(148,163,184,.10)', text: '#94a3b8', border: 'rgba(148,163,184,.2)' }
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

type Bounds = [[number, number], [number, number]]

function gjBounds(gj: GeoJSON.FeatureCollection): Bounds | null {
  const lo: number[] = [], la: number[] = []
  function walk(c: unknown): void {
    if (!Array.isArray(c)) return
    if (typeof c[0] === 'number') { lo.push(c[0]); la.push(c[1]); return }
    for (const x of c) walk(x)
  }
  for (const f of gj.features) if (f.geometry) walk((f.geometry as GeoJSON.Polygon).coordinates)
  const vl = lo.filter((v, i) => v >= -180 && v <= 180 && la[i] >= -90 && la[i] <= 90)
  const vt = la.filter((v, i) => v >= -90 && v <= 90 && lo[i] >= -180 && lo[i] <= 180)
  if (!vl.length) return null
  return [[Math.min(...vl), Math.min(...vt)], [Math.max(...vl), Math.max(...vt)]]
}

// ── Tiny responsive hook ───────────────────────────────────────────────────────

function useIsMobile(): boolean {
  const [mob, setMob] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setMob(mq.matches)
    const h = (e: MediaQueryListEvent) => setMob(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return mob
}

// ── Icon primitives ────────────────────────────────────────────────────────────

const IFit   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>
const IClose = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
const IArrow = () => <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"/></svg>
const IChevDown = ({ open }: { open: boolean }) => (
  <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/>
  </svg>
)

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

// ── Main component ─────────────────────────────────────────────────────────────

export default function ZoneMap({ geojson, zones, runId, scene, height = 520 }: ZoneMapProps) {
  const mapRef   = useRef<MapRef>(null)
  const isMobile = useIsMobile()

  const [selId,        setSelId]        = useState<string | null>(null)
  const [hovId,        setHovId]        = useState<string | null>(null)
  const [popup,        setPopup]        = useState<{ lng: number; lat: number; zone: MapZone } | null>(null)
  const [loaded,       setLoaded]       = useState(false)
  const [legendOpen,   setLegendOpen]   = useState(!isMobile)   // collapsed on mobile by default
  const [sheet,        setSheet]        = useState<MapZone | null>(null)  // bottom sheet / sidebar

  // sync legend default when screen resizes
  useEffect(() => { if (!sheet) setLegendOpen(!isMobile) }, [isMobile, sheet])

  // ── Viewport ──────────────────────────────────────────────────────────────
  const initView = useCallback(() => {
    if (!geojson?.features.length) return { longitude: 45, latitude: 20, zoom: 4 }
    const b = gjBounds(geojson)
    if (!b) return { longitude: 45, latitude: 20, zoom: 4 }
    return { longitude: (b[0][0] + b[1][0]) / 2, latitude: (b[0][1] + b[1][1]) / 2, zoom: 7 }
  }, [geojson])

  const fitAll = useCallback(() => {
    if (!geojson || !mapRef.current) return
    const b = gjBounds(geojson)
    if (!b) return
    mapRef.current.fitBounds(b, { padding: isMobile ? 32 : 52, duration: 900, maxZoom: 14 })
  }, [geojson, isMobile])

  // fit whenever geojson arrives OR map finishes loading — whichever comes last
  // use a short delay so the map canvas is ready after tab-switch renders
  useEffect(() => {
    if (!loaded || !geojson) return
    const t = setTimeout(fitAll, 120)
    return () => clearTimeout(t)
  }, [loaded, geojson, fitAll])

  // ── Events ────────────────────────────────────────────────────────────────
  const onMove = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    setHovId(f?.properties?.zone_id ?? null)
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = f ? 'pointer' : ''
  }, [])

  const onLeave = useCallback(() => {
    setHovId(null)
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = ''
  }, [])

  const onClose = useCallback(() => {
    setSelId(null); setPopup(null); setSheet(null)
    if (!isMobile) setLegendOpen(true)
  }, [isMobile])

  const onClickMap = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) { onClose(); return }

    const id: string = f.properties?.zone_id ?? ''
    setSelId(id)
    const z = zones.find(z => z.zone_id === id) ?? null
    setSheet(z)
    if (isMobile) setLegendOpen(false)   // hide legend on mobile when sheet opens

    if (z && e.lngLat) {
      setPopup({ lng: e.lngLat.lng, lat: e.lngLat.lat, zone: z })
      if (f.geometry?.type === 'Polygon' && mapRef.current) {
        const cs = (f.geometry as GeoJSON.Polygon).coordinates[0]
        const lns = cs.map(c => c[0]), lts = cs.map(c => c[1])
        mapRef.current.fitBounds(
          [[Math.min(...lns), Math.min(...lts)], [Math.max(...lns), Math.max(...lts)]],
          { padding: isMobile ? 48 : 96, duration: 650, maxZoom: 17 }
        )
      }
    }
  }, [zones, isMobile, onClose])

  // ── Layer expressions — dark base map ─────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillColor:   any = ['case', ['==', ['get', 'zone_id'], selId ?? ''], '#60a5fa', ['==', ['get', 'zone_id'], hovId ?? ''], '#fbbf24', riskColorExpr()]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillOpacity: any = ['case', ['==', ['get', 'zone_id'], selId ?? ''], 0.88, ['==', ['get', 'zone_id'], hovId ?? ''], 0.82, 0.70]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineColor:   any = ['case', ['==', ['get', 'zone_id'], selId ?? ''], '#93c5fd', ['==', ['get', 'zone_id'], hovId ?? ''], '#fde68a', '#ffffff']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineWidth:   any = ['case', ['==', ['get', 'zone_id'], selId ?? ''], 3.0, ['==', ['get', 'zone_id'], hovId ?? ''], 2.2, 1.5]

  const zoneCount = geojson?.features.length ?? 0
  const highCount = zones.filter(z => (z.priority_category || '').toLowerCase().includes('high')).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative overflow-hidden"
      style={{ height, borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(0,0,0,.45)' }}
    >

      {/* Loading screen */}
      {!loaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3" style={{ background: C.bg }}>
          <div className="w-9 h-9 rounded-full border-2 border-t-emerald-400 animate-spin" style={{ borderColor: C.border, borderTopColor: '#4ade80' }} />
          <span className="text-xs font-medium" style={{ color: C.textLow }}>Loading map…</span>
        </div>
      )}

      {/* No data overlay */}
      {!geojson && loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2 px-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}>
              <svg className="w-6 h-6" style={{ color: C.textLow }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497z"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: C.textMid }}>No zone geometry</p>
            <p className="text-xs" style={{ color: C.textLow }}>zones.geojson was not produced for this run</p>
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        initialViewState={initView()}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={geojson ? ['zones-fill'] : []}
        onLoad={() => {
          setLoaded(true)
          const map = mapRef.current?.getMap()
          if (!map) return
          // ── Water: give sea/ocean a clear blue so it's distinct from land ──
          if (map.getLayer('water')) {
            map.setPaintProperty('water', 'fill-color', '#0e2340')
          }
          if (map.getLayer('waterway')) {
            map.setPaintProperty('waterway', 'line-color', '#1a3a5c')
          }
          // ── Land: slightly lighter than background so contrast is visible ──
          if (map.getLayer('landcover')) {
            map.setPaintProperty('landcover', 'fill-color', '#1a1f2e')
          }
          // ── Exact layer IDs confirmed from openfreemap dark style ─────────
          // Boundaries
          ;['boundary_country_z0-4', 'boundary_country_z5-', 'boundary_state'].forEach(id => {
            if (!map.getLayer(id)) return
            map.setPaintProperty(id, 'line-color', 'rgba(255,255,255,0.7)')
            map.setPaintProperty(id, 'line-width', id.includes('state') ? 1.0 : 1.8)
          })
          // Place labels — text-color + halo + bigger size
          ;['place_country_major','place_country_minor','place_country_other',
            'place_state','place_city_large','place_city',
            'place_town','place_village','place_suburb','place_other'].forEach(id => {
            if (!map.getLayer(id)) return
            map.setPaintProperty(id, 'text-color', '#ffffff')
            map.setPaintProperty(id, 'text-halo-color', 'rgba(0,0,0,0.9)')
            map.setPaintProperty(id, 'text-halo-width', 1.5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sz = map.getLayoutProperty(id, 'text-size') as any
            if (typeof sz === 'number') {
              map.setLayoutProperty(id, 'text-size', sz * 1.5)
            } else if (Array.isArray(sz) && sz[0] === 'interpolate') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const boosted: any[] = sz.map((v: unknown, i: number) =>
                i >= 3 && i % 2 === 0 ? (v as number) * 1.5 : v
              )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              map.setLayoutProperty(id, 'text-size', boosted as any)
            }
          })
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClickMap}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass visualizePitch />
        <ScaleControl position="bottom-right" unit="metric" />

        {geojson && (
          <Source id="zones" type="geojson" data={geojson}>
            <Layer id="zones-fill"    type="fill" paint={{ 'fill-color': fillColor,  'fill-opacity': fillOpacity }} />
            <Layer id="zones-outline" type="line" paint={{ 'line-color': lineColor,  'line-width': lineWidth }}     />
          </Source>
        )}

        {/* Popup — desktop only (mobile uses bottom sheet) */}
        {popup && !isMobile && (
          <Popup
            longitude={popup.lng} latitude={popup.lat}
            closeOnClick={false}
            onClose={onClose}
            maxWidth="260px"
            className="zm-popup"
          >
            <MiniCard zone={popup.zone} runId={runId} scene={scene} />
          </Popup>
        )}
      </Map>

      {/* ── TOP-LEFT toolbar ── */}
      <Toolbar
        onFit={fitAll}
        zoneCount={zoneCount}
        highCount={highCount}
        hasData={!!geojson}
      />

      {/* ── Legend ── */}
      {!sheet && (
        <Legend open={legendOpen} onToggle={() => setLegendOpen(o => !o)} isMobile={isMobile} />
      )}

      {/* ── Desktop sidebar ── */}
      {sheet && !isMobile && (
        <Sidebar zone={sheet} runId={runId} scene={scene} onClose={onClose} />
      )}

      {/* ── Mobile bottom sheet ── */}
      {sheet && isMobile && (
        <BottomSheet zone={sheet} runId={runId} scene={scene} onClose={onClose} />
      )}

    </div>
  )
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function Toolbar({ onFit, zoneCount, highCount, hasData }: {
  onFit: () => void; zoneCount: number; highCount: number; hasData: boolean
}) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
      {/* Fit button */}
      <button
        onClick={onFit} title="Fit all zones"
        className="zm-btn"
        style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <IFit />
      </button>

      {/* Stats pill */}
      {hasData && (
        <div className="zm-pill flex items-center gap-1.5 h-[34px] px-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.text }}>
            {zoneCount} zones
          </span>
          {highCount > 0 && (
            <>
              <span style={{ color: C.textXlow, margin: '0 1px' }}>·</span>
              <span className="text-[11px] font-semibold tabular-nums text-red-400">
                {highCount} high
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Legend ─────────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Low',      sub: '< 1.0 σ'   },
  { color: '#eab308', label: 'Medium',   sub: '1.0–2.0 σ' },
  { color: '#f97316', label: 'High',     sub: '2.0–2.5 σ' },
  { color: '#ef4444', label: 'Critical', sub: '> 2.5 σ'   },
]

function Legend({ open, onToggle, isMobile }: { open: boolean; onToggle: () => void; isMobile: boolean }) {
  return (
    <div
      className="absolute z-10"
      style={{ bottom: isMobile ? 56 : 44, left: 12 }}
    >
      <div className="zm-card overflow-hidden" style={{ minWidth: 148 }}>
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 transition-colors"
          style={{ color: C.textLow }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHi)}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textLow }}>Risk Level</span>
          <IChevDown open={open} />
        </button>

        {/* Body */}
        {open && (
          <div className="px-3 pb-3 space-y-1" style={{ borderTop: `1px solid ${C.border}` }}>
            {LEGEND_ITEMS.map(({ color, label, sub }) => (
              <div key={label} className="flex items-center gap-2 pt-1.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-[11px] flex-1" style={{ color: C.text }}>{label}</span>
                <span className="text-[10px]" style={{ color: C.textLow }}>{sub}</span>
              </div>
            ))}
            {/* Selected / hovered */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 4 }} className="space-y-1">
              {[{ color: '#60a5fa', label: 'Selected' }, { color: '#fbbf24', label: 'Hovered' }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px]" style={{ color: C.text }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mini popup card (desktop hover) ───────────────────────────────────────────

function MiniCard({ zone, runId, scene }: { zone: MapZone; runId: string; scene: string }) {
  const pc  = priCls(zone.priority_category)
  const rank = zone.priority_rank ?? zone.rank
  const pct  = Math.min((zone.mean_risk ?? 0) / 3, 1) * 100
  const hex  = riskHex(zone.mean_risk)

  return (
    <div className="zm-card overflow-hidden" style={{ minWidth: 220, maxWidth: 252 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${hex}12`, borderBottom: `1px solid ${hex}22` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.dot }} />
        <span className="text-[11px] font-mono font-bold flex-1 truncate" style={{ color: C.text }}>{zone.zone_id}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
          style={{ background: pc.badge, color: pc.text, border: `1px solid ${pc.border}` }}>
          {zone.priority_category || 'Unknown'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1 p-2.5">
        {[
          { l: 'Rank',    v: rank != null ? `#${rank}` : '—' },
          { l: 'Mean σ',  v: zone.mean_risk?.toFixed(2) ?? '—' },
          { l: 'Max σ',   v: zone.max_risk?.toFixed(2)  ?? '—' },
        ].map(({ l, v }) => (
          <div key={l} className="rounded-lg px-1.5 py-1.5 text-center" style={{ background: C.surfaceHi }}>
            <div className="text-[9px] mb-0.5" style={{ color: C.textLow }}>{l}</div>
            <div className="text-[12px] font-bold tabular-nums" style={{ color: C.text }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Risk bar */}
      <div className="px-2.5 pb-2">
        <div className="flex justify-between mb-1">
          <span className="text-[9px]" style={{ color: C.textLow }}>Intensity</span>
          <span className="text-[9px] font-semibold" style={{ color: C.textMid }}>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceHi }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e,#eab308,#ef4444)' }} />
        </div>
      </div>

      {/* CTA */}
      <div className="px-2.5 pb-2.5">
        <a href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
          className="zm-cta-row flex items-center justify-between px-2.5 py-1.5 rounded-lg">
          <span className="text-[11px]" style={{ color: C.textMid }}>View spectral evidence</span>
          <IArrow />
        </a>
      </div>
    </div>
  )
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────

function Sidebar({ zone, runId, scene, onClose }: { zone: MapZone; runId: string; scene: string; onClose: () => void }) {
  const pc    = priCls(zone.priority_category)
  const rank  = zone.priority_rank ?? zone.rank
  const area  = zone.approx_area_m2 ?? zone.area_m2
  const high  = (zone.priority_category || '').toLowerCase().includes('high')
  const pct   = Math.min((zone.mean_risk ?? 0) / 3, 1) * 100
  const hex   = riskHex(zone.mean_risk)

  return (
    <div className="absolute top-3 right-3 bottom-12 z-10 flex flex-col animate-slide-in-right"
      style={{ width: 252, borderRadius: 14, background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(20px)', border: `1px solid ${C.borderHi}`, boxShadow: '0 8px 40px rgba(0,0,0,.5)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: `${hex}10`, borderBottom: `1px solid ${hex}20`, borderRadius: '14px 14px 0 0' }}>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.dot, boxShadow: `0 0 6px ${pc.dot}80` }} />
            <span className="text-[10px] font-mono truncate" style={{ color: C.textMid }}>{zone.zone_id}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: pc.badge, color: pc.text, border: `1px solid ${pc.border}` }}>
              {zone.priority_category || 'Unknown'}
            </span>
            {high && <span className="text-[10px] font-bold text-red-400 animate-pulse">⚠ Inspect First</span>}
          </div>
        </div>
        <button onClick={onClose} className="zm-icon-btn flex-shrink-0"><IClose /></button>
      </div>

      {/* Risk label pill */}
      <div className="mx-4 mt-3 mb-1 flex-shrink-0">
        <div className="rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ background: `${hex}15`, border: `1px solid ${hex}25` }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textLow }}>Risk level</span>
          <span className="text-[13px] font-bold" style={{ color: hex }}>{riskLabel(zone.mean_risk)}</span>
        </div>
      </div>

      {/* Stats grid 2×2 */}
      <div className="px-4 py-2 grid grid-cols-2 gap-1.5 flex-shrink-0">
        {[
          { l: 'Priority Rank', v: rank != null ? `#${rank}` : '—' },
          { l: 'Mean Risk',     v: zone.mean_risk != null ? `${zone.mean_risk.toFixed(3)} σ` : '—' },
          { l: 'Max Risk',      v: zone.max_risk  != null ? `${zone.max_risk.toFixed(3)} σ`  : '—' },
          { l: 'Pixels',        v: zone.pixel_count?.toLocaleString() ?? '—' },
          ...(area != null ? [{ l: 'Area', v: `${(area/10000).toFixed(2)} ha` }] : []),
        ].map(({ l, v }) => (
          <div key={l} className="rounded-xl px-2.5 py-2" style={{ background: C.surfaceHi }}>
            <div className="text-[9px] font-medium uppercase tracking-wider mb-0.5" style={{ color: C.textLow }}>{l}</div>
            <div className="text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Intensity bar */}
      <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: C.textLow }}>Anomaly Intensity</span>
          <span className="text-[9px] font-bold" style={{ color: C.textMid }}>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surfaceHi }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e 0%,#eab308 45%,#ef4444 100%)' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: C.textXlow }}>Low</span>
          <span className="text-[9px]" style={{ color: C.textXlow }}>Critical</span>
        </div>
      </div>

      {/* Recommendation */}
      {zone.recommendation && (
        <div className="px-4 py-3 flex-1 overflow-y-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: C.textLow }}>Recommendation</p>
          <p className="text-[11px] leading-relaxed" style={{ color: C.textMid }}>{zone.recommendation}</p>
        </div>
      )}

      {/* Warning */}
      <div className="px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.12)' }}>
        <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.7)' }}>
          ⚠ Field verification required. Spectral signal only — not a confirmed diagnosis.
        </p>
      </div>

      {/* CTA */}
      <div className="px-3 py-3 flex-shrink-0">
        <a href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-semibold text-[12px] text-white transition-opacity hover:opacity-90"
          style={{ background: `${hex}dd` }}>
          <span>View Spectral Evidence</span>
          <IArrow />
        </a>
      </div>
    </div>
  )
}

// ── Mobile bottom sheet ────────────────────────────────────────────────────────

function BottomSheet({ zone, runId, scene, onClose }: { zone: MapZone; runId: string; scene: string; onClose: () => void }) {
  const pc   = priCls(zone.priority_category)
  const rank = zone.priority_rank ?? zone.rank
  const area = zone.approx_area_m2 ?? zone.area_m2
  const high = (zone.priority_category || '').toLowerCase().includes('high')
  const pct  = Math.min((zone.mean_risk ?? 0) / 3, 1) * 100
  const hex  = riskHex(zone.mean_risk)

  return (
    // Backdrop
    <div className="absolute inset-0 z-20" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      {/* Sheet — stop propagation so tapping inside doesn't close */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col animate-slide-up-sheet"
        style={{ borderRadius: '20px 20px 0 0', background: C.surface, border: `1px solid ${C.border}`, maxHeight: '72vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: C.borderHi }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${hex}20`, background: `${hex}0a` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pc.dot, boxShadow: `0 0 6px ${pc.dot}80` }} />
            <div className="min-w-0">
              <p className="text-[10px] font-mono truncate" style={{ color: C.textMid }}>{zone.zone_id}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: pc.badge, color: pc.text, border: `1px solid ${pc.border}` }}>
                  {zone.priority_category || 'Unknown'}
                </span>
                {high && <span className="text-[10px] font-bold text-red-400">⚠ Inspect First</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="zm-icon-btn flex-shrink-0"><IClose /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Stats row — 4 items inline */}
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {[
              { l: 'Rank',  v: rank != null ? `#${rank}` : '—' },
              { l: 'Mean σ', v: zone.mean_risk?.toFixed(2) ?? '—' },
              { l: 'Max σ',  v: zone.max_risk?.toFixed(2)  ?? '—' },
              { l: 'Pixels', v: zone.pixel_count != null ? (zone.pixel_count > 999 ? `${(zone.pixel_count/1000).toFixed(1)}k` : `${zone.pixel_count}`) : '—' },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-xl px-2 py-2 text-center" style={{ background: C.surfaceHi }}>
                <div className="text-[9px] mb-0.5" style={{ color: C.textLow }}>{l}</div>
                <div className="text-[12px] font-bold tabular-nums" style={{ color: C.text }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Area if present */}
          {area != null && (
            <div className="mx-3 mb-2 rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: C.surfaceHi }}>
              <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: C.textLow }}>Area</span>
              <span className="text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{(area/10000).toFixed(2)} ha</span>
            </div>
          )}

          {/* Intensity bar */}
          <div className="mx-3 mb-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: C.textLow }}>Anomaly Intensity</span>
              <span className="text-[10px] font-bold" style={{ color: hex }}>{riskLabel(zone.mean_risk)} · {pct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.surfaceHi }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e,#eab308,#ef4444)' }} />
            </div>
          </div>

          {/* Recommendation */}
          {zone.recommendation && (
            <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: C.surfaceHi }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: C.textLow }}>Recommendation</p>
              <p className="text-[12px] leading-relaxed" style={{ color: C.textMid }}>{zone.recommendation}</p>
            </div>
          )}

          {/* Warning */}
          <div className="mx-3 mb-3 rounded-xl px-3 py-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.75)' }}>
              ⚠ Field verification required. Spectral signal only.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-3 pb-5 pt-2 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
          <a href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-semibold text-[13px] text-white"
            style={{ background: `${hex}ee` }}>
            <span>View Spectral Evidence</span>
            <IArrow />
          </a>
        </div>

      </div>
    </div>
  )
}
