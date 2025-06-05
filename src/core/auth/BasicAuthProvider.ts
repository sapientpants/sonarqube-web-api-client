import type { AuthProvider } from './AuthProvider';

/**
 * HTTP Basic authentication provider
 */
export class BasicAuthProvider implements AuthProvider {
  private readonly encodedCredentials: string;

  constructor(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Username and password are required for Basic authentication');
    }

    const credentials = `${username}:${password}`;
    if (typeof Buffer !== 'undefined') {
      this.encodedCredentials = Buffer.from(credentials).toString('base64');
    } else {
      const utf8Bytes = new TextEncoder().encode(credentials);
      const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
      this.encodedCredentials = btoa(binaryString);
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
