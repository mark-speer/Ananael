import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { type VisibilityString, DEFAULT_VISIBILITY } from '../types/visibility';

/** Lat/lon used for Celestial Timing and journal sky tags. */
export interface IUserLocation {
  lat: number;
  lon: number;
}

/** Birth profile for natal chart (Celestial Timing Natal panel). */
export interface IUserNatal {
  /** Local civil date YYYY-MM-DD. */
  birthDate: string;
  /** Optional local time HH:MM. */
  birthTime?: string | null;
  /** Birth place coordinates (required for Asc / Whole Sign houses). */
  birthPlace?: IUserLocation | null;
  /** Optional display label. */
  label?: string | null;
}

/** Public shape returned to the client (never include password). */
export interface IUserPublic {
  _id: string;
  username: string;
  email: string;
  location?: IUserLocation | null;
  natal?: IUserNatal | null;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  location?: IUserLocation | null;
  natal?: IUserNatal | null;
  /** Last authenticated activity (presence / online count). */
  lastSeenAt?: Date | null;
  /** Profile visibility: private (default), unlisted, or public */
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
      match: [/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores only'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // omit from queries by default
    },
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lon: { type: Number, min: -180, max: 180 },
    },
    natal: {
      birthDate: { type: String, trim: true },
      birthTime: { type: String, trim: true, default: null },
      birthPlace: {
        lat: { type: Number, min: -90, max: 90 },
        lon: { type: Number, min: -180, max: 180 },
      },
      label: { type: String, trim: true, maxlength: 80, default: null },
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    visibility: {
      type: String,
      enum: ['private', 'unlisted', 'public'],
      default: DEFAULT_VISIBILITY,
      index: true,
    },
  },
  { timestamps: true }
);

UserSchema.index({ lastSeenAt: 1 });

/** Hash password before saving when it has been modified. */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** Compare a plain-text candidate against the stored hash. */
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
