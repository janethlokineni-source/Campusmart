import mongoose, { Schema, Document, Model } from 'mongoose';
import { AssistantProductCardItem, ChatMessage } from '@/types';

export interface ChatSessionDocument extends Document {
  userId?: string;
  sessionKey: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AssistantProductSnapshotSchema = new Schema<AssistantProductCardItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    rating: { type: Number, required: true },
    reviewCount: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const ChatMessageSubSchema = new Schema<ChatMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    products: { type: [AssistantProductSnapshotSchema], default: undefined },
    bundleTotal: { type: Number, default: undefined },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<ChatSessionDocument>(
  {
    userId: { type: String, index: true, default: undefined },
    sessionKey: { type: String, required: true, unique: true, index: true },
    messages: { type: [ChatMessageSubSchema], default: [] },
  },
  { timestamps: true }
);

// Automatic 30-day retention TTL in MongoDB when active
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ChatSessionModel: Model<ChatSessionDocument> =
  (mongoose.models.ChatSession as Model<ChatSessionDocument>) ||
  mongoose.model<ChatSessionDocument>('ChatSession', ChatSessionSchema);

