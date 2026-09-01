import mongoose, { Document, Schema, Types } from 'mongoose';
import { Visibility, VisibilityString } from '../types/visibility';

export type TraditionId = 'goetia' | 'heptameron' | 'generic';

export interface ISolomonicCircle extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  tradition: TraditionId;
  /** Full CircleConfig JSON from the client. */
  config: Record<string, unknown>;
  notes?: string;
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}

const SolomonicCircleSchema = new Schema<ISolomonicCircle>(
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
    tradition: {
      type: String,
      enum: ['goetia', 'heptameron', 'generic'],
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
    notes: {
      type: String,
      maxlength: 5000,
      default: '',
    },
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

const SolomonicCircle = mongoose.model<ISolomonicCircle>(
  'SolomonicCircle',
  SolomonicCircleSchema
);

export default SolomonicCircle;
