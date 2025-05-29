/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { UserPropertiesClient } from '../UserPropertiesClient';
import { SonarQubeError } from '../../../errors';
import { DeprecationManager } from '../../../core/deprecation';

describe('UserPropertiesClient', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up spies before creating client
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Clear deprecation warnings and reset configuration
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should emit deprecation warning when instantiated', () => {
      // Clear any previous warnings
      DeprecationManager.clearWarnings();

      new UserPropertiesClient('https://sonarqube.example.com', 'token', {});

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const warning = consoleWarnSpy.mock.calls[0][0];
      expect(warning).toContain('DEPRECATED API USAGE');
      expect(warning).toContain('API: UserPropertiesClient');
      expect(warning).toContain('Replacement: favorites and notifications APIs');
    });

    it('should include removal date in warning', () => {
      DeprecationManager.clearWarnings();

      new UserPropertiesClient('https://sonarqube.example.com', 'token', {});

      const warning = consoleWarnSpy.mock.calls[0][0];
      expect(warning).toContain('Will be removed in: 2017-06-05');
    });

    it('should include migration guide in warning', () => {
      DeprecationManager.clearWarnings();

      new UserPropertiesClient('https://sonarqube.example.com', 'token', {});

      const warning = consoleWarnSpy.mock.calls[0][0];
      expect(warning).toContain('Migration guide:');
      expect(warning).toContain('Favorites API');
      expect(warning).toContain('Notifications API');
    });
  });

  describe('index', () => {
    it('should always throw SonarQubeError with 410 status', async () => {
      const client = new UserPropertiesClient('https://sonarqube.example.com', 'token', {});

      await expect(client.index()).rejects.toThrow(SonarQubeError);

      try {
        await client.index();
      } catch (error) {
        expect(error).toBeInstanceOf(SonarQubeError);
        expect((error as SonarQubeError).statusCode).toBe(410);
        expect((error as SonarQubeError).message).toContain('removed in SonarQube 6.3');
        expect((error as SonarQubeError).message).toContain('favorites API');
        expect((error as SonarQubeError).message).toContain('notifications API');
      }
    });

    it('should include migration information in error details', async () => {
      const client = new UserPropertiesClient('https://sonarqube.example.com', 'token', {});

      try {
        await client.index();
      } catch (error) {
        const sonarError = error as SonarQubeError;
        expect(sonarError.details).toEqual({
          error: 'api_removed',
          message: 'This API endpoint has been removed',
          migration: {
            favorites: 'Use client.favorites for managing favorite projects',
            notifications: 'Use client.notifications for managing notification preferences',
          },
        });
      }
    });

    it('should not make any HTTP requests', async () => {
      const client = new UserPropertiesClient('https://sonarqube.example.com', 'token', {});
      const fetchSpy = jest.spyOn(global, 'fetch');

      try {
        await client.index();
      } catch {
        // Expected to throw
      }

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('deprecation behavior', () => {
    it('should respect deprecation configuration', () => {
      // Test with warnings disabled
      DeprecationManager.configure({ suppressDeprecationWarnings: true });
      DeprecationManager.clearWarnings();

      const _client = new UserPropertiesClient('https://sonarqube.example.com', 'token', {
        suppressDeprecationWarnings: true,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
