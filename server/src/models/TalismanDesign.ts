import mongoose, { Document, Schema, Types } from 'mongoose';

export type TalismanKind = 'kamea' | 'sigil';

export interface ITalismanDesign extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  kind: TalismanKind;
  config: Record<string, unknown>;
  notes?: string;
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
      enum: ['kamea', 'sigil'],
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    notes: { type: String, maxlength: 5000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ITalismanDesign>(
  'TalismanDesign',
  TalismanDesignSchema
);
