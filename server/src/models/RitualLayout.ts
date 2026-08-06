import mongoose, { Document, Schema, Types } from 'mongoose';

export type RitualToolType =
  | 'candle'
  | 'cup'
  | 'blade'
  | 'incense'
  | 'quarter';

export interface IRitualItem {
  id: string;
  type: RitualToolType;
  x: number;
  y: number;
  rotation?: number;
  label?: string;
}

export interface IRitualLayout extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  items: IRitualItem[];
  showCompass: boolean;
  notes?: string;
}

const RitualItemSchema = new Schema<IRitualItem>(
  {
    id: { type: String, required: true, maxlength: 64 },
    type: {
      type: String,
      enum: ['candle', 'cup', 'blade', 'incense', 'quarter'],
      required: true,
    },
    x: { type: Number, required: true, min: 0, max: 23 },
    y: { type: Number, required: true, min: 0, max: 23 },
    rotation: { type: Number, required: false },
    label: { type: String, required: false, maxlength: 32 },
  },
  { _id: false }
);

const RitualLayoutSchema = new Schema<IRitualLayout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    items: {
      type: [RitualItemSchema],
      required: true,
      default: [],
      validate: {
        validator: (v: IRitualItem[]) => Array.isArray(v) && v.length <= 200,
        message: 'At most 200 items allowed',
      },
    },
    showCompass: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

const RitualLayout = mongoose.model<IRitualLayout>(
  'RitualLayout',
  RitualLayoutSchema
);

export default RitualLayout;
