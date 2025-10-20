// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { DeprecationManager } from '../../../../src/core/deprecation/DeprecationManager.js';

describe('DeprecationManager', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    DeprecationManager.clearWarnings();
    // Reset configuration to default state
    DeprecationManager.configure({
      suppressDeprecationWarnings: false,
      strictMode: false,
      migrationMode: false,
      onDeprecationWarning: undefined,
    });
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

    it('should only warn once per API', () => {
      DeprecationManager.warn({ api: 'test.method()' });
      DeprecationManager.warn({ api: 'test.method()' });
      DeprecationManager.warn({ api: 'test.method()' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should get all warned APIs', () => {
      DeprecationManager.warn({ api: 'method1()' });
      DeprecationManager.warn({ api: 'method2()' });
      DeprecationManager.warn({ api: 'method3()' });

      const warnedApis = DeprecationManager.getWarnedApis();
      expect(warnedApis).toHaveLength(3);
      expect(warnedApis).toContain('method1()');
      expect(warnedApis).toContain('method2()');
      expect(warnedApis).toContain('method3()');
    });
  });

  describe('custom warning handler', () => {
    it('should use custom warning handler', () => {
      const customHandler = vi.fn();
      DeprecationManager.configure({ onDeprecationWarning: customHandler });

      const context = {
        api: 'test.method()',
        replacement: 'test.newMethod()',
      };

      DeprecationManager.warn(context);

      expect(customHandler).toHaveBeenCalledWith(context);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should still track warnings when using custom handler', () => {
      const customHandler = vi.fn();
      DeprecationManager.configure({ onDeprecationWarning: customHandler });

      DeprecationManager.warn({ api: 'test.method()' });

      expect(DeprecationManager.hasWarned('test.method()')).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('should throw error in strict mode', () => {
      DeprecationManager.configure({ strictMode: true });

      expect(() => {
        DeprecationManager.warn({
          api: 'test.method()',
          replacement: 'test.newMethod()',
        });
      }).toThrow(/DEPRECATED API USAGE/);
    });

    it('should include all context in error message', () => {
      DeprecationManager.configure({ strictMode: true });

      expect(() => {
        DeprecationManager.warn({
          api: 'test.method()',
          replacement: 'test.newMethod()',
          removeVersion: 'v2.0.0',
          reason: 'Security vulnerability',
          migrationGuide: 'https://example.com/migration',
        });
      }).toThrow(/Security vulnerability/);
    });
  });

  describe('migration mode', () => {
    it('should include migration command in warning', () => {
      DeprecationManager.configure({ migrationMode: true });

      DeprecationManager.warn({
        api: 'test.method()',
      });

      const warningMessage = consoleSpy.mock.calls[0][0] as string;
      expect(warningMessage).toContain('npx sonarqube-client-migrate');
    });
  });

  describe('warning message formatting', () => {
    it('should include all provided context fields', () => {
      DeprecationManager.warn({
        api: 'test.method()',
        replacement: 'test.newMethod()',
        removeVersion: 'v2.0.0',
        reason: 'API redesign for better performance',
        migrationGuide: 'https://example.com/migration',
      });

      const warningMessage = consoleSpy.mock.calls[0][0] as string;
      expect(warningMessage).toContain('test.method()');
      expect(warningMessage).toContain('test.newMethod()');
      expect(warningMessage).toContain('v2.0.0');
      expect(warningMessage).toContain('API redesign for better performance');
      expect(warningMessage).toContain('https://example.com/migration');
    });

    it('should handle empty optional fields gracefully', () => {
      DeprecationManager.warn({
        api: 'test.method()',
        replacement: '',
        reason: '',
        removeVersion: '',
        migrationGuide: '',
      });

      const warningMessage = consoleSpy.mock.calls[0][0] as string;
      expect(warningMessage).toContain('test.method()');
      // Empty fields should not be included
      expect(warningMessage).not.toContain('Reason:');
      expect(warningMessage).not.toContain('Replacement:');
      expect(warningMessage).not.toContain('Will be removed in:');
      expect(warningMessage).not.toContain('Migration guide:');
    });

    it('should handle minimal context', () => {
      DeprecationManager.warn({
        api: 'test.method()',
      });

      const warningMessage = consoleSpy.mock.calls[0][0] as string;
      expect(warningMessage).toContain('DEPRECATED API USAGE');
      expect(warningMessage).toContain('test.method()');
    });
  });

  describe('configuration', () => {
    it('should merge configurations', () => {
      DeprecationManager.configure({ suppressDeprecationWarnings: true });
      DeprecationManager.configure({ migrationMode: true });

      // Should preserve suppressDeprecationWarnings: true
      DeprecationManager.warn({ api: 'test.method()' });
      expect(consoleSpy).not.toHaveBeenCalled();

      // Should still track the warning
      expect(DeprecationManager.hasWarned('test.method()')).toBe(true);
    });

    it('should override previous configuration values', () => {
      DeprecationManager.configure({ suppressDeprecationWarnings: true });
      DeprecationManager.configure({ suppressDeprecationWarnings: false });

      DeprecationManager.warn({ api: 'test.method()' });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
