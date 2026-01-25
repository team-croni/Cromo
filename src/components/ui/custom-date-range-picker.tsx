import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateRange {
  from: string | null;
  to: string | null;
}

interface CustomDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

export function CustomDateRangePicker({ value, onChange, placeholder = "기간 선택" }: CustomDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'year'>('calendar');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setViewMode('calendar');
    }
  }, [isOpen]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDate(date);
    if (selectingStart || !value.from) {
      onChange({ from: dateStr, to: null });
      setSelectingStart(false);
    } else {
      if (value.from && dateStr < value.from) {
        onChange({ from: dateStr, to: value.from });
      } else {
        onChange({ from: value.from, to: dateStr });
      }
      setSelectingStart(true);
    }
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setSelectingStart(true);
    setViewMode('calendar');
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setViewMode('calendar');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(prev.getFullYear() + (direction === 'prev' ? -1 : 1));
      return newMonth;
    });
  };

  const navigateDecade = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(prev.getFullYear() + (direction === 'prev' ? -12 : 12));
      return newMonth;
    });
  };

  const selectYear = (year: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
    setViewMode('calendar');
  };

  const getYearsInDecade = (date: Date) => {
    const year = date.getFullYear();
    const startYear = Math.floor(year / 12) * 12;
    const years = [];
    for (let i = 0; i < 12; i++) {
      years.push(startYear + i);
    }
    return years;
  };

  const displayValue = value.from && value.to
    ? `${formatDisplayDate(new Date(value.from))} ~ ${formatDisplayDate(new Date(value.to))}`
    : value.from
      ? `${formatDisplayDate(new Date(value.from))} ~ 종료일 선택`
      : placeholder;

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const isDateInRange = (date: Date) => {
    if (!value.from || !value.to) return false;
    const dateStr = formatDate(date);
    return dateStr >= value.from && dateStr <= value.to;
  };

  const isDateStart = (date: Date) => {
    return value.from === formatDate(date);
  };

  const isDateEnd = (date: Date) => {
    return value.to === formatDate(date);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-between min-w-62 px-2.5 py-2 text-sm border bg-input rounded-lg ${isOpen ? 'ring-1 ring-primary' : 'border-popover-border hover:border-muted-foreground/50'}`}
      >
        <span className={value.from || isOpen ? 'text-foreground' : 'text-muted-foreground/70'}>
          {displayValue}
        </span>
        <Calendar className={`w-4 h-4 ml-3  ${isOpen ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
      </button>

      <div className={`absolute left-0 w-62 z-50 mt-2 bg-background border border-popover-border rounded-xl shadow-xl/20 duration-150 overflow-hidden ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-1 py-1">
          <button
            type="button"
            onClick={() => viewMode === 'calendar' ? navigateMonth('prev') : navigateDecade('prev')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className="px-2 py-1 rounded-lg text-sm font-medium cursor-pointer border border-transparent hover:border-popover-border"
            onClick={() => setViewMode(viewMode === 'calendar' ? 'year' : 'calendar')}
          >
            {viewMode === 'calendar'
              ? currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
              : `${Math.floor(currentMonth.getFullYear() / 12) * 12} ~ ${Math.floor(currentMonth.getFullYear() / 12) * 12 + 11}`
            }
          </span>
          <button
            type="button"
            onClick={() => viewMode === 'calendar' ? navigateMonth('next') : navigateDecade('next')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-3">
          {viewMode === 'calendar' ? (
            <>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className={`text-center text-xs py-1 ${day === '일' ? 'text-red-400' : day === '토' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-x-0 gap-y-1">
                {days.map((date, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => date && handleDateSelect(date)}
                    disabled={!date}
                    className={`
                        text-center text-sm w-8 h-8 hover:bg-muted-foreground/5 disabled:opacity-0 disabled:cursor-default rounded-md
                        ${date && isDateInRange(date) ? 'bg-blue-800! text-foreground rounded-none!' : ''}
                        ${date && isDateStart(date) ? 'bg-primary! text-primary-foreground rounded-l-md!' : ''}
                        ${date && isDateEnd(date) ? 'bg-primary! text-primary-foreground rounded-r-md!' : ''}
                      `}
                  >
                    {date ? date.getDate() : ''}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Years */
            <div className="grid grid-cols-3 gap-1">
              {getYearsInDecade(currentMonth).map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => selectYear(year)}
                  className={`
                      text-center text-sm py-2 px-1 rounded-md hover:bg-muted-foreground/5
                      ${year === currentMonth.getFullYear() ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    `}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 py-1.5 border-t">
          <button
            type="button"
            onClick={handleToday}
            disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
            className="px-1 py-1 text-xs text-muted-foreground not-disabled:hover:text-foreground disabled:opacity-50 disabled:cursor-default"
          >
            오늘
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!value.from && !value.to}
              className="px-1 py-1 text-xs text-secondary not-disabled:hover:text-foreground disabled:text-muted-foreground disabled:opacity-50 disabled:cursor-default"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-1 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}