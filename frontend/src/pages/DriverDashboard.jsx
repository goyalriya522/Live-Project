import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { driverService } from '../services/driverService';
import EmergencyModal from '../components/EmergencyModal';
import OfflineBanner from '../components/OfflineBanner';
import {
  Bus,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Navigation,
  MapPin,
  RefreshCw,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const { isOnline, queueAction, cachedData } = useOffline();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [delayInput, setDelayInput] = useState(10);
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState('');

  const loadDriverData = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const res = await driverService.getDashboard();
        setData(res);
      } else {
        // Offline fallback
        if (cachedData) {
          const bus = cachedData.buses.find(
            (b) => String(b.assignedDriver) === String(user?._id) || String(b._id) === String(user?.assignedBus)
          ) || cachedData.buses[0];

          const route = cachedData.routes.find((r) => String(r._id) === String(bus?.assignedRoute));
          const sched = cachedData.schedules.find((s) => String(s.busId) === String(bus?._id));

          setData({
            driver: user,
            assignedBus: bus,
            assignedRoute: route,
            schedule: sched,
            currentTrip: { status: 'started' },
          });
        }
      }
    } catch (err) {
      console.warn('Driver dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [cachedData, user]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  const handleStartTrip = async () => {
    try {
      setActionLoading(true);
      if (navigator.onLine) {
        const res = await driverService.startTrip({
          busId: data?.assignedBus?._id,
          routeId: data?.assignedRoute?._id,
        });
        setData((prev) => ({
          ...prev,
          currentTrip: res.trip,
          assignedBus: res.bus,
        }));
      } else {
        // Queue offline
        await queueAction('trip_status_update', {
          tripId: data?.currentTrip?._id || 'trip_offline',
          status: 'started',
        });
        setData((prev) => ({
          ...prev,
          currentTrip: { ...(prev?.currentTrip || {}), status: 'started' },
        }));
      }
      setStatusFeedback('Trip Started! GPS tracking activated.');
      setTimeout(() => setStatusFeedback(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to start trip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status, delayMins = 0, delayReason = '') => {
    try {
      setActionLoading(true);
      if (navigator.onLine) {
        const res = await driverService.updateTripStatus({
          status,
          delayMinutes: delayMins,
          delayReason,
          nextStopName: data?.assignedRoute?.stops?.[1]?.name || 'Next Stop',
        });
        setData((prev) => ({
          ...prev,
          currentTrip: res.trip,
          assignedBus: res.bus,
        }));
      } else {
        await queueAction('trip_status_update', {
          tripId: data?.currentTrip?._id || 'trip_offline',
          status,
          delayMinutes: delayMins,
          delayReason,
        });
        setData((prev) => ({
          ...prev,
          currentTrip: { ...(prev?.currentTrip || {}), status, delayMinutes: delayMins },
        }));
      }

      setStatusFeedback(`Status updated to: ${status.toUpperCase().replace('_', ' ')}`);
      setShowDelayPicker(false);
      setTimeout(() => setStatusFeedback(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update trip status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencySubmit = async (emergencyPayload) => {
    if (navigator.onLine) {
      await driverService.reportEmergency(emergencyPayload);
    } else {
      await queueAction('emergency_report', {
        busId: data?.assignedBus?._id,
        emergencyType: emergencyPayload.type,
        description: emergencyPayload.description,
        severity: emergencyPayload.severity,
      });
    }
    setStatusFeedback('EMERGENCY REPORT TRANSMITTED TO CONTROL ROOM');
    setTimeout(() => setStatusFeedback(''), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const bus = data?.assignedBus;
  const route = data?.assignedRoute;
  const trip = data?.currentTrip;
  const tripStatus = trip?.status || 'not_started';

  const isTripActive = tripStatus === 'started' || tripStatus === 'on_route' || tripStatus === 'approaching_stop';

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 select-none">
      <OfflineBanner />

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {!bus ? (
          <div className="bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-700 shadow-xl text-center space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
              <Bus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">No College Bus Assigned Yet</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Welcome, <strong>{user?.name}</strong>. Your driver account is active, but no college bus or route has been linked to your profile yet.
              </p>
            </div>
            <div className="pt-2 p-5 bg-slate-900/80 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-2 max-w-md mx-auto">
              <p className="font-bold text-amber-400">CampusBus Central Transport Control Office</p>
              <p>Muktsar Road, Deon Campus, Bathinda, Punjab 151001</p>
              <p className="text-slate-400">Please contact the fleet administrator to assign your designated college route and bus.</p>
              <p className="text-emerald-400 font-mono font-bold">Helpline: +91 164-2786001 / +91 95011-15101</p>
            </div>
          </div>
        ) : (
          <>
            {/* Driver Header */}
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black text-xl">
                  <Bus className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {bus.busNumber}
                    </h1>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-700 text-amber-300">
                      {bus.registrationNumber || 'PB-03'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-300 mt-1">
                    Route: <strong className="text-white">
                      {route ? (route.routeNumber ? `Route No. ${route.routeNumber} — ${route.destination || route.name}` : (route.destination || route.name)) : 'No Route Assigned by Central Control'}
                    </strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Captain: {user?.name || 'Driver'} • Shift: {data?.schedule?.departureTime || 'Morning Shift'}
                  </p>
                </div>
              </div>

              {/* Large Live Status Pill */}
              <div className="text-right">
                <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">
                  Current Trip Status
                </span>
                <span
                  className={`inline-block mt-1 px-4 py-2 rounded-2xl text-base font-black tracking-wide uppercase ${
                    tripStatus === 'started' || tripStatus === 'on_route'
                      ? 'bg-emerald-500 text-slate-950 animate-pulse'
                      : tripStatus === 'delayed'
                      ? 'bg-amber-500 text-slate-950'
                      : tripStatus === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tripStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Temporary Status Feedback Banner */}
            {statusFeedback && (
              <div className="bg-emerald-500 text-slate-950 font-black px-6 py-4 rounded-2xl text-center text-lg shadow-xl animate-bounce">
                {statusFeedback}
              </div>
            )}

            {/* Warning if bus is assigned but route is missing */}
            {!route && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">No College Route Linked:</span> An administrator must assign a route to {bus.busNumber} before you can start simulated tracking.
                </div>
              </div>
            )}

            {/* PRIMARY ACTION: START TRIP (Giant Button) */}
            {!isTripActive && tripStatus !== 'completed' && (
              <button
                onClick={handleStartTrip}
                disabled={actionLoading || !route}
                className={`w-full py-8 rounded-3xl font-black text-2xl sm:text-3xl shadow-2xl flex items-center justify-center gap-4 transition-all ${
                  !route
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 shadow-emerald-500/30'
                }`}
              >
                <Play className="w-10 h-10 fill-current" />
                <span>START COMMUTE TRIP</span>
              </button>
            )}

            {/* QUICK STATUS UPDATE BUTTONS (Large & Tactile) */}
            {isTripActive && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  Tap to Update Current Bus Status
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* On Route Button */}
                  <button
                    onClick={() => handleUpdateStatus('on_route')}
                    disabled={actionLoading}
                    className="py-6 px-6 rounded-3xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] font-black text-xl flex items-center justify-between shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="w-8 h-8 text-amber-300" />
                      <span>ON ROUTE</span>
                    </div>
                    <ArrowRight className="w-6 h-6 opacity-60" />
                  </button>

                  {/* Approaching Stop Button */}
                  <button
                    onClick={() => handleUpdateStatus('approaching_stop')}
                    disabled={actionLoading}
                    className="py-6 px-6 rounded-3xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] font-black text-xl flex items-center justify-between shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Navigation className="w-8 h-8 text-emerald-300" />
                      <span>APPROACHING STOP</span>
                    </div>
                    <ArrowRight className="w-6 h-6 opacity-60" />
                  </button>

                  {/* Report Delay Button */}
                  <button
                    onClick={() => setShowDelayPicker(!showDelayPicker)}
                    className="py-6 px-6 rounded-3xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xl flex items-center justify-between shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-slate-950" />
                      <span>REPORT DELAY</span>
                    </div>
                    <span className="text-sm font-bold bg-slate-950/20 px-3 py-1 rounded-full">
                      Traffic / Signals
                    </span>
                  </button>

                  {/* Complete Trip Button */}
                  <button
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={actionLoading}
                    className="py-6 px-6 rounded-3xl bg-slate-700 hover:bg-slate-600 active:scale-[0.98] font-black text-xl flex items-center justify-between shadow-lg transition-all border border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                      <span>TRIP COMPLETED</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                      At Campus
                    </span>
                  </button>
                </div>

                {/* Delay Quick Select Overlay */}
                {showDelayPicker && (
                  <div className="bg-slate-800 p-6 rounded-3xl border border-amber-400/50 shadow-2xl space-y-4 animate-fade-in">
                    <h3 className="font-extrabold text-base text-amber-300 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Select Approximate Delay Duration
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[5, 10, 15, 25].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleUpdateStatus('delayed', mins, `Moderate congestion adding ~${mins}m`)}
                          className="py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xl shadow"
                        >
                          +{mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Re-start if completed */}
            {tripStatus === 'completed' && (
              <div className="bg-slate-800 p-8 rounded-3xl text-center space-y-4 border border-slate-700">
                <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                <h2 className="text-2xl font-black">Trip Completed Successfully</h2>
                <p className="text-sm text-slate-400">All students have reached destination safely.</p>
                <button
                  onClick={handleStartTrip}
                  className="py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg inline-flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Start Next Shift / Return Trip</span>
                </button>
              </div>
            )}

            {/* EMERGENCY DISPATCH (Prominent Red Button) */}
            <div className="pt-4">
              <button
                onClick={() => setIsEmergencyOpen(true)}
                className="w-full py-6 rounded-3xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-xl sm:text-2xl shadow-2xl shadow-rose-600/40 border-2 border-rose-400 flex items-center justify-center gap-3 transition-all"
              >
                <ShieldAlert className="w-8 h-8 animate-pulse" />
                <span>REPORT EMERGENCY / BREAKDOWN</span>
              </button>
            </div>

            {/* Assigned Stops Reference */}
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-4">
              <h3 className="font-extrabold text-sm uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Stops on Your Route ({route?.stops?.length || 0})
              </h3>
              {(!route?.stops || route.stops.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No designated stops added to this route yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {route.stops.map((stop) => (
                    <div key={stop.stopId || stop.name} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">#{stop.order} {stop.name}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">{stop.landmark || 'Designated Stop'}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-300">{stop.morningPickupTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onSubmit={handleEmergencySubmit}
        busNumber={bus?.busNumber}
      />
    </div>
  );
};

export default DriverDashboard;

