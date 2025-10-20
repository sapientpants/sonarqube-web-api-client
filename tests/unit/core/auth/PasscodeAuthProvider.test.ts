// @ts-nocheck
import { PasscodeAuthProvider } from '../../../../src/core/auth/PasscodeAuthProvider.js';

describe('PasscodeAuthProvider', () => {
  it('should throw error if passcode is empty', () => {
    expect(() => new PasscodeAuthProvider('')).toThrow(
      'Passcode is required for Passcode authentication',
    );
  });

  it('should apply passcode to headers', () => {
    const provider = new PasscodeAuthProvider('test-passcode');
    const headers = new Headers();

    const result = provider.applyAuth(headers);

    expect(result.get('X-Sonar-Passcode')).toBe('test-passcode');
  });

  it('should return passcode as auth type', () => {
    const provider = new PasscodeAuthProvider('test-passcode');
    expect(provider.getAuthType()).toBe('passcode');
  });

  it('should overwrite existing X-Sonar-Passcode header', () => {
    const provider = new PasscodeAuthProvider('new-passcode');
    const headers = new Headers();
    headers.set('X-Sonar-Passcode', 'old-passcode');

    const result = provider.applyAuth(headers);

    expect(result.get('X-Sonar-Passcode')).toBe('new-passcode');
  });

  it('should not affect Authorization header', () => {
    const provider = new PasscodeAuthProvider('test-passcode');
    const headers = new Headers();
    headers.set('Authorization', 'Bearer some-token');

    const result = provider.applyAuth(headers);

    expect(result.get('X-Sonar-Passcode')).toBe('test-passcode');
    expect(result.get('Authorization')).toBe('Bearer some-token');
  });
});
