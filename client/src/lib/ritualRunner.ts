/**
 * Ritual Runner — guided liturgy session helpers and journal payload guards.
 */

import type { LiturgyRite } from '../data/liturgy';
import type { JournalSky, WorkingStatus } from './journal';

export const RITUAL_RUNNER_SYSTEM = 'ritual-runner' as const;

export type LiturgyMode = 'browse' | 'run';

export interface RitualRunnerPayload {
  system: typeof RITUAL_RUNNER_SYSTEM;
  riteId: string;
  stepIndex: number;
  completedSteps: number[];
  startedAt: string;
  completedAt?: string;
  skyStart?: JournalSky;
  skyEnd?: JournalSky;
}

export interface RitualRunnerSession {
  riteId: string;
  entryId: string | null;
  stepIndex: number;
  completedSteps: number[];
  startedAt: string;
  status: WorkingStatus;
  skyStart?: JournalSky;
}

export function isRitualRunnerPayload(
  value: unknown
): value is RitualRunnerPayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    p.system === RITUAL_RUNNER_SYSTEM &&
    typeof p.riteId === 'string' &&
    typeof p.stepIndex === 'number' &&
    Array.isArray(p.completedSteps) &&
    typeof p.startedAt === 'string'
  );
}

export function createRunnerPayload(
  riteId: string,
  opts?: {
    stepIndex?: number;
    completedSteps?: number[];
    startedAt?: string;
    skyStart?: JournalSky;
  }
): RitualRunnerPayload {
  return {
    system: RITUAL_RUNNER_SYSTEM,
    riteId,
    stepIndex: opts?.stepIndex ?? 0,
    completedSteps: opts?.completedSteps ?? [],
    startedAt: opts?.startedAt ?? new Date().toISOString(),
    ...(opts?.skyStart ? { skyStart: opts.skyStart } : {}),
  };
}

export function createRunnerSession(
  rite: LiturgyRite,
  opts?: {
    entryId?: string | null;
    stepIndex?: number;
    completedSteps?: number[];
    startedAt?: string;
    status?: WorkingStatus;
    skyStart?: JournalSky;
  }
): RitualRunnerSession {
  return {
    riteId: rite.id,
    entryId: opts?.entryId ?? null,
    stepIndex: opts?.stepIndex ?? 0,
    completedSteps: opts?.completedSteps ?? [],
    startedAt: opts?.startedAt ?? new Date().toISOString(),
    status: opts?.status ?? 'active',
    ...(opts?.skyStart ? { skyStart: opts.skyStart } : {}),
  };
}

export function sessionFromPayload(
  payload: RitualRunnerPayload,
  entryId: string | null,
  status: WorkingStatus = 'active'
): RitualRunnerSession {
  return {
    riteId: payload.riteId,
    entryId,
    stepIndex: clampStepIndex(payload.stepIndex, Number.POSITIVE_INFINITY),
    completedSteps: payload.completedSteps.filter(
      (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0
    ),
    startedAt: payload.startedAt,
    status,
    ...(payload.skyStart ? { skyStart: payload.skyStart } : {}),
  };
}

export function clampStepIndex(stepIndex: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  if (!Number.isFinite(stepIndex)) return 0;
  return Math.max(0, Math.min(Math.floor(stepIndex), stepCount - 1));
}

export function markStepDone(
  session: RitualRunnerSession,
  stepIndex: number,
  stepCount: number
): RitualRunnerSession {
  const completed = new Set(session.completedSteps);
  completed.add(stepIndex);
  const nextIndex =
    stepIndex + 1 < stepCount ? stepIndex + 1 : stepIndex;
  return {
    ...session,
    stepIndex: nextIndex,
    completedSteps: Array.from(completed).sort((a, b) => a - b),
    status: 'active',
  };
}

export function skipStep(
  session: RitualRunnerSession,
  stepCount: number
): RitualRunnerSession {
  const next = session.stepIndex + 1;
  return {
    ...session,
    stepIndex: next < stepCount ? next : session.stepIndex,
    status: 'active',
  };
}

export function goToPreviousStep(
  session: RitualRunnerSession
): RitualRunnerSession {
  return {
    ...session,
    stepIndex: Math.max(0, session.stepIndex - 1),
  };
}

export function progressFraction(
  completedSteps: number[],
  stepCount: number
): number {
  if (stepCount <= 0) return 0;
  const unique = new Set(
    completedSteps.filter((n) => n >= 0 && n < stepCount)
  );
  return unique.size / stepCount;
}

export function formatRunnerSummary(
  riteTitle: string,
  stepIndex: number,
  stepCount: number
): string {
  const step = Math.min(stepIndex + 1, Math.max(stepCount, 1));
  const total = Math.max(stepCount, 1);
  return `${riteTitle} · step ${step}/${total}`;
}

export function buildCompletionBody(
  rite: LiturgyRite,
  completedSteps: number[],
  notes?: string
): string {
  const lines: string[] = [];
  if (rite.tools.length > 0) {
    lines.push(`Tools: ${rite.tools.join(', ')}`);
    lines.push('');
  }
  lines.push('Steps completed:');
  const ordered = [...completedSteps].sort((a, b) => a - b);
  if (ordered.length === 0) {
    lines.push('(none marked)');
  } else {
    for (const i of ordered) {
      const step = rite.steps[i];
      if (step) lines.push(`${i + 1}. ${step.title}`);
    }
  }
  const trimmed = notes?.trim();
  if (trimmed) {
    lines.push('');
    lines.push('Notes:');
    lines.push(trimmed);
  }
  return lines.join('\n');
}
