/**
 * Request parameters for getting raw source code
 */
export interface GetRawSourceRequest {
  /**
   * File key
   */
  key: string;

  /**
   * Branch key
   */
  branch?: string;

  /**
   * Pull request id
   */
  pullRequest?: string;
}

/**
 * Request parameters for getting SCM information
 */
export interface GetScmInfoRequest {
  /**
   * File key
   */
  key: string;

  /**
   * Group lines by SCM commit if value is false, else display commits for each line,
   * even if two consecutive lines relate to the same commit.
   * @default false
   */
  commitsByLine?: boolean;

  /**
   * First line to return. Starts at 1
   * @default 1
   */
  from?: number;

  /**
   * Last line to return (inclusive)
   */
  to?: number;
}

/**
 * SCM information for a line
 */
export interface ScmInfo {
  /**
   * Line number
   */
  line: number;

  /**
   * Author of the commit
   */
  author: string;

  /**
   * Datetime of the commit
   */
  date: string;

  /**
   * Revision of the commit
   */
  revision: string;
}

/**
 * Response for SCM information
 */
export interface GetScmInfoResponse {
  scm: ScmInfo[];
}

/**
 * Request parameters for showing source code
 */
export interface ShowSourceRequest {
  /**
   * File key
   */
  key: string;

  /**
   * First line to return. Starts at 1
   * @default 1
   */
  from?: number;

  /**
   * Last line to return (inclusive)
   */
  to?: number;
}

/**
 * Source line information
 */
export interface SourceLine {
  /**
   * Line number
   */
  line: number;

  /**
   * Content of the line
   */
  code: string;
}

/**
 * Response for showing source code
 */
export interface ShowSourceResponse {
  sources: SourceLine[];
}
