// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  Deprecated,
  DeprecatedClass,
  DeprecatedParameter,
} from '../../../../src/core/deprecation/decorators';
import { DeprecationManager } from '../../../../src/core/deprecation/DeprecationManager';
import { DeprecationRegistry } from '../../../../src/core/deprecation/DeprecationMetadata';

describe('Deprecation Decorators', () => {
  let consoleSpy: MockInstance;
  let errorSpy: MockInstance;
  let logSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    errorSpy = vi.spyOn(console, 'error').mockImplementation();
    logSpy = vi.spyOn(console, 'log').mockImplementation();
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
    DeprecationRegistry.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('@Deprecated', () => {
    it('should handle methods with properties', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
          reason: 'Test reason',
        })
        oldMethod(): string {
          return 'result';
        }
      }

      // Add a custom property to the method
      (TestClass.prototype.oldMethod as any).customProp = 'custom value';

      const instance = new TestClass();
      const result = instance.oldMethod();

      expect(result).toBe('result');
      expect((instance.oldMethod as any).customProp).toBe('custom value');
    });

    it('should handle methods with missing prototype properties', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
        })
        method(): void {
          // Method with no custom properties
        }
      }

      const instance = new TestClass();
      expect(() => {
        instance.method();
      }).not.toThrow();
    });

    it('should emit critical error for past removal date', () => {
      const pastDate = '2020-01-01';

      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: pastDate,
          reason: 'Should be removed',
        })
        oldMethod(): void {
          // Intentionally empty for testing
        }
      }

      const instance = new TestClass();
      instance.oldMethod();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(pastDate));
    });

    it('should show migration examples when available', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
          examples: [
            {
              before: 'obj.oldMethod()',
              after: 'obj.newMethod()',
              description: 'Simple replacement',
            },
          ],
        })
        oldMethod(): void {
          /* empty */
        }
      }

      const instance = new TestClass();
      instance.oldMethod();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Migration Example'));
      expect(logSpy).toHaveBeenCalledWith('Before:', 'obj.oldMethod()');
      expect(logSpy).toHaveBeenCalledWith('After:', 'obj.newMethod()');
      expect(logSpy).toHaveBeenCalledWith('Note:', 'Simple replacement');
    });

    it('should handle methods without examples', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
        })
        oldMethod(): void {
          /* empty */
        }
      }

      const instance = new TestClass();
      instance.oldMethod();

      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Migration Example'));
    });

    it('should register metadata only once', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
        })
        oldMethod(): void {
          /* empty */
        }
      }

      const instance = new TestClass();
      instance.oldMethod();
      instance.oldMethod();

      const metadata = DeprecationRegistry.getAll();
      const relevantMetadata = metadata.filter((m) => m.api === 'TestClass.oldMethod()');
      expect(relevantMetadata).toHaveLength(1);
    });

    it('should handle methods without "this" context', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
        })
        static staticMethod(): string {
          return 'static result';
        }
      }

      const result = TestClass.staticMethod();
      expect(result).toBe('static result');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should pass migration guide to DeprecationManager', () => {
      class TestClass {
        @Deprecated({
          deprecatedSince: '1.0.0',
          removalDate: '2025-12-31',
          replacement: 'newMethod()',
          migrationGuide: 'https://docs.example.com/migration',
        })
        oldMethod(): void {
          /* empty */
        }
      }

      const instance = new TestClass();
      instance.oldMethod();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://docs.example.com/migration'),
      );
    });
  });

  describe('@DeprecatedClass', () => {
    it('should warn on instantiation', () => {
      @DeprecatedClass({
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        replacement: 'NewClass',
        reason: 'Class has been redesigned',
      })
      class OldClass {
        method(): string {
          return 'result';
        }
      }

      const instance = new OldClass();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OldClass'));
      expect(instance.method()).toBe('result');
    });

    it('should register class metadata', () => {
      @DeprecatedClass({
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        replacement: 'NewClass',
      })
      class OldClass {}

      new OldClass();

      const metadata = DeprecationRegistry.get('OldClass');
      expect(metadata).toBeDefined();
      expect(metadata?.replacement).toBe('NewClass');
    });

    it('should pass all parameters to constructor', () => {
      @DeprecatedClass({
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
      })
      class OldClass {
        constructor(
          public value1: string,
          public value2: number,
          public value3?: boolean,
        ) {}
      }

      const instance = new OldClass('test', 42, true);
      expect(instance.value1).toBe('test');
      expect(instance.value2).toBe(42);
      expect(instance.value3).toBe(true);
    });
  });

  describe('@DeprecatedParameter', () => {
    it('should warn only when deprecated parameter is used', () => {
      class TestClass {
        @DeprecatedParameter(2, 'options', {
          reason: 'Use individual parameters instead',
          replacement: 'method(value, config)',
        })
        method(value: string, _config?: any, options?: any): string {
          return options ? `${value} with options` : value;
        }
      }

      const instance = new TestClass();

      // Call without deprecated parameter
      consoleSpy.mockClear();
      const result1 = instance.method('test');
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(result1).toBe('test');

      // Call with config but not deprecated parameter
      consoleSpy.mockClear();
      const result2 = instance.method('test', { key: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(result2).toBe('test');

      // Call with deprecated parameter
      const result3 = instance.method('test', undefined, { old: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Parameter 'options' in TestClass.method() is deprecated"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Use individual parameters instead'),
      );
      expect(result3).toBe('test with options');
    });

    it('should handle methods without replacement message', () => {
      class TestClass {
        @DeprecatedParameter(0, 'legacyParam', {
          reason: 'No longer needed',
        })
        method(legacyParam?: string): string {
          return legacyParam || 'default';
        }
      }

      const instance = new TestClass();
      instance.method('legacy');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No longer needed'));
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle methods without reason', () => {
      class TestClass {
        @DeprecatedParameter(1, 'param', {})
        method(value: string, _param?: any): string {
          return value;
        }
      }

      const instance = new TestClass();
      instance.method('test', 'deprecated');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Parameter 'param' in TestClass.method() is deprecated"),
      );
    });

    it('should work with static methods', () => {
      class TestClass {
        @DeprecatedParameter(0, 'oldParam', {
          reason: 'Static parameter deprecated',
        })
        static staticMethod(oldParam?: string): string {
          return oldParam || 'static';
        }
      }

      TestClass.staticMethod('value');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Static parameter deprecated'),
      );
    });

    it('should handle regular methods with all parameters', () => {
      class TestClass {
        @DeprecatedParameter(1, 'config', {
          reason: 'Config parameter deprecated',
          replacement: 'Use options parameter',
        })
        method(value: string, _config?: any, _options?: any): string {
          return value;
        }
      }

      const instance = new TestClass();

      // Call with deprecated parameter
      instance.method('test', { old: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Config parameter deprecated'),
      );
    });
  });
});
