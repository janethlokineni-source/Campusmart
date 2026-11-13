import mongoose, { Schema, Document } from 'mongoose';
import { User as UserType } from '@/types';

export interface UserDocument extends Omit<UserType, 'id'>, Document {
  passwordHash: string;
}

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    hostelBlock: { type: String, required: true },
    roomNumber: { type: String, required: true },
    campusGate: { type: String },
    landmark: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    studentId: { type: String },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    phone: { type: String },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

