import mongoose, { Document, Schema, Types } from 'mongoose';

export type JournalEntryType =
  | 'ritual'
  | 'dream'
  | 'divination'
  | 'mood'
  | 'working'
  | 'note';

export type WorkingStatus = 'active' | 'paused' | 'complete';

export type JournalEntityKind =
  | 'sephirah'
  | 'planet'
  | 'zodiac'
  | 'hebrewLetter'
  | 'angel'
  | 'archangel'
  | 'spirit'
  | 'element'
  | 'color'
  | 'incense'
  | 'stone'
  | 'plant'
  | 'goetia'
  | 'tarot'
  | 'hexagram'
  | 'other';

export interface IJournalEntity {
  kind: JournalEntityKind;
  id: string;
  label: string;
}

export interface IJournalSky {
  moonPhase?: string;
  moonIllum?: number;
  dayRuler?: string;
  hourRuler?: string;
  lat?: number;
  lon?: number;
}

export interface IJournalLink {
  module: string;
  refModel: string;
  refId: Types.ObjectId;
}

export interface IJournalEntry extends Document {
  userId: Types.ObjectId;
  entryType: JournalEntryType;
  occurredAt: Date;
  title?: string;
  body?: string;
  mood?: number | null;
  energy?: number | null;
  status?: WorkingStatus | null;
  tags: string[];
  entities: IJournalEntity[];
  sky?: IJournalSky;
  payload?: Record<string, unknown>;
  links: IJournalLink[];
}

const ENTITY_KINDS: JournalEntityKind[] = [
  'sephirah',
  'planet',
  'zodiac',
  'hebrewLetter',
  'angel',
  'archangel',
  'spirit',
  'element',
  'color',
  'incense',
  'stone',
  'plant',
  'goetia',
  'tarot',
  'hexagram',
  'other',
];

const ENTRY_TYPES: JournalEntryType[] = [
  'ritual',
  'dream',
  'divination',
  'mood',
  'working',
  'note',
];

const JournalEntitySchema = new Schema<IJournalEntity>(
  {
    kind: { type: String, enum: ENTITY_KINDS, required: true },
    id: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const JournalSkySchema = new Schema<IJournalSky>(
  {
    moonPhase: { type: String },
    moonIllum: { type: Number, min: 0, max: 1 },
    dayRuler: { type: String },
    hourRuler: { type: String },
    lat: { type: Number },
    lon: { type: Number },
  },
  { _id: false }
);

const JournalLinkSchema = new Schema<IJournalLink>(
  {
    module: { type: String, required: true },
    refModel: { type: String, required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ENTRY_TYPES,
      required: true,
      index: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
      default: '',
    },
    body: {
      type: String,
      maxlength: 20000,
      default: '',
    },
    mood: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    energy: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'complete'],
      required: false,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
    },
    entities: {
      type: [JournalEntitySchema],
      default: [],
    },
    sky: {
      type: JournalSkySchema,
      required: false,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: false,
    },
    links: {
      type: [JournalLinkSchema],
      default: [],
    },
  },
  { timestamps: true }
);

JournalEntrySchema.index({ userId: 1, occurredAt: -1 });
JournalEntrySchema.index({ userId: 1, entryType: 1, occurredAt: -1 });
JournalEntrySchema.index({
  title: 'text',
  body: 'text',
  tags: 'text',
  'entities.label': 'text',
});

const JournalEntry = mongoose.model<IJournalEntry>(
  'JournalEntry',
  JournalEntrySchema
);

export default JournalEntry;
export { ENTRY_TYPES, ENTITY_KINDS };
