import mongoose, { Schema, Document } from 'mongoose';
import { Product as ProductType } from '@/types';

export interface ProductDocument extends Omit<ProductType, 'id'>, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    category: { type: String, required: true, index: true },
    brand: { type: String, default: 'CampusMart' },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    images: [{ type: String }],
    model3dUrl: { type: String },
    model3dType: { type: String, enum: ['glb', 'procedural-headphones', 'procedural-laptop', 'procedural-bottle', 'procedural-backpack', 'procedural-cup'] },
    stock: { type: Number, required: true, default: 10 },
    specs: { type: Map, of: String, default: {} },
    tags: [{ type: String }],
    isCafeteria: { type: Boolean, default: false },
    isVeg: { type: Boolean, default: true },
    badge: { type: String, enum: ['Best Seller', 'Deal of the Day', 'Campus Choice', 'Trending', 'Fresh Arrival'] },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);

