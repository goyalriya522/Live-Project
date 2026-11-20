import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useOffline } from '../context/OfflineContext';
import { studentService } from '../services/studentService';
import LiveMap from '../components/LiveMap';
import ETAProgressCard from '../components/ETAProgressCard';
import StopTimeline from '../components/StopTimeline';
import NotificationModal from '../components/NotificationModal';
import OfflineBanner from '../components/OfflineBanner';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  User,
  AlertTriangle,
  FileText,
  RefreshCw,
  Bell,
  CheckCircle,
  WifiOff,
  Navigation,
} from 'lucide-react';
import { formatTime, formatRelativeTime } from '../utils/formatters';

export const StudentDashboard = () => {
  const { user, updateUser } = useAuth();
  const { liveLocationUpdate, joinBus, leaveBus } = useSocket();
  const { isOnline, cachedData, lastSyncTimestamp } = useOffline();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data from API or IndexedDB fallback
  const loadData = useCallback(async () => {
    try {
      setError(null);
      if (navigator.onLine) {
        const [dashRes, busesRes, notifRes] = await Promise.all([
          studentService.getDashboard(),
          studentService.getBuses(),
          studentService.getNotifications(),
        ]);

        setDashboardData(dashRes || null);
        setBuses(busesRes || []);
        setNotifications(notifRes || []);

        const targetBusId = dashRes?.assignedBus?._id || (busesRes && busesRes.length > 0 ? busesRes[0]._id : null);
        if (targetBusId) {
          setSelectedBusId(targetBusId);
          joinBus(targetBusId);
        }
      } else {
        // Fallback to IndexedDB cached data
        console.log('[StudentDashboard] Offline mode active. Populating from IndexedDB.');
        if (cachedData) {
          const cachedBuses = cachedData.buses || [];
          const cachedRoutes = cachedData.routes || [];
          const cachedLocs = cachedData.lastLocations || [];
          const cachedSchedules = cachedData.schedules || [];

          setBuses(cachedBuses);

          const defaultBus = cachedBuses[0];
          if (defaultBus) {
            setSelectedBusId(defaultBus._id);
            const route = cachedRoutes.find((r) => String(r._id) === String(defaultBus.assignedRoute));
            const loc = cachedLocs.find((l) => String(l.busId) === String(defaultBus._id));
            const sched = cachedSchedules.find((s) => String(s.busId) === String(defaultBus._id));

            setDashboardData({
              assignedBus: defaultBus,
              assignedRoute: route,
              busLocation: loc,
              schedule: sched,
              systemSettings: cachedData.systemSettings,
              notifications: [],
            });
          }
        }
      }
    } catch (err) {
      console.warn('[StudentDashboard] Network fetch failed, reading offline cache:', err.message);
      setError(err.message || 'Unable to connect to transit services');
      if (cachedData) {
        setBuses(cachedData.buses || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cachedData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle bus selection change
  const handleBusChange = async (newBusId) => {
    setSelectedBusId(newBusId);
    if (dashboardData?.assignedBus?._id) {
      leaveBus(dashboardData.assignedBus._id);
    }
    joinBus(newBusId);

    if (navigator.onLine) {
      try {
        await studentService.selectBus(newBusId, dashboardData?.selectedStop || user?.selectedStop);
        const fresh = await studentService.getDashboard();
        setDashboardData(fresh);
        if (user) {
          updateUser({ ...user, assignedBus: newBusId });
        }
      } catch (err) {
        console.warn('Bus switch error:', err.message);
      }
    } else {
      // Local switch while offline
      const bus = buses.find((b) => String(b._id) === String(newBusId));
      const route = cachedData?.routes.find((r) => String(r._id) === String(bus?.assignedRoute));
      const loc = cachedData?.lastLocations.find((l) => String(l.busId) === String(newBusId));
      setDashboardData((prev) => ({
        ...prev,
        assignedBus: bus,
        assignedRoute: route,
        busLocation: loc,
      }));
    }
  };

  // Handle boarding stop selection
  const handleSelectStop = async (stop) => {
    if (!stop?.name) return;
    const busId = selectedBusId || dashboardData?.assignedBus?._id;
    try {
      if (navigator.onLine && busId) {
        await studentService.selectBus(busId, stop.name);
        const fresh = await studentService.getDashboard();
        setDashboardData(fresh);
        if (user) {
          updateUser({ ...user, selectedStop: stop.name, assignedBus: busId });
        }
      } else {
        setDashboardData((prev) => ({
          ...prev,
          selectedStop: stop.name,
        }));
        if (user) {
          updateUser({ ...user, selectedStop: stop.name });
        }
      }
    } catch (err) {
      console.warn('Error selecting boarding stop:', err.message);
    }
  };

  // Sync real-time GPS socket pulse
  useEffect(() => {
    if (liveLocationUpdate && liveLocationUpdate.location) {
      const isCurrentBus =
        String(liveLocationUpdate.busId) === String(selectedBusId) ||
        String(liveLocationUpdate.busId) === String(dashboardData?.assignedBus?._id);

      if (isCurrentBus) {
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            busLocation: {
              ...prev.busLocation,
              ...liveLocationUpdate.location,
              isLive: true,
            },
            currentTrip: prev.currentTrip
              ? { ...prev.currentTrip, status: liveLocationUpdate.tripStatus || prev.currentTrip.status }
              : liveLocationUpdate.tripId
              ? { _id: liveLocationUpdate.tripId, status: liveLocationUpdate.tripStatus || 'started' }
              : null,
          };
        });
      }
    }
  }, [liveLocationUpdate, selectedBusId, dashboardData?.assignedBus?._id]);

  const handleMarkRead = async (notifId) => {
    try {
      await studentService.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (e) {}
  };

  // 1. Graceful Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Connecting to Campus Satellite Tracking...</p>
        </div>
      </div>
    );
  }

  // 2. Graceful Error State (if network failed and no cached data)
  if (error && (!buses || buses.length === 0) && !dashboardData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Transit Service Notice</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const bus = dashboardData?.assignedBus || (buses.length > 0 ? buses.find((b) => String(b._id) === String(selectedBusId)) || buses[0] : null);
  const route = dashboardData?.assignedRoute || bus?.route;
  const location = dashboardData?.busLocation;
  const trip = dashboardData?.currentTrip;
  const driver = dashboardData?.assignedDriver || bus?.driver;
  const isExamMode = dashboardData?.systemSettings?.examModeEnabled;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Offline Banner Indicator */}
      <OfflineBanner />

      {/* Exam Mode Alert Banner */}
      {isExamMode && (
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-4 py-3 shadow-md border-b border-purple-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-300 animate-pulse" />
              <div>
                <span className="font-extrabold uppercase tracking-wider text-purple-200">Exam Mode Active:</span>{' '}
                {dashboardData?.systemSettings?.examModeMessage || 'Special examination schedules and express non-stop routes are running.'}
              </div>
            </div>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-white/20 font-bold text-xs">
              Special Timings
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Bar: Bus Selector & Quick Actions */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {bus?.busNumber || (buses.length > 0 ? 'Select College Bus' : 'CampusBus Transit')}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {bus?.registrationNumber || 'PB-03'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isOnline && location?.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isOnline && location?.isLive ? 'Live Tracking' : 'Offline / Cached'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {route ? (
                  <>
                    Route No. <strong className="text-slate-800">{route.routeNumber || route.routeCode}</strong> — <strong className="text-slate-700">{route.destination || route.name}</strong>
                  </>
                ) : (
                  'No route selected'
                )}
              </p>
            </div>
          </div>

          {/* Bus Selector Dropdown & Notification Button */}
          <div className="flex items-center gap-3">
            {/* Bus Picker */}
            {buses.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Route / Bus:
                </label>
                <select
                  value={selectedBusId || ''}
                  onChange={(e) => handleBusChange(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.busNumber} {b.route?.routeNumber ? `(Route ${b.route.routeNumber})` : ''} — {b.route?.destination || b.route?.name || b.routeName || 'Assigned Route'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Center Trigger */}
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="View Alerts"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => {
                setRefreshing(true);
                loadData();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Empty State when no routes or buses exist yet */}
        {(!buses || buses.length === 0) ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Bus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">No College Bus Routes Added Yet</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                CampusBus routes (Route 1 to Route 95) will appear here once configured by the college administration.
              </p>
            </div>
            <div className="pt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">CampusBus Central Transport Office</p>
              <p>Muktsar Road, Deon, Bathinda, Punjab 151001</p>
              <p className="text-blue-600 font-semibold">Phone: +91 164-2786001 / +91 95011-15101</p>
            </div>
          </div>
        ) : (
          <>
            {/* Driver & Vehicle Quick Banner */}
            {driver && (
              <div className="bg-gradient-to-r from-campus-dark to-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center text-amber-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">Designated Bus Captain</p>
                    <p className="font-bold text-sm text-white">{driver.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {driver.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Driver</span>
                    </a>
                  )}
                  <div className="px-3 py-1.5 rounded-xl bg-black/20 text-slate-300">
                    Shift: <strong>{dashboardData?.schedule?.departureTime || '07:30 AM'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Main Grid: Interactive Map + ETA Card + Stop Sequence */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Leaflet Map */}
              <div className="lg:col-span-8 space-y-6">
                <LiveMap
                  busLocation={location}
                  busNumber={bus?.busNumber}
                  route={route}
                  isLive={isOnline && location?.isLive}
                  height="520px"
                />

                {/* Trip Details & Vehicle Specs */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Trip Status</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 capitalize">
                      {trip?.status ? trip.status.replace('_', ' ') : 'On Route'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Passenger Capacity</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{bus?.capacity || 50} Seats</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Total Route Distance</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {route?.totalDistanceKm ? `${route.totalDistanceKm} km` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Journey Duration</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {route?.estimatedDurationMinutes ? `~${route.estimatedDurationMinutes} mins` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: ETA Progress Card & Stop Sequence Timeline */}
              <div className="lg:col-span-4 space-y-6">
                {/* Dynamic ETA Progress Card */}
                <ETAProgressCard
                  busLocation={location}
                  busNumber={bus?.busNumber}
                  currentTrip={trip}
                  assignedRoute={route}
                  selectedStopName={dashboardData?.selectedStop || user?.selectedStop}
                  isLive={isOnline && location?.isLive}
                />

                {/* Sequence of Stops */}
                <StopTimeline
                  stops={route?.stopsWithEta || route?.stops || []}
                  currentStopIndex={location?.currentStopIndex || 0}
                  nextStopOrder={location?.nextStopOrder || 1}
                  selectedStopName={dashboardData?.selectedStop || user?.selectedStop}
                  selectedBusId={selectedBusId || dashboardData?.assignedBus?._id}
                  onSelectStop={handleSelectStop}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
};

export default StudentDashboard;
