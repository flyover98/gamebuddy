'use client';

const GAMES = ['All', 'Valorant', 'BGMI', 'Free Fire', 'Counter-Strike 2', 'League of Legends', 'Apex Legends'];
const REGIONS = ['All', 'Asia', 'South Asia', 'Europe', 'North America', 'South America'];
const PLAYSTYLES = ['All', 'Casual', 'Competitive', 'Coach'];

export default function FilterBar({ filters, setFilters }) {
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-wrap gap-2 items-center p-2">
      <select
        value={filters.game}
        onChange={e => update('game', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {GAMES.map(g => <option key={g} value={g}>{g === 'All' ? '🎮 All Games' : g}</option>)}
      </select>

      <select
        value={filters.region}
        onChange={e => update('region', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {REGIONS.map(r => <option key={r} value={r}>{r === 'All' ? '🌍 All Regions' : r}</option>)}
      </select>

      <select
        value={filters.playstyle}
        onChange={e => update('playstyle', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {PLAYSTYLES.map(p => <option key={p} value={p}>{p === 'All' ? '⚡ All Styles' : p}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer ml-1">
        <input
          type="checkbox"
          checked={filters.onlineOnly}
          onChange={e => update('onlineOnly', e.target.checked)}
          className="w-4 h-4 accent-cyan-500 rounded"
        />
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
          Online only
        </span>
      </label>

      {/* Clear filters */}
      {(filters.game !== 'All' || filters.region !== 'All' || filters.playstyle !== 'All' || filters.onlineOnly) && (
        <button
          onClick={() => setFilters({ game: 'All', region: 'All', playstyle: 'All', onlineOnly: false })}
          className="text-xs text-slate-500 hover:text-slate-300 transition ml-auto"
        >
          Clear filters ✕
        </button>
      )}
    </div>
  );
}
