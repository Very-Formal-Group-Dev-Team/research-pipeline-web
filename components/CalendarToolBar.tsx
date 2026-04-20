const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 overflow-x-auto">
      
      {/* Navigation */}
      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={() => onNavigate('PREV')}
          className=" lg:px-3 py-1.5 bg-transparent border-none cursor-pointer rounded-lg text-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          &#8249;
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-1 lg:px-3 py-1.5 bg-transparent border-none cursor-pointer rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-all"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className=" lg:px-3 py-1.5 bg-transparent border-none cursor-pointer rounded-lg text-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          &#8250;
        </button>
      </div>

      {/* Label */}
      <h2 className="m-0 text-xs sm:text-sm px-1 font-semibold text-neutral-800 pr-3">{label}</h2>

      {/* View switcher — visible on sm and above, hidden on mobile */}
      <div className="hidden sm:flex bg-slate-100 rounded-lg p-1 gap-0.5">
        {['month', 'week', 'day', 'agenda'].map((v) => (
            <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1 text-xs font-medium rounded-md border-none cursor-pointer capitalize transition-all ${
                view === v
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
            >
            {v}
            </button>
        ))}
        </div>

        {/* Dropdown — visible only on mobile, hidden on sm and above */}
        <select
        className="sm:hidden text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600"
        value={view}
        onChange={(e) => onView(e.target.value)}
        >
        {['month', 'week', 'day', 'agenda'].map((v) => (
            <option key={v} value={v}>{v}</option>
        ))}
        </select>
    </div>
  );
};

export default CustomToolbar;