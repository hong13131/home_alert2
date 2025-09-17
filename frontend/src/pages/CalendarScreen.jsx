import React, { useState, useEffect } from 'react';

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/calendar_events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      }
    };
    fetchEvents();
  }, []);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDay }, (_, i) => <div key={`empty-${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = events.filter(e => {
        const startDate = new Date(e.start);
        const endDate = new Date(e.end);
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate >= startDate && checkDate <= endDate;
    });
    
    days.push(
      <div
        key={day}
        className={`py-2 rounded-lg cursor-pointer text-center ${dayEvents.length > 0 ? 'bg-blue-100 text-blue-600 font-semibold' : ''} ${selectedDate === day ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedDate(day)}
      >
        {day}
      </div>
    );
  }

  const selectedDayEvents = events.filter(e => {
    const startDate = new Date(e.start);
    const endDate = new Date(e.end);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
    return checkDate >= startDate && checkDate <= endDate;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">청약 일정</h3>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>{'<'}</button>
            <h4 className="font-semibold">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</h4>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>{'>'}</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="font-medium text-gray-500 py-2">{day}</div>
          ))}
          {days}
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{selectedDate}일 청약 일정</p>
        <div className="space-y-2">
          {selectedDayEvents.length > 0 ? selectedDayEvents.map((event, i) => (
            <a href={event.url} key={i} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
                <div className="bg-blue-500 text-white rounded px-2 py-1 text-sm font-medium mr-3 flex-shrink-0">
                  {selectedDate}일
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-500">청약 접수</p>
                </div>
              </div>
            </a>
          )) : <p className="text-sm text-gray-500 p-3">선택한 날짜에 청약 일정이 없습니다.</p>}
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;
