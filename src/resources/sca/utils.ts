/**
 * Utility functions for SCA SBOM format conversion and analysis
 * @since 10.6
 */

import type {
  SbomReportV2Response,
  SPDXDocument,
  CycloneDXDocument,
  SecurityRiskAnalysis,
  LicenseComplianceAnalysis,
  SbomComponentV2,
  SbomVulnerabilityV2,
  SbomLicenseV2,
} from './types';

// ===== SBOM Format Converters =====

/**
 * Utility class for converting between SBOM formats
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SbomFormatConverter {
  /**
   * Convert SonarQube SBOM to SPDX format
   *
   * @param sbom - SonarQube SBOM report
   * @returns SPDX document structure
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({ projectKey: 'my-project' });
   * const spdxDoc = SbomFormatConverter.toSpdx(sbom);
   * console.log(`SPDX version: ${spdxDoc.spdxVersion}`);
   * ```
   */
  static toSpdx(sbom: SbomReportV2Response): SPDXDocument {
    return {
      spdxVersion: 'SPDX-2.3',
      creationInfo: {
        created: sbom.document.createdAt,
        creators: [`Tool: ${sbom.document.creator.tool}-${sbom.document.creator.version}`],
      },
      name: sbom.document.primaryComponent.name,
      packages: sbom.components.map((component) => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SPDXID: `SPDXRef-${this.sanitizeId(component.id)}`,
        name: component.name,
        versionInfo: component.version,
        downloadLocation: component.source?.downloadUrl ?? 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: component.licenses?.[0] ?? 'NOASSERTION',
        copyrightText: component.copyright ?? 'NOASSERTION',
      })),
      relationships: sbom.dependencies.flatMap((dep) =>
        dep.dependsOn.map((targetId) => ({
          spdxElementId: `SPDXRef-${this.sanitizeId(dep.componentId)}`,
          relationshipType: 'DEPENDS_ON',
          relatedSpdxElement: [`SPDXRef-${this.sanitizeId(targetId)}`],
        }))
      ),
    };
  }

  /**
   * Convert SonarQube SBOM to CycloneDX format
   *
   * @param sbom - SonarQube SBOM report
   * @returns CycloneDX document structure
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   includeVulnerabilities: true
   * });
   * const cycloneDx = SbomFormatConverter.toCycloneDx(sbom);
   * console.log(`Found ${cycloneDx.vulnerabilities?.length || 0} vulnerabilities`);
   * ```
   */
  static toCycloneDx(sbom: SbomReportV2Response): CycloneDXDocument {
    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${sbom.document.id}`,
      version: 1,
      metadata: {
        timestamp: sbom.document.createdAt,
        tools: [
          {
            vendor: sbom.document.creator.vendor,
            name: sbom.document.creator.tool,
            version: sbom.document.creator.version,
          },
        ],
        component: {
          type: 'application',
          name: sbom.document.primaryComponent.name,
          version: sbom.document.primaryComponent.version,
        },
      },
      components: sbom.components.map((component) => ({
        type: component.type,
        name: component.name,
        version: component.version,
        ...(component.purl !== undefined && component.purl.length > 0 && { purl: component.purl }),
        ...(component.licenses && {
          licenses: component.licenses.map((license) => ({ license: { id: license } })),
        }),
        ...(component.source && {
          externalReferences: [
            {
              type: 'website',
              url: component.source.homepage ?? component.source.repository ?? '',
            },
          ].filter((ref) => ref.url.length > 0),
        }),
      })),
      dependencies: sbom.dependencies.map((dep) => ({
        ref: dep.componentId,
        dependsOn: dep.dependsOn,
      })),
      ...(sbom.vulnerabilities && {
        vulnerabilities: sbom.vulnerabilities.map((vuln) => ({
          id: vuln.id,
          source: { name: vuln.source },
          ...(vuln.cvss && {
            ratings: [
              {
                source: { name: vuln.source },
                score: vuln.cvss.score,
                severity: vuln.cvss.severity.toLowerCase(),
                method: `CVSSv${vuln.cvss.version}`,
                ...(vuln.cvss.vector !== undefined &&
                  vuln.cvss.vector.length > 0 && { vector: vuln.cvss.vector }),
              },
            ],
          }),
          ...(vuln.description !== undefined &&
            vuln.description.length > 0 && { description: vuln.description }),
          ...(vuln.dates.published.length > 0 && { published: vuln.dates.published }),
          ...(vuln.dates.updated !== undefined &&
            vuln.dates.updated.length > 0 && { updated: vuln.dates.updated }),
          affects: vuln.affects.map((affect) => ({
            ref: affect.componentId,
            versions: [{ version: affect.versionRange }],
          })),
        })),
      }),
    };
  }

  /**
   * Sanitize ID for SPDX format (remove invalid characters)
   * @private
   */
  private static sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9.-]/g, '-');
  }
}

// ===== SBOM Analysis Utilities =====

/**
 * Utility class for analyzing SBOM reports for security and compliance
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SbomAnalyzer {
  /**
   * Analyze SBOM for security risks and vulnerabilities
   *
   * @param sbom - SBOM report to analyze
   * @returns Security risk analysis with recommendations
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   includeVulnerabilities: true
   * });
   *
   * const riskAnalysis = SbomAnalyzer.analyzeSecurityRisks(sbom);
   * console.log(`Risk Level: ${riskAnalysis.riskLevel}`);
   * console.log(`Critical: ${riskAnalysis.criticalVulnerabilities}`);
   *
   * riskAnalysis.recommendations.forEach(rec => {
   *   console.log(`- ${rec}`);
   * });
   * ```
   */
  static analyzeSecurityRisks(sbom: SbomReportV2Response): SecurityRiskAnalysis {
    const vulnerabilities = sbom.vulnerabilities ?? [];
    const criticalVulns = vulnerabilities.filter((v) => v.cvss?.severity === 'CRITICAL');
    const highVulns = vulnerabilities.filter((v) => v.cvss?.severity === 'HIGH');
    const outdatedComponents = sbom.components.filter((c) => this.isOutdated(c));

    return {
      riskLevel: this.calculateRiskLevel(criticalVulns.length, highVulns.length),
      criticalVulnerabilities: criticalVulns.length,
      highVulnerabilities: highVulns.length,
      outdatedComponents: outdatedComponents.length,
      recommendations: this.generateSecurityRecommendations(
        criticalVulns,
        highVulns,
        outdatedComponents
      ),
    };
  }

  /**
   * Analyze SBOM for license compliance and risk
   *
   * @param sbom - SBOM report to analyze
   * @returns License compliance analysis with recommendations
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   includeLicenses: true
   * });
   *
   * const compliance = SbomAnalyzer.analyzeLicenseCompliance(sbom);
   * console.log(`Status: ${compliance.complianceStatus}`);
   * console.log(`High Risk Licenses: ${compliance.highRiskLicenses}`);
   *
   * if (compliance.complianceStatus !== 'COMPLIANT') {
   *   compliance.recommendations.forEach(rec => {
   *     console.warn(`⚠️  ${rec}`);
   *   });
   * }
   * ```
   */
  static analyzeLicenseCompliance(sbom: SbomReportV2Response): LicenseComplianceAnalysis {
    const licenses = sbom.licenses ?? [];
    const riskLicenses = licenses.filter((l) => l.riskLevel === 'HIGH');
    const copyleftLicenses = licenses.filter((l) => l.category === 'copyleft');
    const proprietaryLicenses = licenses.filter((l) => l.category === 'proprietary');

    return {
      totalLicenses: licenses.length,
      highRiskLicenses: riskLicenses.length,
      copyleftLicenses: copyleftLicenses.length,
      complianceStatus: this.calculateComplianceStatus(riskLicenses, proprietaryLicenses),
      recommendations: this.generateLicenseRecommendations(
        riskLicenses,
        copyleftLicenses,
        proprietaryLicenses
      ),
    };
  }

  /**
   * Get components with the most vulnerabilities
   *
   * @param sbom - SBOM report to analyze
   * @param limit - Maximum number of components to return
   * @returns Components sorted by vulnerability count (descending)
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   includeVulnerabilities: true
   * });
   *
   * const riskiest = SbomAnalyzer.getMostVulnerableComponents(sbom, 5);
   * riskiest.forEach(comp => {
   *   console.log(`${comp.name}: ${comp.vulnerabilityCount} vulnerabilities`);
   * });
   * ```
   */
  static getMostVulnerableComponents(
    sbom: SbomReportV2Response,
    limit = 10
  ): Array<{
    component: SbomComponentV2;
    vulnerabilityCount: number;
    highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  }> {
    const vulnerabilities = sbom.vulnerabilities ?? [];

    const componentVulns = new Map<
      string,
      {
        component: SbomComponentV2;
        vulnerabilities: SbomVulnerabilityV2[];
      }
    >();

    // Group vulnerabilities by component
    vulnerabilities.forEach((vuln) => {
      vuln.affects.forEach((affect) => {
        const component = sbom.components.find((c) => c.id === affect.componentId);
        if (component) {
          if (!componentVulns.has(affect.componentId)) {
            componentVulns.set(affect.componentId, {
              component,
              vulnerabilities: [],
            });
          }
          const componentData = componentVulns.get(affect.componentId);
          if (componentData) {
            componentData.vulnerabilities.push(vuln);
          }
        }
      });
    });

    return Array.from(componentVulns.values())
      .map(({ component, vulnerabilities: vulns }) => ({
        component,
        vulnerabilityCount: vulns.length,
        highestSeverity: this.getHighestSeverity(vulns),
      }))
      .sort((a, b) => {
        // Sort by severity first, then by count
        const severityOrder = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          CRITICAL: 4,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          HIGH: 3,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          MEDIUM: 2,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          LOW: 1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          NONE: 0,
        };
        const severityDiff = severityOrder[b.highestSeverity] - severityOrder[a.highestSeverity];
        return severityDiff !== 0 ? severityDiff : b.vulnerabilityCount - a.vulnerabilityCount;
      })
      .slice(0, limit);
  }

  /**
   * Get license distribution statistics
   *
   * @param sbom - SBOM report to analyze
   * @returns License statistics by category and risk
   *
   * @example
   * ```typescript
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   includeLicenses: true
   * });
   *
   * const stats = SbomAnalyzer.getLicenseDistribution(sbom);
   * console.log(`Permissive: ${stats.byCategory.permissive}`);
   * console.log(`Copyleft: ${stats.byCategory.copyleft}`);
   * console.log(`High Risk: ${stats.byRisk.high}`);
   * ```
   */
  static getLicenseDistribution(sbom: SbomReportV2Response): {
    total: number;
    byCategory: Record<string, number>;
    byRisk: Record<string, number>;
    osiApproved: number;
  } {
    const licenses = sbom.licenses ?? [];

    const byCategory = licenses.reduce<Record<string, number>>((acc, license) => {
      acc[license.category] = (acc[license.category] ?? 0) + 1;
      return acc;
    }, {});

    const byRisk = licenses.reduce<Record<string, number>>((acc, license) => {
      const risk = license.riskLevel.toLowerCase();
      acc[risk] = (acc[risk] ?? 0) + 1;
      return acc;
    }, {});

    const osiApproved = licenses.filter((l) => l.osiApproved === true).length;

    return {
      total: licenses.length,
      byCategory,
      byRisk,
      osiApproved,
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Check if a component appears to be outdated (simplified heuristic)
   * @private
   */
  private static isOutdated(component: SbomComponentV2): boolean {
    // Simple heuristic: check for very old versions or known old patterns
    const version = component.version.toLowerCase();

    // Check for very old major versions
    if (/^[0-4]\./.exec(version)) {
      return true;
    }

    // Check for snapshot/beta/alpha versions (might indicate old dev versions)
    if (version.includes('snapshot') || version.includes('alpha') || version.includes('beta')) {
      return true;
    }

    // Check for very old date patterns (2015-2018)
    if (/201[5-8]/.exec(version)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate overall risk level based on vulnerability counts
   * @private
   */
  private static calculateRiskLevel(
    critical: number,
    high: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (critical !== 0) {
      return 'CRITICAL';
    }
    if (high > 5) {
      return 'HIGH';
    }
    if (high !== 0) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Calculate compliance status based on license risks
   * @private
   */
  private static calculateComplianceStatus(
    riskLicenses: SbomLicenseV2[],
    proprietaryLicenses: SbomLicenseV2[]
  ): 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' {
    if (riskLicenses.length !== 0 || proprietaryLicenses.length > 2) {
      return 'NON_COMPLIANT';
    }
    if (proprietaryLicenses.length !== 0) {
      return 'AT_RISK';
    }
    return 'COMPLIANT';
  }

  /**
   * Get the highest severity from a list of vulnerabilities
   * @private
   */
  private static getHighestSeverity(
    vulnerabilities: SbomVulnerabilityV2[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE' {
    if (vulnerabilities.length === 0) {
      return 'NONE';
    }

    const severities = vulnerabilities
      .map((v) => v.cvss?.severity)
      .filter((s): s is NonNullable<typeof s> => s !== undefined);

    if (severities.includes('CRITICAL')) {
      return 'CRITICAL';
    }
    if (severities.includes('HIGH')) {
      return 'HIGH';
    }
    if (severities.includes('MEDIUM')) {
      return 'MEDIUM';
    }
    if (severities.includes('LOW')) {
      return 'LOW';
    }

    return 'NONE';
  }

  /**
   * Generate security-focused recommendations
   * @private
   */
  private static generateSecurityRecommendations(
    critical: SbomVulnerabilityV2[],
    high: SbomVulnerabilityV2[],
    outdated: SbomComponentV2[]
  ): string[] {
    const recommendations = [];

    if (critical.length > 0) {
      recommendations.push(
        `🚨 URGENT: Address ${critical.length.toString()} critical vulnerabilities immediately`
      );
      const criticalComponents = new Set(
        critical.flatMap((v) => v.affects.map((a) => a.componentId))
      );
      recommendations.push(
        `Critical components: ${Array.from(criticalComponents).slice(0, 3).join(', ')}${criticalComponents.size > 3 ? '...' : ''}`
      );
    }

    if (high.length > 0) {
      recommendations.push(`⚠️  Fix ${high.length.toString()} high-severity vulnerabilities`);
    }

    if (outdated.length > 0) {
      recommendations.push(
        `📅 Update ${outdated.length.toString()} outdated components to latest versions`
      );
    }

    if (critical.length === 0 && high.length === 0) {
      recommendations.push('✅ No critical or high-severity vulnerabilities found');
    }

    // Add specific CVE recommendations for critical vulnerabilities
    critical.slice(0, 3).forEach((vuln) => {
      if (vuln.fixes && vuln.fixes.length > 0) {
        recommendations.push(
          `Fix ${vuln.id}: Upgrade to version ${vuln.fixes[0]?.version ?? 'unknown'}`
        );
      }
    });

    return recommendations;
  }

  /**
   * Generate license compliance recommendations
   * @private
   */
  private static generateLicenseRecommendations(
    risk: SbomLicenseV2[],
    copyleft: SbomLicenseV2[],
    proprietary: SbomLicenseV2[]
  ): string[] {
    const recommendations = [];

    if (risk.length > 0) {
      recommendations.push(
        `⚖️  Review ${risk.length.toString()} high-risk licenses for compliance`
      );
      recommendations.push(
        `High-risk licenses: ${risk
          .map((l) => l.name)
          .slice(0, 3)
          .join(', ')}`
      );
    }

    if (copyleft.length > 0) {
      recommendations.push(
        `📋 Verify compliance requirements for ${copyleft.length.toString()} copyleft licenses`
      );
      recommendations.push(
        'Ensure source code disclosure obligations are met for copyleft dependencies'
      );
    }

    if (proprietary.length > 0) {
      recommendations.push(
        `💼 Review ${proprietary.length.toString()} proprietary licenses for usage rights`
      );
    }

    if (risk.length === 0 && proprietary.length === 0) {
      recommendations.push('✅ No high-risk or proprietary licenses detected');
    }

    // Specific license recommendations
    if (copyleft.length > 5) {
      recommendations.push(
        'Consider reducing copyleft dependencies to minimize compliance overhead'
      );
    }

    return recommendations;
  }
}
