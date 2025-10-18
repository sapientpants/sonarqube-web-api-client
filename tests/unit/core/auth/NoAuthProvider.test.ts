// @ts-nocheck
import { NoAuthProvider } from '../../../../src/core/auth/NoAuthProvider';

describe('NoAuthProvider', () => {
  it('should not add any authentication headers', () => {
    const provider = new NoAuthProvider();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const result = provider.applyAuth(headers);

    expect(result.get('Content-Type')).toBe('application/json');
    expect(result.get('Authorization')).toBeNull();
    expect(result.get('X-Sonar-Passcode')).toBeNull();
  });

  it('should return none as auth type', () => {
    const provider = new NoAuthProvider();
    expect(provider.getAuthType()).toBe('none');
  });

  it('should preserve existing headers', () => {
    const provider = new NoAuthProvider();
    const headers = new Headers();
    headers.set('X-Custom-Header', 'custom-value');
    headers.set('Accept', 'application/json');

    const result = provider.applyAuth(headers);

    expect(result.get('X-Custom-Header')).toBe('custom-value');
    expect(result.get('Accept')).toBe('application/json');
  });
});
