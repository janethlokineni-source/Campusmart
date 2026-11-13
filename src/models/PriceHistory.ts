import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PriceHistoryDocument extends Document {
  productId: string;
  price: number;
  changedAt: Date;
}

const PriceHistorySchema = new Schema<PriceHistoryDocument>(
  {
    productId: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    changedAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

PriceHistorySchema.index({ productId: 1, changedAt: -1 });

export const PriceHistoryModel: Model<PriceHistoryDocument> =
  (mongoose.models.PriceHistory as Model<PriceHistoryDocument>) ||
  mongoose.model<PriceHistoryDocument>('PriceHistory', PriceHistorySchema);

