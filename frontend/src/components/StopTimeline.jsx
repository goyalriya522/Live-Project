import React from 'react';
import { MapPin, CheckCircle2, Clock, ArrowDown, Star, Check } from 'lucide-react';
import { studentService } from '../services/studentService';

export const StopTimeline = ({
  stops = [],
  currentStopIndex = 0,
  nextStopOrder = 1,
  selectedStopName,
  selectedBusId,
  onSelectStop,
}) => {
  const handleStopClick = async (stop) => {
    if (onSelectStop) {
      onSelectStop(stop);
    } else if (selectedBusId && stop?.name) {
      try {
        await studentService.selectBus(selectedBusId, stop.name);
      } catch (err) {
        console.warn('Failed to select stop in StopTimeline:', err.message);
      }
    }
  };

  if (!stops || stops.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
        <p className="text-sm text-slate-500">No stop sequence data available for this route.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Route Stop Sequence</h3>
            <p className="text-xs text-slate-500">Tap any stop to set as your personal boarding stop</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
          Shift Schedule
        </span>
      </div>

      <div className="mt-4 relative pl-6 space-y-4">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[35px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

        {stops.map((stop, index) => {
          const isPassed = stop.isPassed !== undefined ? stop.isPassed : currentStopIndex > index;
          const isNext = stop.isNext !== undefined ? stop.isNext : nextStopOrder === stop.order;
          const isSelected = Boolean(selectedStopName && stop?.name && stop.name.toLowerCase() === selectedStopName.toLowerCase());

          return (
            <div
              key={stop._id || stop.stopId || index}
              onClick={() => handleStopClick(stop)}
              className={`relative flex items-start gap-4 p-3 rounded-xl transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-amber-50/90 border border-amber-300 shadow-sm ring-1 ring-amber-300'
                  : isNext
                  ? 'bg-emerald-50/70 border border-emerald-300 shadow-sm'
                  : isPassed
                  ? 'bg-slate-50/50 opacity-70 hover:opacity-100'
                  : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
            >
              {/* Stop Indicator Badge */}
              <div className="relative z-10 shrink-0">
                {isPassed ? (
                  <div className="w-7 h-7 rounded-full bg-slate-400 text-white flex items-center justify-center shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isNext ? (
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-9 h-9 rounded-full bg-emerald-400/40 animate-ping"></span>
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                      {stop.order}
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow">
                    {stop.order}
                  </div>
                )}
              </div>

              {/* Stop Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-sm text-slate-900 truncate">{stop.name}</span>
                    {isSelected ? (
                      <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                        <Star className="w-3 h-3 fill-slate-950" />
                        My Boarding Stop
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Set as My Stop
                      </span>
                    )}
                  </div>

                  {isNext && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider animate-pulse">
                      Approaching
                    </span>
                  )}
                </div>

                {stop.landmark && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{stop.landmark}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Morning Pickup: <strong>{stop.morningPickupTime}</strong></span>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div>
                    <span>Evening Drop: <strong>{stop.eveningDropTime}</strong></span>
                  </div>

                  {stop.estimatedMinutesRemaining !== undefined && !isPassed && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-blue-600">
                        ETA ~{stop.estimatedMinutesRemaining} mins
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StopTimeline;

