/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { SonarQubeClient } from '../index';
import { SonarQubeError } from '../errors';
import { DeprecationManager } from '../core/deprecation';

describe('User Properties Integration', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    DeprecationManager.clearWarnings();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should have userProperties accessible on main client', () => {
    const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
    expect(client.userProperties).toBeDefined();
  });

  it('should throw error when calling index() method', async () => {
    const client = new SonarQubeClient('https://sonarqube.example.com', 'token');

    await expect(client.userProperties.index()).rejects.toThrow(SonarQubeError);

    try {
      await client.userProperties.index();
    } catch (error) {
      expect(error).toBeInstanceOf(SonarQubeError);
      const sonarError = error as SonarQubeError;
      expect(sonarError.code).toBe('API_REMOVED');
      expect(sonarError.statusCode).toBe(410);
      expect(sonarError.message).toContain('removed in SonarQube 6.3');
      expect(sonarError.message).toContain('favorites');
      expect(sonarError.message).toContain('notifications');
    }
  });

  it('should emit deprecation warning when accessing userProperties', () => {
    // Configure to suppress main client warnings but not userProperties
    const client = new SonarQubeClient('https://sonarqube.example.com', 'token', {
      suppressDeprecationWarnings: false,
    });

    // Access the deprecated client
    const _userProps = client.userProperties;

    // Should have warned about the deprecated class
    expect(consoleWarnSpy).toHaveBeenCalled();
    const warning = consoleWarnSpy.mock.calls[0][0];
    expect(warning).toContain('UserPropertiesClient');
    expect(warning).toContain('removed in SonarQube 6.3');
  });

  it('should guide users to alternatives', async () => {
    const client = new SonarQubeClient('https://sonarqube.example.com', 'token');

    try {
      await client.userProperties.index();
    } catch (error) {
      const sonarError = error as SonarQubeError;
      expect(sonarError.details).toMatchObject({
        migration: {
          favorites: expect.stringContaining('client.favorites'),
          notifications: expect.stringContaining('client.notifications'),
        },
      });
    }
  });
});
