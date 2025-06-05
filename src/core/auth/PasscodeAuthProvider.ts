import type { AuthProvider } from './AuthProvider';

/**
 * SonarQube passcode authentication provider
 */
export class PasscodeAuthProvider implements AuthProvider {
  constructor(private readonly passcode: string) {
    if (!passcode) {
      throw new Error('Passcode is required for Passcode authentication');
    }
  }

  applyAuth(headers: Headers): Headers {
    headers.set('X-Sonar-Passcode', this.passcode);
    return headers;
  }

  getAuthType(): 'passcode' {
    return 'passcode';
  }
}
