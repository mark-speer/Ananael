import mongoose, { Document, Schema, Types } from 'mongoose';

/** Allowed spread identifiers matching the frontend selector. */
export type SpreadType = 'single' | 'three' | 'celtic' | 'horseshoe' | 'pyramid' | 'wheel' | 'diamond';

export interface ICardDrawn {
  cardId: string;
  isReversed: boolean;
  position: string;
}

export interface ITarotReading extends Document {
  userId?: Types.ObjectId;
  date: Date;
  spreadType: SpreadType;
  cardsDrawn: ICardDrawn[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardDrawnSchema = new Schema<ICardDrawn>(
  {
    cardId: { type: String, required: true },
    isReversed: { type: Boolean, required: true, default: false },
    position: { type: String, required: true },
  },
  { _id: false }
);

const TarotReadingSchema = new Schema<ITarotReading>(
  {
    // Optional so guest readings can be stored later; Phase 1 save requires auth
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
    spreadType: {
      type: String,
      enum: ['single', 'three', 'celtic', 'horseshoe', 'pyramid', 'wheel', 'diamond'],
      required: true,
    },
    cardsDrawn: {
      type: [CardDrawnSchema],
      required: true,
      validate: {
        validator: (v: ICardDrawn[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one card is required',
      },
    },
    userNotes: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

const TarotReading = mongoose.model<ITarotReading>(
  'TarotReading',
  TarotReadingSchema
);

export default TarotReading;
