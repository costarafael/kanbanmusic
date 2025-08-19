import { z } from 'zod';
import { isValidUrl, isValidAudioUrl } from '@/lib/utils/validation-helpers';

// Board validators
export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
});

// Column validators
export const createColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  coverUrl: z.string().refine(isValidUrl, 'Invalid cover URL or path').optional().or(z.literal('')),
  order: z.number().int().min(0).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

// Card validators
export const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  audioUrl: z.string().refine(isValidAudioUrl, 'Invalid audio URL or path').optional().or(z.literal('')),
  coverUrl: z.string().refine(isValidUrl, 'Invalid cover URL or path').optional().or(z.literal('')),
  music_ai_notes: z.string().optional(),
  isPlaylist: z.boolean().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.any().optional(), // Rich text content object
  audioUrl: z.string().refine(isValidAudioUrl, 'Invalid audio URL or path').optional().or(z.literal('')),
  coverUrl: z.string().refine(isValidUrl, 'Invalid cover URL or path').optional().or(z.literal('')),
  music_ai_notes: z.string().optional(), // AI-generated music analysis notes
  rating: z.number().int().min(0).max(5).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  showDescriptionInPreview: z.boolean().optional(),
  showTagsInPreview: z.boolean().optional(),
  // Playlist fields
  isPlaylist: z.boolean().optional(),
  playlistItems: z.array(z.object({
    cardId: z.string().min(1),
    order: z.number().int().min(0),
  })).optional(),
  order: z.number().int().min(0).optional(),
  columnId: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;