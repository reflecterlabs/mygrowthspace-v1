import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateCarouselProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); 
};

const DateCarousel: React.FC<DateCarouselProps> = ({ selectedDate, onDateChange }) => {
  const generateDateRange = (centerDateStr: string, range: number = 3) => { 
    const dates: { date: string; label: string; dayName: string }[] = [];
    const center = createLocalDate(centerDateStr);

    for (let i = -range; i <= range; i++) {
      const date = new Date(center);
      date.setDate(date.getDate() + i);
      const dateStr = getLocalDateString(date);
      const dayIndex = date.getDay();
      const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
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
    const prev = createLocalDate(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(getLocalDateString(prev));
  };

  const handleNextDay = () => {
    const next = createLocalDate(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(getLocalDateString(next));
  };

  const today = getLocalDateString(new Date());
  const dates = generateDateRange(selectedDate);

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-[3rem] p-3 border border-white/10 w-full shadow-2xl">
      <button
        onClick={handlePrevDay}
        className="flex-shrink-0 w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-400/50 transition-all active:scale-90"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex gap-2 flex-1 justify-around overflow-x-auto no-scrollbar px-1">
        {dates.map((d) => {
          const isSelected = d.date === selectedDate;
          const isToday = d.date === today;

          return (
            <button
              key={d.date}
              onClick={() => onDateChange(d.date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : isToday
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <span className={`text-[7px] font-black uppercase tracking-tighter ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                {d.dayName}
              </span>
              <span className={`text-[14px] font-black leading-none mt-1 ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                {d.label}
              </span>
              {isToday && (
                <span className="text-[6px] font-black text-orange-500 mt-0.5">HOY</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextDay}
        className="flex-shrink-0 w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-400/50 transition-all active:scale-90"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default DateCarousel;