/**
 * Issues API types
 */

import type { PaginatedRequest, PaginatedResponse } from '../../core/builders';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';

/**
 * Issue status values
 */
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';

/**
 * Issue type categories
 */
export type IssueType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

/**
 * Issue resolution values
 */
export type IssueResolution = 'FALSE-POSITIVE' | 'WONTFIX' | 'FIXED' | 'REMOVED';

/**
 * Issue workflow transitions
 */
export type IssueTransition =
  | 'confirm'
  | 'unconfirm'
  | 'reopen'
  | 'resolve'
  | 'falsepositive'
  | 'wontfix'
  | 'close';

/**
 * Text range within a file
 */
export interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Issue location information
 */
export interface IssueLocation {
  component: string;
  textRange?: TextRange;
  msg?: string;
}

/**
 * Issue flow for vulnerability analysis
 */
export interface IssueFlow {
  locations: IssueLocation[];
}

/**
 * Issue comment
 */
export interface IssueComment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

/**
 * Core Issue entity
 */
export interface Issue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows?: IssueFlow[];
  status: IssueStatus;
  message: string;
  effort?: string;
  debt?: string;
  assignee?: string;
  author?: string;
  tags: string[];
  transitions?: IssueTransition[];
  actions?: string[];
  comments?: IssueComment[];
  creationDate: string;
  updateDate: string;
  closeDate?: string;
  type: IssueType;
  resolution?: IssueResolution;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  impacts?: Array<{
    softwareQuality: string;
    severity: string;
  }>;
}

/**
 * Impact severity levels (for new Clean Code taxonomy)
 */
export type ImpactSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Software quality impact categories (for new Clean Code taxonomy)
 */
export type ImpactSoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';

/**
 * Clean Code attribute categories
 */
export type CleanCodeAttributeCategory = 'ADAPTABLE' | 'CONSISTENT' | 'INTENTIONAL' | 'RESPONSIBLE';

/**
 * New issue status values (replacing deprecated statuses)
 */
export type IssueStatusNew = 'OPEN' | 'CONFIRMED' | 'RESOLVED' | 'REOPENED' | 'CLOSED';

/**
 * Facet mode for aggregations
 */
export type FacetMode = 'effort' | 'count';

/**
 * Issue scope values
 */
export type IssueScope = 'MAIN' | 'TEST' | 'OVERALL';

/**
 * OWASP Top 10 2017 categories
 */
export type OwaspTop10Category =
  | 'a1' // Injection
  | 'a2' // Broken Authentication
  | 'a3' // Sensitive Data Exposure
  | 'a4' // XML External Entities (XXE)
  | 'a5' // Broken Access Control
  | 'a6' // Security Misconfiguration
  | 'a7' // Cross-Site Scripting (XSS)
  | 'a8' // Insecure Deserialization
  | 'a9' // Using Components with Known Vulnerabilities
  | 'a10'; // Insufficient Logging & Monitoring

/**
 * OWASP Top 10 2021 categories
 */
export type OwaspTop10v2021Category =
  | 'a1' // Broken Access Control
  | 'a2' // Cryptographic Failures
  | 'a3' // Injection
  | 'a4' // Insecure Design
  | 'a5' // Security Misconfiguration
  | 'a6' // Vulnerable and Outdated Components
  | 'a7' // Identification and Authentication Failures
  | 'a8' // Software and Data Integrity Failures
  | 'a9' // Security Logging and Monitoring Failures
  | 'a10'; // Server-Side Request Forgery (SSRF)

/**
 * OWASP ASVS 4.0 categories
 */
export type OwaspAsvs40Category =
  | '1.1' // Architecture, design and threat modelling
  | '1.2' // Authentication architectural requirements
  | '2.1' // Password security requirements
  | '2.2' // General authenticator requirements
  | '2.3' // Authenticator lifecycle requirements
  | '2.4' // Credential storage requirements
  | '2.5' // Credential recovery requirements
  | '2.6' // Look-up secret verifier requirements
  | '2.7' // Out of band verifier requirements
  | '2.8' // Single or multi factor one time verifier requirements
  | '2.9' // Cryptographic verifier requirements
  | '2.10' // Service authentication requirements
  | '3.1' // Fundamental session management requirements
  | '3.2' // Session binding requirements
  | '3.3' // Session logout and timeout requirements
  | '3.4' // Cookie-based session management
  | '3.5' // Token-based session management
  | '3.6' // Re-authentication from a federation or assertion
  | '3.7' // Defenses against session management exploits
  | '4.1' // General access control design
  | '4.2' // Operation level access control
  | '4.3' // Other access control considerations
  | '5.1' // Input validation requirements
  | '5.2' // Sanitization and sandboxing requirements
  | '5.3' // Output encoding and injection prevention requirements
  | '5.4' // Memory, string, and unmanaged code requirements
  | '5.5' // Deserialization prevention requirements
  | '6.1' // Data classification
  | '6.2' // Algorithms
  | '6.3' // Random values
  | '6.4' // Key management
  | '7.1' // Log content requirements
  | '7.2' // Log processing requirements
  | '7.3' // Log protection requirements
  | '7.4' // Error handling
  | '8.1' // General data protection
  | '8.2' // Client-side data protection
  | '8.3' // Sensitive private data
  | '9.1' // Client communication security requirements
  | '9.2' // Server communication security requirements
  | '10.1' // Code integrity controls
  | '10.2' // Malicious code search
  | '10.3' // Deployed application integrity controls
  | '11.1' // Business logic security requirements
  | '11.2' // Business logic data validation
  | '12.1' // Uploaded file requirements
  | '12.2' // File integrity requirements
  | '12.3' // File execution requirements
  | '12.4' // File storage requirements
  | '12.5' // File download requirements
  | '12.6' // SSRF protection requirements
  | '13.1' // Generic web service security verification requirements
  | '13.2' // RESTful web service verification requirements
  | '13.3' // SOAP web service verification requirements
  | '13.4' // GraphQL and other web service data layer security requirements
  | '14.1' // Build
  | '14.2' // Dependency
  | '14.3' // Unintended security disclosure requirements
  | '14.4' // HTTP security headers requirements
  | '14.5'; // Validate HTTP request header requirements;

/**
 * OWASP Mobile Top 10 2024 categories
 */
export type OwaspMobileTop102024Category =
  | 'm1' // Improper Credential Usage
  | 'm2' // Inadequate Supply Chain Security
  | 'm3' // Insecure Authentication/Authorization
  | 'm4' // Insufficient Input/Output Validation
  | 'm5' // Insecure Communication
  | 'm6' // Inadequate Privacy Controls
  | 'm7' // Insufficient Binary Protections
  | 'm8' // Security Misconfiguration
  | 'm9' // Insecure Data Storage
  | 'm10'; // Insufficient Cryptography

/**
 * PCI DSS 3.2 categories
 */
export type PciDss32Category =
  | '1.1' // Firewall configuration standards
  | '1.2' // Firewall configurations that restrict connections
  | '1.3' // Firewall configurations that prohibit direct connections
  | '1.4' // Personal firewall software or equivalent functionality
  | '2.1' // Vendor-supplied defaults for system passwords
  | '2.2' // System configuration standards
  | '2.3' // Encrypt all non-console administrative access
  | '2.4' // Shared hosting providers must protect each entity's data
  | '3.1' // Data retention and disposal policies
  | '3.2' // Do not store sensitive authentication data
  | '3.3' // Mask PAN when displayed
  | '3.4' // Render PAN unreadable anywhere it is stored
  | '3.5' // Document and implement procedures to protect keys
  | '3.6' // Fully document and implement key management processes
  | '3.7' // Ensure that security policies and operational procedures
  | '4.1' // Use strong cryptography and security protocols
  | '4.2' // Never send unprotected PANs by end-user messaging
  | '4.3' // Ensure that security policies and operational procedures
  | '5.1' // Deploy anti-virus software on all systems
  | '5.2' // Ensure that all anti-virus mechanisms are current
  | '5.3' // Ensure that anti-virus mechanisms are actively running
  | '5.4' // Ensure that security policies and operational procedures
  | '6.1' // Establish a process to identify security vulnerabilities
  | '6.2' // Ensure that all system components and software are protected
  | '6.3' // Develop internal and external software applications
  | '6.4' // Follow change control processes and procedures
  | '6.5' // Address common vulnerabilities in software development
  | '6.6' // For public-facing web applications
  | '6.7' // Ensure that security policies and operational procedures
  | '7.1' // Limit access to system components and cardholder data
  | '7.2' // Establish an access control system for systems components
  | '7.3' // Ensure that security policies and operational procedures
  | '8.1' // Define and implement policies and procedures
  | '8.2' // In addition to assigning a unique ID
  | '8.3' // Secure all individual non-console administrative access
  | '8.4' // Document and communicate authentication policies
  | '8.5' // Do not use group, shared, or generic IDs
  | '8.6' // Where other authentication mechanisms are used
  | '8.7' // All access to any database containing cardholder data
  | '8.8' // Ensure that security policies and operational procedures
  | '9.1' // Use appropriate facility entry controls
  | '9.2' // Develop procedures to easily distinguish between
  | '9.3' // Control physical access for onsite personnel
  | '9.4' // Implement procedures to identify and authorize visitors
  | '9.5' // Physically secure all media
  | '9.6' // Maintain strict control over the internal or external
  | '9.7' // Maintain strict control over the storage and accessibility
  | '9.8' // Destroy media when it is no longer needed
  | '9.9' // Protect devices that capture payment card data
  | '9.10' // Ensure that security policies and operational procedures
  | '10.1' // Implement audit trails to link all access
  | '10.2' // Implement automated audit trails for all system components
  | '10.3' // Record at least the following audit trail entries
  | '10.4' // Using time-synchronization technology
  | '10.5' // Secure audit trails so they cannot be altered
  | '10.6' // Review logs and security events for all system components
  | '10.7' // Retain audit trail history for at least one year
  | '10.8' // Ensure that security policies and operational procedures
  | '10.9' // Ensure that security policies and operational procedures
  | '11.1' // Implement processes to test for the presence of wireless
  | '11.2' // Run internal and external network vulnerability scans
  | '11.3' // Implement a methodology for penetration testing
  | '11.4' // Use intrusion-detection and/or intrusion-prevention
  | '11.5' // Deploy a change-detection mechanism
  | '11.6' // Ensure that security policies and operational procedures
  | '12.1' // Establish, publish, maintain, and disseminate a security policy
  | '12.2' // Implement a risk-assessment process
  | '12.3' // Develop usage policies for critical technologies
  | '12.4' // Ensure that the security policy and procedures clearly define
  | '12.5' // Assign to an individual or team the following information
  | '12.6' // Implement a formal security awareness program
  | '12.7' // Screen potential personnel prior to hire
  | '12.8' // Maintain and implement policies and procedures
  | '12.9' // Ensure that security policies and procedures clearly define
  | '12.10' // Implement an incident response plan
  | '12.11'; // Additional requirement for service providers only

/**
 * PCI DSS 4.0 categories
 */
export type PciDss40Category =
  | '1.1' // Processes and mechanisms for implementing firewall and router configuration management
  | '1.2' // Network security controls
  | '1.3' // Network access to and from the cardholder data environment
  | '1.4' // Network connections between trusted and untrusted networks
  | '1.5' // Protection of the cardholder data environment from compromise
  | '2.1' // Processes and mechanisms for keeping system components secure from known vulnerabilities
  | '2.2' // System components are configured securely
  | '2.3' // Wireless networks carrying cardholder data or connected to the cardholder data environment
  | '3.1' // Processes and mechanisms for protecting stored account data
  | '3.2' // Storage of account data is kept to a minimum
  | '3.3' // Sensitive authentication data is not stored after authorization
  | '3.4' // Access to displays of full PAN and ability to copy cardholder data
  | '3.5' // Primary account number (PAN) is protected wherever it is stored
  | '3.6' // Cryptographic keys used to protect stored account data
  | '3.7' // Where cryptography is used to protect stored account data
  | '4.1' // Processes and mechanisms for protecting cardholder data with strong cryptography during transmission
  | '4.2' // PAN is protected with strong cryptography whenever it is sent over open, public networks
  | '5.1' // Processes and mechanisms for protecting all systems and networks from malicious software
  | '5.2' // Malicious software (malware) is prevented, or detected and addressed
  | '5.3' // Anti-malware mechanisms and processes are active, maintained, and monitored
  | '5.4' // Anti-malware mechanisms cannot be disabled or altered by users
  | '6.1' // Processes and mechanisms for developing and maintaining secure systems and software
  | '6.2' // Bespoke and custom software are developed securely
  | '6.3' // Security vulnerabilities are identified and addressed
  | '6.4' // Public-facing web applications are protected against attacks
  | '6.5' // Changes to all system components are managed securely
  | '7.1' // Processes and mechanisms for restricting access to system components and cardholder data by business need to know
  | '7.2' // Access to system components and data is appropriately defined and assigned
  | '7.3' // Access to system components and cardholder data is managed via an access control system(s)
  | '8.1' // Processes and mechanisms for identifying users and authenticating access to system components
  | '8.2' // User identification and related accounts for users and administrators are strictly managed
  | '8.3' // Strong authentication for users and administrators is established and managed
  | '8.4' // Multi-factor authentication (MFA) is implemented to secure access into the cardholder data environment
  | '8.5' // Multi-factor authentication (MFA) systems are configured to prevent misuse
  | '8.6' // Use of application and system accounts and associated authentication factors are strictly managed
  | '9.1' // Processes and mechanisms for restricting physical access to the cardholder data environment
  | '9.2' // Physical access controls manage entry into facilities and systems containing cardholder data
  | '9.3' // Physical access for personnel and visitors is authorized and managed
  | '9.4' // Media with cardholder data is securely handled
  | '9.5' // Point-of-interaction (POI) devices are protected from tampering and unauthorized substitution
  | '10.1' // Processes and mechanisms for logging and monitoring all access to system components and cardholder data
  | '10.2' // Audit logs are implemented to support anomaly detection
  | '10.3' // Audit logs capture all access to system components and cardholder data
  | '10.4' // Log files are protected from destruction and unauthorized modifications
  | '10.5' // Audit logs are reviewed to identify anomalies or suspicious activity
  | '10.6' // Deploy automated mechanisms to perform audit log reviews
  | '10.7' // Failures of critical security control systems are detected, alerted, and addressed promptly
  | '11.1' // Processes and mechanisms for regularly testing security of systems and networks
  | '11.2' // Wireless access points are identified and monitored, and unauthorized wireless access points are addressed
  | '11.3' // External and internal vulnerabilities are regularly identified, prioritized, and addressed
  | '11.4' // External and internal penetration testing is regularly performed
  | '11.5' // Network intrusions and unexpected file changes are detected and responded to
  | '11.6' // Unauthorized changes on payment pages are detected and responded to
  | '12.1' // A comprehensive information security policy that governs and provides direction for protection of the entity's information assets
  | '12.2' // Acceptable use policies for end-user technologies are defined and implemented
  | '12.3' // Risks to the cardholder data environment are formally identified, evaluated, and managed
  | '12.4' // PCI DSS compliance is managed as an ongoing program
  | '12.5' // PCI DSS scope is documented and validated
  | '12.6' // Security awareness education is provided to all personnel
  | '12.7' // Personnel are screened to reduce risks from insider threats
  | '12.8' // Risk to information assets associated with third-party service provider (TPSP) relationships is managed
  | '12.9' // Third-party service providers (TPSPs) support their customers' PCI DSS compliance
  | '12.10'; // Suspected and confirmed security incidents that could impact the cardholder data environment are responded to immediately;

/**
 * SANS Top 25 categories (deprecated since SonarQube 10.0)
 */
export type SansTop25Category = 'insecure-interaction' | 'risky-resource' | 'porous-defenses';

/**
 * STIG Application Security and Development V5R3 categories
 */
export type StigASDV5R3Category =
  | 'V-222400' // The application must limit the number of concurrent sessions
  | 'V-222401' // The application must automatically terminate a user session
  | 'V-222402' // The application must provide a capability to limit the number of failed login attempts
  | 'V-222403' // The application must display an approved system use notification message
  | 'V-222404' // The application must display the date and time of the last successful account logon
  | 'V-222405' // The application must enforce approved authorizations for logical access
  | 'V-222406' // The application must enforce the limit of three consecutive invalid logon attempts
  | 'V-222407' // The application must display the Standard Mandatory DoD Notice and Consent Banner
  | 'V-222408' // The application must retain the Standard Mandatory DoD Notice and Consent Banner
  | 'V-222409' // The application must implement NSA-approved cryptography
  | 'V-222410' // The application must protect the confidentiality and integrity of transmitted information
  | 'V-222411' // The application must implement cryptographic mechanisms to prevent unauthorized disclosure
  | 'V-222412' // The application must separate user functionality from application management functionality
  | 'V-222413' // The application must validate all input
  | 'V-222414' // The application must protect from Cross-Site Scripting (XSS) vulnerabilities
  | 'V-222415' // The application must protect from SQL injection vulnerabilities
  | 'V-222416' // The application must not be vulnerable to XML-based attacks
  | 'V-222417' // The application must not store passwords in recoverable form
  | 'V-222418' // The application must transmit only cryptographically-protected passwords
  | 'V-222419'; // The application must not display passwords/PINs as clear text;

/**
 * CASA (Cloud Application Security Assessment) categories
 */
export type CasaCategory =
  | 'authentication'
  | 'authorization'
  | 'data-protection'
  | 'secure-communication'
  | 'input-validation'
  | 'error-handling'
  | 'logging-monitoring'
  | 'configuration-management'
  | 'dependency-management'
  | 'cryptography';

/**
 * Available facet values for search aggregations
 */
export type IssueFacet =
  | 'severities'
  | 'statuses'
  | 'resolutions'
  | 'rules'
  | 'tags'
  | 'types'
  | 'author' // Note: Documentation shows 'author', not 'authors'
  | 'authors' // Keeping for backward compatibility
  | 'assignees'
  | 'assigned_to_me' // New facet for issues assigned to current user
  | 'languages'
  | 'projects'
  | 'directories'
  | 'files'
  | 'cwe'
  | 'createdAt' // New facet for creation date aggregation
  | 'owaspTop10'
  | 'owaspTop10-2021'
  | 'owaspAsvs-4.0'
  | 'owaspMobileTop10-2024'
  | 'pciDss-3.2'
  | 'pciDss-4.0'
  | 'sansTop25'
  | 'sonarsourceSecurity'
  | 'stig-ASD_V5R3'
  | 'casa'
  | 'codeVariants' // New facet for code variants
  | 'cleanCodeAttributeCategories'
  | 'impactSeverities'
  | 'impactSoftwareQualities'
  | 'issueStatuses'
  | 'prioritizedRule' // New facet for prioritized rules
  | 'scopes';

/**
 * Request to search for issues
 */
export interface SearchIssuesRequest extends PaginatedRequest {
  additionalFields?: string[];
  asc?: boolean;
  assigned?: boolean;
  assignees?: string[];
  author?: string;
  authors?: string[];
  branch?: string;
  casa?: CasaCategory[]; // since 10.7
  cleanCodeAttributeCategories?: CleanCodeAttributeCategory[];
  codeVariants?: string[]; // since 10.1
  componentKeys?: string[];
  components?: string[];
  createdAfter?: string;
  createdAt?: string;
  createdBefore?: string;
  createdInLast?: string;
  cwe?: string[];
  directories?: string[];
  facetMode?: FacetMode;
  facets?: IssueFacet[];
  files?: string[];
  fixedInPullRequest?: string; // since 10.4
  impactSeverities?: ImpactSeverity[];
  impactSoftwareQualities?: ImpactSoftwareQuality[];
  inNewCodePeriod?: boolean;
  issueStatuses?: IssueStatusNew[];
  issues?: string[];
  languages?: string[];
  onComponentOnly?: boolean;
  organization?: string;
  owaspAsvs40?: OwaspAsvs40Category[]; // Maps to 'owaspAsvs-4.0' in API, since 9.7
  owaspAsvsLevel?: 1 | 2 | 3; // since 9.7
  owaspMobileTop102024?: OwaspMobileTop102024Category[]; // Maps to 'owaspMobileTop10-2024' in API, since 2025.3
  owaspTop10?: OwaspTop10Category[];
  owaspTop10v2021?: OwaspTop10v2021Category[]; // Maps to 'owaspTop10-2021' in API
  pciDss32?: PciDss32Category[]; // Maps to 'pciDss-3.2' in API, since 9.6
  pciDss40?: PciDss40Category[]; // Maps to 'pciDss-4.0' in API, since 9.6
  prioritizedRule?: boolean;
  projects?: string[];
  pullRequest?: string;
  resolutions?: IssueResolution[]; // deprecated
  resolved?: boolean;
  rules?: string[];
  s?: string; // sort field
  sansTop25?: SansTop25Category[];
  scopes?: IssueScope[];
  severities?: IssueSeverity[]; // deprecated
  sinceLeakPeriod?: boolean;
  sonarsourceSecurity?: string[];
  sonarsourceSecurityCategory?: string[];
  statuses?: IssueStatus[]; // deprecated
  stigASDV5R3?: StigASDV5R3Category[]; // Maps to 'stig-ASD_V5R3' in API, since 10.7
  tags?: string[];
  timeZone?: string; // since 8.6
  types?: IssueType[]; // deprecated
}

/**
 * Response from searching issues
 */
export interface SearchIssuesResponse extends PaginatedResponse {
  issues: Issue[];
  components?: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules?: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
  users?: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  languages?: Array<{
    key: string;
    name: string;
  }>;
  facets?: Array<{
    property: string;
    values: Array<{
      val: string;
      count: number;
    }>;
  }>;
}

/**
 * Request to add a comment to an issue
 */
export interface AddCommentRequest {
  issue: string;
  text: string;
  isFeedback?: boolean;
}

/**
 * Response from adding a comment
 */
export interface AddCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to assign an issue
 */
export interface AssignIssueRequest {
  issue: string;
  assignee?: string;
}

/**
 * Response from assigning an issue
 */
export interface AssignIssueResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to perform a workflow transition on an issue
 */
export interface DoTransitionRequest {
  issue: string;
  transition: IssueTransition;
}

/**
 * Response from performing a transition
 */
export interface DoTransitionResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to set tags on an issue
 */
export interface SetTagsRequest {
  issue: string;
  tags: string[];
}

/**
 * Response from setting tags
 */
export interface SetTagsResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to search for SCM authors
 */
export interface SearchAuthorsRequest {
  q?: string;
  ps?: number;
  project?: string;
}

/**
 * Response from searching authors
 */
export interface SearchAuthorsResponse {
  authors: string[];
}

/**
 * Request to perform bulk changes on issues
 */
export interface BulkChangeRequest {
  issues: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  add_tags?: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  remove_tags?: string[];
  assign?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set_severity?: IssueSeverity;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set_type?: IssueType;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  do_transition?: IssueTransition;
  comment?: string;
  sendNotifications?: boolean;
}

/**
 * Response from bulk change operation
 */
export interface BulkChangeResponse {
  total: number;
  success: number;
  ignored: number;
  failures: number;
  issues: Issue[];
}

/**
 * Request to get issue changelog
 */
export interface GetChangelogRequest {
  issue: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  user: string;
  userName: string;
  creationDate: string;
  diffs: Array<{
    key: string;
    newValue?: string;
    oldValue?: string;
  }>;
}

/**
 * Response from getting changelog
 */
export interface GetChangelogResponse {
  changelog: ChangelogEntry[];
}

/**
 * Request to delete a comment
 */
export interface DeleteCommentRequest {
  comment: string;
}

/**
 * Response from deleting a comment
 */
export interface DeleteCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to edit a comment
 */
export interface EditCommentRequest {
  comment: string;
  text: string;
}

/**
 * Response from editing a comment
 */
export interface EditCommentResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to export vulnerabilities in GitLab SAST format
 */
export interface GitLabSastExportRequest {
  project: string;
  branch?: string;
  pullRequest?: string;
}

/**
 * Response from GitLab SAST export (JSON format)
 */
export interface GitLabSastExportResponse {
  version: string;
  vulnerabilities: Array<{
    id: string;
    category: string;
    name: string;
    message: string;
    description: string;
    cve: string;
    severity: string;
    confidence: string;
    solution?: string;
    scanner: {
      id: string;
      name: string;
    };
    location: {
      file: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      start_line: number;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      end_line: number;
    };
    identifiers: Array<{
      type: string;
      name: string;
      value: string;
      url?: string;
    }>;
  }>;
}

/**
 * Request to reindex issues
 */
export interface ReindexRequest {
  project: string;
}

/**
 * Response from reindex operation
 */
export interface ReindexResponse {
  message: string;
}

/**
 * Request to set severity
 */
export interface SetSeverityRequest {
  issue: string;
  severity: IssueSeverity;
}

/**
 * Response from setting severity
 */
export interface SetSeverityResponse {
  issue: Issue;
  users: Array<{
    login: string;
    name: string;
    active: boolean;
    avatar?: string;
  }>;
  components: Array<{
    key: string;
    uuid: string;
    enabled: boolean;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    status: string;
    lang?: string;
    langName?: string;
  }>;
}

/**
 * Request to search for tags
 */
export interface SearchTagsRequest {
  q?: string;
  ps?: number;
  organization?: string;
}

/**
 * Response from searching tags
 */
export interface SearchTagsResponse {
  tags: string[];
}
