import { describe, it, expect } from 'vitest';
import { FARM_ITEMS, ITEM_TYPES, getItemDefinition } from '../types/farm';

describe('Farm Item Definitions', () => {
  it('contains all required farm element types', () => {
    const requiredTypes = ['grass', 'tree', 'fence', 'water', 'wheat', 'carrot'];
    const definedTypes = FARM_ITEMS.map((item) => item.type);
    
    requiredTypes.forEach((type) => {
      expect(definedTypes).toContain(type);
    });
  });

  it('provides valid dimensions and colors for every item', () => {
    FARM_ITEMS.forEach((item) => {
      expect(item.defaultWidth).toBeGreaterThan(0);
      expect(item.defaultHeight).toBeGreaterThan(0);
      expect(item.color.bg).toMatch(/^#/);
      expect(item.color.border).toMatch(/^#/);
      expect(item.color.accent).toMatch(/^#/);
    });
  });

  it('retrieves correct definition by type with fallback', () => {
    const grass = getItemDefinition(ITEM_TYPES.GRASS);
    expect(grass.type).toBe('grass');
    expect(grass.label).toBe('Grass Plot');

    const fallback = getItemDefinition('non-existent');
    expect(fallback).toBeDefined();
    expect(fallback.type).toBe('grass');
  });
});
