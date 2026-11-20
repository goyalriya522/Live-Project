import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Wrench,
  Car,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Send,
} from 'lucide-react';

export const EmergencyModal = ({ isOpen, onClose, onSubmit, busNumber = 'BUS-01' }) => {
  const [type, setType] = useState('breakdown');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('high');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const emergencyOptions = [
    { id: 'breakdown', label: 'Mechanical Breakdown', icon: Wrench, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'accident', label: 'Vehicle Accident', icon: Car, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'obstruction', label: 'Route Obstruction / Blockage', icon: AlertOctagon, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'delay', label: 'Critical Traffic Delay', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please provide a brief description of the emergency.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        type,
        description: description.trim(),
        severity,
      });
      setDescription('');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit emergency report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-rose-200">
        {/* Header */}
        <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg">Report Emergency Incident</h2>
              <p className="text-xs text-rose-100">Driver Emergency Dispatch for {busNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Large tactile options for quick driver tap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Incident Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {emergencyOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/80 shadow-md scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Severity Level
            </label>
            <div className="flex gap-2">
              {['medium', 'high', 'critical'].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
                    severity === s
                      ? s === 'critical'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Emergency Details / Exact Location
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Engine overheat near Sector 62 flyover, stopped safely on shoulder..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Transmitting Alert...' : 'DISPATCH EMERGENCY ALERT NOW'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyModal;

