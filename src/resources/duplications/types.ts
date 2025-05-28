/**
 * Request parameters for showing duplications
 */
export interface ShowDuplicationsRequest {
  /**
   * File key
   * @example "my_project:/src/foo/Bar.php"
   */
  key: string;

  /**
   * Branch key
   * @example "feature/my_branch"
   */
  branch?: string;

  /**
   * Pull request id
   * @example "5461"
   */
  pullRequest?: string;
}

/**
 * Represents a block of duplicated code
 */
export interface DuplicationBlock {
  /**
   * Starting line number (1-based)
   */
  from: number;

  /**
   * Ending line number (1-based)
   */
  to: number;

  /**
   * Number of lines in the duplication block
   */
  size: number;

  /**
   * Reference identifier for the block
   */
  _ref: string;
}

/**
 * Represents a file that contains duplicated code
 */
export interface DuplicatedFile {
  /**
   * File key
   */
  key: string;

  /**
   * File name
   */
  name: string;

  /**
   * Project key
   */
  project: string;

  /**
   * Human-readable project name
   */
  projectName: string;

  /**
   * File UUID
   * @deprecated Since 6.5
   */
  uuid?: string;

  /**
   * Project UUID
   * @deprecated Since 6.5
   */
  projectUuid?: string;

  /**
   * Sub-project UUID
   * @deprecated Since 6.5
   */
  subProjectUuid?: string;
}

/**
 * Represents a set of duplication blocks across files
 */
export interface Duplication {
  /**
   * Array of duplication blocks
   */
  blocks: DuplicationBlock[];
}

/**
 * Response from the show duplications endpoint
 */
export interface ShowDuplicationsResponse {
  /**
   * Array of duplications found
   */
  duplications: Duplication[];

  /**
   * Array of files involved in the duplications
   */
  files: DuplicatedFile[];
}
