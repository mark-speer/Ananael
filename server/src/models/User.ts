import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/** Lat/lon used for Celestial Timing and journal sky tags. */
export interface IUserLocation {
  lat: number;
  lon: number;
}

/** Public shape returned to the client (never include password). */
export interface IUserPublic {
  _id: string;
  username: string;
  email: string;
  location?: IUserLocation | null;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  location?: IUserLocation | null;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: 3,
      maxlength: 40,
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
  },
  { timestamps: true }
);

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
