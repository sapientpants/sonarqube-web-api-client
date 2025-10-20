import type { AuthProvider } from './AuthProvider.js';

/**
 * HTTP Basic authentication provider
 */
export class BasicAuthProvider implements AuthProvider {
  private readonly encodedCredentials: string;

  constructor(username: string, password = '') {
    if (!username) {
      throw new TypeError('Username is required for Basic authentication');
    }

    const credentials = `${username}:${password}`;
    if (typeof Buffer === 'undefined') {
      const utf8Bytes = new TextEncoder().encode(credentials);
      const binaryString = Array.from(utf8Bytes, (byte) => String.fromCodePoint(byte)).join('');
      this.encodedCredentials = btoa(binaryString);
    } else {
      this.encodedCredentials = Buffer.from(credentials).toString('base64');
    }
  }

  applyAuth(headers: Headers): Headers {
    headers.set('Authorization', `Basic ${this.encodedCredentials}`);
    return headers;
  }

  getAuthType(): 'basic' {
    return 'basic';
  }
}
