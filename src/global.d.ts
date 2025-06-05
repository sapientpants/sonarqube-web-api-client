// Global type declarations for the project
// These types are available from Node.js fetch implementation

declare global {
  // HeadersInit is available in Node.js 18+ via undici
  // Simplified type that matches what new Headers() accepts
  type HeadersInit = Headers | string[][] | Record<string, string> | undefined;
}

export {};
