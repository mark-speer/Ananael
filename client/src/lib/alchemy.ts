/**
 * Hermetic alchemy helpers — metals, principles, opus stages, day operations.
 */

import {
  CLASSICAL_METALS,
  HERMETIC_AXIOMS,
  METAL_PLANETS,
  OPUS_STAGES,
  PLANET_METALS,
  TRIA_PRIMA,
  type ClassicalMetal,
  type OpusStageDef,
  type OpusStageId,
  type PrincipleDef,
  type PrincipleId,
} from '../data/alchemy';
import type { MoonPhaseName } from './moonPhase';
import type { PlanetId } from './planetaryHours';

export type {
  ClassicalMetal,
  OpusStageDef,
  OpusStageId,
  PrincipleDef,
  PrincipleId,
};

export interface DayOperation {
  stageId: OpusStageId;
  stage: OpusStageDef;
  principle: PrincipleDef;
  metal: ClassicalMetal;
  /** Short operation counsel for almanac / Magical OS. */
  counsel: string;
  axiom: string;
}

export function metalForPlanet(planet: PlanetId): ClassicalMetal {
  return PLANET_METALS[planet];
}

export function planetForMetal(metal: string): PlanetId | undefined {
  const normalized = metal.trim().toLowerCase();
  for (const m of CLASSICAL_METALS) {
    if (m.toLowerCase() === normalized) return METAL_PLANETS[m];
  }
  // Liber 777 sometimes uses phrases like "Grain metals"
  if (normalized.includes('gold')) return 'Sun';
  if (normalized.includes('silver')) return 'Moon';
  if (normalized.includes('iron')) return 'Mars';
  if (normalized.includes('mercury') || normalized.includes('quicksilver'))
    return 'Mercury';
  if (normalized.includes('tin')) return 'Jupiter';
  if (normalized.includes('copper')) return 'Venus';
  if (normalized.includes('lead')) return 'Saturn';
  return undefined;
}

export function listStages(): OpusStageDef[] {
  return OPUS_STAGES;
}

export function getStage(id: OpusStageId): OpusStageDef {
  const stage = OPUS_STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown opus stage: ${id}`);
  return stage;
}

export function listPrinciples(): PrincipleDef[] {
  return TRIA_PRIMA;
}

export function getPrinciple(id: PrincipleId): PrincipleDef {
  const p = TRIA_PRIMA.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown principle: ${id}`);
  return p;
}

function stageForPlanet(planet: PlanetId): OpusStageId {
  switch (planet) {
    case 'Saturn':
    case 'Mars':
      return 'nigredo';
    case 'Moon':
      return 'albedo';
    case 'Mercury':
    case 'Venus':
    case 'Jupiter':
      return 'citrinitas';
    case 'Sun':
      return 'rubedo';
    default:
      return 'nigredo';
  }
}

/** Moon can pull the work toward wash/dissolve or coagulate/seal. */
function adjustStageForMoon(
  base: OpusStageId,
  moon: MoonPhaseName
): OpusStageId {
  if (moon === 'New Moon' || moon === 'Waning Crescent') return 'nigredo';
  if (moon === 'Full Moon') return 'rubedo';
  if (
    moon === 'Waxing Crescent' ||
    moon === 'First Quarter' ||
    moon === 'Waxing Gibbous'
  ) {
    if (base === 'nigredo') return 'albedo';
    return base;
  }
  if (moon === 'Waning Gibbous' || moon === 'Last Quarter') {
    if (base === 'rubedo') return 'citrinitas';
    return base === 'citrinitas' ? 'albedo' : base;
  }
  return base;
}

function axiomForDay(when: Date): string {
  const day = Math.floor(when.getTime() / 86_400_000);
  return HERMETIC_AXIOMS[Math.abs(day) % HERMETIC_AXIOMS.length];
}

/**
 * Map day ruler + moon phase to an alchemical operation for counsel.
 */
export function operationForDay(
  planet: PlanetId,
  moonPhase: MoonPhaseName,
  when: Date = new Date()
): DayOperation {
  const stageId = adjustStageForMoon(stageForPlanet(planet), moonPhase);
  const stage = getStage(stageId);
  const principle = getPrinciple(stage.relatedPrinciple);
  const metal = metalForPlanet(planet);
  const verb = stage.operations[0] ?? 'work';
  const counsel = `${stage.name} (${stage.colorOfWork}): ${verb} under ${planet} — ${metal} of the day, through ${principle.name}.`;
  return {
    stageId,
    stage,
    principle,
    metal,
    counsel,
    axiom: axiomForDay(when),
  };
}

/** Compact Scale of Nature row for a planet. */
export function scaleOfNature(planet: PlanetId): {
  planet: PlanetId;
  metal: ClassicalMetal;
  principle: PrincipleDef;
  stage: OpusStageDef;
} {
  const stage = getStage(stageForPlanet(planet));
  return {
    planet,
    metal: metalForPlanet(planet),
    principle: getPrinciple(stage.relatedPrinciple),
    stage,
  };
}
