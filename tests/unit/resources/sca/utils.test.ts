// @ts-nocheck
import { SbomFormatConverter, SbomAnalyzer } from '../../../../src/resources/sca/utils';
import type { SbomReportV2Response } from '../../../../src/resources/sca/types';

describe('SbomFormatConverter', () => {
  const createMockSbom = (overrides?: Partial<SbomReportV2Response>): SbomReportV2Response => ({
    document: {
      id: '12345',
      createdAt: '2024-01-01T10:00:00Z',
      creator: {
        tool: 'SonarQube',
        version: '10.6',
        vendor: 'SonarSource',
      },
      primaryComponent: {
        name: 'my-project',
        version: '1.0.0',
      },
    },
    components: [],
    dependencies: [],
    ...overrides,
  });

  describe('toSpdx', () => {
    it('should convert basic SBOM to SPDX format', () => {
      const sbom = createMockSbom({
        components: [
          {
            id: 'comp-1',
            name: 'lodash',
            version: '4.17.21',
            type: 'library',
            purl: 'pkg:npm/lodash@4.17.21',
          },
          {
            id: 'comp-2',
            name: 'react',
            version: '18.2.0',
            type: 'library',
            licenses: ['MIT'],
            copyright: 'Facebook Inc.',
          },
        ],
        dependencies: [
          {
            componentId: 'comp-1',
            dependsOn: ['comp-2'],
          },
        ],
      });

      const spdx = SbomFormatConverter.toSpdx(sbom);

      expect(spdx.spdxVersion).toBe('SPDX-2.3');
      expect(spdx.name).toBe('my-project');
      expect(spdx.creationInfo.created).toBe('2024-01-01T10:00:00Z');
      expect(spdx.creationInfo.creators).toEqual(['Tool: SonarQube-10.6']);

      expect(spdx.packages).toHaveLength(2);
      expect(spdx.packages[0]).toEqual({
        SPDXID: 'SPDXRef-comp-1',
        name: 'lodash',
        versionInfo: '4.17.21',
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: 'NOASSERTION',
        copyrightText: 'NOASSERTION',
      });
      expect(spdx.packages[1]).toEqual({
        SPDXID: 'SPDXRef-comp-2',
        name: 'react',
        versionInfo: '18.2.0',
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: 'MIT',
        copyrightText: 'Facebook Inc.',
      });

      expect(spdx.relationships).toHaveLength(1);
      expect(spdx.relationships[0]).toEqual({
        spdxElementId: 'SPDXRef-comp-1',
        relationshipType: 'DEPENDS_ON',
        relatedSpdxElement: ['SPDXRef-comp-2'],
      });
    });

    it('should handle component with download URL', () => {
      const sbom = createMockSbom({
        components: [
          {
            id: 'comp-1',
            name: 'package',
            version: '1.0.0',
            type: 'library',
            source: {
              downloadUrl: 'https://example.com/download',
            },
          },
        ],
      });

      const spdx = SbomFormatConverter.toSpdx(sbom);
      expect(spdx.packages[0].downloadLocation).toBe('https://example.com/download');
    });

    it('should sanitize invalid ID characters', () => {
      const sbom = createMockSbom({
        components: [
          {
            id: 'comp:with@special#chars',
            name: 'package',
            version: '1.0.0',
            type: 'library',
          },
        ],
      });

      const spdx = SbomFormatConverter.toSpdx(sbom);
      expect(spdx.packages[0].SPDXID).toBe('SPDXRef-comp-with-special-chars');
    });
  });

  describe('toCycloneDx', () => {
    it('should convert basic SBOM to CycloneDX format', () => {
      const sbom = createMockSbom({
        components: [
          {
            id: 'comp-1',
            name: 'express',
            version: '4.18.2',
            type: 'library',
            purl: 'pkg:npm/express@4.18.2',
            licenses: ['MIT'],
            source: {
              homepage: 'https://expressjs.com',
              repository: 'https://github.com/expressjs/express',
            },
          },
        ],
        dependencies: [
          {
            componentId: 'comp-1',
            dependsOn: [],
          },
        ],
      });

      const cycloneDx = SbomFormatConverter.toCycloneDx(sbom);

      expect(cycloneDx.bomFormat).toBe('CycloneDX');
      expect(cycloneDx.specVersion).toBe('1.4');
      expect(cycloneDx.serialNumber).toBe('urn:uuid:12345');
      expect(cycloneDx.version).toBe(1);

      expect(cycloneDx.metadata).toEqual({
        timestamp: '2024-01-01T10:00:00Z',
        tools: [
          {
            vendor: 'SonarSource',
            name: 'SonarQube',
            version: '10.6',
          },
        ],
        component: {
          type: 'application',
          name: 'my-project',
          version: '1.0.0',
        },
      });

      expect(cycloneDx.components).toHaveLength(1);
      expect(cycloneDx.components[0]).toEqual({
        type: 'library',
        name: 'express',
        version: '4.18.2',
        purl: 'pkg:npm/express@4.18.2',
        licenses: [{ license: { id: 'MIT' } }],
        externalReferences: [
          {
            type: 'website',
            url: 'https://expressjs.com',
          },
        ],
      });

      expect(cycloneDx.dependencies).toEqual([
        {
          ref: 'comp-1',
          dependsOn: [],
        },
      ]);
    });

    it('should handle vulnerabilities', () => {
      const sbom = createMockSbom({
        vulnerabilities: [
          {
            id: 'CVE-2021-44228',
            source: 'NVD',
            cvss: {
              score: 10.0,
              severity: 'CRITICAL',
              version: '3.1',
              vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
            },
            description: 'Log4Shell vulnerability',
            dates: {
              published: '2021-12-10T00:00:00Z',
              updated: '2021-12-14T00:00:00Z',
            },
            affects: [
              {
                componentId: 'comp-1',
                versionRange: '<2.17.0',
              },
            ],
          },
        ],
      });

      const cycloneDx = SbomFormatConverter.toCycloneDx(sbom);

      expect(cycloneDx.vulnerabilities).toHaveLength(1);
      expect(cycloneDx.vulnerabilities?.[0]).toEqual({
        id: 'CVE-2021-44228',
        source: { name: 'NVD' },
        ratings: [
          {
            source: { name: 'NVD' },
            score: 10.0,
            severity: 'critical',
            method: 'CVSSv3.1',
            vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
          },
        ],
        description: 'Log4Shell vulnerability',
        published: '2021-12-10T00:00:00Z',
        updated: '2021-12-14T00:00:00Z',
        affects: [
          {
            ref: 'comp-1',
            versions: [{ version: '<2.17.0' }],
          },
        ],
      });
    });

    it('should handle empty optional fields', () => {
      const sbom = createMockSbom({
        components: [
          {
            id: 'comp-1',
            name: 'minimal',
            version: '1.0.0',
            type: 'library',
            // Empty purl
            purl: '',
            source: {
              // Empty URLs
              homepage: '',
              repository: '',
            },
          },
        ],
        vulnerabilities: [
          {
            id: 'VULN-1',
            source: 'Source',
            affects: [
              {
                componentId: 'comp-1',
                versionRange: '*',
              },
            ],
            dates: {
              published: '2024-01-01',
              // Empty updated
              updated: '',
            },
            // Empty description
            description: '',
          },
        ],
      });

      const cycloneDx = SbomFormatConverter.toCycloneDx(sbom);

      // Should not include empty purl
      expect(cycloneDx.components[0]).not.toHaveProperty('purl');

      // Should have empty array for external references (since filter removes empty URLs)
      expect(cycloneDx.components[0].externalReferences).toEqual([]);

      // Should not include empty description and updated
      expect(cycloneDx.vulnerabilities?.[0]).not.toHaveProperty('description');
      expect(cycloneDx.vulnerabilities?.[0]).not.toHaveProperty('updated');
    });
  });
});

describe('SbomAnalyzer', () => {
  describe('analyzeSecurityRisks', () => {
    it('should analyze security risks with critical vulnerabilities', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [
          { id: 'c1', name: 'old-package', version: '0.1.0', type: 'library' },
          { id: 'c2', name: 'test-package', version: 'v2016.1.0', type: 'library' },
        ],
        dependencies: [],
        vulnerabilities: [
          {
            id: 'CVE-1',
            source: 'NVD',
            cvss: { score: 9.8, severity: 'CRITICAL', version: '3.1' },
            affects: [{ componentId: 'c1', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
          {
            id: 'CVE-2',
            source: 'NVD',
            cvss: { score: 7.5, severity: 'HIGH', version: '3.1' },
            affects: [{ componentId: 'c2', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
          {
            id: 'CVE-3',
            source: 'NVD',
            cvss: { score: 7.0, severity: 'HIGH', version: '3.1' },
            affects: [{ componentId: 'c2', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
        ],
      };

      const analysis = SbomAnalyzer.analyzeSecurityRisks(sbom);

      expect(analysis.riskLevel).toBe('CRITICAL');
      expect(analysis.criticalVulnerabilities).toBe(1);
      expect(analysis.highVulnerabilities).toBe(2);
      expect(analysis.outdatedComponents).toBe(2);
      expect(analysis.recommendations).toContain(
        '🚨 URGENT: Address 1 critical vulnerabilities immediately',
      );
    });

    it('should analyze security risks with only high vulnerabilities', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        vulnerabilities: Array(6)
          .fill(null)
          .map((_, i) => ({
            id: `CVE-${String(i)}`,
            source: 'NVD',
            cvss: { score: 7.5, severity: 'HIGH' as const, version: '3.1' },
            affects: [{ componentId: 'c1', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          })),
      };

      const analysis = SbomAnalyzer.analyzeSecurityRisks(sbom);

      expect(analysis.riskLevel).toBe('HIGH');
      expect(analysis.criticalVulnerabilities).toBe(0);
      expect(analysis.highVulnerabilities).toBe(6);
    });

    it('should handle no vulnerabilities', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
      };

      const analysis = SbomAnalyzer.analyzeSecurityRisks(sbom);

      expect(analysis.riskLevel).toBe('LOW');
      expect(analysis.criticalVulnerabilities).toBe(0);
      expect(analysis.highVulnerabilities).toBe(0);
      expect(analysis.recommendations).toContain(
        '✅ No critical or high-severity vulnerabilities found',
      );
    });

    it('should include fix recommendations for critical vulnerabilities', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        vulnerabilities: [
          {
            id: 'CVE-2021-44228',
            source: 'NVD',
            cvss: { score: 10.0, severity: 'CRITICAL', version: '3.1' },
            affects: [{ componentId: 'log4j', versionRange: '<2.17.0' }],
            dates: { published: '2021-12-10' },
            fixes: [{ version: '2.17.0' }],
          },
        ],
      };

      const analysis = SbomAnalyzer.analyzeSecurityRisks(sbom);

      expect(analysis.recommendations).toContain('Fix CVE-2021-44228: Upgrade to version 2.17.0');
    });

    it('should identify outdated components with alpha/beta versions', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [
          { id: 'c1', name: 'pkg1', version: '1.0.0-alpha', type: 'library' },
          { id: 'c2', name: 'pkg2', version: '2.0.0-beta.1', type: 'library' },
          { id: 'c3', name: 'pkg3', version: '0.1.0-SNAPSHOT', type: 'library' },
        ],
        dependencies: [],
      };

      const analysis = SbomAnalyzer.analyzeSecurityRisks(sbom);

      expect(analysis.outdatedComponents).toBe(3);
    });
  });

  describe('analyzeLicenseCompliance', () => {
    it('should analyze license compliance with high risk licenses', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        licenses: [
          { name: 'GPL-3.0', category: 'copyleft', riskLevel: 'HIGH', osiApproved: true },
          { name: 'AGPL-3.0', category: 'copyleft', riskLevel: 'HIGH', osiApproved: true },
          { name: 'MIT', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
        ],
      };

      const analysis = SbomAnalyzer.analyzeLicenseCompliance(sbom);

      expect(analysis.totalLicenses).toBe(3);
      expect(analysis.highRiskLicenses).toBe(2);
      expect(analysis.copyleftLicenses).toBe(2);
      expect(analysis.complianceStatus).toBe('NON_COMPLIANT');
      expect(analysis.recommendations).toContain('⚖️  Review 2 high-risk licenses for compliance');
      expect(analysis.recommendations).toContain('High-risk licenses: GPL-3.0, AGPL-3.0');
    });

    it('should analyze compliance with proprietary licenses', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        licenses: [
          { name: 'Commercial', category: 'proprietary', riskLevel: 'MEDIUM', osiApproved: false },
          { name: 'MIT', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
        ],
      };

      const analysis = SbomAnalyzer.analyzeLicenseCompliance(sbom);

      expect(analysis.complianceStatus).toBe('AT_RISK');
      expect(analysis.recommendations).toContain(
        '💼 Review 1 proprietary licenses for usage rights',
      );
    });

    it('should be compliant with only permissive licenses', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        licenses: [
          { name: 'MIT', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
          { name: 'Apache-2.0', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
        ],
      };

      const analysis = SbomAnalyzer.analyzeLicenseCompliance(sbom);

      expect(analysis.complianceStatus).toBe('COMPLIANT');
      expect(analysis.recommendations).toContain(
        '✅ No high-risk or proprietary licenses detected',
      );
    });

    it('should recommend reducing copyleft dependencies when there are many', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        licenses: Array(6)
          .fill(null)
          .map((_, i) => ({
            name: `GPL-${String(i)}`,
            category: 'copyleft' as const,
            riskLevel: 'MEDIUM' as const,
            osiApproved: true,
          })),
      };

      const analysis = SbomAnalyzer.analyzeLicenseCompliance(sbom);

      expect(analysis.copyleftLicenses).toBe(6);
      expect(analysis.recommendations).toContain(
        'Consider reducing copyleft dependencies to minimize compliance overhead',
      );
    });
  });

  describe('getMostVulnerableComponents', () => {
    it('should return components sorted by vulnerability severity and count', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [
          { id: 'c1', name: 'critical-pkg', version: '1.0.0', type: 'library' },
          { id: 'c2', name: 'high-pkg', version: '2.0.0', type: 'library' },
          { id: 'c3', name: 'multi-vuln-pkg', version: '3.0.0', type: 'library' },
        ],
        dependencies: [],
        vulnerabilities: [
          {
            id: 'CVE-1',
            source: 'NVD',
            cvss: { score: 9.8, severity: 'CRITICAL', version: '3.1' },
            affects: [{ componentId: 'c1', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
          {
            id: 'CVE-2',
            source: 'NVD',
            cvss: { score: 7.5, severity: 'HIGH', version: '3.1' },
            affects: [{ componentId: 'c2', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
          {
            id: 'CVE-3',
            source: 'NVD',
            cvss: { score: 7.0, severity: 'HIGH', version: '3.1' },
            affects: [{ componentId: 'c3', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
          {
            id: 'CVE-4',
            source: 'NVD',
            cvss: { score: 5.0, severity: 'MEDIUM', version: '3.1' },
            affects: [{ componentId: 'c3', versionRange: '*' }],
            dates: { published: '2024-01-01' },
          },
        ],
      };

      const result = SbomAnalyzer.getMostVulnerableComponents(sbom, 3);

      expect(result).toHaveLength(3);
      expect(result[0].component.name).toBe('critical-pkg');
      expect(result[0].highestSeverity).toBe('CRITICAL');
      expect(result[1].component.name).toBe('multi-vuln-pkg');
      expect(result[1].vulnerabilityCount).toBe(2);
      expect(result[2].component.name).toBe('high-pkg');
    });

    it('should handle components with no vulnerabilities', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [{ id: 'c1', name: 'safe-pkg', version: '1.0.0', type: 'library' }],
        dependencies: [],
        vulnerabilities: [],
      };

      const result = SbomAnalyzer.getMostVulnerableComponents(sbom);

      expect(result).toHaveLength(0);
    });

    it('should limit results to specified number', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: Array(20)
          .fill(null)
          .map((_, i) => ({
            id: `c${String(i)}`,
            name: `pkg${String(i)}`,
            version: '1.0.0',
            type: 'library' as const,
          })),
        dependencies: [],
        vulnerabilities: Array(20)
          .fill(null)
          .map((_, i) => ({
            id: `CVE-${String(i)}`,
            source: 'NVD',
            cvss: { score: 5.0, severity: 'MEDIUM' as const, version: '3.1' },
            affects: [{ componentId: `c${String(i)}`, versionRange: '*' }],
            dates: { published: '2024-01-01' },
          })),
      };

      const result = SbomAnalyzer.getMostVulnerableComponents(sbom, 5);

      expect(result).toHaveLength(5);
    });

    it('should return NONE severity for components without CVSS', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [{ id: 'c1', name: 'unknown-severity', version: '1.0.0', type: 'library' }],
        dependencies: [],
        vulnerabilities: [
          {
            id: 'VULN-1',
            source: 'Internal',
            affects: [{ componentId: 'c1', versionRange: '*' }],
            dates: { published: '2024-01-01' },
            // No CVSS data
          },
        ],
      };

      const result = SbomAnalyzer.getMostVulnerableComponents(sbom);

      expect(result[0].highestSeverity).toBe('NONE');
    });
  });

  describe('getLicenseDistribution', () => {
    it('should calculate license distribution statistics', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
        licenses: [
          { name: 'MIT', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
          { name: 'Apache-2.0', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
          { name: 'GPL-3.0', category: 'copyleft', riskLevel: 'HIGH', osiApproved: true },
          { name: 'Commercial', category: 'proprietary', riskLevel: 'MEDIUM', osiApproved: false },
          { name: 'BSD-3-Clause', category: 'permissive', riskLevel: 'LOW', osiApproved: true },
        ],
      };

      const distribution = SbomAnalyzer.getLicenseDistribution(sbom);

      expect(distribution.total).toBe(5);
      expect(distribution.byCategory).toEqual({
        permissive: 3,
        copyleft: 1,
        proprietary: 1,
      });
      expect(distribution.byRisk).toEqual({
        low: 3,
        medium: 1,
        high: 1,
      });
      expect(distribution.osiApproved).toBe(4);
    });

    it('should handle empty licenses', () => {
      const sbom: SbomReportV2Response = {
        document: {
          id: '123',
          createdAt: '2024-01-01',
          creator: { tool: 'test', version: '1.0', vendor: 'test' },
          primaryComponent: { name: 'project', version: '1.0' },
        },
        components: [],
        dependencies: [],
      };

      const distribution = SbomAnalyzer.getLicenseDistribution(sbom);

      expect(distribution.total).toBe(0);
      expect(distribution.byCategory).toEqual({});
      expect(distribution.byRisk).toEqual({});
      expect(distribution.osiApproved).toBe(0);
    });
  });
});
