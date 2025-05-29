import { DeprecationRegistry } from '../DeprecationMetadata';
import type { DeprecationMetadata } from '../DeprecationMetadata';

describe('DeprecationRegistry', () => {
  beforeEach(() => {
    DeprecationRegistry.clear();
  });

  describe('register and get', () => {
    it('should register and retrieve metadata', () => {
      const metadata: DeprecationMetadata = {
        api: 'test.method()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        replacement: 'test.newMethod()',
        reason: 'Performance improvements',
      };

      DeprecationRegistry.register(metadata);
      const retrieved = DeprecationRegistry.get('test.method()');

      expect(retrieved).toEqual(metadata);
    });

    it('should return undefined for non-existent API', () => {
      const result = DeprecationRegistry.get('nonexistent.api()');
      expect(result).toBeUndefined();
    });

    it('should handle registration with all optional fields', () => {
      const metadata: DeprecationMetadata = {
        api: 'complex.api()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        replacement: 'complex.newApi()',
        reason: 'API redesign',
        migrationGuide: 'https://docs.example.com/migration',
        tags: ['breaking-change', 'performance'],
        examples: [
          {
            before: 'complex.api(param)',
            after: 'complex.newApi(param)',
            description: 'Simple parameter passing',
          },
        ],
      };

      DeprecationRegistry.register(metadata);
      const retrieved = DeprecationRegistry.get('complex.api()');

      expect(retrieved).toEqual(metadata);
    });
  });

  describe('getAll', () => {
    it('should return all registered metadata', () => {
      const metadata1: DeprecationMetadata = {
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      };

      const metadata2: DeprecationMetadata = {
        api: 'api2()',
        deprecatedSince: '1.1.0',
        removalDate: '2025-06-01',
      };

      DeprecationRegistry.register(metadata1);
      DeprecationRegistry.register(metadata2);

      const all = DeprecationRegistry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(metadata1);
      expect(all).toContainEqual(metadata2);
    });

    it('should return empty array when no metadata registered', () => {
      const all = DeprecationRegistry.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getByTag', () => {
    it('should filter by single tag', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
        tags: ['breaking-change'],
      });

      DeprecationRegistry.register({
        api: 'api2()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
        tags: ['performance'],
      });

      DeprecationRegistry.register({
        api: 'api3()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
        tags: ['breaking-change', 'security'],
      });

      const breakingChanges = DeprecationRegistry.getByTag('breaking-change');
      expect(breakingChanges).toHaveLength(2);
      expect(breakingChanges.map((m) => m.api)).toContain('api1()');
      expect(breakingChanges.map((m) => m.api)).toContain('api3()');
    });

    it('should return empty array for non-existent tag', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
        tags: ['existing-tag'],
      });

      const result = DeprecationRegistry.getByTag('non-existent-tag');
      expect(result).toEqual([]);
    });

    it('should handle metadata without tags', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      DeprecationRegistry.register({
        api: 'api2()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
        tags: ['has-tag'],
      });

      const result = DeprecationRegistry.getByTag('has-tag');
      expect(result).toHaveLength(1);
      expect(result[0].api).toBe('api2()');
    });
  });

  describe('getTimeline', () => {
    it('should sort by removal date', () => {
      DeprecationRegistry.register({
        api: 'api3()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
      });

      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      DeprecationRegistry.register({
        api: 'api2()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-06-15',
      });

      const timeline = DeprecationRegistry.getTimeline();
      expect(timeline).toHaveLength(3);
      expect(timeline[0].api).toBe('api1()');
      expect(timeline[1].api).toBe('api2()');
      expect(timeline[2].api).toBe('api3()');
    });

    it('should handle metadata without removal dates', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      DeprecationRegistry.register({
        api: 'apiNoDate()',
        deprecatedSince: '1.0.0',
        removalDate: undefined as any, // API without removal date
      });

      const timeline = DeprecationRegistry.getTimeline();
      // Should filter out items without removal dates
      expect(timeline).toHaveLength(1);
      expect(timeline[0].api).toBe('api1()');
    });

    it('should handle invalid date formats', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: 'invalid-date',
      });

      DeprecationRegistry.register({
        api: 'api2()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      const timeline = DeprecationRegistry.getTimeline();
      // Should filter out items with invalid dates
      expect(timeline).toHaveLength(1);
      expect(timeline[0].api).toBe('api2()');
    });
  });

  describe('clear', () => {
    it('should remove all registered metadata', () => {
      DeprecationRegistry.register({
        api: 'api1()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      DeprecationRegistry.register({
        api: 'api2()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-01-01',
      });

      expect(DeprecationRegistry.getAll()).toHaveLength(2);

      DeprecationRegistry.clear();

      expect(DeprecationRegistry.getAll()).toHaveLength(0);
      expect(DeprecationRegistry.get('api1()')).toBeUndefined();
      expect(DeprecationRegistry.get('api2()')).toBeUndefined();
    });
  });

  describe('export', () => {
    it('should export all metadata as JSON string', () => {
      const metadata: DeprecationMetadata = {
        api: 'test.api()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        replacement: 'test.newApi()',
        reason: 'Test reason',
        tags: ['test-tag'],
      };

      DeprecationRegistry.register(metadata);

      const exported = DeprecationRegistry.export();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([metadata]);
    });

    it('should export empty array when no metadata', () => {
      const exported = DeprecationRegistry.export();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([]);
    });

    it('should produce valid JSON for complex metadata', () => {
      DeprecationRegistry.register({
        api: 'complex.api()',
        deprecatedSince: '1.0.0',
        removalDate: '2025-12-31',
        examples: [
          {
            before: 'complex.api("test")',
            after: 'complex.newApi("test")',
            description: 'String with "quotes"',
          },
        ],
      });

      const exported = DeprecationRegistry.export();
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });
});
