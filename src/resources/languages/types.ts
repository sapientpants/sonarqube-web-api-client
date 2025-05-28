/**
 * Represents a programming language supported by SonarQube
 */
export interface Language {
  /**
   * Language key (e.g., "java", "js", "py")
   */
  key: string;

  /**
   * Human-readable language name (e.g., "Java", "JavaScript", "Python")
   */
  name: string;
}

/**
 * Parameters for listing programming languages
 */
export interface ListLanguagesParams {
  /**
   * The size of the list to return, 0 for all languages
   * @default "0"
   */
  ps?: number;

  /**
   * A pattern to match language keys/names against
   */
  q?: string;
}

/**
 * Response from the languages list endpoint
 */
export interface ListLanguagesResponse {
  /**
   * List of programming languages
   */
  languages: Language[];
}
