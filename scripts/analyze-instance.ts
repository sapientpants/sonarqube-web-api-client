#!/usr/bin/env tsx

/**
 * SonarQube Instance Analyzer
 * 
 * Analyzes a SonarQube instance to determine what integration test results
 * are expected based on version, edition, and available features.
 */

import { SonarQubeClient, SystemInfoV2, SystemEdition } from '../src/index';

interface AnalysisResult {
  version: string;
  edition: SystemEdition;
  features: string[];
  expectedFailures: ExpectedFailure[];
  summary: string;
}

interface ExpectedFailure {
  category: string;
  reason: string;
  count: number;
  apis: string[];
}

function printHeader() {
  console.log('');
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│' + ' '.repeat(18) + 'SonarQube Instance Analyzer' + ' '.repeat(18) + '     │');
  console.log('│' + ' '.repeat(22) + 'Integration Test Assessment' + ' '.repeat(21) + '     │');
  console.log('└' + '─'.repeat(78) + '┘');
  console.log('');
}

function validateEnvironment(): { url: string; token: string } {
  const url = process.env.SONARQUBE_URL;
  const token = process.env.SONARQUBE_TOKEN;

  if (!url) {
    throw new Error('SONARQUBE_URL environment variable is required');
  }

  if (!token) {
    throw new Error('SONARQUBE_TOKEN environment variable is required');
  }

  return { url, token };
}

function printConfiguration(config: { url: string; token: string }) {
  const maskedToken = config.token.substring(0, 8) + '...';
  
  console.log('🔧 Configuration:');
  console.log(`   URL:   ${config.url}`);
  console.log(`   Token: ${maskedToken}`);
  console.log('');
}

function isVersionAtLeast(version: string, minVersion: string): boolean {
  const parseVersion = (v: string) => v.split('.').map(n => parseInt(n, 10));
  const versionParts = parseVersion(version);
  const minVersionParts = parseVersion(minVersion);
  
  for (let i = 0; i < Math.max(versionParts.length, minVersionParts.length); i++) {
    const vPart = versionParts[i] || 0;
    const minPart = minVersionParts[i] || 0;
    
    if (vPart > minPart) return true;
    if (vPart < minPart) return false;
  }
  
  return true; // Equal versions
}

function analyzeExpectedFailures(systemInfo: SystemInfoV2): ExpectedFailure[] {
  const failures: ExpectedFailure[] = [];
  const version = systemInfo.version;
  const edition = systemInfo.edition;
  const features = systemInfo.features || [];

  // V2 API failures (404s) - expected for older versions
  if (!isVersionAtLeast(version, '10.6')) {
    failures.push({
      category: 'V2 APIs Not Available',
      reason: `SonarQube ${version} doesn't support v2 REST APIs (requires 10.6+)`,
      count: 6,
      apis: [
        '/api/v2/system/info',
        '/api/v2/system/health', 
        '/api/v2/system/status',
        '/api/v2/authorizations/groups',
        '/api/v2/analysis/jres',
        '/api/v2/sca/sbom-report'
      ]
    });
  }

  // Enterprise Edition features
  if (edition === 'community' || edition === 'developer') {
    const enterpriseApis: string[] = [];
    let enterpriseCount = 0;

    // License usage API (Enterprise only)
    enterpriseApis.push('/api/projects/license_usage');
    enterpriseCount++;

    // AI code detection (may require specific edition/features)
    if (!features.includes('security') && !features.includes('developerEdition')) {
      enterpriseApis.push('/api/projects/get_contains_ai_code');
      enterpriseCount++;
    }

    if (enterpriseCount > 0) {
      failures.push({
        category: 'Enterprise Features',
        reason: `${edition} edition doesn't support enterprise-only features`,
        count: enterpriseCount,
        apis: enterpriseApis
      });
    }
  }

  // Invalid language filter (always fails with unknown languages)
  failures.push({
    category: 'Invalid Parameters',
    reason: 'Tests with invalid/unknown language filters (expected validation errors)',
    count: 1,
    apis: ['/api/issues/search?languages=unknownlang']
  });

  // Admin-only features
  if (!process.env.INTEGRATION_TEST_RUN_ADMIN) {
    // Note: This doesn't add to expected failures since admin tests are skipped
    console.log('   ℹ️  Admin tests are disabled (INTEGRATION_TEST_RUN_ADMIN=false)');
  }

  return failures;
}

function calculateSuccessRate(expectedFailures: ExpectedFailure[], totalTests: number): number {
  const expectedFailureCount = expectedFailures.reduce((sum, failure) => sum + failure.count, 0);
  const expectedPasses = totalTests - expectedFailureCount;
  return Math.round((expectedPasses / totalTests) * 100);
}

function generateSummary(analysis: AnalysisResult, totalTests: number = 144): string {
  const expectedFailureCount = analysis.expectedFailures.reduce((sum, failure) => sum + failure.count, 0);
  const expectedPasses = totalTests - expectedFailureCount;
  const successRate = calculateSuccessRate(analysis.expectedFailures, totalTests);

  let summary = `\n📊 Expected Test Results for SonarQube ${analysis.version} (${analysis.edition}):\n\n`;
  
  summary += `   Expected passing tests: ${expectedPasses}/${totalTests} (${successRate}%)\n`;
  summary += `   Expected failing tests: ${expectedFailureCount}\n\n`;

  if (analysis.expectedFailures.length > 0) {
    summary += '   Expected Failure Categories:\n';
    analysis.expectedFailures.forEach(failure => {
      summary += `   • ${failure.category}: ${failure.count} failures\n`;
      summary += `     Reason: ${failure.reason}\n`;
      if (failure.apis.length <= 3) {
        failure.apis.forEach(api => {
          summary += `     - ${api}\n`;
        });
      } else {
        failure.apis.slice(0, 2).forEach(api => {
          summary += `     - ${api}\n`;
        });
        summary += `     - ... and ${failure.apis.length - 2} more\n`;
      }
      summary += '\n';
    });
  }

  summary += '💡 Test Result Assessment:\n';
  summary += `   If your integration tests show ${expectedPasses} ± 2 passing tests\n`;
  summary += `   and ${expectedFailureCount} ± 2 failing tests, this is EXPECTED behavior.\n\n`;

  if (analysis.edition === 'community') {
    summary += '   ⚠️  Community Edition Note:\n';
    summary += '   Some enterprise features will naturally fail - this is normal.\n\n';
  }

  return summary;
}

async function analyzeInstance(): Promise<AnalysisResult> {
  const config = validateEnvironment();
  printConfiguration(config);

  console.log('🔍 Analyzing SonarQube instance...\n');

  const client = new SonarQubeClient(config.url, config.token);

  try {
    // Test basic connectivity first
    console.log('   • Testing connectivity...');
    const pingResult = await client.system.ping();
    if (pingResult !== 'pong') {
      throw new Error('Unexpected ping response');
    }
    console.log('     ✅ Connection successful');

    // Get system information
    console.log('   • Retrieving system information...');
    let systemInfo: SystemInfoV2;
    
    try {
      systemInfo = await client.system.getInfoV2();
      console.log('     ✅ v2 API available');
    } catch (error) {
      console.log('     ⚠️  v2 API not available, falling back to v1...');
      // Fall back to v1 API and construct SystemInfoV2-like object
      const statusInfo = await client.system.status();
      const versionMatch = statusInfo.version?.match(/^(\d+\.\d+)/);
      const majorVersion = versionMatch ? versionMatch[1] : 'unknown';
      
      systemInfo = {
        version: statusInfo.version || 'unknown',
        edition: 'community' as SystemEdition, // Assume community if v2 not available
        features: [],
        serverId: 'unknown',
        installedAt: new Date().toISOString(),
        database: { name: 'unknown', version: 'unknown' },
        productionMode: true
      };
      console.log('     ✅ v1 API available');
    }

    console.log('   • Analyzing features and capabilities...');
    const expectedFailures = analyzeExpectedFailures(systemInfo);
    console.log('     ✅ Analysis complete');

    return {
      version: systemInfo.version,
      edition: systemInfo.edition,
      features: systemInfo.features || [],
      expectedFailures,
      summary: ''
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze instance: ${errorMessage}`);
  }
}

async function main() {
  printHeader();

  try {
    const analysis = await analyzeInstance();
    
    console.log('\n🎯 Instance Analysis Results:\n');
    console.log(`   Version:  ${analysis.version}`);
    console.log(`   Edition:  ${analysis.edition}`);
    console.log(`   Features: ${analysis.features.length > 0 ? analysis.features.join(', ') : 'None detected'}`);
    
    const summary = generateSummary(analysis);
    console.log(summary);

    // Return success exit code
    process.exit(0);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   • Verify SONARQUBE_URL and SONARQUBE_TOKEN are set correctly');
    console.log('   • Ensure SonarQube instance is running and accessible');
    console.log('   • Check if authentication token has proper permissions');
    console.log('');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, analyzeInstance, validateEnvironment };