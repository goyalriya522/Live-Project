import React from 'react';
import { Clock, MapPin, Gauge, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

export const ETAProgressCard = ({
  busLocation,
  busNumber = 'BUS-01',
  currentTrip,
  assignedRoute,
  selectedStopName,
  isLive = true,
}) => {
  const isDelayed = currentTrip?.status === 'delayed' || (currentTrip?.delayMinutes && currentTrip.delayMinutes > 0);
  const nextStop = busLocation?.nextStopName || 'Approaching Stop';
  const etaMinutes = busLocation?.etaNextStopMinutes || 4;
  const speed = busLocation?.speedKmH || 0;
  const progressPercent = busLocation?.pathProgressPercent || 35;

  // Find if student has a selected stop and what its ETA is
  let studentStopEta = null;
  const stopsList = assignedRoute?.stopsWithEta || assignedRoute?.stops || [];
  if (selectedStopName && stopsList.length > 0) {
    const matchedStop = stopsList.find(
      (s) => s && s.name && s.name.toLowerCase() === selectedStopName.toLowerCase()
    );
    if (matchedStop) {
      studentStopEta = matchedStop;
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Estimated Arrival Time</h3>
            <p className="text-xs text-slate-500">Live dynamic calculation</p>
          </div>
        </div>

        {/* Live / Delayed Status Badge */}
        {isDelayed ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Delayed (+{currentTrip.delayMinutes}m)</span>
          </div>
        ) : isLive ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>On Schedule</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Last Known ETA
          </div>
        )}
      </div>

      {/* Main ETA Stat Highlight */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Next Stop ETA */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            Next Stop
          </div>
          <div className="text-base font-extrabold text-slate-900 mt-1 truncate" title={nextStop}>
            {nextStop}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-blue-600">{etaMinutes}</span>
            <span className="text-sm font-semibold text-slate-600">mins approx</span>
          </div>
        </div>

        {/* Student's Assigned Stop ETA (if set) or Route Speed */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
          {studentStopEta ? (
            <>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Your Boarding Stop
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-1 truncate" title={studentStopEta.name}>
                {studentStopEta.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-600">
                  {studentStopEta.isPassed
                    ? 'Passed'
                    : studentStopEta.estimatedMinutesRemaining !== undefined
                    ? `${studentStopEta.estimatedMinutesRemaining}m`
                    : studentStopEta.morningPickupTime || '~10m'}
                </span>
                {!studentStopEta.isPassed && studentStopEta.distanceFromBusKm !== undefined && (
                  <span className="text-xs text-slate-500">
                    ({studentStopEta.distanceFromBusKm} km away)
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-600" />
                Transit Velocity
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {busNumber} Current Speed
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800">{speed}</span>
                <span className="text-sm font-semibold text-slate-600">km/h</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Route Journey Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>Route Completion</span>
          <span className="text-blue-600 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          ></div>
        </div>
      </div>

      {/* Delay explanation banner if delayed */}
      {isDelayed && currentTrip?.delayReason && (
        <div className="mt-3 bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Delay Advisory:</span> {currentTrip.delayReason}
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <p className="mt-3 text-[11px] text-slate-600 text-center italic">
        * Estimated Arrival Times (ETA) are approximate and dynamically modeled based on traffic corridor speeds.
      </p>
    </div>
  );
};

export default ETAProgressCard;

