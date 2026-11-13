import mongoose, { Schema, Document } from 'mongoose';
import { Order as OrderType } from '@/types';

export interface OrderDocument extends Omit<OrderType, 'id'>, Document {}

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    isCafeteria: { type: Boolean, default: false },
  },
  { _id: false }
);

const OrderTimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [OrderItemSchema],
    address: {
      fullName: String,
      phone: String,
      hostelBlock: String,
      roomNumber: String,
      campusGate: String,
      landmark: String,
    },
    deliverySlot: { type: String, required: true },
    paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    statusTimeline: [OrderTimelineSchema],
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 5 },
    totalAmount: { type: Number, required: true },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema);

