import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationType } from '@/types';

export interface NotificationDocument extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  productId?: string;
  productSlug?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['price_drop', 'order_update', 'system'],
      required: true,
      default: 'price_drop',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    productId: { type: String, default: undefined, index: true },
    productSlug: { type: String, default: undefined },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);

