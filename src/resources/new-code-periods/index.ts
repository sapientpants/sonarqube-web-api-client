/**
 * New Code Periods API module
 *
 * This module provides functionality for managing new code period definitions
 * in SonarQube at global, project, and branch levels.
 *
 * @since SonarQube 8.0
 * @module new-code-periods
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // List new code periods for a project
 * const periods = await client.newCodePeriods.list({
 *   project: 'my-project'
 * });
 *
 * // Set new code period to 30 days
 * await client.newCodePeriods.set({
 *   project: 'my-project',
 *   type: NewCodePeriodType.NUMBER_OF_DAYS,
 *   value: '30'
 * });
 * ```
 */

// Export the client
export { NewCodePeriodsClient } from './NewCodePeriodsClient';

// Export all types
export type {
  NewCodePeriod,
  BranchNewCodePeriod,
  ListNewCodePeriodsRequest,
  ListNewCodePeriodsResponse,
  SetNewCodePeriodRequest,
  SetNewCodePeriodResponse,
  UnsetNewCodePeriodRequest,
} from './types';

// Export enums
export { NewCodePeriodType } from './types';
