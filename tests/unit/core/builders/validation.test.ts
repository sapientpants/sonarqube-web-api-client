// @ts-nocheck
import {
  isRequired,
  validateRequired,
  validateOAuth,
} from '../../../../src/core/builders/validation.js';

describe('validation utilities', () => {
  describe('isRequired', () => {
    it('should return true for non-empty strings', () => {
      expect(isRequired('test')).toBe(true);
      expect(isRequired('a')).toBe(true);
      expect(isRequired(' ')).toBe(true);
      expect(isRequired('123')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isRequired('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
      expect(isRequired(123)).toBe(false);
      expect(isRequired(true)).toBe(false);
      expect(isRequired({})).toBe(false);
      expect(isRequired([])).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should not throw for valid non-empty strings', () => {
      expect(() => {
        validateRequired('test', 'Field');
      }).not.toThrow();
      expect(() => {
        validateRequired('value', 'Name');
      }).not.toThrow();
      expect(() => {
        validateRequired(' ', 'Space');
      }).not.toThrow();
    });

    it('should throw for empty strings', () => {
      expect(() => {
        validateRequired('', 'Field');
      }).toThrow('Field is required');
    });

    it('should throw for non-string values', () => {
      expect(() => {
        validateRequired(null, 'Field');
      }).toThrow('Field is required');
      expect(() => {
        validateRequired(undefined, 'Field');
      }).toThrow('Field is required');
      expect(() => {
        validateRequired(123, 'Number');
      }).toThrow('Number is required');
      expect(() => {
        validateRequired(false, 'Boolean');
      }).toThrow('Boolean is required');
    });

    it('should include field name in error message', () => {
      expect(() => {
        validateRequired('', 'Username');
      }).toThrow('Username is required');
      expect(() => {
        validateRequired('', 'Password');
      }).toThrow('Password is required');
      expect(() => {
        validateRequired('', 'API Key');
      }).toThrow('API Key is required');
    });
  });

  describe('validateOAuth', () => {
    it('should not throw for valid OAuth credentials', () => {
      expect(() => {
        validateOAuth('client-id', 'client-secret');
      }).not.toThrow();
      expect(() => {
        validateOAuth('abc123', 'xyz789', 'GitHub');
      }).not.toThrow();
    });

    it('should throw when client ID is missing', () => {
      expect(() => {
        validateOAuth('', 'secret');
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth(null, 'secret');
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth(undefined, 'secret');
      }).toThrow('OAuth client ID and secret are required');
    });

    it('should throw when client secret is missing', () => {
      expect(() => {
        validateOAuth('client-id', '');
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth('client-id', null);
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth('client-id', undefined);
      }).toThrow('OAuth client ID and secret are required');
    });

    it('should throw when both are missing', () => {
      expect(() => {
        validateOAuth('', '');
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth(null, null);
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth(undefined, undefined);
      }).toThrow('OAuth client ID and secret are required');
    });

    it('should use custom provider name in error message', () => {
      expect(() => {
        validateOAuth('', '', 'GitHub');
      }).toThrow('GitHub client ID and secret are required');
      expect(() => {
        validateOAuth(null, null, 'Azure');
      }).toThrow('Azure client ID and secret are required');
      expect(() => {
        validateOAuth('id', '', 'GitLab');
      }).toThrow('GitLab client ID and secret are required');
    });

    it('should use default provider name when not specified', () => {
      expect(() => {
        validateOAuth('', '');
      }).toThrow('OAuth client ID and secret are required');
      expect(() => {
        validateOAuth('id', '');
      }).toThrow('OAuth client ID and secret are required');
    });
  });
});
