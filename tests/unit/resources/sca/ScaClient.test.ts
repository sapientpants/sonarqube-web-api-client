// @ts-nocheck
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import { SonarQubeClient } from '../../../../src/index.js';
import type {
  SbomReportV2Response,
  SbomMetadataV2,
  VulnerabilitySummaryV2,
  DownloadProgress,
} from '../../../../src/resources/sca/types.js';

describe('ScaClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: SonarQubeClient;

  beforeEach(() => {
    client = new SonarQubeClient(baseUrl, token);
  });

  describe('getSbomReportV2', () => {
    it('should fetch basic SBOM report for a project', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-my-project-main-20250130',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'my-project',
            name: 'My Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              groupId: 'com.example',
              artifactId: 'my-project',
              name: 'my-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [
          {
            id: 'junit-junit-4.13.2',
            name: 'junit',
            type: 'library',
            ecosystem: 'maven',
            version: '4.13.2',
            purl: 'pkg:maven/junit/junit@4.13.2',
            coordinates: {
              groupId: 'junit',
              artifactId: 'junit',
              name: 'junit',
              version: '4.13.2',
            },
            scope: 'required',
            licenses: ['EPL-1.0'],
            description: 'JUnit testing framework',
          },
        ],
        dependencies: [
          {
            componentId: 'my-project',
            dependsOn: ['junit-junit-4.13.2'],
            scope: 'test',
            relationship: 'direct',
            optional: false,
          },
        ],
        metadata: {
          project: {
            key: 'my-project',
            name: 'My Project',
          },
          analysis: {
            analysisId: 'analysis-123',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 25,
            totalVulnerabilities: 0,
            totalLicenses: 8,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: false,
            includeLicenses: false,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.sca.getSbomReportV2({
        projectKey: 'my-project',
      });

      expect(result).toEqual(mockResponse);
      expect(result.components).toHaveLength(1);
      expect(result.dependencies).toHaveLength(1);
    });

    it('should handle branch parameter', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-my-project-feature-20250130',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'my-project',
            name: 'My Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              groupId: 'com.example',
              artifactId: 'my-project',
              name: 'my-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [],
        dependencies: [],
        metadata: {
          project: {
            key: 'my-project',
            name: 'My Project',
            branch: 'feature/new-feature',
          },
          analysis: {
            analysisId: 'analysis-456',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 20,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: false,
            includeLicenses: false,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.sca.getSbomReportV2({
        projectKey: 'my-project',
        branch: 'feature/new-feature',
      });

      expect(capturedUrl).toContain('projectKey=my-project');
      expect(capturedUrl).toContain('branch=feature%2Fnew-feature');
    });

    it('should handle pull request parameter', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-my-project-pr-123',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'my-project',
            name: 'My Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              name: 'my-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [],
        dependencies: [],
        metadata: {
          project: {
            key: 'my-project',
            name: 'My Project',
            pullRequest: '123',
          },
          analysis: {
            analysisId: 'analysis-789',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 22,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: false,
            includeLicenses: false,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.sca.getSbomReportV2({
        projectKey: 'my-project',
        pullRequest: '123',
      });

      expect(capturedUrl).toContain('projectKey=my-project');
      expect(capturedUrl).toContain('pullRequest=123');
    });

    it('should include vulnerabilities when requested', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-my-project-with-vulns',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'my-project',
            name: 'My Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              name: 'my-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [
          {
            id: 'vulnerable-lib-1.0.0',
            name: 'vulnerable-lib',
            type: 'library',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              name: 'vulnerable-lib',
              version: '1.0.0',
            },
            scope: 'required',
          },
        ],
        dependencies: [],
        vulnerabilities: [
          {
            id: 'CVE-2020-15250',
            source: 'NVD',
            cvss: {
              version: '3.1',
              score: 5.5,
              severity: 'MEDIUM',
              vector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H',
            },
            summary: 'Vulnerability in vulnerable-lib',
            dates: {
              published: '2020-10-12T13:15:00Z',
              updated: '2021-07-21T11:39:00Z',
            },
            affects: [
              {
                componentId: 'vulnerable-lib-1.0.0',
                versionRange: '< 2.0.0',
              },
            ],
          },
        ],
        metadata: {
          project: {
            key: 'my-project',
            name: 'My Project',
          },
          analysis: {
            analysisId: 'analysis-with-vulns',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 5,
            totalVulnerabilities: 1,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: true,
            includeLicenses: false,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.sca.getSbomReportV2({
        projectKey: 'my-project',
        includeVulnerabilities: true,
      });

      expect(capturedUrl).toContain('includeVulnerabilities=true');
      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities?.[0].id).toBe('CVE-2020-15250');
    });

    it('should include licenses when requested', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-my-project-with-licenses',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'my-project',
            name: 'My Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              name: 'my-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [],
        dependencies: [],
        licenses: [
          {
            spdxId: 'EPL-1.0',
            name: 'Eclipse Public License 1.0',
            url: 'https://opensource.org/licenses/EPL-1.0',
            osiApproved: true,
            category: 'copyleft',
            riskLevel: 'MEDIUM',
            components: ['junit-junit-4.13.2'],
          },
        ],
        metadata: {
          project: {
            key: 'my-project',
            name: 'My Project',
          },
          analysis: {
            analysisId: 'analysis-with-licenses',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 5,
            totalLicenses: 1,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: false,
            includeLicenses: true,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.sca.getSbomReportV2({
        projectKey: 'my-project',
        includeLicenses: true,
      });

      expect(capturedUrl).toContain('includeLicenses=true');
      expect(result.licenses).toHaveLength(1);
      expect(result.licenses?.[0].spdxId).toBe('EPL-1.0');
    });

    it('should handle empty components response', async () => {
      const mockResponse: SbomReportV2Response = {
        document: {
          id: 'sbom-empty-project',
          specVersion: '2.3',
          createdAt: '2025-01-30T10:00:00Z',
          creator: {
            tool: 'SonarQube',
            version: '10.6.0',
            vendor: 'SonarSource',
          },
          primaryComponent: {
            id: 'empty-project',
            name: 'Empty Project',
            type: 'application',
            ecosystem: 'maven',
            version: '1.0.0',
            coordinates: {
              name: 'empty-project',
              version: '1.0.0',
            },
            scope: 'required',
          },
        },
        components: [],
        dependencies: [],
        metadata: {
          project: {
            key: 'empty-project',
            name: 'Empty Project',
          },
          analysis: {
            analysisId: 'analysis-empty',
            completedAt: '2025-01-30T09:45:00Z',
            totalComponents: 0,
          },
          generation: {
            format: 'json',
            includeVulnerabilities: false,
            includeLicenses: false,
            requestedAt: '2025-01-30T10:00:00Z',
            generatedAt: '2025-01-30T10:00:05Z',
          },
        },
      };

      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.sca.getSbomReportV2({
        projectKey: 'empty-project',
      });

      expect(result.components).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
      expect(result.metadata.analysis.totalComponents).toBe(0);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      await expect(client.sca.getSbomReportV2({ projectKey: 'test' })).rejects.toThrow();
    });
  });

  describe('downloadSbomReportV2', () => {
    it('should download SBOM in JSON format', async () => {
      const mockSbomText = JSON.stringify({
        document: { id: 'test-sbom' },
        components: [],
        dependencies: [],
      });

      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          const acceptHeader = request.headers.get('accept');
          if (acceptHeader?.includes('application/json') === true) {
            return HttpResponse.text(mockSbomText, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new HttpResponse(null, { status: 406 });
        }),
      );

      const result = await client.sca.downloadSbomReportV2({
        projectKey: 'my-project',
        format: 'json',
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('test-sbom');
    });

    it('should download SBOM in SPDX JSON format', async () => {
      const mockSpdxJson = JSON.stringify({
        spdxVersion: 'SPDX-2.3',
        name: 'My Project SBOM',
        packages: [],
      });

      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('format') === 'spdx-json') {
            return HttpResponse.text(mockSpdxJson, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const result = await client.sca.downloadSbomReportV2({
        projectKey: 'my-project',
        format: 'spdx-json',
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('SPDX-2.3');
    });

    it('should download SBOM in CycloneDX format', async () => {
      const mockCycloneDxJson = JSON.stringify({
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        components: [],
      });

      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('format') === 'cyclonedx-json') {
            return HttpResponse.text(mockCycloneDxJson, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const result = await client.sca.downloadSbomReportV2({
        projectKey: 'my-project',
        format: 'cyclonedx-json',
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('CycloneDX');
    });

    it('should download SBOM in binary formats', async () => {
      const mockBinaryData = new ArrayBuffer(1024);

      server.use(
        http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('format') === 'spdx-rdf') {
            return new HttpResponse(mockBinaryData, {
              headers: {
                'Content-Type': 'application/rdf+xml',
                'Content-Length': '1024',
              },
            });
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const result = await client.sca.downloadSbomReportV2({
        projectKey: 'my-project',
        format: 'spdx-rdf',
      });

      expect(result).toBeInstanceOf(Blob);
      expect((result as Blob).size).toBe(1024);
    });

    it('should track download progress for large reports', async () => {
      const totalSize = 10240; // 10KB
      const chunkSize = 1024; // 1KB chunks
      const progressUpdates: DownloadProgress[] = [];

      server.use(
        http.get('*/api/v2/sca/sbom-reports', async () => {
          const chunks: Uint8Array[] = [];
          for (let i = 0; i < totalSize / chunkSize; i++) {
            chunks.push(new Uint8Array(chunkSize));
          }

          const stream = new ReadableStream({
            async start(controller): Promise<void> {
              for (const chunk of chunks) {
                controller.enqueue(chunk);
                await delay(10); // Simulate network delay
              }
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: {
              'Content-Type': 'application/rdf+xml',
              'Content-Length': totalSize.toString(),
            },
          });
        }),
      );

      await client.sca.downloadSbomReportV2(
        {
          projectKey: 'my-project',
          format: 'spdx-rdf',
        },
        {
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          },
        },
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toEqual({
        loaded: totalSize,
        total: totalSize,
        percentage: 100,
      });
    });

    it('should handle download timeouts', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', async () => {
          await delay(1000);
          return new HttpResponse(new ArrayBuffer(1024));
        }),
      );

      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 100);

      await expect(
        client.sca.downloadSbomReportV2(
          {
            projectKey: 'my-project',
            format: 'spdx-rdf',
          },
          { signal: controller.signal },
        ),
      ).rejects.toThrow();
    });
  });

  describe('getSbomMetadataV2', () => {
    it('should fetch report metadata', async () => {
      const mockMetadata: SbomMetadataV2 = {
        project: {
          key: 'my-project',
          name: 'My Project',
          branch: 'main',
        },
        analysis: {
          analysisId: 'analysis-123',
          completedAt: '2025-01-30T09:45:00Z',
          totalComponents: 42,
          totalVulnerabilities: 5,
          totalLicenses: 12,
        },
        generation: {
          format: 'json',
          includeVulnerabilities: true,
          includeLicenses: true,
          requestedAt: '2025-01-30T10:00:00Z',
          generatedAt: '2025-01-30T10:00:05Z',
        },
      };

      server.use(
        http.get('*/api/v2/sca/sbom-reports/metadata', () => {
          return HttpResponse.json(mockMetadata);
        }),
      );

      const result = await client.sca.getSbomMetadataV2({
        projectKey: 'my-project',
        branch: 'main',
      });

      expect(result).toEqual(mockMetadata);
      expect(result.analysis.totalComponents).toBe(42);
      expect(result.analysis.totalVulnerabilities).toBe(5);
    });

    it('should handle missing reports', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports/metadata', () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      await expect(
        client.sca.getSbomMetadataV2({
          projectKey: 'non-existent-project',
        }),
      ).rejects.toThrow();
    });
  });

  describe('streamSbomReportV2', () => {
    it('should return readable stream', async () => {
      const mockData = 'streaming sbom data';

      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          const stream = new ReadableStream({
            start(controller): void {
              controller.enqueue(new TextEncoder().encode(mockData));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
      );

      const stream = await client.sca.streamSbomReportV2({
        projectKey: 'my-project',
        format: 'json',
      });

      expect(stream).toBeInstanceOf(ReadableStream);

      // Read from stream
      const reader = stream.getReader();
      const { value, done } = await reader.read();
      reader.releaseLock();

      expect(done).toBe(false);
      expect(new TextDecoder().decode(value)).toBe(mockData);
    });

    it('should handle streaming errors', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(
        client.sca.streamSbomReportV2({
          projectKey: 'my-project',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getVulnerabilitySummaryV2', () => {
    it('should return vulnerability counts by severity', async () => {
      const mockSummary: VulnerabilitySummaryV2 = {
        total: 15,
        critical: 2,
        high: 5,
        medium: 6,
        low: 2,
        byComponent: [
          {
            componentId: 'vulnerable-lib-1.0.0',
            componentName: 'vulnerable-lib',
            vulnerabilityCount: 8,
            highestSeverity: 'CRITICAL',
          },
          {
            componentId: 'another-lib-2.1.0',
            componentName: 'another-lib',
            vulnerabilityCount: 7,
            highestSeverity: 'HIGH',
          },
        ],
      };

      server.use(
        http.get('*/api/v2/sca/vulnerabilities/summary', () => {
          return HttpResponse.json(mockSummary);
        }),
      );

      const result = await client.sca.getVulnerabilitySummaryV2({
        projectKey: 'my-project',
      });

      expect(result).toEqual(mockSummary);
      expect(result.total).toBe(15);
      expect(result.critical).toBe(2);
      expect(result.byComponent).toHaveLength(2);
    });

    it('should handle projects with no vulnerabilities', async () => {
      const mockSummary: VulnerabilitySummaryV2 = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        byComponent: [],
      };

      server.use(
        http.get('*/api/v2/sca/vulnerabilities/summary', () => {
          return HttpResponse.json(mockSummary);
        }),
      );

      const result = await client.sca.getVulnerabilitySummaryV2({
        projectKey: 'secure-project',
      });

      expect(result.total).toBe(0);
      expect(result.byComponent).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      await expect(client.sca.getSbomReportV2({ projectKey: 'test' })).rejects.toThrow();
    });

    it('should handle 404 not found errors', async () => {
      server.use(
        http.get('*/api/v2/sca/vulnerabilities/summary', () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      await expect(
        client.sca.getVulnerabilitySummaryV2({
          projectKey: 'non-existent-project',
        }),
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', () => {
          throw new Error('Network error');
        }),
      );

      await expect(
        client.sca.getSbomReportV2({
          projectKey: 'my-project',
        }),
      ).rejects.toThrow();
    });

    it('should handle timeout with abort signal', async () => {
      server.use(
        http.get('*/api/v2/sca/sbom-reports', async () => {
          await delay(1000);
          return HttpResponse.json({ components: [] });
        }),
      );

      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 100);

      await expect(
        client.sca.streamSbomReportV2({ projectKey: 'my-project' }, controller.signal),
      ).rejects.toThrow();
    });
  });
});
