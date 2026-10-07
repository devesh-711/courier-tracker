import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Truck,
  MapPin,
  Building2,
  Navigation,
  Maximize2,
  Minimize2,
  Layers,
  Radio,
  Play,
  Square,
  Compass,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import type { Shipment } from '@/types';
import {
  resolveShipmentCoordinates,
  calculateDistance,
  formatKmToMiles,
  getShipmentGeoFenceZones,
  type GeoFenceZone,
} from '@/lib/geo';
import { Badge } from '@/components/ui';

export interface GeoFenceTransitionEvent {
  zone: GeoFenceZone;
  transition: 'ENTER' | 'EXIT';
  distanceKm: number;
}

interface ShipmentMapProps {
  shipment: Shipment;
  onLocationUpdate?: (lat: number, lng: number, city?: string) => void;
  onGeoFenceTransition?: (event: GeoFenceTransitionEvent) => void;
  className?: string;
  geoFenceRadiusKm?: number;
  onGeoFenceRadiusChange?: (radius: number) => void;
}

// Controller component to smoothly adjust bounds or center when coordinates change
function MapViewController({
  bounds,
  centerOnCourier,
  courierCoords,
  isExpanded,
}: {
  bounds: L.LatLngBoundsExpression | null;
  centerOnCourier: boolean;
  courierCoords: [number, number];
  isExpanded: boolean;
}) {
  const map = useMap();

  // Invalidate size when fullscreen/expanded or mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map, isExpanded]);

  // Handle bounds fitting or centering
  useEffect(() => {
    if (centerOnCourier && courierCoords) {
      map.flyTo(courierCoords, Math.max(map.getZoom(), 11), {
        animate: true,
        duration: 0.8,
      });
    } else if (bounds) {
      try {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
          duration: 0.8,
        });
      } catch {
        // Fallback
      }
    }
  }, [map, bounds, centerOnCourier, courierCoords]);

  return null;
}

const TILE_SERVERS = {
  cartoVoyager: {
    name: 'Detailed Light',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  cartoDark: {
    name: 'Cyber Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
};

export function ShipmentMap({
  shipment,
  onLocationUpdate,
  onGeoFenceTransition,
  className = '',
  geoFenceRadiusKm = 25,
  onGeoFenceRadiusChange,
}: ShipmentMapProps) {
  const [selectedTile, setSelectedTile] = useState<'cartoVoyager' | 'cartoDark' | 'osm'>('cartoVoyager');
  const [centerOnCourier, setCenterOnCourier] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showGeoFence, setShowGeoFence] = useState(true);
  const [showGeoFenceSettings, setShowGeoFenceSettings] = useState(false);
  const [localRadiusKm, setLocalRadiusKm] = useState(geoFenceRadiusKm);
  const stepRef = useRef(0);

  // Sync radius state
  const activeRadiusKm = onGeoFenceRadiusChange ? geoFenceRadiusKm : localRadiusKm;

  // Coordinate resolution
  const { origin, destination, current, hasLiveCoords, progressPercent } = useMemo(() => {
    return resolveShipmentCoordinates(shipment);
  }, [shipment]);

  // Predefined delivery zones
  const geoFenceZones = useMemo(() => {
    return getShipmentGeoFenceZones(shipment, activeRadiusKm);
  }, [shipment, activeRadiusKm]);

  // Primary Destination Delivery Zone
  const primaryDeliveryZone = useMemo(() => {
    return geoFenceZones.find((z) => z.type === 'DESTINATION_DELIVERY') || geoFenceZones[0];
  }, [geoFenceZones]);

  // Distance to destination center
  const distToDeliveryZoneCenterKm = useMemo(() => {
    return calculateDistance(current[0], current[1], primaryDeliveryZone.center[0], primaryDeliveryZone.center[1]);
  }, [current, primaryDeliveryZone]);

  const isInsideDeliveryZone = distToDeliveryZoneCenterKm <= primaryDeliveryZone.radiusKm;

  // Distance calculations
  const totalDistanceKm = useMemo(() => {
    return calculateDistance(origin[0], origin[1], destination[0], destination[1]);
  }, [origin, destination]);

  const remainingDistanceKm = useMemo(() => {
    if (shipment.status === 'DELIVERED') return 0;
    return calculateDistance(current[0], current[1], destination[0], destination[1]);
  }, [current, destination, shipment.status]);

  // Geo-Fence transition detection engine
  const prevInsideStateMap = useRef<Record<string, boolean>>({});
  const isInitialMount = useRef(true);

  useEffect(() => {
    geoFenceZones.forEach((zone) => {
      const dist = calculateDistance(current[0], current[1], zone.center[0], zone.center[1]);
      const isNowInside = dist <= zone.radiusKm;
      const prevInside = prevInsideStateMap.current[zone.id];

      // Only fire transition if not first mount and state changed
      if (!isInitialMount.current && prevInside !== undefined && prevInside !== isNowInside) {
        if (onGeoFenceTransition) {
          onGeoFenceTransition({
            zone,
            transition: isNowInside ? 'ENTER' : 'EXIT',
            distanceKm: dist,
          });
        }
      }

      prevInsideStateMap.current[zone.id] = isNowInside;
    });

    isInitialMount.current = false;
  }, [current, geoFenceZones, onGeoFenceTransition]);

  // Bounds enclosing all key coordinates
  const bounds = useMemo<L.LatLngBoundsExpression>(() => {
    return L.latLngBounds([origin, current, destination]);
  }, [origin, current, destination]);

  // Custom marker icons
  const originIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -top-7 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md uppercase tracking-wider whitespace-nowrap">
            Origin
          </div>
          <div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white shadow-lg border-2 border-white ring-2 ring-blue-500/30">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -22],
    });
  }, []);

  const destinationIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-destination-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -top-7 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md uppercase tracking-wider whitespace-nowrap">
            Destination
          </div>
          <div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg border-2 border-white ring-2 ring-emerald-500/30">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -22],
    });
  }, []);

  const courierIcon = useMemo(() => {
    const isMoving = shipment.status === 'IN_TRANSIT' || shipment.status === 'OUT_FOR_DELIVERY';
    return L.divIcon({
      className: 'custom-courier-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Animated Radar Ping -->
          <span class="absolute inline-flex h-14 w-14 animate-ping rounded-full ${isInsideDeliveryZone ? 'bg-emerald-400/40' : 'bg-amber-400/40'} opacity-75"></span>
          <span class="absolute inline-flex h-10 w-10 animate-pulse rounded-full ${isInsideDeliveryZone ? 'bg-emerald-500/30' : 'bg-amber-500/30'}"></span>

          <!-- Tag -->
          <div class="absolute -top-7 rounded-full ${isInsideDeliveryZone ? 'bg-emerald-600 border-emerald-300' : 'bg-amber-500 border-amber-300'} px-2 py-0.5 text-[10px] font-extrabold text-white shadow-lg uppercase tracking-wider whitespace-nowrap flex items-center gap-1 border">
            <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
            ${shipment.status === 'DELIVERED' ? 'DELIVERED' : isInsideDeliveryZone ? 'IN GEO-ZONE' : 'LIVE GPS'}
          </div>

          <!-- Main Pin Avatar -->
          <div class="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl ${
            isInsideDeliveryZone
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-emerald-500/40'
              : 'bg-gradient-to-tr from-amber-600 to-orange-500 ring-amber-500/40'
          } text-white shadow-2xl border-2 border-white ring-4">
            <svg class="h-5 w-5 ${isMoving ? 'animate-bounce' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -26],
    });
  }, [shipment.status, isInsideDeliveryZone]);

  // Interactive Live GPS Simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % 20;
      const ratio = Math.max(0.1, Math.min(0.95, stepRef.current / 20));
      const newLat = origin[0] + (destination[0] - origin[0]) * ratio + (Math.random() - 0.5) * 0.005;
      const newLng = origin[1] + (destination[1] - origin[1]) * ratio + (Math.random() - 0.5) * 0.005;
      const intermediateCity = `En Route (Mile Marker ${Math.round(totalDistanceKm * ratio * 0.621371)})`;

      if (onLocationUpdate) {
        onLocationUpdate(newLat, newLng, intermediateCity);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, origin, destination, totalDistanceKm, onLocationUpdate]);

  // Interactive Boundary Crossing Simulator Button
  const handleToggleBoundaryCrossing = () => {
    if (!onLocationUpdate) return;
    if (isInsideDeliveryZone) {
      // Jump courier outside the zone (e.g. radius + 15 km)
      const offset = (activeRadiusKm + 18) / 111; // 1 degree lat is ~111km
      const newLat = destination[0] - offset;
      const newLng = destination[1] - offset;
      onLocationUpdate(
        newLat,
        newLng,
        `Corridor Approach (${primaryDeliveryZone.name} Perimeter - Outside)`,
      );
    } else {
      // Jump courier inside the zone (e.g. 4 km from destination)
      const offset = 4 / 111;
      const newLat = destination[0] + offset;
      const newLng = destination[1] + offset;
      onLocationUpdate(
        newLat,
        newLng,
        `${shipment.recipientCity || 'Metro'} Delivery Zone (Inside Perimeter)`,
      );
    }
  };

  const handleRadiusChange = (radius: number) => {
    setLocalRadiusKm(radius);
    if (onGeoFenceRadiusChange) {
      onGeoFenceRadiusChange(radius);
    }
  };

  // Completed path and remaining path coordinates
  const traveledPath: [number, number][] = useMemo(() => [origin, current], [origin, current]);
  const remainingPath: [number, number][] = useMemo(() => [current, destination], [current, destination]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-surface-900 shadow-xl transition-all duration-300 dark:border-surface-800 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'h-[480px] w-full'
      } ${className}`}
    >
      {/* Top Floating Map Header Bar */}
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Real-time Status Pills & Geo-Fence Beacon */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Geo-Fence Status Indicator */}
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs backdrop-blur-md border shadow-lg transition-all ${
              isInsideDeliveryZone
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40 ring-2 ring-emerald-500/20'
                : 'bg-surface-900/90 text-surface-200 border-white/10'
            }`}
          >
            {isInsideDeliveryZone ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            )}
            <span className="font-bold">
              {isInsideDeliveryZone ? 'Inside Geo-Fence Zone' : 'Outside Geo-Fence Zone'}
            </span>
            <span className="text-3xs font-mono opacity-80">
              ({distToDeliveryZoneCenterKm} km to dest)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-surface-900/90 px-3 py-1.5 text-xs text-white backdrop-blur-md border border-white/10 shadow-lg">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-2xs text-surface-400">
              {hasLiveCoords ? 'Sat GPS Active' : 'City Interpolated'}
            </span>
          </div>

          <Badge variant="primary" className="shadow-lg backdrop-blur-md">
            {shipment.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Map Tool Actions */}
        <div className="flex items-center gap-1.5 rounded-xl bg-surface-900/90 p-1 text-white backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
          {/* Geo-Fence Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowGeoFence((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${
              showGeoFence
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'text-surface-400 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Geo-Fence Zone overlay on map"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Geo-Fence: {showGeoFence ? 'ON' : 'OFF'}</span>
          </button>

          {/* Geo-Fence Radius & Zone Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGeoFenceSettings((prev) => !prev)}
              className="rounded-lg p-1.5 text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Geo-Fence Zone Configuration"
            >
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            </button>

            {showGeoFenceSettings && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-900 p-3 shadow-2xl border border-surface-700 text-xs z-50 space-y-2.5">
                <div className="flex items-center justify-between border-b border-surface-800 pb-1.5">
                  <span className="font-bold text-white">Delivery Zone Area</span>
                  <span className="text-3xs text-emerald-400 font-mono">{activeRadiusKm} km</span>
                </div>
                <p className="text-3xs text-surface-400">
                  Predefined perimeter around recipient destination that triggers automated entry/exit toast alerts.
                </p>
                <div>
                  <span className="text-3xs uppercase font-bold text-surface-400 block mb-1">Perimeter Radius</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[10, 25, 50].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRadiusChange(r)}
                        className={`rounded-lg py-1 text-center font-mono text-2xs transition-colors ${
                          activeRadiusKm === r
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Test Boundary Crossing Button */}
          <button
            type="button"
            onClick={handleToggleBoundaryCrossing}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
            title={
              isInsideDeliveryZone
                ? 'Simulate moving outside the delivery zone (Triggers EXIT toast)'
                : 'Simulate moving inside the delivery zone (Triggers ENTER toast)'
            }
          >
            <span>{isInsideDeliveryZone ? 'Test Exit Zone' : 'Test Enter Zone'}</span>
          </button>

          <div className="h-4 w-px bg-white/20" />

          {/* Tile Layer Selector */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Change Map Style"
            >
              <Layers className="h-3.5 w-3.5 text-primary-400" />
              <span className="hidden lg:inline">{TILE_SERVERS[selectedTile].name}</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col gap-1 rounded-xl bg-surface-900 p-2 shadow-xl border border-surface-700 min-w-[140px] z-50">
              {(Object.keys(TILE_SERVERS) as (keyof typeof TILE_SERVERS)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTile(key)}
                  className={`rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    selectedTile === key
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-surface-300 hover:bg-surface-800'
                  }`}
                >
                  {TILE_SERVERS[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Center on Courier */}
          <button
            type="button"
            onClick={() => setCenterOnCourier((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              centerOnCourier
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'text-surface-300 hover:text-white hover:bg-white/10'
            }`}
            title="Focus on Vehicle"
          >
            <Navigation className="h-3.5 w-3.5" />
          </button>

          {/* Reset / Fit Route */}
          <button
            type="button"
            onClick={() => setCenterOnCourier(false)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Fit Entire Route"
          >
            <Compass className="h-3.5 w-3.5" />
          </button>

          {/* Live Simulator Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulating((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isSimulating
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-surface-300 hover:text-white hover:bg-white/10'
            }`}
            title={isSimulating ? 'Stop Live GPS Movement' : 'Simulate Real-Time Driving GPS'}
          >
            {isSimulating ? <Square className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-emerald-400 text-emerald-400" />}
            <span className="hidden md:inline">{isSimulating ? 'Simulating' : 'Simulate'}</span>
          </button>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-lg p-1.5 text-surface-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Minimize Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-full w-full relative z-0">
        <MapContainer
          key={`map-${shipment.id}-${selectedTile}-${activeRadiusKm}`}
          center={current}
          zoom={6}
          scrollWheelZoom={true}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url={TILE_SERVERS[selectedTile].url}
            attribution={TILE_SERVERS[selectedTile].attribution}
          />

          <MapViewController
            bounds={centerOnCourier ? null : bounds}
            centerOnCourier={centerOnCourier}
            courierCoords={current}
            isExpanded={isExpanded}
          />

          {/* Geo-Fencing Circles (Predefined Delivery Zones) */}
          {showGeoFence &&
            geoFenceZones.map((zone) => {
              const isDestZone = zone.type === 'DESTINATION_DELIVERY';
              const isInThisZone = isDestZone ? isInsideDeliveryZone : false;

              return (
                <Circle
                  key={zone.id}
                  center={zone.center}
                  radius={zone.radiusKm * 1000}
                  pathOptions={{
                    color: isInThisZone ? '#10b981' : zone.color,
                    fillColor: zone.fillColor,
                    fillOpacity: isInThisZone ? 0.22 : 0.12,
                    weight: isDestZone ? 2.5 : 1.5,
                    dashArray: '6, 8',
                  }}
                >
                  <Popup>
                    <div className="p-3 text-xs min-w-[220px] space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-surface-900 dark:text-surface-100">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <span>{zone.name}</span>
                      </div>
                      <p className="text-2xs text-surface-500">{zone.description}</p>
                      <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-800 text-2xs space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-surface-400">Radius:</span>
                          <span className="font-bold">{zone.radiusKm} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-400">Current Status:</span>
                          <span
                            className={`font-bold ${
                              isInThisZone
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isInThisZone ? 'INSIDE ZONE' : 'OUTSIDE ZONE'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-400">Distance to Center:</span>
                          <span className="font-bold">
                            {calculateDistance(current[0], current[1], zone.center[0], zone.center[1])} km
                          </span>
                        </div>
                      </div>
                      <p className="text-3xs text-surface-400 italic">
                        Automated toast notifications are active when shipment crosses this perimeter.
                      </p>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

          {/* Traveled Route Polyline */}
          <Polyline
            positions={traveledPath}
            pathOptions={{
              color: '#3b82f6',
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />

          {/* Remaining Route Polyline (Dashed) */}
          <Polyline
            positions={remainingPath}
            pathOptions={{
              color: '#94a3b8',
              weight: 4,
              opacity: 0.7,
              dashArray: '8, 10',
              lineCap: 'round',
            }}
          />

          {/* Origin Marker */}
          <Marker position={origin} icon={originIcon}>
            <Popup>
              <div className="p-3 text-xs min-w-[210px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>Sender Dispatch Hub</span>
                </div>
                <p className="font-semibold text-surface-900 dark:text-surface-100">{shipment.senderName}</p>
                <p className="text-surface-500">{shipment.senderAddress}, {shipment.senderCity}, {shipment.senderState}</p>
                <div className="pt-1 border-t border-surface-200 dark:border-surface-700 text-2xs text-surface-400 font-mono">
                  GPS: {origin[0].toFixed(4)}°, {origin[1].toFixed(4)}°
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Current Real-Time Position Marker */}
          <Marker position={current} icon={courierIcon} zIndexOffset={100}>
            <Popup>
              <div className="p-3 text-xs min-w-[230px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-500 flex items-center gap-1 uppercase tracking-wider text-2xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                    Live GPS Telemetry
                  </span>
                  <Badge variant="primary" className="text-3xs">{shipment.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div>
                  <p className="font-bold text-surface-900 dark:text-surface-100 text-sm">
                    {shipment.currentCity || 'In Transit Distribution'}
                  </p>
                  <p className="text-surface-500 text-2xs">
                    Assigned: {shipment.assignedDriverName || 'Primary Agent'}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-800 text-2xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-surface-400">Coordinates:</span>
                    <span className="font-bold text-surface-700 dark:text-surface-300">
                      {current[0].toFixed(4)}° N, {Math.abs(current[1]).toFixed(4)}° W
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Geo-Fence:</span>
                    <span
                      className={`font-bold ${
                        isInsideDeliveryZone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isInsideDeliveryZone ? 'Inside Perimeter' : 'Outside Perimeter'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Journey Progress:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{progressPercent}%</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={destination} icon={destinationIcon}>
            <Popup>
              <div className="p-3 text-xs min-w-[210px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Delivery Destination</span>
                </div>
                <p className="font-semibold text-surface-900 dark:text-surface-100">{shipment.recipientName}</p>
                <p className="text-surface-500">{shipment.recipientAddress}, {shipment.recipientCity}, {shipment.recipientState}</p>
                <div className="pt-1 border-t border-surface-200 dark:border-surface-700 text-2xs text-surface-400 font-mono">
                  GPS: {destination[0].toFixed(4)}°, {destination[1].toFixed(4)}°
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom Floating Telemetry & Geo-Fence Card */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
        <div className="mx-auto flex max-w-3xl flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-surface-900/90 p-3.5 text-white backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
          {/* Current City & Coords */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner ${
                isInsideDeliveryZone
                  ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/40'
                  : 'bg-primary-600/30 text-primary-400 border-primary-500/40'
              }`}
            >
              {isInsideDeliveryZone ? <ShieldCheck className="h-5 w-5" /> : <Truck className="h-5 w-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-white">
                  {shipment.currentCity || shipment.recipientCity}
                </p>
                <span
                  className={`text-3xs font-mono uppercase px-1.5 py-0.5 rounded-full border ${
                    isInsideDeliveryZone
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isInsideDeliveryZone ? 'Inside Delivery Zone' : 'En Route to Zone'}
                </span>
                <span className="text-3xs font-mono uppercase bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded-full border border-primary-500/30">
                  {progressPercent}% Complete
                </span>
              </div>
              <p className="text-2xs text-surface-400 font-mono mt-0.5">
                {current[0].toFixed(4)}° N, {Math.abs(current[1]).toFixed(4)}° W • {distToDeliveryZoneCenterKm} km from {shipment.recipientCity}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0 text-2xs">
            <div className="text-left sm:text-right">
              <span className="text-surface-400 block uppercase tracking-wider text-3xs">Zone Perimeter</span>
              <span className="font-bold text-emerald-400 font-mono">
                {activeRadiusKm} km radius
              </span>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="text-left sm:text-right">
              <span className="text-surface-400 block uppercase tracking-wider text-3xs">Remaining</span>
              <span className="font-bold text-surface-100 font-mono">
                {formatKmToMiles(remainingDistanceKm)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
