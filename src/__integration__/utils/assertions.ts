/**
 * Custom assertions for integration tests
 *
 * Provides domain-specific assertions for validating SonarQube API responses
 * and behaviors in integration tests.
 */

/**
 * Assertions for SonarQube API responses
 */
export const IntegrationAssertions = {
  /**
   * Asserts that a response has valid pagination structure
   */
  expectValidPagination(response: any): void {
    expect(response).toHaveProperty('paging');
    expect(response.paging).toMatchObject({
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
  expectValidProject(project: any): void {
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
  expectValidUser(user: any): void {
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
  expectValidIssue(issue: any): void {
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
  expectValidQualityGate(qualityGate: any): void {
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
  expectValidQualityProfile(profile: any): void {
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
  expectValidRule(rule: any): void {
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
  expectValidMeasure(measure: any): void {
    expect(measure).toMatchObject({
      metric: expect.any(String),
    });
    expect(measure.metric).toBeTruthy();

    // Should have either value or values array
    expect(measure.value !== undefined || Array.isArray(measure.values)).toBe(true);
  },

  /**
   * Asserts that a component response has required fields
   */
  expectValidComponent(component: any): void {
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
  expectValidErrorResponse(error: any): void {
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
  expectHttpError(error: any, expectedStatusCode: number): void {
    expect(error).toHaveProperty('status', expectedStatusCode);
    this.expectValidErrorResponse(error);
  },

  /**
   * Asserts authentication error (401)
   */
  expectAuthenticationError(error: any): void {
    this.expectHttpError(error, 401);
  },

  /**
   * Asserts authorization error (403)
   */
  expectAuthorizationError(error: any): void {
    this.expectHttpError(error, 403);
  },

  /**
   * Asserts not found error (404)
   */
  expectNotFoundError(error: any): void {
    this.expectHttpError(error, 404);
  },

  /**
   * Asserts that a response contains expected number of items
   */
  expectItemCount(response: any, expectedCount: number): void {
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
  expectReasonableResponseTime(durationMs: number, maxMs = 5000): void {
    expect(durationMs).toBeLessThan(maxMs);
    expect(durationMs).toBeGreaterThan(0);
  },

  /**
   * Asserts that a search response contains expected items
   */
  expectSearchResults(response: any, minResults = 0): void {
    this.expectValidPagination(response);

    const items = response.components || response.issues || response.users || response.rules || [];
    expect(items.length).toBeGreaterThanOrEqual(minResults);

    if (items.length > 0) {
      // Validate first item structure based on type
      const firstItem = items[0];
      if (response.components) {
        this.expectValidComponent(firstItem);
      } else if (response.issues) {
        this.expectValidIssue(firstItem);
      } else if (response.users) {
        this.expectValidUser(firstItem);
      } else if (response.rules) {
        this.expectValidRule(firstItem);
      }
    }
  },
};
