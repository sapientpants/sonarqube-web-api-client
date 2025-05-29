import { DeprecationManager } from '../DeprecationManager';

describe('DeprecationManager', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('basic functionality', () => {
    it('should display deprecation warning', () => {
      DeprecationManager.warn({
        api: 'users.search()',
        replacement: 'users.searchV2()',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const warningMessage = consoleSpy.mock.calls[0][0] as string;
      expect(warningMessage).toContain('DEPRECATED API USAGE');
      expect(warningMessage).toContain('users.search()');
      expect(warningMessage).toContain('users.searchV2()');
    });

    it('should not display warning when suppressed', () => {
      DeprecationManager.configure({ suppressDeprecationWarnings: true });

      DeprecationManager.warn({ api: 'test.method()' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should track warned APIs', () => {
      // Make sure warnings are not suppressed
      DeprecationManager.configure({ suppressDeprecationWarnings: false });

      DeprecationManager.warn({ api: 'test.method()' });

      expect(DeprecationManager.hasWarned('test.method()')).toBe(true);
      expect(DeprecationManager.hasWarned('other.method()')).toBe(false);
    });

    it('should clear warnings', () => {
      DeprecationManager.warn({ api: 'test.method()' });
      expect(DeprecationManager.getWarnedApis()).toContain('test.method()');

      DeprecationManager.clearWarnings();
      expect(DeprecationManager.getWarnedApis()).toHaveLength(0);
    });
  });
});
