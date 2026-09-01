import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPlanetaryChart extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  config: Record<string, unknown>;
  notes?: string;
}

const PlanetaryChartSchema = new Schema<IPlanetaryChart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    config: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    notes: { type: String, maxlength: 5000, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IPlanetaryChart>(
  'PlanetaryChart',
  PlanetaryChartSchema
);
