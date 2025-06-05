import { BearerTokenAuthProvider } from '../BearerTokenAuthProvider';

describe('BearerTokenAuthProvider', () => {
  it('should throw error if token is empty', () => {
    expect(() => new BearerTokenAuthProvider('')).toThrow(
      'Token is required for Bearer authentication'
    );
  });

  it('should apply Bearer token to headers', () => {
    const provider = new BearerTokenAuthProvider('test-token');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    expect(result.get('Authorization')).toBe('Bearer test-token');
  });

  it('should return bearer as auth type', () => {
    const provider = new BearerTokenAuthProvider('test-token');
    expect(provider.getAuthType()).toBe('bearer');
  });

  it('should overwrite existing Authorization header', () => {
    const provider = new BearerTokenAuthProvider('new-token');
    const headers = new Headers();
    headers.set('Authorization', 'Bearer old-token');

    const result = provider.applyAuth(headers);

    expect(result.get('Authorization')).toBe('Bearer new-token');
  });
});
