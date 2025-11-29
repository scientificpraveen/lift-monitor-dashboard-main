export const getISTTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const istDate = new Date(
    parseInt(parts.find(p => p.type === 'year').value),
    parseInt(parts.find(p => p.type === 'month').value) - 1,
    parseInt(parts.find(p => p.type === 'day').value),
    parseInt(parts.find(p => p.type === 'hour').value),
    parseInt(parts.find(p => p.type === 'minute').value),
    parseInt(parts.find(p => p.type === 'second').value)
  );
  
  return istDate;
};

export const getISTTimeSlot = (date = null) => {
  const istTime = getISTTime();
  const hours = istTime.getHours();
  
  const slotHour = Math.floor(hours / 2) * 2;
  
  return `${String(slotHour).padStart(2, '0')}:00`;
};

export const getAllTimeSlots = () => {
  return [
    '00:00', '02:00', '04:00', '06:00', 
    '08:00', '10:00', '12:00', '14:00', 
    '16:00', '18:00', '20:00', '22:00'
  ];
};

export const formatTimeSlot = (timeSlot) => {
  const hour = parseInt(timeSlot.split(':')[0]);
  const nextHour = (hour + 2) % 24;
  return `${timeSlot} - ${String(nextHour).padStart(2, '0')}:00`;
};

export const getTimeSlotDescription = (timeSlot) => {
  const hour = parseInt(timeSlot.split(':')[0]);
  
  if (hour >= 0 && hour < 6) return 'Night Shift';
  if (hour >= 6 && hour < 12) return 'Morning Shift';
  if (hour >= 12 && hour < 18) return 'Afternoon Shift';
  return 'Evening Shift';
};

export const istToLocal = (istDate) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(istDate.getTime() - istOffset + (new Date().getTimezoneOffset() * 60 * 1000));
};

export const getISTDate = () => {
  return getISTTime().toISOString().split('T')[0];
};
