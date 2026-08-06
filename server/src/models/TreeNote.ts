import mongoose, { Document, Schema, Types } from 'mongoose';

export type TreeTargetType = 'sephira' | 'path';

export interface ITreeNote extends Document {
  userId: Types.ObjectId;
  date: Date;
  targetType: TreeTargetType;
  targetId: number;
  userNotes: string;
}

const TreeNoteSchema = new Schema<ITreeNote>(
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
      enum: ['sephira', 'path'],
      required: true,
    },
    targetId: {
      type: Number,
      required: true,
      min: 1,
      max: 32,
    },
    userNotes: {
      type: String,
      required: true,
      maxlength: 5000,
      default: '',
    },
  },
  { timestamps: true }
);

const TreeNote = mongoose.model<ITreeNote>('TreeNote', TreeNoteSchema);

export default TreeNote;
