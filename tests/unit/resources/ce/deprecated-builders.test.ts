// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Mock, MockInstance } from 'vitest';
import { DeprecationManager } from '../../../../src/core/deprecation';
import { ActivityBuilder } from '../../../../src/resources/ce/builders';

describe('CE Deprecated Builders', () => {
  let consoleSpy: MockInstance;
  let mockExecutor: Mock;

  beforeEach(() => {
    // Reset warnings and configure for testing
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    mockExecutor = vi.fn().mockResolvedValue({ tasks: [] });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ActivityBuilder', () => {
    it('should show deprecation warning for withComponentId()', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      builder.withComponentId('component-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ActivityBuilder.withComponentId()'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('withComponent()'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('8.0'));
    });

    it('should only show deprecation warning once', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      builder.withComponentId('component-1').withPageSize(50);

      // Create another builder instance
      const builder2 = new ActivityBuilder(mockExecutor);

      builder2.withComponentId('component-2');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should still function correctly despite deprecation', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      const response = await builder.withComponentId('component-123').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        componentId: 'component-123',
      });
      expect(response).toEqual({ tasks: [] });
    });

    it('should throw error when trying to use withComponentId() after withQuery()', () => {
      const builder = new ActivityBuilder(mockExecutor);

      expect(() => {
        builder.withQuery('search').withComponentId('component-123');
      }).toThrow('Cannot set componentId when query is already set');
    });
  });
});
