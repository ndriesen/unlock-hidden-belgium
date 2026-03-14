"use client";

interface OpeningHoursDisplayProps {
  openingHours?: string | Record<string, any> | Record<string, string>[];
  className?: string;
}

export default function OpeningHoursDisplay({ openingHours, className = "" }: OpeningHoursDisplayProps) {
  if (!openingHours) {
    return <span className={`text-sm text-slate-500 ${className}`}>Not provided</span>;
  }

  if (typeof openingHours === 'string') {
    return <span className={`text-sm whitespace-pre-wrap ${className}`}>{openingHours}</span>;
  }

  const dayData = Array.isArray(openingHours) 
    ? openingHours.flatMap(item => 
        typeof item === 'object' && item !== null 
          ? Object.entries(item)
          : []
      )
    : Object.entries(openingHours as Record<string, any>);

  const days = dayData
    .filter(([_, hours]) => hours !== null && hours !== undefined)
    .sort(([a], [b]) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });

  if (days.length === 0) {
    return <span className={`text-sm text-slate-500 ${className}`}>Closed</span>;
  }

  return (
    <div className={`space-y-1 text-sm ${className}`}>
      {days.map(([day, hours]) => (
        <div key={day} className="flex items-center justify-between py-0.5">
          <span className="font-medium text-slate-900 capitalize">{day}</span>
          <span className="text-slate-700">{String(hours).replace(/,/g, ' & ')}</span>
        </div>
      ))}
    </div>
  );
}
