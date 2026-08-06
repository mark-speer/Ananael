import mongoose, { Document, Schema, Types } from 'mongoose';

export type GematriaSystem =
  | 'hebrew_ordinal'
  | 'hebrew_reduced'
  | 'hebrew_sofit'
  | 'greek_isopsephy'
  | 'english_simple'
  | 'english_agrippa';

export interface IGematriaQuery extends Document {
  userId: Types.ObjectId;
  text: string;
  system: GematriaSystem;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VALID_SYSTEMS: GematriaSystem[] = [
  'hebrew_ordinal',
  'hebrew_reduced',
  'hebrew_sofit',
  'greek_isopsephy',
  'english_simple',
  'english_agrippa',
];

const GematriaQuerySchema = new Schema<IGematriaQuery>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    system: {
      type: String,
      enum: VALID_SYSTEMS,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

export { VALID_SYSTEMS };

const GematriaQuery = mongoose.model<IGematriaQuery>(
  'GematriaQuery',
  GematriaQuerySchema
);

export default GematriaQuery;
