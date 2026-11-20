import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, MapPin, Bus, AlertCircle, Compass } from 'lucide-react';
import { formatTime, formatRelativeTime } from '../utils/formatters';

// Custom SVG Icons for Leaflet
const createBusIcon = (busNumber = 'BUS', isLive = true, heading = 0) => {
  const bgColor = isLive ? '#FFB800' : '#94A3B8';
  const pulseClass = isLive ? 'animate-bounce' : '';

  const html = `
    <div style="transform: rotate(${heading}deg); transition: transform 0.8s ease;" class="relative flex items-center justify-center">
      <div style="background-color: ${bgColor}; border: 3px solid #0B192C; width: 44px; height: 44px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0B192C;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"></path>
          <path d="M15 6v6"></path>
          <path d="M2 12h19.6"></path>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2-.3-1.1-.8-2.8-.8-2.8H2"></path>
          <path d="M4 18h11"></path>
          <circle cx="7" cy="18" r="2"></circle>
          <circle cx="17" cy="18" r="2"></circle>
        </svg>
      </div>
      <div style="position: absolute; bottom: -16px; background-color: #0B192C; color: #FFF; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 6px; border: 1px solid #334155; white-space: nowrap;">
        ${busNumber}
      </div>
      ${
        isLive
          ? `<span style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background-color: #10B981; border: 2px solid white; border-radius: 9999px;"></span>`
          : `<span style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background-color: #F59E0B; border: 2px solid white; border-radius: 9999px;"></span>`
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-bus-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

const createStopIcon = (order = 1, isNext = false, isPassed = false) => {
  let bgColor = '#1E88E5';
  let borderColor = '#FFFFFF';
  let textColor = '#FFFFFF';

  if (isPassed) {
    bgColor = '#94A3B8';
  } else if (isNext) {
    bgColor = '#10B981';
    borderColor = '#0B192C';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${
        isNext
          ? `<div style="position: absolute; width: 34px; height: 34px; background: rgba(16, 185, 129, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ''
      }
      <div style="background-color: ${bgColor}; border: 2px solid ${borderColor}; width: 26px; height: 26px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: ${textColor}; font-size: 11px; font-weight: 800;">
        ${order}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-stop-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

// Component to dynamically fit bounds or re-center map when location/route updates
const MapController = ({ center, bounds, zoom = 14 }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 1) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) {
        // Fallback to center
        if (center) map.setView(center, zoom);
      }
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [center, bounds, map, zoom]);

  return null;
};

export const LiveMap = ({
  busLocation,
  busNumber = 'BUS-01',
  route,
  isLive = true,
  fleetBuses = [], // For admin multi-bus fleet mode
  height = '500px',
  onSelectBus,
}) => {
  // Default coordinates: CampusBus Terminal (30.2520, 74.8860)
  const defaultPos = [30.2520, 74.8860];

  const currentLat =
    busLocation?.latitude != null && !isNaN(busLocation.latitude)
      ? busLocation.latitude
      : defaultPos[0];
  const currentLng =
    busLocation?.longitude != null && !isNaN(busLocation.longitude)
      ? busLocation.longitude
      : defaultPos[1];
  const busHeading = busLocation?.heading || 0;

  // Polyline coordinates from assigned route (with coordinate validation)
  const polylineCoords =
    (route?.pathCoordinates?.filter((c) => c && c.lat != null && c.lng != null).map((c) => [c.lat, c.lng])) ||
    (route?.stops?.filter((s) => s && s.lat != null && s.lng != null).map((s) => [s.lat, s.lng])) ||
    [];

  // Compute bounding box for map
  const bounds = polylineCoords.length > 0 ? polylineCoords : [[currentLat, currentLng]];

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100" style={{ height }}>
      {/* Map Control HUD Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
          <span className="font-bold text-slate-800">
            {isLive ? 'Live Simulated Tracking' : 'Last-Known Location'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-300"></div>

        <div className="flex items-center gap-1 text-slate-600">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Speed: <strong>{busLocation?.speedKmH || 0} km/h</strong></span>
        </div>

        {busLocation?.lastUpdated && (
          <div className="hidden sm:flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: {formatTime(busLocation.lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Offline Watermark if offline */}
      {!isLive && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-amber-50/95 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg shadow text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Displaying cached coordinates. Satellite sync resumes when connected.</span>
        </div>
      )}

      <MapContainer
        center={[currentLat, currentLng]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={[currentLat, currentLng]} bounds={bounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline */}
        {polylineCoords.length > 0 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: route?.isExamRoute ? '#8B5CF6' : '#1E88E5',
              weight: 5,
              opacity: 0.85,
              dashArray: route?.isExamRoute ? '8, 8' : undefined,
            }}
          />
        )}

        {/* Route Stop Pins */}
        {route?.stops?.filter((stop) => stop && stop.lat != null && stop.lng != null).map((stop, index) => {
          const isPassed = busLocation?.currentStopIndex > index;
          const isNext = busLocation?.nextStopOrder === stop.order;

          return (
            <Marker
              key={stop._id || stop.stopId || index}
              position={[stop.lat, stop.lng]}
              icon={createStopIcon(stop.order, isNext, isPassed)}
            >
              <Popup>
                <div className="p-1 min-w-[180px] text-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Stop #{stop.order}: {stop.name}</span>
                  </div>
                  {stop.landmark && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Landmark: {stop.landmark}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs flex justify-between text-slate-600">
                    <span>Morning: <strong>{stop.morningPickupTime}</strong></span>
                    <span>Evening: <strong>{stop.eveningDropTime}</strong></span>
                  </div>
                  {isNext && (
                    <div className="mt-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded text-center border border-emerald-200">
                      NEXT UPCOMING STOP
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Single Main Bus Marker */}
        {(!fleetBuses || fleetBuses.length === 0) && (
          <Marker
            position={[currentLat, currentLng]}
            icon={createBusIcon(busNumber, isLive, busHeading)}
          >
            <Popup>
              <div className="p-1 min-w-[200px] text-slate-800">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="font-extrabold text-base text-slate-900">{busNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isLive ? 'LIVE' : 'LAST KNOWN'}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>Route: <strong>{route?.name || 'Assigned Route'}</strong></p>
                  <p>Next Stop: <strong>{busLocation?.nextStopName || 'Campus Terminus'}</strong></p>
                  <p>Speed: <strong>{busLocation?.speedKmH || 0} km/h</strong></p>
                  <p className="text-[10px] text-slate-400">
                    Last updated: {formatRelativeTime(busLocation?.lastUpdated)}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Multi-Bus Markers (for Admin Fleet Overview) */}
        {fleetBuses &&
          fleetBuses.length > 0 &&
          fleetBuses.map((bus) => {
            const bLat = bus.location?.latitude || bus.latitude || defaultPos[0];
            const bLng = bus.location?.longitude || bus.longitude || defaultPos[1];
            const bLive = bus.location?.isLive !== undefined ? bus.location.isLive : bus.isLive;

            return (
              <Marker
                key={bus.busId || bus._id}
                position={[bLat, bLng]}
                icon={createBusIcon(bus.busNumber, bLive, bus.location?.heading || 0)}
                eventHandlers={{
                  click: () => onSelectBus && onSelectBus(bus),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-900">{bus.busNumber}</span>
                      <span className="text-xs text-slate-500 font-mono">{bus.registrationNumber}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p>Route: <strong>{bus.routeName || bus.route?.name || 'Unassigned'}</strong></p>
                      <p>Driver: <strong>{bus.driver?.name || bus.driverName || 'Unassigned'}</strong></p>
                      <p>Status: <strong className="capitalize">{bus.status || bus.tripStatus}</strong></p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;

