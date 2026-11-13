import mongoose, { Schema, Document } from 'mongoose';
import { Category as CategoryType } from '@/types';

export interface CategoryDocument extends Omit<CategoryType, 'id'>, Document {}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.models.Category || mongoose.model<CategoryDocument>('Category', CategorySchema);

