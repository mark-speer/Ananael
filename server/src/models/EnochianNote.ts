import mongoose, { Document, Schema, Types } from 'mongoose';

export type EnochianTargetType = 'tablet' | 'call' | 'hierarchy';

export interface IEnochianNote extends Document {
  userId: Types.ObjectId;
  date: Date;
  targetType: EnochianTargetType;
  targetId: string;
  userNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnochianNoteSchema = new Schema<IEnochianNote>(
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
    targetType: {
      type: String,
      enum: ['tablet', 'call', 'hierarchy'],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      maxlength: 100,
    },
    userNotes: {
      type: String,
      required: true,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

EnochianNoteSchema.index({ userId: 1, date: -1 });

const EnochianNote = mongoose.model<IEnochianNote>(
  'EnochianNote',
  EnochianNoteSchema
);

export default EnochianNote;
