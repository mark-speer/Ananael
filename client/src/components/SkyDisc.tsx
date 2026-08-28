/**
 * Compact horizon disc for Magical OS — zenith at center, N at top.
 */

import { useId } from 'react';
import {
  getBody,
  type BodyPosition,
  type CelestialBodyId,
  type SkySnapshot,
} from '../lib/celestialEphemeris';
import { PLANET_GLYPHS } from '../lib/natalChart';
import type { PlanetaryHoursChart } from '../lib/planetaryHours';

const CX = 100;
const CY = 100;
const R_HORIZON = 78;
const R_HOUR = 88;
const R_COMPASS = 66;

const DISC_BODIES: readonly CelestialBodyId[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
] as const;

interface SkyStops {
  inner: string;
  outer: string;
  rim: string;
}

interface SkyDiscProps {
  snapshot: SkySnapshot;
  hours?: PlanetaryHoursChart | null;
  onClick?: () => void;
  /** When the disc opens a dialog, marks the trigger as expanded. */
  expanded?: boolean;
  className?: string;
}

function isPlottedBody(
  b: BodyPosition | undefined
): b is BodyPosition & { azimuth: number; altitude: number } {
  return (
    !!b &&
    b.aboveHorizon === true &&
    b.azimuth != null &&
    b.altitude != null
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 0° = north (up), clockwise. */
function azimuthPoint(az: number, r: number): { x: number; y: number } {
  const rad = (az * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

function polarFromAzAlt(
  azimuth: number,
  altitude: number,
  rHorizon: number
): { x: number; y: number } {
  const alt = clamp(altitude, 0, 90);
  const r = rHorizon * (1 - alt / 90);
  return azimuthPoint(azimuth, r);
}

function arcPath(startAz: number, endAz: number, r: number): string {
  const a = azimuthPoint(startAz, r);
  const b = azimuthPoint(endAz, r);
  const delta = ((endAz - startAz) % 360 + 360) % 360;
  const large = delta > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

function localHourDecimal(when: Date): number {
  return when.getHours() + when.getMinutes() / 60;
}

/** Approximate altitude from clock hour when no observer is set (6–18 day-ish). */
function altitudeFromClockHour(hour: number): number {
  if (hour >= 6 && hour < 18) {
    const t = 1 - Math.abs(hour - 12) / 6;
    return t * 60;
  }
  const dist = hour < 6 ? 6 - hour : hour - 18;
  return -dist * 10;
}

function skyFillFromSunAltitude(
  alt: number | undefined,
  clockHour: number
): SkyStops {
  const a = alt ?? altitudeFromClockHour(clockHour);
  if (a > 10) {
    return { inner: '#2a2418', outer: '#c9a227', rim: '#c9a227' };
  }
  if (a >= -12) {
    return { inner: '#1a1525', outer: '#b87333', rim: '#7c3aed' };
  }
  return { inner: '#0c0c0f', outer: '#5b21b6', rim: '#5b21b6' };
}

function dayNightLabel(alt: number | undefined, clockHour: number): string {
  const a = alt ?? altitudeFromClockHour(clockHour);
  if (a > 10) return 'day';
  if (a >= -12) return 'twilight';
  return 'night';
}

/** Shadow-sphere offset: 0 covers the disc (new); ±2r leaves it fully lit (full). */
function moonCoverOffset(phaseFraction: number, r: number): number {
  const p = ((phaseFraction % 1) + 1) % 1;
  if (p <= 0.5) return -2 * r * (p / 0.5);
  return 2 * r * (1 - (p - 0.5) / 0.5);
}

function MoonPhaseDisc({
  cx,
  cy,
  r,
  phaseFraction,
  clipId,
}: {
  cx: number;
  cy: number;
  r: number;
  phaseFraction: number;
  clipId: string;
}) {
  const cover = moonCoverOffset(phaseFraction, r);
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx} cy={cy} r={r} fill="#f0e6c8" />
        <circle cx={cx + cover} cy={cy} r={r} fill="#1a1525" />
      </g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#c9a227"
        strokeWidth={0.75}
      />
    </g>
  );
}

/**
 * Live sky disc: horizon polar map, sun-altitude wash, moon crescent,
 * traditional planets, and current planetary-hour rim arc.
 */
export default function SkyDisc({
  snapshot,
  hours,
  onClick,
  expanded = false,
  className = 'h-64 w-64',
}: SkyDiscProps) {
  const rawId = useId().replace(/:/g, '');
  const gradId = `sky-disc-grad-${rawId}`;
  const moonClipId = `sky-disc-moon-${rawId}`;
  const fallbackMoonClipId = `sky-disc-moon-fb-${rawId}`;

  const sun = getBody(snapshot, 'Sun');
  const clockHour = localHourDecimal(snapshot.when);
  const fill = skyFillFromSunAltitude(sun?.altitude, clockHour);
  const hasObserver = sun?.azimuth != null && sun?.altitude != null;

  const layerOrder: Record<string, number> = { Moon: 1, Sun: 2 };
  const visible = DISC_BODIES.map((id) =>
    snapshot.bodies.find((b) => b.id === id)
  )
    .filter(isPlottedBody)
    .sort((a, b) => (layerOrder[a.id] ?? 0) - (layerOrder[b.id] ?? 0));

  const currentHour = hours?.currentHour;
  const hourArc =
    currentHour != null
      ? arcPath(
          90 + currentHour.index * 15,
          90 + (currentHour.index + 1) * 15,
          R_HOUR
        )
      : null;

  const skyLabel = dayNightLabel(sun?.altitude, clockHour);
  const visibleNames = visible.map((b) => b.id);
  const ariaLabel = [
    onClick ? 'Enlarge sky disc' : 'Sky disc',
    skyLabel,
    snapshot.moon.name,
    hasObserver
      ? visibleNames.length > 0
        ? `${visibleNames.join(', ')} above horizon`
        : 'no traditional planets above the horizon'
      : 'set location to place the planets',
    currentHour
      ? `hour of ${currentHour.planet}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const compass: { az: number; label: string }[] = [
    { az: 0, label: 'N' },
    { az: 90, label: 'E' },
    { az: 180, label: 'S' },
    { az: 270, label: 'W' },
  ];

  const svg = (
    <svg
      viewBox="0 0 200 200"
      className={onClick ? 'h-full w-full' : className}
      role={onClick ? undefined : 'img'}
      aria-hidden={onClick ? true : undefined}
      aria-label={onClick ? undefined : ariaLabel}
    >
      <title>{ariaLabel}</title>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={fill.inner} />
          <stop offset="100%" stopColor={fill.outer} stopOpacity={0.55} />
        </radialGradient>
      </defs>

      <circle
        cx={CX}
        cy={CY}
        r={R_HORIZON}
        fill={`url(#${gradId})`}
        stroke={fill.rim}
        strokeWidth={1.25}
        strokeOpacity={0.7}
      />
      <circle
        cx={CX}
        cy={CY}
        r={R_HORIZON * (1 - 45 / 90)}
        fill="none"
        stroke="#3f3f46"
        strokeWidth={0.6}
        strokeOpacity={0.5}
      />
      <circle cx={CX} cy={CY} r={1.5} fill="#c9a227" fillOpacity={0.7} />

      <circle
        cx={CX}
        cy={CY}
        r={R_HOUR}
        fill="none"
        stroke="#3f3f46"
        strokeWidth={1}
        strokeOpacity={0.6}
      />
      {hourArc && (
        <path
          d={hourArc}
          fill="none"
          stroke="#c9a227"
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}

      {compass.map(({ az, label }) => {
        const pt = azimuthPoint(az, R_COMPASS);
        return (
          <text
            key={label}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#c9a227"
            fillOpacity={0.7}
            fontSize={9}
            fontFamily="Cinzel, Georgia, serif"
          >
            {label}
          </text>
        );
      })}

      {!hasObserver && (
        <MoonPhaseDisc
          cx={CX}
          cy={CY}
          r={22}
          phaseFraction={snapshot.moon.phaseFraction}
          clipId={fallbackMoonClipId}
        />
      )}

      {visible.map((b) => {
        const pt = polarFromAzAlt(b.azimuth, b.altitude, R_HORIZON);
        if (b.id === 'Moon') {
          return (
            <g key="Moon">
              <MoonPhaseDisc
                cx={pt.x}
                cy={pt.y}
                r={8}
                phaseFraction={snapshot.moon.phaseFraction}
                clipId={moonClipId}
              />
            </g>
          );
        }
        if (b.id === 'Sun') {
          return (
            <g key="Sun">
              <circle cx={pt.x} cy={pt.y} r={8} fill="#c9a227" />
              <text
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#0c0c0f"
                fontSize={11}
              >
                {PLANET_GLYPHS.Sun}
              </text>
            </g>
          );
        }
        return (
          <g key={b.id}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={7}
              fill="#1a1525"
              stroke="#c9a227"
              strokeWidth={0.8}
            />
            <text
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f0e6c8"
              fontSize={9}
            >
              {PLANET_GLYPHS[b.id]}
            </text>
          </g>
        );
      })}
    </svg>
  );

  if (!onClick) {
    return svg;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ananael-violet ${className}`}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={expanded}
    >
      {svg}
    </button>
  );
}
