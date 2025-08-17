// lib/db/models.ts
import { Schema, model, models } from 'mongoose';

const cardSchema = new Schema({
  id: { type: String, required: true, unique: true }, // nanoid
  title: { type: String, required: true, trim: true },
  description: { type: Object }, // Objeto JSON do Yoopta
  audioUrl: { type: String },
  coverUrl: { type: String }, // URL da imagem de cover
  rating: { type: Number, min: 0, max: 5, default: 0 }, // Rating de 0-5 estrelas
  showDescriptionInPreview: { type: Boolean, default: false }, // Mostrar descrição no preview
  order: { type: Number, required: true },
  columnId: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

const columnSchema = new Schema({
  id: { type: String, required: true, unique: true }, // nanoid
  title: { type: String, required: true, trim: true },
  coverUrl: { type: String }, // URL da imagem de cover
  order: { type: Number, required: true },
  boardId: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

const boardSchema = new Schema({
  id: { type: String, required: true, unique: true }, // nanoid
  title: { type: String, required: true, default: 'Novo Board', trim: true },
}, { timestamps: true });

export const Card = models.Card || model('Card', cardSchema);
export const Column = models.Column || model('Column', columnSchema);
export const Board = models.Board || model('Board', boardSchema);
