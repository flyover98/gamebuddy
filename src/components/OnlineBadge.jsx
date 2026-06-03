'use client';

/**
 * OnlineBadge — shows a green "online" or grey "offline" dot.
 *
 * Props:
 *   isOnline   (bool)              — whether the player is online
 *   lastSeen   (string|null)       — ISO timestamp of last_seen (used for tooltip)
 *   size       ('sm'|'md'|'lg')    — dot size, default 'md'
 *   showLabel  (bool)              — show "Online" / "Offline" text next to dot
 *   className  (string)            — extra classes on the wrapper
 *
 * Usage examples:
 *
 *   // Dot only, positioned over an avatar (most common)
 *   <div className="relative">
 *     <Avatar />
 *     <OnlineBadge isOnline={buddy.is_online} size="sm" className="absolute -bottom-0.5 -right-0.5" />
 *   </div>
 *
 *   // Dot + label inline
 *   <OnlineBadge isOnline={buddy.is_online} lastSeen={buddy.last_seen} showLabel />
 */

// ─── Size map ─────────────────────────────────────────────────────────────
const sizes = {
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3.5 h-3.5 border-2',
  lg: 'w-4 h-4 border-2',
};

const labelSizes = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

// ─── Time ago for tooltip ─────────────────────────────────────────────────
function formatLastSeen(dateStr) {
  if (!dateStr) return 'Last seen unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Online now';
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${Math.floor(hrs / 24)}d ago`;
}

export default function OnlineBadge({
  isOnline = false,
  lastSeen = null,
  size = 'md',
  showLabel = false,
  className = '',
}) {
  const dotSize = sizes[size] || sizes.md;
  const labelSize = labelSizes[size] || labelSizes.md;
  const tooltip = isOnline ? 'Online now' : formatLastSeen(lastSeen);

  if (!showLabel) {
    // Dot only — designed to be placed absolute over an avatar
    return (
      <span
        title={tooltip}
        aria-label={tooltip}
        className={`
          block rounded-full border-slate-900 shrink-0
          ${dotSize}
          ${isOnline
            ? 'bg-green-400 shadow-[0_0_6px_1px_rgba(74,222,128,0.5)]'
            : 'bg-slate-600'
          }
          ${className}
        `}
      />
    );
  }

  // Dot + label
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <span
        className={`
          block rounded-full shrink-0
          ${dotSize.replace('border-[1.5px]', '').replace('border-2', '')}
          ${isOnline
            ? 'bg-green-400 shadow-[0_0_6px_1px_rgba(74,222,128,0.5)]'
            : 'bg-slate-600'
          }
        `}
      />
      <span className={`font-medium ${labelSize} ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
        {isOnline ? 'Online' : formatLastSeen(lastSeen)}
      </span>
    </span>
  );
}
