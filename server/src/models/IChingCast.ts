import mongoose, { Document, Schema, Types } from 'mongoose';

export type IChingMethod = 'coins' | 'yarrow';

export interface IIChingCast extends Document {
  userId?: Types.ObjectId;
  date: Date;
  method: IChingMethod;
  lines: number[];
  primaryNumber: number;
  relatingNumber: number | null;
  changingLines: number[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IChingCastSchema = new Schema<IIChingCast>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['coins', 'yarrow'],
      required: true,
    },
    lines: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) =>
          Array.isArray(v) &&
          v.length === 6 &&
          v.every((n) => [6, 7, 8, 9].includes(n)),
        message: 'lines must be six values from {6,7,8,9}',
      },
    },
    primaryNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 64,
    },
    relatingNumber: {
      type: Number,
      required: false,
      default: null,
      validate: {
        validator: (v: number | null | undefined) =>
          v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 64),
        message: 'relatingNumber must be null or an integer from 1 to 64',
      },
    },
    changingLines: {
      type: [Number],
      required: true,
      default: [],
    },
    userNotes: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

const IChingCast = mongoose.model<IIChingCast>('IChingCast', IChingCastSchema);

export default IChingCast;
