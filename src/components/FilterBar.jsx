'use client';

export default function FilterBar({ filters, setFilters }) {
  // A simple temporary list of games for your filter UI
  const games = ['All', 'Valorant', 'League of Legends', 'Apex Legends', 'CS2', 'FIFA'];

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Select Game</label>
        <select 
          value={filters.game} 
          onChange={(e) => setFilters({ ...filters, game: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          {games.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      
      {/* Temporary indicator */}
      <span className="text-xs text-slate-500 italic ml-auto">Filters active</span>
    </div>
  );
}