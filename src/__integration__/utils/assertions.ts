/**
 * Custom assertions for integration tests
 *
 * Provides domain-specific assertions for validating SonarQube API responses
 * and behaviors in integration tests.
 */

/**
 * Common response types for assertions
 */
interface PaginatedResponse {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

interface ProjectResponse {
  key: string;
  name: string;
  qualifier: string;
}

interface UserResponse {
  login: string;
  name: string;
}

interface IssueResponse {
  key: string;
  rule: string;
  severity: string;
  component: string;
  status: string;
  type: string;
}

interface QualityGateResponse {
  id: string;
  name: string;
}

interface QualityProfileResponse {
  key: string;
  name: string;
  language: string;
}

interface RuleResponse {
  key: string;
  name: string;
  type: string;
}

interface MeasureResponse {
  metric: string;
  value?: string;
  values?: unknown[];
}

interface ComponentResponse {
  key: string;
  name: string;
  qualifier: string;
}

interface ErrorResponse {
  message: string;
  status?: number;
  errors?: unknown[];
}

interface SearchResponse {
  components?: ComponentResponse[];
  issues?: IssueResponse[];
  users?: UserResponse[];
  rules?: RuleResponse[];
}

/**
 * Assertions for SonarQube API responses
 */
export const INTEGRATION_ASSERTIONS = {
  /**
   * Asserts that a response has valid pagination structure
   */
  expectValidPagination(response: PaginatedResponse): void {
    expect(response).toHaveProperty('paging');
    const { paging } = response;
    expect(paging).toMatchObject({
      pageIndex: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
    });
    expect(response.paging.pageIndex).toBeGreaterThan(0);
    expect(response.paging.pageSize).toBeGreaterThan(0);
    expect(response.paging.total).toBeGreaterThanOrEqual(0);
  },

  /**
   * Asserts that a project response has required fields
   */
  expectValidProject(project: ProjectResponse): void {
    expect(project).toMatchObject({
      key: expect.any(String),
      name: expect.any(String),
      qualifier: expect.any(String),
    });
    expect(project.key).toBeTruthy();
    expect(project.name).toBeTruthy();
  },

  /**
   * Asserts that a user response has required fields
   */
  expectValidUser(user: UserResponse): void {
    expect(user).toMatchObject({
      login: expect.any(String),
      name: expect.any(String),
    });
    expect(user.login).toBeTruthy();
    expect(user.name).toBeTruthy();
  },

  /**
   * Asserts that an issue response has required fields
   */
  expectValidIssue(issue: IssueResponse): void {
    expect(issue).toMatchObject({
      key: expect.any(String),
      rule: expect.any(String),
      severity: expect.any(String),
      component: expect.any(String),
      status: expect.any(String),
      type: expect.any(String),
    });
    expect(issue.key).toBeTruthy();
    expect(issue.rule).toBeTruthy();
    expect(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER']).toContain(issue.severity);
    expect(['OPEN', 'CONFIRMED', 'REOPENED', 'RESOLVED', 'CLOSED']).toContain(issue.status);
    expect(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']).toContain(issue.type);
  },

  /**
   * Asserts that a quality gate response has required fields
   */
  expectValidQualityGate(qualityGate: QualityGateResponse): void {
    expect(qualityGate).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
    expect(qualityGate.id).toBeTruthy();
    expect(qualityGate.name).toBeTruthy();
  },

  /**
   * Asserts that a quality profile response has required fields
   */
  expectValidQualityProfile(profile: QualityProfileResponse): void {
    expect(profile).toMatchObject({
      key: expect.any(String),
      name: expect.any(String),
      language: expect.any(String),
    });
    expect(profile.key).toBeTruthy();
    expect(profile.name).toBeTruthy();
    expect(profile.language).toBeTruthy();
  },

  /**
   * Asserts that a rule response has required fields
   */
  expectValidRule(rule: RuleResponse): void {
    expect(rule).toMatchObject({
      key: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
    });
    expect(rule.key).toBeTruthy();
    expect(rule.name).toBeTruthy();
    expect(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']).toContain(rule.type);
  },

  /**
   * Asserts that a measure response has required fields
   */
  expectValidMeasure(measure: MeasureResponse): void {
    expect(measure).toMatchObject({
      metric: expect.any(String),
    });
    expect(measure.metric).toBeTruthy();

    // Should have either value or values array
    expect(measure.value !== undefined || Boolean(measure.values)).toBe(true);
  },

  /**
   * Asserts that a component response has required fields
   */
  expectValidComponent(component: ComponentResponse): void {
    expect(component).toMatchObject({
      key: expect.any(String),
      name: expect.any(String),
      qualifier: expect.any(String),
    });
    expect(component.key).toBeTruthy();
    expect(component.name).toBeTruthy();
    expect(['TRK', 'DIR', 'FIL', 'UTS']).toContain(component.qualifier);
  },

  /**
   * Asserts that an error response has expected structure
   */
  expectValidErrorResponse(error: ErrorResponse): void {
    expect(error).toHaveProperty('message');
    expect(error.message).toBeTruthy();

    // May have additional error details
    if (error.errors) {
      expect(Array.isArray(error.errors)).toBe(true);
    }
  },

  /**
   * Asserts that an HTTP error has expected status code
   */
  expectHttpError(error: ErrorResponse & { status: number }, expectedStatusCode: number): void {
    expect(error).toHaveProperty('status', expectedStatusCode);
    this.expectValidErrorResponse(error);
  },

  /**
   * Asserts authentication error (401)
   */
  expectAuthenticationError(error: ErrorResponse & { status: number }): void {
    this.expectHttpError(error, 401);
  },

  /**
   * Asserts authorization error (403)
   */
  expectAuthorizationError(error: ErrorResponse & { status: number }): void {
    this.expectHttpError(error, 403);
  },

  /**
   * Asserts not found error (404)
   */
  expectNotFoundError(error: ErrorResponse & { status: number }): void {
    this.expectHttpError(error, 404);
  },

  /**
   * Asserts that a response contains expected number of items
   */
  expectItemCount(response: SearchResponse, expectedCount: number): void {
    if (response.components) {
      expect(response.components).toHaveLength(expectedCount);
    } else if (response.issues) {
      expect(response.issues).toHaveLength(expectedCount);
    } else if (response.users) {
      expect(response.users).toHaveLength(expectedCount);
    } else if (Array.isArray(response)) {
      expect(response).toHaveLength(expectedCount);
    } else {
      throw new Error('Response does not contain a recognizable items array');
    }
  },

  /**
   * Asserts that response time is within acceptable limits
   */
  expectReasonableResponseTime(
    durationMs: number,
    options: number | { expected?: number; maximum?: number } = 5000
  ): void {
    const maxMs =
      typeof options === 'number' ? options : (options.maximum ?? options.expected ?? 5000);
    expect(durationMs).toBeLessThan(maxMs);
    expect(durationMs).toBeGreaterThan(0);
  },

  /**
   * Asserts that an API response is valid (has expected structure)
   */
  expectValidResponse(response: unknown): void {
    expect(response).toBeDefined();
    expect(response).not.toBeNull();
    expect(typeof response).toBe('object');
  },

  /**
   * Asserts that a search response contains expected items
   */
  expectSearchResults(response: PaginatedResponse & SearchResponse, minResults = 0): void {
    this.expectValidPagination(response);

    const items = response.components ?? response.issues ?? response.users ?? response.rules ?? [];
    expect(items.length).toBeGreaterThanOrEqual(minResults);

    if (items.length > 0) {
      // Validate first item structure based on type
      const firstItem = items[0];
      if (response.components) {
        this.expectValidComponent(firstItem as ComponentResponse);
      } else if (response.issues) {
        this.expectValidIssue(firstItem as IssueResponse);
      } else if (response.users) {
        this.expectValidUser(firstItem as UserResponse);
      } else if (response.rules) {
        this.expectValidRule(firstItem as RuleResponse);
      }
    }
  },
};
