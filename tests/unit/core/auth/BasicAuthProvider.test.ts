// @ts-nocheck
import { BasicAuthProvider } from '../../../../src/core/auth/BasicAuthProvider';

describe('BasicAuthProvider', () => {
  it('should throw error if username is empty', () => {
    expect(() => new BasicAuthProvider('', 'password')).toThrow(
      'Username is required for Basic authentication',
    );
  });

  it('should allow empty password for token authentication', () => {
    const provider = new BasicAuthProvider('mytoken', '');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    // Base64 encoding of 'mytoken:' is 'bXl0b2tlbjo='
    expect(result.get('Authorization')).toBe('Basic bXl0b2tlbjo=');
  });

  it('should allow password to be omitted for token authentication', () => {
    const provider = new BasicAuthProvider('mytoken');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    // Base64 encoding of 'mytoken:' is 'bXl0b2tlbjo='
    expect(result.get('Authorization')).toBe('Basic bXl0b2tlbjo=');
  });

  it('should support SonarQube token authentication pattern', () => {
    // SonarQube documentation states: "The token is sent via the login field
    // of HTTP basic authentication, without any password"
    const sonarqubeToken = 'squ_1234567890abcdef';
    const provider = new BasicAuthProvider(sonarqubeToken);
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    // Token should be used as username with empty password
    const expectedCredentials = Buffer.from(`${sonarqubeToken}:`).toString('base64');
    expect(result.get('Authorization')).toBe(`Basic ${expectedCredentials}`);
  });

  it('should apply Basic auth to headers', () => {
    const provider = new BasicAuthProvider('admin', 'secret');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    // Base64 encoding of 'admin:secret' is 'YWRtaW46c2VjcmV0'
    expect(result.get('Authorization')).toBe('Basic YWRtaW46c2VjcmV0');
  });

  it('should return basic as auth type', () => {
    const provider = new BasicAuthProvider('admin', 'secret');
    expect(provider.getAuthType()).toBe('basic');
  });

  it('should handle unicode characters correctly', () => {
    const provider = new BasicAuthProvider('user', 'café☕');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    // Base64 encoding of 'user:café☕' with proper UTF-8 handling
    expect(result.get('Authorization')).toBe('Basic dXNlcjpjYWbDqeKYlQ==');
  });

  it('should overwrite existing Authorization header', () => {
    const provider = new BasicAuthProvider('newuser', 'newpass');
    const headers = new Headers();
    headers.set('Authorization', 'Basic b2xkdXNlcjpvbGRwYXNz');

    const result = provider.applyAuth(headers);

    // Base64 encoding of 'newuser:newpass' is 'bmV3dXNlcjpuZXdwYXNz'
    expect(result.get('Authorization')).toBe('Basic bmV3dXNlcjpuZXdwYXNz');
  });

  it('should handle browser environment without Buffer', () => {
    // Mock Buffer as undefined to simulate browser environment
    const originalBuffer = global.Buffer;
    // @ts-expect-error - Temporarily setting Buffer to undefined for testing
    global.Buffer = undefined;

    try {
      const provider = new BasicAuthProvider('testuser', 'testpass');
      const headers = new Headers();

      const result = provider.applyAuth(headers);

      // Base64 encoding of 'testuser:testpass' is 'dGVzdHVzZXI6dGVzdHBhc3M='
      expect(result.get('Authorization')).toBe('Basic dGVzdHVzZXI6dGVzdHBhc3M=');
    } finally {
      // Restore original Buffer
      global.Buffer = originalBuffer;
    }
  });

  it('should handle browser environment with unicode characters', () => {
    // Mock Buffer as undefined to simulate browser environment
    const originalBuffer = global.Buffer;
    // @ts-expect-error - Temporarily setting Buffer to undefined for testing
    global.Buffer = undefined;

    try {
      const provider = new BasicAuthProvider('user', 'café☕');
      const headers = new Headers();

      const result = provider.applyAuth(headers);

      // Base64 encoding of 'user:café☕' with proper UTF-8 handling
      expect(result.get('Authorization')).toBe('Basic dXNlcjpjYWbDqeKYlQ==');
    } finally {
      // Restore original Buffer
      global.Buffer = originalBuffer;
    }
  });
});
