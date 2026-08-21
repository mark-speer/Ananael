/**
 * SVG natal chart wheel — Whole Sign houses, planet glyphs, aspect lines.
 */

import { useMemo, useRef } from 'react';
import { downloadJson, exportSvgAsPng } from '../lib/svgExport';
import {
  MAJOR_ASPECTS,
  PLANET_GLYPHS,
  natalExportPayload,
  WESTERN_SIGN_GLYPHS,
  type NatalChart,
} from '../lib/natalChart';
import { WESTERN_SIGNS } from '../lib/westernZodiac';

interface NatalChartWheelProps {
  chart: NatalChart;
}

const CX = 200;
const CY = 200;
const R_OUTER = 190;
const R_SIGN = 165;
const R_HOUSE = 140;
const R_PLANET = 110;
const R_ASPECT = 85;

function polar(deg: number, r: number): { x: number; y: number } {
  // 0° Aries at left (western chart convention: Asc on left = 180° screen)
  const rad = ((180 - deg) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

/**
 * Visual natal wheel. Requires Ascendant + houses (full natal).
 */
export default function NatalChartWheel({ chart }: NatalChartWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const ascLon = chart.ascendant?.longitude ?? 0;

  const signWedges = useMemo(() => {
    if (!chart.houses) return [];
    return chart.houses.map((h) => {
      const signIndex = WESTERN_SIGNS.indexOf(h.sign);
      const startLon = signIndex * 30;
      const mid = startLon + 15;
      return { ...h, startLon, mid };
    });
  }, [chart.houses]);

  const planetPoints = useMemo(() => {
    return chart.positions.map((b) => {
      const pt = polar(b.longitude, R_PLANET);
      return { id: b.id, ...pt, lon: b.longitude };
    });
  }, [chart.positions]);

  if (!chart.ascendant || !chart.houses) {
    return null;
  }

  const onExportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    void exportSvgAsPng({
      svg,
      filenameBase: chart.profile.label || 'natal-chart',
      fallbackName: 'natal-chart',
      background: '#0c0a12',
    });
  };

  const onExportJson = () => {
    downloadJson(
      natalExportPayload(chart),
      chart.profile.label || 'natal-chart',
      'natal-chart'
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-ananael-gold">Chart wheel</h3>
          <p className="text-xs text-ananael-muted">
            Whole Sign houses · Asc {WESTERN_SIGN_GLYPHS[chart.ascendant.sign]}{' '}
            {chart.ascendant.sign}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportPng}
            className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-ananael-gold/50 hover:text-ananael-gold"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-ananael-gold/50 hover:text-ananael-gold"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-3">
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className="mx-auto h-auto w-full max-w-[400px]"
          role="img"
          aria-label="Natal chart wheel"
        >
          <circle
            cx={CX}
            cy={CY}
            r={R_OUTER}
            fill="#0c0a12"
            stroke="#5c4d7a"
            strokeWidth={1.5}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_SIGN}
            fill="none"
            stroke="#3d3554"
            strokeWidth={1}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_HOUSE}
            fill="none"
            stroke="#3d3554"
            strokeWidth={1}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_ASPECT}
            fill="none"
            stroke="#2a2438"
            strokeWidth={1}
          />

          {/* Sign / house spokes — Whole Sign boundaries */}
          {signWedges.map((h) => {
            const a = polar(h.startLon, R_HOUSE);
            const b = polar(h.startLon, R_OUTER);
            const label = polar(h.mid, (R_SIGN + R_OUTER) / 2);
            const houseLabel = polar(h.mid, (R_HOUSE + R_SIGN) / 2);
            return (
              <g key={`house-${h.house}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={h.house === 1 ? '#c9a227' : '#4a4060'}
                  strokeWidth={h.house === 1 ? 2 : 1}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#c9a227"
                  fontSize={14}
                >
                  {WESTERN_SIGN_GLYPHS[h.sign]}
                </text>
                <text
                  x={houseLabel.x}
                  y={houseLabel.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9b8fb8"
                  fontSize={10}
                >
                  {h.house}
                </text>
              </g>
            );
          })}

          {/* Aspect lines */}
          {chart.aspects.map((asp) => {
            const pa = planetPoints.find((p) => p.id === asp.a);
            const pb = planetPoints.find((p) => p.id === asp.b);
            if (!pa || !pb) return null;
            const a1 = polar(pa.lon, R_ASPECT);
            const a2 = polar(pb.lon, R_ASPECT);
            const stroke =
              asp.kind === 'trine' || asp.kind === 'sextile'
                ? '#6b8f71'
                : asp.kind === 'square' || asp.kind === 'opposition'
                  ? '#a85c5c'
                  : '#8a7ca8';
            return (
              <line
                key={`${asp.a}-${asp.b}-${asp.kind}`}
                x1={a1.x}
                y1={a1.y}
                x2={a2.x}
                y2={a2.y}
                stroke={stroke}
                strokeWidth={1}
                opacity={0.75}
              />
            );
          })}

          {/* Planets */}
          {planetPoints.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={10} fill="#1a1525" stroke="#c9a227" />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f0e6c8"
                fontSize={12}
              >
                {PLANET_GLYPHS[p.id]}
              </text>
            </g>
          ))}

          {/* Asc marker on rim */}
          {(() => {
            const asc = polar(ascLon, R_OUTER + 2);
            return (
              <text
                x={asc.x}
                y={asc.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#c9a227"
                fontSize={11}
                fontWeight={600}
              >
                Asc
              </text>
            );
          })()}

          <title>
            Natal chart — {chart.sunSign ?? ''} Sun
            {chart.ascendant ? `, Asc ${chart.ascendant.sign}` : ''}
          </title>
        </svg>
      </div>

      <p className="text-[11px] text-ananael-muted">
        Aspects:{' '}
        {MAJOR_ASPECTS.map((a) => `${a.glyph} ${a.kind}`).join(' · ')}
      </p>
    </div>
  );
}
