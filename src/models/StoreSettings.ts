import mongoose, { Schema, Document } from 'mongoose';
import { StoreSettings as StoreSettingsType } from '@/types';

export interface StoreSettingsDocument extends Omit<StoreSettingsType, 'updatedAt'>, Document {
  updatedAt: string;
}

const StoreSettingsSchema = new Schema<StoreSettingsDocument>(
  {
    openDays: [{ type: Number }], // 0=Sun, 1=Mon, ..., 6=Sat
    openTime: { type: String, default: '00:00' },
    closeTime: { type: String, default: '23:59' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    overrides: [
      {
        date: { type: String, required: true },
        forceOpen: { type: Boolean, required: true },
        reason: { type: String, required: true },
      },
    ],
    weekendNotice: {
      type: String,
      default: 'Ordering is closed on Saturday and Sunday. Add items to your cart now and order on Monday!',
    },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const StoreSettingsModel =
  mongoose.models.StoreSettings ||
  mongoose.model<StoreSettingsDocument>('StoreSettings', StoreSettingsSchema);

