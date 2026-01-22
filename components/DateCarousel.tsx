import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateCarouselProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
}

const DateCarousel: React.FC<DateCarouselProps> = ({ selectedDate, onDateChange }) => {
  const generateDateRange = (centerDate: string, range: number = 3) => {
    const dates: { date: string; label: string; dayName: string }[] = [];
    const center = new Date(centerDate);

    for (let i = -range; i <= range; i++) {
      const date = new Date(center);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayIndex = date.getDay();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dayIndex];
      const dayNum = date.getDate();

      dates.push({
        date: dateStr,
        label: `${dayNum}`,
        dayName: dayName
      });
    }

    return dates;
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];
  const dates = generateDateRange(selectedDate, 3);

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-[2.5rem] p-4 border border-white/10 w-full">
      <button
        onClick={handlePrevDay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar pr-0">
        {dates.map((d) => {
          const isSelected = d.date === selectedDate;
          const isToday = d.date === today;

          return (
            <button
              key={d.date}
              onClick={() => onDateChange(d.date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : isToday
                  ? 'bg-white/10 border-white/20 hover:border-cyan-400/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {d.dayName}
              </span>
              <span className={`text-base font-black ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                {d.label}
              </span>
              {isToday && (
                <span className="text-[8px] font-black text-orange-500 uppercase mt-0.5">TODAY</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextDay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default DateCarousel;
