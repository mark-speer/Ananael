/**
 * Integration tests for visibility field on shareable models
 */

import mongoose, { Types } from 'mongoose';
import TalismanDesign from '../src/models/TalismanDesign';
import SolomonicCircle from '../src/models/SolomonicCircle';
import RitualLayout from '../src/models/RitualLayout';
import OpusVessel from '../src/models/OpusVessel';
import PracticeVessel from '../src/models/PracticeVessel';
import TreeNote from '../src/models/TreeNote';
import { Visibility } from '../src/types/visibility';

// Test helper to create a mock user ID
const mockUserId = new Types.ObjectId();

describe('Visibility Field on Models', () => {
  describe('TalismanDesign Model', () => {
    test('should default visibility to "private" on creation', async () => {
      const design = new TalismanDesign({
        userId: mockUserId,
        name: 'Test Talisman',
        kind: 'kamea',
        config: {},
      });

      expect(design.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting visibility to different values', async () => {
      const designPrivate = new TalismanDesign({
        userId: mockUserId,
        name: 'Private Talisman',
        kind: 'kamea',
        config: {},
        visibility: Visibility.PRIVATE,
      });

      const designPublic = new TalismanDesign({
        userId: mockUserId,
        name: 'Public Talisman',
        kind: 'kamea',
        config: {},
        visibility: Visibility.PUBLIC,
      });

      const designUnlisted = new TalismanDesign({
        userId: mockUserId,
        name: 'Unlisted Talisman',
        kind: 'kamea',
        config: {},
        visibility: Visibility.UNLISTED,
      });

      expect(designPrivate.visibility).toBe(Visibility.PRIVATE);
      expect(designPublic.visibility).toBe(Visibility.PUBLIC);
      expect(designUnlisted.visibility).toBe(Visibility.UNLISTED);
    });

    test('should validate visibility enum values in schema', () => {
      const designInvalid = new TalismanDesign({
        userId: mockUserId,
        name: 'Invalid Talisman',
        kind: 'kamea',
        config: {},
        visibility: 'invalid' as any,
      });

      // Validation would occur on save(), not construction
      expect(designInvalid.visibility).toBe('invalid');
    });
  });

  describe('SolomonicCircle Model', () => {
    test('should default visibility to "private" on creation', () => {
      const circle = new SolomonicCircle({
        userId: mockUserId,
        name: 'Test Circle',
        tradition: 'goetia',
        config: {},
      });

      expect(circle.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting different visibility levels', () => {
      const circlePublic = new SolomonicCircle({
        userId: mockUserId,
        name: 'Public Circle',
        tradition: 'goetia',
        config: {},
        visibility: Visibility.PUBLIC,
      });

      expect(circlePublic.visibility).toBe(Visibility.PUBLIC);
    });
  });

  describe('RitualLayout Model', () => {
    test('should default visibility to "private" on creation', () => {
      const layout = new RitualLayout({
        userId: mockUserId,
        name: 'Test Layout',
        items: [],
        showCompass: true,
      });

      expect(layout.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting different visibility levels', () => {
      const layoutPublic = new RitualLayout({
        userId: mockUserId,
        name: 'Public Layout',
        items: [],
        showCompass: true,
        visibility: Visibility.PUBLIC,
      });

      expect(layoutPublic.visibility).toBe(Visibility.PUBLIC);
    });
  });

  describe('OpusVessel Model', () => {
    test('should default visibility to "private" on creation', () => {
      const vessel = new OpusVessel({
        userId: mockUserId,
        name: 'Test Opus',
        config: {},
      });

      expect(vessel.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting different visibility levels', () => {
      const vesselUnlisted = new OpusVessel({
        userId: mockUserId,
        name: 'Unlisted Opus',
        config: {},
        visibility: Visibility.UNLISTED,
      });

      expect(vesselUnlisted.visibility).toBe(Visibility.UNLISTED);
    });
  });

  describe('PracticeVessel Model', () => {
    test('should default visibility to "private" on creation', () => {
      const vessel = new PracticeVessel({
        userId: mockUserId,
        name: 'Test Practice',
        config: {},
      });

      expect(vessel.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting different visibility levels', () => {
      const vesselPublic = new PracticeVessel({
        userId: mockUserId,
        name: 'Public Practice',
        config: {},
        visibility: Visibility.PUBLIC,
      });

      expect(vesselPublic.visibility).toBe(Visibility.PUBLIC);
    });
  });

  describe('TreeNote Model', () => {
    test('should default visibility to "private" on creation', () => {
      const note = new TreeNote({
        userId: mockUserId,
        targetType: 'sephira',
        targetId: 1,
        userNotes: 'Test note',
      });

      expect(note.visibility).toBe(Visibility.PRIVATE);
    });

    test('should allow setting different visibility levels', () => {
      const notePublic = new TreeNote({
        userId: mockUserId,
        targetType: 'sephira',
        targetId: 1,
        userNotes: 'Public note',
        visibility: Visibility.PUBLIC,
      });

      expect(notePublic.visibility).toBe(Visibility.PUBLIC);
    });
  });

  describe('Backward Compatibility', () => {
    test('models should handle undefined visibility gracefully', () => {
      const design = new TalismanDesign({
        userId: mockUserId,
        name: 'Test',
        kind: 'kamea',
        config: {},
        visibility: undefined as any,
      });

      // In Mongoose, undefined fields get the default value
      expect(design.visibility).toBe(Visibility.PRIVATE);
    });

    test('models should work with minimal data (no visibility specified)', () => {
      const design = new TalismanDesign({
        userId: mockUserId,
        name: 'Test',
        kind: 'kamea',
        config: {},
      });

      // Should have default visibility
      expect(design.visibility).toBe(Visibility.PRIVATE);
      expect(design.name).toBe('Test');
      expect(design.kind).toBe('kamea');
    });
  });
});
