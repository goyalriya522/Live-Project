export const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return formatDate(dateString);
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'started':
    case 'on_route':
    case 'online':
    case 'success':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'approaching_stop':
    case 'syncing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delayed':
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'maintenance':
    case 'emergency':
    case 'offline':
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

