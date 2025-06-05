import { BasicAuthProvider } from '../BasicAuthProvider';

describe('BasicAuthProvider', () => {
  it('should throw error if username is empty', () => {
    expect(() => new BasicAuthProvider('', 'password')).toThrow(
      'Username and password are required for Basic authentication'
    );
  });

  it('should throw error if password is empty', () => {
    expect(() => new BasicAuthProvider('username', '')).toThrow(
      'Username and password are required for Basic authentication'
    );
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
});
