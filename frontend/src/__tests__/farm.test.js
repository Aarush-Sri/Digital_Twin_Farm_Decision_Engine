import { describe, it, expect } from 'vitest';
import { 
  FARM_ITEMS, 
  ITEM_TYPES, 
  ITEM_LAYER_PRIORITY,
  getItemDefinition, 
  calculateZIndex,
  pxToMeters,
  metersToPx
} from '../types/farm';

describe('Farm Item Definitions & Scale Logic', () => {
  it('contains all required farm element types', () => {
    const requiredTypes = ['grass', 'tree', 'fence', 'water', 'wheat', 'carrot'];
    const definedTypes = FARM_ITEMS.map((item) => item.type);
    
    requiredTypes.forEach((type) => {
      expect(definedTypes).toContain(type);
    });
  });

  it('enforces realistic starting sizes (2x2 tree point icon, 2x2 crops/grass, thin long fence)', () => {
    const tree = getItemDefinition(ITEM_TYPES.TREE);
    expect(tree.defaultWidth).toBe(80); // 2.0m point icon
    expect(tree.defaultHeight).toBe(80); // 2.0m point icon
    expect(tree.isPointIcon).toBe(true);

    const wheat = getItemDefinition(ITEM_TYPES.WHEAT);
    expect(wheat.defaultWidth).toBe(80); // 2.0m
    expect(wheat.defaultHeight).toBe(80); // 2.0m

    const carrot = getItemDefinition(ITEM_TYPES.CARROT);
    expect(carrot.defaultWidth).toBe(80); // 2.0m
    expect(carrot.defaultHeight).toBe(80); // 2.0m

    const fence = getItemDefinition(ITEM_TYPES.FENCE);
    expect(fence.defaultHeight).toBeLessThanOrEqual(20); // thin
    expect(fence.defaultWidth).toBeGreaterThan(100); // long
  });

  it('enforces overlaying logic: fence is higher tier than water and grass', () => {
    expect(ITEM_LAYER_PRIORITY[ITEM_TYPES.FENCE]).toBeGreaterThan(
      ITEM_LAYER_PRIORITY[ITEM_TYPES.WATER]
    );
    expect(ITEM_LAYER_PRIORITY[ITEM_TYPES.WATER]).toBeGreaterThan(
      ITEM_LAYER_PRIORITY[ITEM_TYPES.GRASS]
    );

    const fenceZ = calculateZIndex(ITEM_TYPES.FENCE, 1);
    const waterZ = calculateZIndex(ITEM_TYPES.WATER, 1);
    const grassZ = calculateZIndex(ITEM_TYPES.GRASS, 1);

    expect(fenceZ).toBeGreaterThan(waterZ);
    expect(waterZ).toBeGreaterThan(grassZ);
  });

  it('converts correctly between pixels and meters', () => {
    expect(pxToMeters(40)).toBe('1m');
    expect(pxToMeters(80)).toBe('2m');
    expect(metersToPx(1)).toBe(40);
    expect(metersToPx(2.5)).toBe(100);
  });
});
