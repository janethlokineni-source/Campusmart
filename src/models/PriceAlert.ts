import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PriceAlertDocument extends Document {
  userId: string;
  productId: string;
  priceWhenAdded: number;
  targetPrice?: number;
  active: boolean;
  lastNotifiedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PriceAlertSchema = new Schema<PriceAlertDocument>(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    priceWhenAdded: { type: Number, required: true, min: 0 },
    targetPrice: { type: Number, default: undefined, min: 0 },
    active: { type: Boolean, default: true, index: true },
    lastNotifiedPrice: { type: Number, default: undefined },
  },
  { timestamps: true }
);

PriceAlertSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const PriceAlertModel: Model<PriceAlertDocument> =
  (mongoose.models.PriceAlert as Model<PriceAlertDocument>) ||
  mongoose.model<PriceAlertDocument>('PriceAlert', PriceAlertSchema);

