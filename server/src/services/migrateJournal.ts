import TarotReading from '../models/TarotReading';
import IChingCast from '../models/IChingCast';
import JournalEntry from '../models/JournalEntry';
import { Types } from 'mongoose';

export interface MigrateResult {
  tarotMigrated: number;
  ichingMigrated: number;
}

/**
 * Idempotent: copies TarotReading / IChingCast docs for a user into JournalEntry
 * when no journal link already points at that legacy id.
 */
export async function migrateLegacyToJournal(
  userId: string
): Promise<MigrateResult> {
  const uid = new Types.ObjectId(userId);

  const existingLinks = await JournalEntry.find({
    userId: uid,
    'links.refModel': { $in: ['TarotReading', 'IChingCast'] },
  })
    .select('links')
    .lean();

  const linkedIds = new Set<string>();
  for (const entry of existingLinks) {
    for (const link of entry.links ?? []) {
      if (
        link.refModel === 'TarotReading' ||
        link.refModel === 'IChingCast'
      ) {
        linkedIds.add(String(link.refId));
      }
    }
  }

  let tarotMigrated = 0;
  let ichingMigrated = 0;

  const readings = await TarotReading.find({ userId: uid }).lean();
  for (const r of readings) {
    const id = String(r._id);
    if (linkedIds.has(id)) continue;

    const spreadLabel =
      r.spreadType === 'single'
        ? 'Single Card'
        : r.spreadType === 'three'
          ? 'Three-Card'
          : 'Celtic Cross';

    const entities = (r.cardsDrawn ?? []).map((c) => ({
      kind: 'tarot' as const,
      id: c.cardId,
      label: c.cardId,
    }));

    await JournalEntry.create({
      userId: uid,
      entryType: 'divination',
      occurredAt: r.date ?? new Date(),
      title: `Tarot · ${spreadLabel}`,
      body: r.userNotes ?? '',
      tags: ['tarot', r.spreadType],
      entities,
      payload: {
        system: 'tarot',
        spreadType: r.spreadType,
        cardsDrawn: r.cardsDrawn,
      },
      links: [
        {
          module: 'tarot',
          refModel: 'TarotReading',
          refId: r._id,
        },
      ],
    });
    tarotMigrated += 1;
    linkedIds.add(id);
  }

  const casts = await IChingCast.find({ userId: uid }).lean();
  for (const c of casts) {
    const id = String(c._id);
    if (linkedIds.has(id)) continue;

    const entities = [
      {
        kind: 'hexagram' as const,
        id: String(c.primaryNumber),
        label: `Hexagram ${c.primaryNumber}`,
      },
    ];
    if (c.relatingNumber != null) {
      entities.push({
        kind: 'hexagram' as const,
        id: String(c.relatingNumber),
        label: `Hexagram ${c.relatingNumber}`,
      });
    }

    await JournalEntry.create({
      userId: uid,
      entryType: 'divination',
      occurredAt: c.date ?? new Date(),
      title: `I Ching · Hexagram ${c.primaryNumber}`,
      body: c.userNotes ?? '',
      tags: ['iching', c.method],
      entities,
      payload: {
        system: 'iching',
        method: c.method,
        lines: c.lines,
        primaryNumber: c.primaryNumber,
        relatingNumber: c.relatingNumber ?? null,
        changingLines: c.changingLines,
      },
      links: [
        {
          module: 'iching',
          refModel: 'IChingCast',
          refId: c._id,
        },
      ],
    });
    ichingMigrated += 1;
    linkedIds.add(id);
  }

  return { tarotMigrated, ichingMigrated };
}
