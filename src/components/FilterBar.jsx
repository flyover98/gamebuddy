'use client';

/**
 * FilterBar — search filters for the player discovery page.
 *
 * FIX: Each game now has a separate display label and DB slug value.
 * The filter sends the slug (e.g. 'cs2') to the query, not the
 * display name (e.g. 'Counter-Strike 2') which never matched the DB.
 *
 * To add a new game: add one object to GAMES with label + value.
 * The value must exactly match what's stored in player_profiles.primary_game.
 */

// ── Source of truth for all games ────────────────────────────────────────
// label  = shown to user in the dropdown
// value  = slug stored in the DB (must match profile/create/page.js exactly)
export const GAMES = [
  { label: '🎮 All Games',      value: 'All'      },
  { label: 'Valorant',          value: 'valorant'  },
  { label: 'BGMI',              value: 'bgmi'      },
  { label: 'Counter-Strike 2',  value: 'cs2'       },
  { label: 'Free Fire',         value: 'freefire'  },
  { label: 'League of Legends', value: 'lol'       },
  { label: 'Apex Legends',      value: 'apex'      },
];

const REGIONS = [
  'All',
  'Asia',
  'South Asia',
  'Europe',
  'North America',
  'South America',
];

const PLAYSTYLES = ['All', 'Casual', 'Competitive', 'Coach'];

export default function FilterBar({ filters, setFilters }) {
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const hasActiveFilters =
    filters.game !== 'All' ||
    filters.region !== 'All' ||
    filters.playstyle !== 'All' ||
    filters.onlineOnly;

  return (
    <div className="flex flex-wrap gap-2 items-center p-2">

      {/* Game filter — uses slug as value, shows label to user */}
      <select
        value={filters.game}
        onChange={e => update('game', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {GAMES.map(g => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>

      {/* Region filter */}
      <select
        value={filters.region}
        onChange={e => update('region', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {REGIONS.map(r => (
          <option key={r} value={r}>
            {r === 'All' ? '🌍 All Regions' : r}
          </option>
        ))}
      </select>

      {/* Playstyle filter */}
      <select
        value={filters.playstyle}
        onChange={e => update('playstyle', e.target.value)}
        className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
      >
        {PLAYSTYLES.map(p => (
          <option key={p} value={p}>
            {p === 'All' ? '⚡ All Styles' : p}
          </option>
        ))}
      </select>

      {/* Online only toggle */}
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

      {/* Clear filters — only shown when something is active */}
      {hasActiveFilters && (
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
