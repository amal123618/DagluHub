/**
 * ScheduleItem — single row in the Dashboard schedule timeline.
 *
 * Props:
 *   month    {string}   - e.g. "JAN"
 *   day      {string}   - e.g. "14"
 *   title    {string}
 *   time     {string}   - e.g. "10:00 AM • Live Webinar"
 *   badge    {string}   - optional pill label, e.g. "Live"
 *   active   {boolean}  - highlights the date tile
 *   isLast   {boolean}  - hides the connecting vertical line
 */
export default function ScheduleItem({ month, day, title, time, badge, active = false, isLast = false }) {
  return (
    <div className="flex gap-md group cursor-pointer">
      {/* Date + connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center leading-none transition-all group-hover:scale-105 ${
            active
              ? 'bg-primary-fixed text-on-primary-fixed-variant'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <span className="text-[9px] font-bold">{month}</span>
          <span className="text-[15px] font-bold">{day}</span>
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-outline-variant/40 mt-2" />
        )}
      </div>

      {/* Content */}
      <div className={!isLast ? 'pb-md' : ''}>
        <p className="text-label-md font-semibold text-primary group-hover:text-secondary transition-colors">
          {title}
        </p>
        <p className="text-label-sm text-on-surface-variant">{time}</p>
        {badge && (
          <span className="mt-1 inline-block px-sm py-0.5 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase tracking-widest">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
