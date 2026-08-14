/**
 * Shamanic journey runner — journal payload guards (mirror ritual-runner).
 */

import type { JournalSky, WorkingStatus } from './journal';
import type { WorldId } from '../data/shamanism';

export const SHAMANIC_JOURNEY_SYSTEM = 'shamanic-journey' as const;

export const JOURNEY_STEPS = [
  { id: 'open', title: 'Opening', body: 'State the intention. Call your allies by name if you work with any. Settle the breath and start the drum.' },
  { id: 'depart', title: 'Departure', body: 'Find the axis — tree, cave, smoke-hole, or inner column. Begin the descent or ascent toward the chosen world.' },
  { id: 'travel', title: 'Travel', body: 'Stay with the drum. Notice landmarks. Do not force a story; let images arrive and pass.' },
  { id: 'encounter', title: 'Encounter', body: 'Meet what meets you. Ask the question you named. Receive without bargaining closed knowledge.' },
  { id: 'return', title: 'Return', body: 'Thank the encounter. Retrace the path back along the axis. Do not linger once the work is done.' },
  { id: 'ground', title: 'Grounding', body: 'Stop the drum. Feel the body, room, and day. Eat or drink. Write what you will keep.' },
] as const;

export type JourneyStepId = (typeof JOURNEY_STEPS)[number]['id'];

export interface ShamanicJourneyPayload {
  system: typeof SHAMANIC_JOURNEY_SYSTEM;
  worldId: WorldId;
  allyId?: string;
  intention: string;
  stepIndex: number;
  completedSteps: number[];
  startedAt: string;
  completedAt?: string;
  skyStart?: JournalSky;
  skyEnd?: JournalSky;
  encounterNotes?: string;
}

export interface ShamanicJourneySession {
  entryId: string | null;
  worldId: WorldId;
  allyId?: string;
  intention: string;
  stepIndex: number;
  completedSteps: number[];
  startedAt: string;
  status: WorkingStatus;
  encounterNotes: string;
  skyStart?: JournalSky;
}

export function isShamanicJourneyPayload(
  value: unknown
): value is ShamanicJourneyPayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    p.system === SHAMANIC_JOURNEY_SYSTEM &&
    (p.worldId === 'lower' || p.worldId === 'middle' || p.worldId === 'upper') &&
    typeof p.intention === 'string' &&
    typeof p.stepIndex === 'number' &&
    Array.isArray(p.completedSteps) &&
    typeof p.startedAt === 'string'
  );
}

export function createJourneyPayload(opts: {
  worldId: WorldId;
  intention: string;
  allyId?: string;
  stepIndex?: number;
  completedSteps?: number[];
  startedAt?: string;
  skyStart?: JournalSky;
  encounterNotes?: string;
}): ShamanicJourneyPayload {
  return {
    system: SHAMANIC_JOURNEY_SYSTEM,
    worldId: opts.worldId,
    intention: opts.intention,
    stepIndex: opts.stepIndex ?? 0,
    completedSteps: opts.completedSteps ?? [],
    startedAt: opts.startedAt ?? new Date().toISOString(),
    ...(opts.allyId ? { allyId: opts.allyId } : {}),
    ...(opts.skyStart ? { skyStart: opts.skyStart } : {}),
    ...(opts.encounterNotes ? { encounterNotes: opts.encounterNotes } : {}),
  };
}

export function sessionFromJourneyPayload(
  payload: ShamanicJourneyPayload,
  entryId: string | null,
  status: WorkingStatus = 'active'
): ShamanicJourneySession {
  return {
    entryId,
    worldId: payload.worldId,
    allyId: payload.allyId,
    intention: payload.intention,
    stepIndex: Math.max(0, Math.min(payload.stepIndex, JOURNEY_STEPS.length - 1)),
    completedSteps: payload.completedSteps.filter(
      (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0
    ),
    startedAt: payload.startedAt,
    status,
    encounterNotes: payload.encounterNotes ?? '',
    ...(payload.skyStart ? { skyStart: payload.skyStart } : {}),
  };
}

export function markJourneyStepDone(
  session: ShamanicJourneySession
): ShamanicJourneySession {
  const completed = new Set(session.completedSteps);
  completed.add(session.stepIndex);
  const next =
    session.stepIndex + 1 < JOURNEY_STEPS.length
      ? session.stepIndex + 1
      : session.stepIndex;
  return {
    ...session,
    stepIndex: next,
    completedSteps: Array.from(completed).sort((a, b) => a - b),
    status: 'active',
  };
}

export function journeyProgress(completedSteps: number[]): number {
  const unique = new Set(
    completedSteps.filter((n) => n >= 0 && n < JOURNEY_STEPS.length)
  );
  return unique.size / JOURNEY_STEPS.length;
}
