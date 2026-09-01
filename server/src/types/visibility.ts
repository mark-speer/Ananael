/**
 * Privacy model for shareable artifacts
 * Defines visibility levels for user-created documents
 */

export enum Visibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public',
}

export type VisibilityString = 'private' | 'unlisted' | 'public';

export const VISIBILITY_VALUES = Object.values(Visibility) as VisibilityString[];

export const DEFAULT_VISIBILITY: VisibilityString = Visibility.PRIVATE;
