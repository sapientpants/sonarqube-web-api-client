import { DeprecationManager } from '../../../core/deprecation';
import { ActivityBuilder } from '../builders';

describe('CE Deprecated Builders', () => {
  let consoleSpy: jest.SpyInstance;
  let mockExecutor: jest.Mock;

  beforeEach(() => {
    // Reset warnings and configure for testing
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockExecutor = jest.fn().mockResolvedValue({ tasks: [] });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ActivityBuilder', () => {
    it('should show deprecation warning for withComponentId()', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      builder.withComponentId('component-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ActivityBuilder.withComponentId()')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('withComponent()'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('8.0'));
    });

    it('should only show deprecation warning once', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      builder.withComponentId('component-1').withPageSize(50);

      // Create another builder instance
      const builder2 = new ActivityBuilder(mockExecutor);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      builder2.withComponentId('component-2');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should still function correctly despite deprecation', async () => {
      const builder = new ActivityBuilder(mockExecutor);

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const response = await builder.withComponentId('component-123').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        componentId: 'component-123',
      });
      expect(response).toEqual({ tasks: [] });
    });

    it('should throw error when trying to use withComponentId() after withQuery()', () => {
      const builder = new ActivityBuilder(mockExecutor);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        builder.withQuery('search').withComponentId('component-123');
      }).toThrow('Cannot set componentId when query is already set');
    });
  });
});
