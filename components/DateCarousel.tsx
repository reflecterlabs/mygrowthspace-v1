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
    <div className="flex items-center gap-1 sm:gap-2 bg-white/5 rounded-[3rem] p-2 sm:p-3 border border-white/10 w-full shadow-2xl">
      <button
        onClick={handlePrevDay}
        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-primary-500 hover:border-primary-500/50 transition-all active:scale-90"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 px-0.5">
        {dates.map((d) => {
          const isSelected = d.date === selectedDate;
          const isToday = d.date === today;

          return (
            <button
              key={d.date}
              onClick={() => onDateChange(d.date)}
              className={`relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 transition-all duration-300 py-3 sm:py-4 ${
                isSelected
                  ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/10'
                  : isToday
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              {isToday && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-2 py-0.5 rounded-md text-[7px] sm:text-[8px] font-black shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-orange-400 z-10 whitespace-nowrap">
                  HOY
                </span>
              )}
              
              <span className={`text-[6px] sm:text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-primary-500' : 'text-slate-500'}`}>
                {d.dayName}
              </span>
              <span className={`text-[12px] sm:text-[16px] font-black leading-none mt-0.5 sm:mt-1 ${isSelected ? 'text-primary-500' : 'text-white'}`}>
                {d.label}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextDay}
        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-primary-500 hover:border-primary-500/50 transition-all active:scale-90"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default DateCarousel;