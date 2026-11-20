import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { adminService } from '../services/adminService';
import LiveMap from '../components/LiveMap';
import OfflineBanner from '../components/OfflineBanner';
import {
  Shield,
  Bus,
  Users,
  Route as RouteIcon,
  Calendar,
  Bell,
  AlertTriangle,
  Play,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Send,
  Check,
  Compass,
  MapPin,
  Clock,
} from 'lucide-react';
import { formatTime, formatDate, formatRelativeTime } from '../utils/formatters';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { liveLocationUpdate } = useSocket();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'buses' | 'drivers' | 'routes' | 'schedules' | 'exammode' | 'notifications' | 'emergencies'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [trips, setTrips] = useState([]);

  // Modals & form states
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [busFormData, setBusFormData] = useState({ busNumber: '', registrationNumber: '', capacity: 50, model: '', assignedDriver: '', assignedRoute: '', status: 'active' });
  const [editingBusId, setEditingBusId] = useState(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverFormData, setDriverFormData] = useState({ name: '', email: '', password: '', phone: '', licenseNumber: '', assignedBus: '', assignedRoute: '' });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeFormData, setRouteFormData] = useState({
    name: '',
    routeNumber: 1,
    destination: '',
    routeCode: 'Route 1',
    startPoint: '',
    endPoint: 'Campus Terminus',
    totalDistanceKm: 25,
    estimatedDurationMinutes: 45,
    assignedBus: '',
    assignedDriver: '',
    isActive: true,
    isExamRoute: false,
    stops: [
      { name: '', landmark: '', morningPickupTime: '07:15 AM', eveningDropTime: '05:30 PM', order: 1 }
    ],
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({ title: '', routeId: '', busId: '', departureTime: '07:30 AM', estimatedArrivalTime: '08:15 AM', shift: 'morning', isExamSchedule: false });

  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info', targetAudience: 'all', targetBusId: '', targetRouteId: '' });
  const [examModeCustomMsg, setExamModeCustomMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [overview, busesRes, driversRes, routesRes, schedulesRes, tripsRes] = await Promise.all([
        adminService.getOverview(),
        adminService.getBuses(),
        adminService.getDrivers(),
        adminService.getRoutes(),
        adminService.getSchedules(),
        adminService.getTrips(),
      ]);

      setOverviewData(overview);
      setBuses(busesRes);
      setDrivers(driversRes);
      setRoutes(routesRes);
      setSchedules(schedulesRes);
      setTrips(tripsRes);
      if (overview?.systemSettings?.examModeMessage) {
        setExamModeCustomMsg(overview.systemSettings.examModeMessage);
      }
    } catch (err) {
      console.warn('Error loading admin records:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Update fleet map on real-time location update
  useEffect(() => {
    if (liveLocationUpdate && overviewData?.fleetMapData) {
      setOverviewData((prev) => {
        if (!prev) return prev;
        const updatedFleet = prev.fleetMapData.map((b) => {
          if (String(b.busId) === String(liveLocationUpdate.busId)) {
            return {
              ...b,
              location: liveLocationUpdate.location,
              tripStatus: liveLocationUpdate.tripStatus || b.tripStatus,
            };
          }
          return b;
        });
        return { ...prev, fleetMapData: updatedFleet };
      });
    }
  }, [liveLocationUpdate]);

  const showFeedback = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // BUS CRUD
  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      if (editingBusId) {
        await adminService.updateBus(editingBusId, busFormData);
        showFeedback('Bus record updated successfully.');
      } else {
        await adminService.createBus(busFormData);
        showFeedback('New bus added to fleet.');
      }
      setIsBusModalOpen(false);
      setEditingBusId(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error saving bus.');
    }
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm('Are you sure you want to remove this bus from the fleet?')) {
      try {
        await adminService.deleteBus(id);
        showFeedback('Bus removed.');
        loadAllData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // DRIVER CREATE
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDriver(driverFormData);
      showFeedback('Driver registered successfully.');
      setIsDriverModalOpen(false);
      setDriverFormData({ name: '', email: '', password: '', phone: '', licenseNumber: '', assignedBus: '', assignedRoute: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error registering driver.');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to remove this driver?')) {
      try {
        await adminService.deleteDriver(id);
        showFeedback('Driver removed successfully.');
        loadAllData();
      } catch (err) {
        alert(err.message || 'Error removing driver.');
      }
    }
  };

  // ROUTE ACTIONS (ROUTE 1 TO ROUTE 95)
  const handleOpenAddRoute = () => {
    setEditingRouteId(null);
    const nextRouteNum = routes.length > 0
      ? Math.min(Math.max(...routes.map((r) => r.routeNumber || 0)) + 1, 95)
      : 1;

    setRouteFormData({
      name: '',
      routeNumber: nextRouteNum,
      destination: '',
      routeCode: `Route ${nextRouteNum}`,
      startPoint: '',
      endPoint: 'Campus Terminus',
      totalDistanceKm: 25,
      estimatedDurationMinutes: 45,
      assignedBus: '',
      assignedDriver: '',
      isActive: true,
      isExamRoute: false,
      stops: [
        { name: '', landmark: '', morningPickupTime: '07:15 AM', eveningDropTime: '05:30 PM', order: 1 }
      ],
    });
    setIsRouteModalOpen(true);
  };

  const handleEditRoute = (route) => {
    setEditingRouteId(route._id);
    setRouteFormData({
      name: route.name || '',
      routeNumber: route.routeNumber || 1,
      destination: route.destination || route.name || '',
      routeCode: route.routeCode || `Route ${route.routeNumber || 1}`,
      startPoint: route.startPoint || '',
      endPoint: route.endPoint || 'Campus Terminus',
      totalDistanceKm: route.totalDistanceKm || 25,
      estimatedDurationMinutes: route.estimatedDurationMinutes || 45,
      assignedBus: route.assignedBus || route.busId || '',
      assignedDriver: route.assignedDriver || route.driverId || '',
      isActive: route.isActive !== false,
      isExamRoute: !!route.isExamRoute,
      stops: route.stops && route.stops.length > 0
        ? route.stops.map((s, idx) => ({
            name: s.name || '',
            landmark: s.landmark || '',
            morningPickupTime: s.morningPickupTime || '07:15 AM',
            eveningDropTime: s.eveningDropTime || '05:30 PM',
            order: s.order || idx + 1,
          }))
        : [{ name: '', landmark: '', morningPickupTime: '07:15 AM', eveningDropTime: '05:30 PM', order: 1 }],
    });
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...routeFormData,
        routeNumber: Number(routeFormData.routeNumber),
        destination: routeFormData.destination || routeFormData.name,
        routeCode: routeFormData.routeCode || `Route ${routeFormData.routeNumber}`,
        stops: routeFormData.stops.filter((s) => s.name.trim() !== '').map((s, idx) => ({
          ...s,
          order: idx + 1,
        })),
      };

      if (editingRouteId) {
        await adminService.updateRoute(editingRouteId, payload);
        showFeedback('College route updated successfully.');
      } else {
        await adminService.createRoute(payload);
        showFeedback('New college route configured successfully.');
      }
      setIsRouteModalOpen(false);
      setEditingRouteId(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error saving route.');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (window.confirm('Are you sure you want to delete this route? Assigned buses and drivers will be unlinked.')) {
      try {
        await adminService.deleteRoute(id);
        showFeedback('Route deleted successfully.');
        loadAllData();
      } catch (err) {
        alert(err.message || 'Error deleting route.');
      }
    }
  };

  const handleToggleRouteStatus = async (route) => {
    try {
      const updated = route.isActive === false ? true : false;
      await adminService.updateRoute(route._id, { isActive: updated });
      showFeedback(`Route ${updated ? 'activated' : 'deactivated'} successfully.`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error updating route status.');
    }
  };

  const handleAddStopToForm = () => {
    setRouteFormData((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: '',
          landmark: '',
          morningPickupTime: '07:30 AM',
          eveningDropTime: '05:30 PM',
          order: prev.stops.length + 1,
        },
      ],
    }));
  };

  const handleRemoveStopFromForm = (index) => {
    if (routeFormData.stops.length <= 1) return;
    setRouteFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const handleStopChange = (index, field, value) => {
    setRouteFormData((prev) => {
      const updatedStops = [...prev.stops];
      updatedStops[index] = { ...updatedStops[index], [field]: value };
      return { ...prev, stops: updatedStops };
    });
  };

  // SCHEDULE ACTIONS
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSchedule(scheduleFormData);
      showFeedback('Schedule created.');
      setIsScheduleModalOpen(false);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleScheduleStatus = async (schedule) => {
    try {
      const updatedStatus = schedule.isActive === false ? true : false;
      await adminService.updateSchedule(schedule._id, { isActive: updatedStatus });
      showFeedback(`Schedule ${updatedStatus ? 'activated' : 'deactivated'} successfully.`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error updating schedule status.');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await adminService.deleteSchedule(id);
        showFeedback('Schedule deleted successfully.');
        loadAllData();
      } catch (err) {
        alert(err.message || 'Error deleting schedule.');
      }
    }
  };

  // EXAM MODE TOGGLE
  const handleToggleExamMode = async () => {
    try {
      const currentState = overviewData?.systemSettings?.examModeEnabled;
      const res = await adminService.toggleExamMode({
        enabled: !currentState,
        customMessage: examModeCustomMsg,
      });
      showFeedback(res.message);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // BROADCAST NOTIFICATION
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await adminService.sendNotification(notifForm);
      showFeedback('Broadcast transmitted to relevant students and drivers.');
      setNotifForm({ title: '', message: '', type: 'info', targetAudience: 'all', targetBusId: '', targetRouteId: '' });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // OPERATOR OVERRIDE FOR TRIP STATUS
  const handleOperatorTripUpdate = async (tripId, status, delayMinutes = 0) => {
    try {
      await adminService.updateTripOperator(tripId, { status, delayMinutes });
      showFeedback(`Trip updated to ${status}.`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // RESOLVE EMERGENCY
  const handleResolveEmergency = async (emgId) => {
    const notes = window.prompt('Enter resolution notes:', 'Assistance dispatched, bus cleared by road patrol.');
    if (notes !== null) {
      try {
        await adminService.resolveEmergency(emgId, { resolutionNotes: notes, status: 'resolved' });
        showFeedback('Emergency marked as resolved.');
        loadAllData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = overviewData?.stats || {};
  const isExamModeActive = overviewData?.systemSettings?.examModeEnabled;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <OfflineBanner />

      {/* Admin Header Bar */}
      <div className="bg-campus-navy text-white px-4 sm:px-8 py-5 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">CampusBus Command Center</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                  /ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300">
                CampusBus Fleet Operations • Real-time Monitoring • Admin: {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Exam Mode Quick Indicator Pill */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isExamModeActive ? 'bg-purple-600/40 text-purple-300 border border-purple-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <FileText className="w-3.5 h-3.5" />
              <span>Exam Mode: {isExamModeActive ? 'ACTIVE' : 'OFF'}</span>
            </div>

            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Pill */}
      {successMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-md text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
          {[
            { id: 'overview', label: 'Fleet Overview', icon: Compass },
            { id: 'buses', label: `Buses (${buses.length})`, icon: Bus },
            { id: 'drivers', label: `Drivers (${drivers.length})`, icon: Users },
            { id: 'routes', label: `Routes (${routes.length})`, icon: RouteIcon },
            { id: 'schedules', label: `Schedules (${schedules.length})`, icon: Calendar },
            { id: 'exammode', label: 'Exam Mode', icon: FileText },
            { id: 'notifications', label: 'Broadcast', icon: Bell },
            { id: 'emergencies', label: `Emergencies (${overviewData?.recentEmergencies?.length || 0})`, icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-campus-navy text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* ==================== 1. FLEET OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Buses</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeBuses} / {stats.totalBuses}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Trips</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{stats.activeTripsCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Routes</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalRoutes}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Fleet Drivers</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalDrivers}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Delayed Trips</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{stats.delayedTripsCount}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Emergencies</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{stats.activeEmergenciesCount}</p>
              </div>
            </div>

            {/* Central Live Fleet Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  Live Satellite Fleet Overview (Simulated GPS Pulses)
                </h2>
                <span className="text-xs text-slate-500">
                  Showing {overviewData?.fleetMapData?.length || 0} deployed college vehicles
                </span>
              </div>

              <LiveMap
                fleetBuses={overviewData?.fleetMapData || []}
                height="500px"
              />
            </div>

            {/* Active Trips Monitor Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Active Trip Dispatch & Operator Overrides</h3>
                  <p className="text-xs text-slate-500">Live trip telemetry & backup driver control</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Bus</th>
                      <th className="p-3.5">Route</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Trip Status</th>
                      <th className="p-3.5">Delay</th>
                      <th className="p-3.5">Speed</th>
                      <th className="p-3.5 text-right">Operator Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trips.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{t.busNumber}</td>
                        <td className="p-3.5 text-slate-600">{t.routeName}</td>
                        <td className="p-3.5 font-medium">{t.driverName}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            t.status === 'started' || t.status === 'on_route'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'delayed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {t.delayMinutes > 0 ? (
                            <span className="font-bold text-amber-600">+{t.delayMinutes} min</span>
                          ) : (
                            <span className="text-slate-400">On Time</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono">{t.location?.speedKmH || 0} km/h</td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOperatorTripUpdate(t._id, 'on_route')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100"
                          >
                            On Route
                          </button>
                          <button
                            onClick={() => handleOperatorTripUpdate(t._id, 'delayed', 10)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 font-bold rounded hover:bg-amber-100"
                          >
                            +10m Delay
                          </button>
                          <button
                            onClick={() => handleOperatorTripUpdate(t._id, 'completed')}
                            className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded hover:bg-slate-200"
                          >
                            Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. BUSES MANAGEMENT TAB ==================== */}
        {activeTab === 'buses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Manage College Fleet</h2>
                <p className="text-xs text-slate-500">Register, inspect, and assign vehicles in the CampusBus transit fleet</p>
              </div>
              <button
                onClick={() => {
                  setEditingBusId(null);
                  setBusFormData({ busNumber: `BUS-${String(buses.length + 1).padStart(2, '0')}`, registrationNumber: 'PB-03-', capacity: 50, model: 'College Standard Transit Bus', assignedDriver: '', assignedRoute: '', status: 'active' });
                  setIsBusModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Bus</span>
              </button>
            </div>

            {buses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Bus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">No Buses in Fleet Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    No buses are currently registered in the CampusBus transit fleet. Click "+ Add New Bus" to register a college vehicle.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingBusId(null);
                    setBusFormData({ busNumber: 'BUS-01', registrationNumber: 'PB-03-', capacity: 50, model: 'College Standard Transit Bus', assignedDriver: '', assignedRoute: '', status: 'active' });
                    setIsBusModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Bus</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Bus Number</th>
                      <th className="p-3.5">Registration</th>
                      <th className="p-3.5">Assigned Route</th>
                      <th className="p-3.5">Assigned Driver</th>
                      <th className="p-3.5">Capacity</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buses.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{b.busNumber}</td>
                        <td className="p-3.5 font-mono text-slate-600">{b.registrationNumber}</td>
                        <td className="p-3.5 font-medium">{b.routeName}</td>
                        <td className="p-3.5 font-medium">{b.driverName}</td>
                        <td className="p-3.5">{b.capacity} seats</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.status === 'active' || b.status === 'on_trip'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'maintenance'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingBusId(b._id);
                              setBusFormData({
                                busNumber: b.busNumber,
                                registrationNumber: b.registrationNumber,
                                capacity: b.capacity,
                                model: b.model,
                                assignedDriver: b.assignedDriver || '',
                                assignedRoute: b.assignedRoute || '',
                                status: b.status,
                              });
                              setIsBusModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Bus"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(b._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Bus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. DRIVERS MANAGEMENT TAB ==================== */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Manage Drivers</h2>
                <p className="text-xs text-slate-500">Register bus captains, link vehicles and assign shifts</p>
              </div>
              <button
                onClick={() => setIsDriverModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Register Driver</span>
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">No Drivers Registered Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    No drivers are currently assigned to the CampusBus fleet. Click "+ Register Driver" to create a driver account.
                  </p>
                </div>
                <button
                  onClick={() => setIsDriverModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Register Driver</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Driver Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">License #</th>
                      <th className="p-3.5">Assigned Bus</th>
                      <th className="p-3.5">Assigned Route</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drivers.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="p-3.5 text-slate-600">{d.email}</td>
                        <td className="p-3.5 font-mono">{d.phone || '--'}</td>
                        <td className="p-3.5 font-mono">{d.licenseNumber || 'DL-PENDING'}</td>
                        <td className="p-3.5 font-bold text-amber-600">{d.busNumber}</td>
                        <td className="p-3.5 font-medium">{d.routeName}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteDriver(d._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Driver"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. ROUTES & STOPS MANAGEMENT TAB ==================== */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">
                  Manage College Bus Routes (Route 1 to Route 95)
                </h2>
                <p className="text-xs text-slate-500">
                  Configure institutional transit corridors, ordered stops with timings, assigned buses and drivers
                </p>
              </div>
              <button
                onClick={handleOpenAddRoute}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add College Route</span>
              </button>
            </div>

            {routes.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <RouteIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">No College Bus Routes Added Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    CampusBus operates routes spanning Route 1 to Route 95. Click "+ Add College Route" to configure the first transit corridor with its ordered stops and assigned vehicle.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddRoute}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add College Route</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routes.map((r) => (
                  <div key={r._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono">
                              Route No. {r.routeNumber || (parseInt(r.routeCode?.replace(/\D/g, ''), 10) || r.routeCode)}
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900">
                              {r.destination || r.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {r.startPoint || 'City Origin'} ➔ {r.endPoint || 'Campus Terminus'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleRouteStatus(r)}
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                              r.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Click to toggle active status"
                          >
                            {r.isActive !== false ? 'Active' : 'Inactive'}
                          </button>
                          {r.isExamRoute && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                              EXAM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assigned Bus & Driver Info */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Bus</span>
                          <span className="font-bold text-slate-800">{r.busNumber || 'Unassigned'}</span>
                          {r.busRegistration && (
                            <span className="text-[11px] font-mono text-slate-500 block">{r.busRegistration}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Driver</span>
                          <span className="font-bold text-slate-800">{r.driverName || 'Unassigned'}</span>
                          {r.driverPhone && (
                            <span className="text-[11px] text-slate-500 block">{r.driverPhone}</span>
                          )}
                        </div>
                      </div>

                      {/* Stop sequence tags with morning arrival timings */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Designated Stops ({r.stops?.length || 0})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {r.totalDistanceKm ? `${r.totalDistanceKm} km` : ''} • ~{r.estimatedDurationMinutes || 40} mins
                          </span>
                        </div>
                        {(!r.stops || r.stops.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No designated stops added yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {r.stops.map((s) => (
                              <span key={s.stopId || s.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                                <span className="font-bold text-slate-900">#{s.order}</span> {s.name}
                                {s.morningPickupTime && (
                                  <span className="text-[10px] font-mono text-slate-500 font-semibold">({s.morningPickupTime})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditRoute(r)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Route</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(r._id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 5. SCHEDULES MANAGEMENT TAB ==================== */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Manage Bus Timetables</h2>
                <p className="text-xs text-slate-500">Departure times, arrival targets, and shifts</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Schedule</span>
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">No Timetables Configured Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Configure morning pickup and evening return timetables for assigned routes and buses.
                  </p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Schedule</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((s) => (
                  <div key={s._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{s.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">Bus: {s.busNumber} • {s.routeName}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {s.shift}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleScheduleStatus(s)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                            s.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to toggle active status"
                        >
                          {s.isActive !== false ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Departure</span>
                        <strong className="text-emerald-600">{s.departureTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Est. Arrival</span>
                        <strong className="text-slate-800">{s.estimatedArrivalTime}</strong>
                      </div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(s._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 6. EXAM MODE TAB ==================== */}
        {activeTab === 'exammode' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isExamModeActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Exam Mode Control</h2>
                  <p className="text-xs text-slate-500">Enable express examination shuttle schedules & student banners</p>
                </div>
              </div>

              {/* Master Toggle Switch */}
              <button
                onClick={handleToggleExamMode}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isExamModeActive ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isExamModeActive ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 leading-relaxed space-y-2">
              <p className="font-bold">When Exam Mode is ACTIVE:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Special examination transit routes (e.g. <strong>R-EXAM Express</strong>) are unlocked.</li>
                <li>Exam special timetables become active on the Student Dashboard.</li>
                <li>A prominent notification and live banner appear for all logged-in students and drivers.</li>
                <li>Normal schedules are automatically restored when Exam Mode is toggled off.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Custom Exam Notification Message
              </label>
              <textarea
                rows={3}
                value={examModeCustomMsg}
                onChange={(e) => setExamModeCustomMsg(e.target.value)}
                placeholder="Special examination routes are active. Buses depart 20 minutes earlier."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleToggleExamMode}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                isExamModeActive
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isExamModeActive ? 'DEACTIVATE EXAM MODE' : 'ACTIVATE EXAM MODE NOW'}
            </button>
          </div>
        )}

        {/* ==================== 7. BROADCAST NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl space-y-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">Broadcast Transit Announcement</h2>
              <p className="text-xs text-slate-500">Send push notices to students, specific routes, or drivers in real time via Socket.io</p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Audience
                  </label>
                  <select
                    value={notifForm.targetAudience}
                    onChange={(e) => setNotifForm({ ...notifForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="all">All Students & Drivers</option>
                    <option value="students">All Students Only</option>
                    <option value="drivers">All Drivers Only</option>
                    <option value="bus">Specific Bus Passengers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Notification Type
                  </label>
                  <select
                    value={notifForm.type}
                    onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="info">General Info</option>
                    <option value="delay">Delay Advisory</option>
                    <option value="warning">Route Warning</option>
                    <option value="emergency">Emergency Alert</option>
                    <option value="exam">Exam Announcement</option>
                  </select>
                </div>
              </div>

              {notifForm.targetAudience === 'bus' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Bus
                  </label>
                  <select
                    value={notifForm.targetBusId}
                    onChange={(e) => setNotifForm({ ...notifForm, targetBusId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="">Select Target Bus</option>
                    {buses.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.busNumber} ({b.routeName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  placeholder="e.g. Weather Advisory: Morning Route Schedule Update"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  placeholder="Detailed transportation instructions..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Broadcast Immediately</span>
              </button>
            </form>
          </div>
        )}

        {/* ==================== 8. EMERGENCIES MANAGEMENT TAB ==================== */}
        {activeTab === 'emergencies' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900">Driver Emergency Reports</h2>
              <p className="text-xs text-slate-500">Active breakdowns, road obstructions, and medical alerts</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Incident Type</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Reported</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overviewData?.recentEmergencies?.map((emg) => (
                    <tr key={emg._id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold uppercase text-rose-700">{emg.type}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800">
                          {emg.severity}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">{emg.description}</td>
                      <td className="p-3.5 text-slate-400">{formatRelativeTime(emg.createdAt)}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          emg.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {emg.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {emg.status !== 'resolved' ? (
                          <button
                            onClick={() => handleResolveEmergency(emg._id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* BUS MODAL */}
      {isBusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingBusId ? 'Edit College Bus' : 'Add New College Bus'}
            </h3>
            <form onSubmit={handleSaveBus} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Bus Fleet Number</label>
                <input
                  type="text"
                  required
                  value={busFormData.busNumber}
                  onChange={(e) => setBusFormData({ ...busFormData, busNumber: e.target.value })}
                  placeholder="e.g. BUS-12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Registration # (Punjab RTO)</label>
                <input
                  type="text"
                  required
                  value={busFormData.registrationNumber}
                  onChange={(e) => setBusFormData({ ...busFormData, registrationNumber: e.target.value })}
                  placeholder="e.g. PB-03-AB-1234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Bus Model / Type</label>
                <input
                  type="text"
                  value={busFormData.model || ''}
                  onChange={(e) => setBusFormData({ ...busFormData, model: e.target.value })}
                  placeholder="e.g. College Standard Transit Bus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="20"
                  max="80"
                  required
                  value={busFormData.capacity}
                  onChange={(e) => setBusFormData({ ...busFormData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Assigned Driver</label>
                <select
                  value={busFormData.assignedDriver}
                  onChange={(e) => setBusFormData({ ...busFormData, assignedDriver: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Assigned Route</label>
                <select
                  value={busFormData.assignedRoute}
                  onChange={(e) => setBusFormData({ ...busFormData, assignedRoute: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">Unassigned</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      Route {r.routeNumber || r.routeCode} — {r.destination || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 font-bold text-white"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Register New Driver</h3>
            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Driver Full Name</label>
                <input
                  type="text"
                  required
                  value={driverFormData.name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                  placeholder="e.g. Gurpreet Singh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={driverFormData.email}
                  onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
                  placeholder="driver@campusbus.edu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={driverFormData.phone || ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                  placeholder="+91 98765-43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Default Password</label>
                <input
                  type="password"
                  required
                  value={driverFormData.password}
                  onChange={(e) => setDriverFormData({ ...driverFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Driving License #</label>
                <input
                  type="text"
                  required
                  value={driverFormData.licenseNumber}
                  onChange={(e) => setDriverFormData({ ...driverFormData, licenseNumber: e.target.value })}
                  placeholder="PB03-2022-0012345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Assign College Bus</label>
                <select
                  value={driverFormData.assignedBus || ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, assignedBus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">Unassigned</option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>{b.busNumber} ({b.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 font-bold text-white"
                >
                  Register Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROUTE & ORDERED STOPS MODAL (ROUTE NO. 1 TO 95) */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingRouteId ? 'Edit College Bus Route' : 'Configure New College Route'}
                </h3>
                <p className="text-xs text-slate-500">
                  CampusBus Transit Corridor (Routes 1 to 95)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-mono">
                Route No. {routeFormData.routeNumber}
              </span>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Route Number Selector (1 to 95) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Route Number (1 – 95) *
                  </label>
                  <select
                    value={routeFormData.routeNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setRouteFormData({
                        ...routeFormData,
                        routeNumber: num,
                        routeCode: `Route ${num}`,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
                  >
                    {Array.from({ length: 95 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>Route No. {num}</option>
                    ))}
                  </select>
                </div>

                {/* Route Name / Destination */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Route Name / Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeFormData.name}
                    onChange={(e) => setRouteFormData({
                      ...routeFormData,
                      name: e.target.value,
                      destination: routeFormData.destination || e.target.value,
                    })}
                    placeholder="e.g. Malout Transit Line"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Point (First Origin Stop)</label>
                  <input
                    type="text"
                    required
                    value={routeFormData.startPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, startPoint: e.target.value })}
                    placeholder="e.g. Malout Bus Stand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Point (College Destination)</label>
                  <input
                    type="text"
                    required
                    value={routeFormData.endPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, endPoint: e.target.value })}
                    placeholder="Campus Terminus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Vehicle & Driver Linkages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Bus</label>
                  <select
                    value={routeFormData.assignedBus || ''}
                    onChange={(e) => setRouteFormData({ ...routeFormData, assignedBus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {buses.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.busNumber} ({b.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Driver</label>
                  <select
                    value={routeFormData.assignedDriver || ''}
                    onChange={(e) => setRouteFormData({ ...routeFormData, assignedDriver: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.phone || d.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Distance, Duration & Status Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Distance (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    step="0.5"
                    value={routeFormData.totalDistanceKm}
                    onChange={(e) => setRouteFormData({ ...routeFormData, totalDistanceKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Est. Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={routeFormData.estimatedDurationMinutes}
                    onChange={(e) => setRouteFormData({ ...routeFormData, estimatedDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={routeFormData.isActive}
                      onChange={(e) => setRouteFormData({ ...routeFormData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active Route</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-700">
                    <input
                      type="checkbox"
                      checked={routeFormData.isExamRoute}
                      onChange={(e) => setRouteFormData({ ...routeFormData, isExamRoute: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Exam Special</span>
                  </label>
                </div>
              </div>

              {/* ORDERED STOPS LIST EDITOR */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Ordered Bus Stops & Timings Sequence
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Specify boarding stops in exact travel sequence with morning pickup and evening drop times
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStopToForm}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Stop</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {routeFormData.stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-1 text-center font-bold text-slate-500 text-xs">
                        #{idx + 1}
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={stop.name}
                          onChange={(e) => handleStopChange(idx, 'name', e.target.value)}
                          placeholder="Stop Name (e.g. Malout Chowk)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          value={stop.landmark || ''}
                          onChange={(e) => handleStopChange(idx, 'landmark', e.target.value)}
                          placeholder="Landmark (Optional)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          value={stop.morningPickupTime || '07:30 AM'}
                          onChange={(e) => handleStopChange(idx, 'morningPickupTime', e.target.value)}
                          placeholder="07:30 AM"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-center"
                          title="Morning Pickup Time"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveStopFromForm(idx)}
                          disabled={routeFormData.stops.length <= 1}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Remove Stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow transition-colors"
                >
                  {editingRouteId ? 'Update College Route' : 'Save & Publish Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Create Schedule</h3>
            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Schedule Title</label>
                <input
                  type="text"
                  required
                  value={scheduleFormData.title}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                  placeholder="e.g. Morning Inward Shift"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Departure</label>
                  <input
                    type="text"
                    required
                    value={scheduleFormData.departureTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, departureTime: e.target.value })}
                    placeholder="07:30 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Arrival</label>
                  <input
                    type="text"
                    required
                    value={scheduleFormData.estimatedArrivalTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, estimatedArrivalTime: e.target.value })}
                    placeholder="08:15 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Assigned Route</label>
                <select
                  value={scheduleFormData.routeId}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, routeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  required
                >
                  <option value="">Select Route</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Assigned Bus</label>
                <select
                  value={scheduleFormData.busId}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, busId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  required
                >
                  <option value="">Select Bus</option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>{b.busNumber}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 font-bold text-white"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

