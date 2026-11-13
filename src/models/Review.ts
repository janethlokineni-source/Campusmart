import mongoose, { Schema, Document } from 'mongoose';
import { Review as ReviewType } from '@/types';

export interface ReviewDocument extends Omit<ReviewType, 'id'>, Document {}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.models.Review || mongoose.model<ReviewDocument>('Review', ReviewSchema);

