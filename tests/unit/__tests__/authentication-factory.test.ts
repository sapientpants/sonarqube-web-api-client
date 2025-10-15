// @ts-nocheck
import {
  SonarQubeClient,
  BearerTokenAuthProvider,
  BasicAuthProvider,
  PasscodeAuthProvider,
} from '../../../src/index';

describe('SonarQubeClient Factory Methods', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const options = { organization: 'test-org' };

  describe('withToken', () => {
    it('should create client with Bearer token authentication', () => {
      const client = SonarQubeClient.withToken(baseUrl, 'test-token', options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BearerTokenAuthProvider);
      expect(client['authProvider'].getAuthType()).toBe('bearer');
    });

    it('should create client without options', () => {
      const client = SonarQubeClient.withToken(baseUrl, 'test-token');

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BearerTokenAuthProvider);
    });
  });

  describe('withBasicAuth', () => {
    it('should create client with Basic authentication', () => {
      const client = SonarQubeClient.withBasicAuth(baseUrl, 'username', 'password', options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BasicAuthProvider);
      expect(client['authProvider'].getAuthType()).toBe('basic');
    });

    it('should create client without options', () => {
      const client = SonarQubeClient.withBasicAuth(baseUrl, 'username', 'password');

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BasicAuthProvider);
    });

    it('should create client with token as username and no password', () => {
      const client = SonarQubeClient.withBasicAuth(baseUrl, 'squ_mytoken123');

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BasicAuthProvider);
      expect(client['authProvider'].getAuthType()).toBe('basic');
    });
  });

  describe('withPasscode', () => {
    it('should create client with Passcode authentication', () => {
      const client = SonarQubeClient.withPasscode(baseUrl, 'test-passcode', options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(PasscodeAuthProvider);
      expect(client['authProvider'].getAuthType()).toBe('passcode');
    });

    it('should create client without options', () => {
      const client = SonarQubeClient.withPasscode(baseUrl, 'test-passcode');

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(PasscodeAuthProvider);
    });
  });

  describe('withAuth', () => {
    it('should create client with custom authentication provider', () => {
      const customAuthProvider = {
        applyAuth: (headers: Headers): Headers => {
          headers.set('X-Custom-Auth', 'custom-value');
          return headers;
        },
        getAuthType: (): 'bearer' | 'basic' | 'passcode' => 'bearer' as const,
      };

      const client = SonarQubeClient.withAuth(baseUrl, customAuthProvider, options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBe(customAuthProvider);
    });

    it('should create client without options', () => {
      const customAuthProvider = {
        applyAuth: (headers: Headers): Headers => headers,
        getAuthType: (): 'bearer' | 'basic' | 'passcode' => 'bearer' as const,
      };

      const client = SonarQubeClient.withAuth(baseUrl, customAuthProvider);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBe(customAuthProvider);
    });
  });

  describe('backward compatibility', () => {
    it('should still accept string token in constructor', () => {
      const client = new SonarQubeClient(baseUrl, 'test-token', options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBeInstanceOf(BearerTokenAuthProvider);
      expect(client['authProvider'].getAuthType()).toBe('bearer');
    });

    it('should accept AuthProvider in constructor', () => {
      const authProvider = new PasscodeAuthProvider('test-passcode');
      const client = new SonarQubeClient(baseUrl, authProvider, options);

      expect(client).toBeInstanceOf(SonarQubeClient);
      expect(client['authProvider']).toBe(authProvider);
    });
  });
});
