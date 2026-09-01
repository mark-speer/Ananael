/**
 * Unit tests for Visibility enum and type definitions
 */

import { Visibility, VisibilityString, VISIBILITY_VALUES, DEFAULT_VISIBILITY } from '../src/types/visibility';

describe('Visibility Enum', () => {
  test('should define PRIVATE value', () => {
    expect(Visibility.PRIVATE).toBe('private');
  });

  test('should define UNLISTED value', () => {
    expect(Visibility.UNLISTED).toBe('unlisted');
  });

  test('should define PUBLIC value', () => {
    expect(Visibility.PUBLIC).toBe('public');
  });

  test('should have all visibility values in VISIBILITY_VALUES array', () => {
    expect(VISIBILITY_VALUES).toContain(Visibility.PRIVATE);
    expect(VISIBILITY_VALUES).toContain(Visibility.UNLISTED);
    expect(VISIBILITY_VALUES).toContain(Visibility.PUBLIC);
    expect(VISIBILITY_VALUES.length).toBe(3);
  });

  test('should have DEFAULT_VISIBILITY set to PRIVATE', () => {
    expect(DEFAULT_VISIBILITY).toBe(Visibility.PRIVATE);
  });

  test('should allow VisibilityString type assignments', () => {
    const private_vis: VisibilityString = 'private';
    const unlisted_vis: VisibilityString = 'unlisted';
    const public_vis: VisibilityString = 'public';

    expect(private_vis).toBe(Visibility.PRIVATE);
    expect(unlisted_vis).toBe(Visibility.UNLISTED);
    expect(public_vis).toBe(Visibility.PUBLIC);
  });
});
