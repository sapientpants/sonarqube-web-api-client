/**
 * Quality Profile related types
 * @module quality-profiles/types
 */

/**
 * Common quality profile structure
 */
export interface QualityProfile {
  key: string;
  name: string;
  language: string;
  languageName: string;
  isInherited: boolean;
  isBuiltIn: boolean;
  activeRuleCount: number;
  activeDeprecatedRuleCount: number;
  isDefault: boolean;
  parentKey?: string;
  parentName?: string;
  organization?: string;
  rulesUpdatedAt?: string;
  lastUsed?: string;
  userUpdatedAt?: string;
}

/**
 * Rule activation severity levels
 */
export type Severity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';

/**
 * Rule statuses
 */
export type RuleStatus = 'BETA' | 'DEPRECATED' | 'READY' | 'REMOVED';

/**
 * Rule types
 */
export type RuleType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Activate rule request
 */
export interface ActivateRuleRequest {
  key: string;
  rule: string;
  severity?: Severity;
  params?: string;
  reset?: boolean;
}

/**
 * Bulk activate rules request
 */
export interface ActivateRulesRequest {
  targetKey: string;
  activation?: boolean;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  active_severities?: string;
  asc?: boolean;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  available_since?: string;
  cwe?: string;
  inheritance?: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  is_template?: boolean;
  languages?: string;
  owaspTop10?: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  owaspTop10_2021?: string;
  p?: number;
  ps?: number;
  q?: string;
  qprofile?: string;
  repositories?: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  rule_key?: string;
  s?: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  sans_top25?: string;
  severities?: string;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  sonarsource_security?: string;
  statuses?: string;
  tags?: string;
  targetSeverity?: Severity;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  template_key?: string;
  types?: string;
}

/**
 * Bulk activate rules response
 */
export interface ActivateRulesResponse {
  succeeded: number;
  failed: number;
  errors?: Array<{
    msg: string;
    rule: string;
  }>;
}

/**
 * Add project request
 */
export interface AddProjectRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
  project?: string;
  projectUuid?: string;
}

/**
 * Backup request
 */
export interface BackupRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
}

/**
 * Change parent request
 */
export interface ChangeParentRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
  parentKey?: string;
  parentQualityProfile?: string;
}

/**
 * Changelog request
 */
export interface ChangelogRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
  p?: number;
  ps?: number;
  since?: string;
  to?: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  date: string;
  authorLogin?: string;
  authorName?: string;
  action: string;
  ruleKey: string;
  ruleName: string;
  params?: Record<string, string>;
  severity?: Severity;
}

/**
 * Changelog response
 */
export interface ChangelogResponse {
  events: ChangelogEntry[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Compare request
 */
export interface CompareRequest {
  leftKey?: string;
  leftQualityProfile?: string;
  rightKey?: string;
  rightQualityProfile?: string;
}

/**
 * Rule comparison
 */
export interface RuleComparison {
  key: string;
  name: string;
  pluginKey?: string;
  pluginName?: string;
  languageKey?: string;
  languageName?: string;
  left?: {
    severity: Severity;
    params?: Record<string, string>;
  };
  right?: {
    severity: Severity;
    params?: Record<string, string>;
  };
}

/**
 * Compare response
 */
export interface CompareResponse {
  left: {
    key: string;
    name: string;
  };
  right: {
    key: string;
    name: string;
  };
  inLeft: RuleComparison[];
  inRight: RuleComparison[];
  modified: RuleComparison[];
  same: RuleComparison[];
}

/**
 * Copy request
 */
export interface CopyRequest {
  fromKey?: string;
  from?: string;
  language?: string;
  toName: string;
}

/**
 * Copy response
 */
export interface CopyResponse {
  key: string;
  name: string;
  language: string;
  languageName: string;
  isInherited: boolean;
  parentKey?: string;
}

/**
 * Create request
 */
export interface CreateRequest {
  name: string;
  language: string;
}

/**
 * Create response
 */
export interface CreateResponse {
  profile: QualityProfile;
  warnings?: string[];
}

/**
 * Deactivate rule request
 */
export interface DeactivateRuleRequest {
  key: string;
  rule: string;
}

/**
 * Deactivate rules request
 */
export type DeactivateRulesRequest = ActivateRulesRequest;

/**
 * Deactivate rules response
 */
export type DeactivateRulesResponse = ActivateRulesResponse;

/**
 * Delete request
 */
export interface DeleteRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
}

/**
 * Export request
 */
export interface ExportRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
  exporterKey?: string;
}

/**
 * Exporter information
 */
export interface Exporter {
  key: string;
  name: string;
  languages: string[];
}

/**
 * Exporters response (deprecated)
 */
export interface ExportersResponse {
  exporters: Exporter[];
}

/**
 * Importer information
 */
export interface Importer {
  key: string;
  name: string;
  languages: string[];
}

/**
 * Importers response (deprecated)
 */
export interface ImportersResponse {
  importers: Importer[];
}

/**
 * Inheritance request
 */
export interface InheritanceRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
}

/**
 * Profile inheritance information
 */
export interface ProfileInheritance {
  key: string;
  name: string;
  activeRuleCount: number;
  overridingRuleCount?: number;
  isBuiltIn: boolean;
}

/**
 * Inheritance response
 */
export interface InheritanceResponse {
  profile: QualityProfile;
  ancestors: ProfileInheritance[];
  children: ProfileInheritance[];
}

/**
 * Projects request
 */
export interface ProjectsRequest {
  key: string;
  p?: number;
  ps?: number;
  q?: string;
  selected?: 'all' | 'selected' | 'deselected';
}

/**
 * Project association
 */
export interface ProjectAssociation {
  id: string;
  key: string;
  name: string;
  selected: boolean;
}

/**
 * Projects response
 */
export interface ProjectsResponse {
  results: ProjectAssociation[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Remove project request
 */
export interface RemoveProjectRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
  project?: string;
  projectUuid?: string;
}

/**
 * Rename request
 */
export interface RenameRequest {
  key: string;
  name: string;
}

/**
 * Restore request
 */
export interface RestoreRequest {
  backup: string;
  organization: string;
}

/**
 * Restore response
 */
export interface RestoreResponse {
  profile: QualityProfile;
  ruleSuccesses: number;
  ruleFailures: number;
}

/**
 * Search request
 */
export interface SearchRequest {
  defaults?: boolean;
  language?: string;
  project?: string;
  qualityProfile?: string;
  organization?: string;
}

/**
 * Search response
 */
export interface SearchResponse {
  profiles: QualityProfile[];
  actions?: {
    create?: boolean;
  };
}

/**
 * Set default request
 */
export interface SetDefaultRequest {
  key?: string;
  qualityProfile?: string;
  language?: string;
}

/**
 * Common paginated request parameters
 */
export interface PaginatedRequest {
  p?: number;
  ps?: number;
}

/**
 * Common paginated response structure
 */
export interface PaginatedResponse {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}
