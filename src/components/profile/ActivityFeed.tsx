"use client";

interface Activity {
  id: string;
  actorName: string;
  actorAvatarUrl: string | null;
  message: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
}

export function ActivityFeed({ activities, title = "Recent Activity" }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-2xl">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          🔔
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title} ({activities.length})</h3>
      <div className="space-y-3 divide-y divide-slate-100">
{activities.slice(0, 10).map((activity, index) => (
          <div key={activity.id || `activity-${index}`} className="pt-3 first:pt-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                {activity.actorAvatarUrl ? (
                  <img 
                    src={activity.actorAvatarUrl} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {activity.actorName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {activity.actorName}
                </p>
                <p className="text-sm text-slate-700 mt-0.5 line-clamp-2">
                  {activity.message}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(activity.createdAt).toLocaleString('nl-BE', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

