import mongoose, { Document, Schema, Types } from 'mongoose';
import { Visibility, VisibilityString } from '../types/visibility';

export type TalismanKind = 'kamea' | 'sigil' | 'sutra';

export interface ITalismanDesign extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  kind: TalismanKind;
  config: Record<string, unknown>;
  notes?: string;
  visibility: VisibilityString;
}

const TalismanDesignSchema = new Schema<ITalismanDesign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    kind: {
      type: String,
      enum: ['kamea', 'sigil', 'sutra'],
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    notes: { type: String, maxlength: 5000, default: '' },
    visibility: {
      type: String,
      enum: [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC],
      default: Visibility.PRIVATE,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITalismanDesign>(
  'TalismanDesign',
  TalismanDesignSchema
);
