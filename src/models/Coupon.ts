import mongoose, { Schema, Document } from 'mongoose';
import { Coupon as CouponType } from '@/types';

export interface CouponDocument extends Omit<CouponType, 'id'>, Document {}

const CouponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    expiresAt: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<CouponDocument>('Coupon', CouponSchema);

