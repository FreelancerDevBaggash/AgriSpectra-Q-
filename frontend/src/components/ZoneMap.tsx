'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl, MapRef } from 'react-map-gl/maplibre'
import * as maplibregl from 'maplibre-gl'
import type { MapLayerMouseEvent, LngLatBoundsLike } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

// Set MapLibre worker URL once — must happen before any Map is instantiated
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(maplibregl as any).setWorkerUrl?.('/maplibre-gl-worker.mjs')
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
  /** GeoJSON FeatureCollection — must be in WGS-84 (EPSG:4326) */
  geojson:  GeoJSON.FeatureCollection | null
  zones:    MapZone[]
  runId:    string
  scene:    string
  height?:  number
}

// ── Colour helpers ────────────────────────────────────────────────────────────

/** Returns a MapLibre interpolate expression: mean_risk → fill colour */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function riskColorExpression(): any {
  return [
    'interpolate', ['linear'], ['get', 'mean_risk'],
    0.5, '#22c55e',
    1.0, '#84cc16',
    1.5, '#eab308',
    2.0, '#f97316',
    2.5, '#ef4444',
    3.0, '#b91c1c',
  ]
}

/** CSS colour for priority badge */
function priorityBadgeClass(cat: string): string {
  const c = (cat || '').toLowerCase()
  if (c.includes('high'))   return 'bg-red-100 text-red-700 border-red-200'
  if (c.includes('medium')) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (c.includes('low'))    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return 'bg-surface-100 text-surface-600 border-surface-200'
}

/** Dot colour for priority */
function priorityDot(cat: string): string {
  const c = (cat || '').toLowerCase()
  if (c.includes('high'))   return 'bg-red-500'
  if (c.includes('medium')) return 'bg-amber-400'
  if (c.includes('low'))    return 'bg-emerald-500'
  return 'bg-surface-400'
}

// ── Bounds helper ─────────────────────────────────────────────────────────────

function geojsonBounds(geojson: GeoJSON.FeatureCollection): LngLatBoundsLike | null {
  const lons: number[] = []
  const lats: number[] = []

  function collect(coords: unknown): void {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') { lons.push(coords[0]); lats.push(coords[1]); return }
    for (const c of coords) collect(c)
  }

  for (const f of geojson.features) {
    if (f.geometry) collect((f.geometry as GeoJSON.Polygon).coordinates)
  }

  const validLons = lons.filter((v, i) => v >= -180 && v <= 180 && lats[i] >= -90 && lats[i] <= 90)
  const validLats = lats.filter((v, i) => v >= -90 && v <= 90 && lons[i] >= -180 && lons[i] <= 180)
  if (validLons.length === 0) return null

  return [
    [Math.min(...validLons), Math.min(...validLats)],
    [Math.max(...validLons), Math.max(...validLats)],
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ZoneMap({ geojson, zones, runId, scene, height = 520 }: ZoneMapProps) {
  const mapRef = useRef<MapRef>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId,  setHoveredId]  = useState<string | null>(null)
  const [popup, setPopup] = useState<{ lng: number; lat: number; zone: MapZone } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Compute initial view from GeoJSON centroid so the map opens near the data
  const initialView = useCallback(() => {
    if (!geojson || geojson.features.length === 0) return { longitude: 45, latitude: 20, zoom: 4 }
    const bounds = geojsonBounds(geojson)
    if (!bounds) return { longitude: 45, latitude: 20, zoom: 4 }
    const [[minLon, minLat], [maxLon, maxLat]] = bounds as [[number,number],[number,number]]
    return { longitude: (minLon + maxLon) / 2, latitude: (minLat + maxLat) / 2, zoom: 8 }
  }, [geojson])

  // Fit to GeoJSON bounds — called both on map load and whenever geojson changes
  const fitBounds = useCallback(() => {
    if (!geojson || !mapRef.current) return
    const bounds = geojsonBounds(geojson)
    if (!bounds) return
    mapRef.current.fitBounds(bounds as [[number,number],[number,number]], { padding: 48, duration: 800, maxZoom: 14 })
  }, [geojson])

  // Trigger fitBounds whenever map becomes ready OR geojson changes after map is ready
  useEffect(() => {
    if (mapLoaded && geojson) fitBounds()
  }, [mapLoaded, geojson, fitBounds])

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    setHoveredId(feat?.properties?.zone_id ?? null)
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = feat ? 'pointer' : ''
    }
  }, [])

  const onMouseLeave = useCallback(() => {
    setHoveredId(null)
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = ''
  }, [])

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feat = e.features?.[0]
    if (!feat) { setSelectedId(null); setPopup(null); return }

    const zoneId: string = feat.properties?.zone_id ?? ''
    setSelectedId(zoneId)

    const matched = zones.find(z => z.zone_id === zoneId) ?? null
    if (matched && e.lngLat) {
      setPopup({ lng: e.lngLat.lng, lat: e.lngLat.lat, zone: matched })
      if (feat.geometry?.type === 'Polygon' && mapRef.current) {
        const coords = (feat.geometry as GeoJSON.Polygon).coordinates[0]
        const lngs = coords.map(c => c[0])
        const lats = coords.map(c => c[1])
        mapRef.current.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 96, duration: 600, maxZoom: 16 }
        )
      }
    }
  }, [zones])

  // ── Layer paint expressions ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillColor: any  = ['case', ['==', ['get', 'zone_id'], selectedId ?? ''], '#3b82f6', ['==', ['get', 'zone_id'], hoveredId ?? ''], '#f59e0b', riskColorExpression()]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fillOpacity: any = ['case', ['==', ['get', 'zone_id'], selectedId ?? ''], 0.85, ['==', ['get', 'zone_id'], hoveredId ?? ''], 0.75, 0.55]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineColor: any  = ['case', ['==', ['get', 'zone_id'], selectedId ?? ''], '#93c5fd', ['==', ['get', 'zone_id'], hoveredId ?? ''], '#fcd34d', 'rgba(255,255,255,0.3)']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineWidth: any  = ['case', ['==', ['get', 'zone_id'], selectedId ?? ''], 2.5, ['==', ['get', 'zone_id'], hoveredId ?? ''], 1.5, 0.6]

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedZone = selectedId ? zones.find(z => z.zone_id === selectedId) : null

  return (
    <div className="relative rounded-xl overflow-hidden border border-surface-200 shadow-sm" style={{ height }}>

      {/* Empty state overlay — shown inside the map when geojson hasn't loaded */}
      {!geojson && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-950/70 z-20 pointer-events-none">
          <div className="text-center space-y-2 text-surface-400">
            <svg className="w-10 h-10 mx-auto opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z" />
            </svg>
            <p className="text-sm">Zone geometry unavailable</p>
            <p className="text-xs opacity-60">zones.geojson was not produced for this run</p>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        initialViewState={initialView()}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={geojson ? ['zones-fill'] : []}
        onLoad={() => { setMapLoaded(true) }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" unit="metric" />

        {/* Zone layers — only when GeoJSON is available */}
        {geojson && (
          <Source id="zones" type="geojson" data={geojson}>
            <Layer
              id="zones-fill"
              type="fill"
              paint={{ 'fill-color': fillColor, 'fill-opacity': fillOpacity }}
            />
            <Layer
              id="zones-outline"
              type="line"
              paint={{ 'line-color': lineColor, 'line-width': lineWidth }}
            />
          </Source>
        )}

        {/* Popup */}
        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            closeOnClick={false}
            onClose={() => { setPopup(null); setSelectedId(null) }}
            maxWidth="260px"
          >
            <PopupContent zone={popup.zone} runId={runId} scene={scene} />
          </Popup>
        )}
      </Map>

      {/* Fit-bounds button */}
      <button
        onClick={fitBounds}
        title="Fit all zones"
        className="absolute top-3 left-3 z-10 bg-surface-900/80 hover:bg-surface-800 backdrop-blur-sm text-white rounded-lg p-2 transition-colors shadow-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </button>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-10 bg-surface-900/85 backdrop-blur-sm rounded-xl px-3.5 py-3 text-white shadow-lg min-w-[160px]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Risk Level</p>
        <div className="space-y-1.5">
          {[
            { color: 'bg-emerald-500', label: 'Low anomaly',      sub: '< 1.0 σ' },
            { color: 'bg-yellow-400',  label: 'Medium anomaly',   sub: '1.0–2.0 σ' },
            { color: 'bg-orange-500',  label: 'High anomaly',     sub: '2.0–2.5 σ' },
            { color: 'bg-red-600',     label: 'Critical anomaly', sub: '> 2.5 σ' },
          ].map(({ color, label, sub }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
              <div>
                <span className="text-[11px] text-white leading-none">{label}</span>
                <span className="text-[10px] text-surface-400 ml-1">{sub}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-surface-700 pt-1.5 mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
              <span className="text-[11px] text-white">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
              <span className="text-[11px] text-white">Hovered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone count badge */}
      <div className="absolute bottom-8 right-12 z-10 bg-surface-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-white shadow-md">
        <span className="text-[11px] font-semibold tabular-nums">
          {geojson ? `${geojson.features.length} zones` : 'No data'}
        </span>
      </div>

      {/* Selected zone info panel */}
      {selectedZone && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-surface-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white shadow-lg max-w-xs pointer-events-none">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(selectedZone.priority_category)}`} />
            <span className="text-xs font-mono font-semibold truncate">{selectedZone.zone_id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${priorityBadgeClass(selectedZone.priority_category)}`}>
              {selectedZone.priority_category || 'Unknown'}
            </span>
          </div>
          <div className="flex gap-3 mt-1.5 text-[11px] text-surface-300">
            <span>Risk <strong className="text-white">{selectedZone.mean_risk?.toFixed(3)} σ</strong></span>
            <span>Rank <strong className="text-white">#{selectedZone.priority_rank ?? selectedZone.rank ?? '—'}</strong></span>
            {(selectedZone.approx_area_m2 ?? selectedZone.area_m2) != null && (
              <span>Area <strong className="text-white">{(((selectedZone.approx_area_m2 ?? selectedZone.area_m2)!) / 10000).toFixed(1)} ha</strong></span>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// ── Popup content sub-component ───────────────────────────────────────────────

function PopupContent({ zone, runId, scene }: { zone: MapZone; runId: string; scene: string }) {
  const rank  = zone.priority_rank ?? zone.rank
  const area  = zone.approx_area_m2 ?? zone.area_m2
  const isHigh = (zone.priority_category || '').toLowerCase().includes('high')

  return (
    <div className="bg-white rounded-lg shadow-xl border border-surface-200 overflow-hidden min-w-[220px]">
      {/* Header */}
      <div className="bg-surface-900 px-3 py-2.5 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(zone.priority_category)}`} />
        <span className="text-xs font-mono font-bold text-white truncate">{zone.zone_id}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${priorityBadgeClass(zone.priority_category)}`}>
            {zone.priority_category || 'Unknown'}
          </span>
          {isHigh && (
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Inspect First</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            <span className="text-surface-400 block">Rank</span>
            <span className="font-bold text-surface-900">#{rank ?? '—'}</span>
          </div>
          <div>
            <span className="text-surface-400 block">Mean Risk</span>
            <span className="font-bold text-surface-900">{typeof zone.mean_risk === 'number' ? zone.mean_risk.toFixed(3) : '—'} σ</span>
          </div>
          <div>
            <span className="text-surface-400 block">Max Risk</span>
            <span className="font-bold text-surface-900">{typeof zone.max_risk === 'number' ? zone.max_risk.toFixed(3) : '—'} σ</span>
          </div>
          <div>
            <span className="text-surface-400 block">Pixels</span>
            <span className="font-bold text-surface-900">{zone.pixel_count ?? '—'}</span>
          </div>
          {area != null && (
            <div className="col-span-2">
              <span className="text-surface-400 block">Area</span>
              <span className="font-bold text-surface-900">{(area / 10000).toFixed(2)} ha</span>
            </div>
          )}
        </div>

        {/* Risk intensity bar */}
        <div>
          <div className="flex justify-between text-[10px] text-surface-400 mb-1">
            <span>Anomaly intensity</span>
            <span>{typeof zone.mean_risk === 'number' ? ((Math.min(zone.mean_risk, 3) / 3) * 100).toFixed(0) : 0}%</span>
          </div>
          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${typeof zone.mean_risk === 'number' ? Math.min((zone.mean_risk / 3) * 100, 100) : 0}%`,
                background: 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)',
              }}
            />
          </div>
        </div>

        {zone.recommendation && (
          <p className="text-[10px] text-surface-500 leading-relaxed border-t border-surface-100 pt-2">
            {zone.recommendation}
          </p>
        )}

        <p className="text-[10px] text-amber-600 font-medium">Field verification required</p>
      </div>

      {/* Footer */}
      <div className="border-t border-surface-100 px-3 py-2 bg-surface-50">
        <a
          href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
          className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
        >
          View spectral evidence
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </a>
      </div>
    </div>
  )
}
