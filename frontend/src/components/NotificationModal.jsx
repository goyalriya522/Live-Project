import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  AlertOctagon,
  Clock,
  FileText,
  CheckCircle,
  Info,
  Check,
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

export const NotificationModal = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkRead,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'delay' | 'emergency' | 'exam'

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      case 'delay':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'exam':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-campus-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Notification Center</h2>
              <p className="text-xs text-slate-300">Live Campus Transportation Announcements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-xs">
          {['all', 'delay', 'emergency', 'exam'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-campus-navy text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {f === 'all' ? 'All Updates' : f}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-medium">No notifications in this category</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                className="pt-3 first:pt-0 flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 inline-block">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {onMarkRead && (
                  <button
                    onClick={() => onMarkRead(item._id)}
                    className="text-xs text-slate-400 hover:text-emerald-600 p-1.5 rounded hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

