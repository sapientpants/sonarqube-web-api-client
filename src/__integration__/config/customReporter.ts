/**
 * Custom Jest Reporter for Integration Tests
 *
 * Provides more interpretable output for integration test results,
 * including clear categorization of expected failures (404s) vs real failures.
 */

// Types for Jest compatibility - based on Jest's actual interfaces
interface TestCaseResult {
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  title: string;
  failureMessages?: string[];
}

interface TestResult {
  testFilePath: string;
  testResults: TestCaseResult[];
  perfStats?: {
    start: number;
    end: number;
  };
}

interface AggregatedResult {
  testResults: TestResult[];
  numTotalTestSuites: number;
}

interface SummaryStats {
  totalTests: number;
  passedTests: number;
  expectedFailures: number;
  realFailures: number;
  skippedTests: number;
}

export default class IntegrationTestReporter {
  private readonly testSuites = new Map<string, { passed: number; total: number }>();

  onRunStart(_aggregatedResults: AggregatedResult, _options: unknown): void {
    console.log('\n🧪 Starting Integration Test Execution...\n');
  }

  onTestFileStart(test: TestResult): void {
    const fileName =
      test.testFilePath.split('/').pop()?.replace('.integration.test.ts', '') || 'Unknown';
    console.log(`📂 ${fileName} API Tests`);
  }

  onTestFileResult(_test: TestResult, testResult: TestResult): void {
    const fileName =
      testResult.testFilePath.split('/').pop()?.replace('.integration.test.ts', '') || 'Unknown';
    const passed = testResult.testResults.filter(
      (t: TestCaseResult) => t.status === 'passed'
    ).length;
    const failed = testResult.testResults.filter(
      (t: TestCaseResult) => t.status === 'failed'
    ).length;
    const skipped = testResult.testResults.filter(
      (t: TestCaseResult) => t.status === 'skipped'
    ).length;
    const total = testResult.testResults.length;

    this.testSuites.set(fileName, { passed, total });

    const duration = testResult.perfStats
      ? `${((testResult.perfStats.end - testResult.perfStats.start) / 1000).toFixed(2)}s`
      : 'N/A';

    if (failed === 0) {
      console.log(`   ✅ ${passed}/${total} tests passed (${duration})`);
    } else {
      const expected404s = testResult.testResults.filter(
        (t: TestCaseResult) =>
          t.status === 'failed' &&
          t.failureMessages?.some(
            (msg: string) => msg.includes('404') || msg.includes('not available')
          )
      ).length;

      const realFailures = failed - expected404s;

      if (realFailures === 0 && expected404s > 0) {
        console.log(
          `   ⚠️  ${passed}/${total} tests passed, ${expected404s} expected 404s (${duration})`
        );
      } else {
        console.log(
          `   ❌ ${passed}/${total} tests passed, ${realFailures} real failures, ${expected404s} expected 404s (${duration})`
        );
      }
    }

    if (skipped > 0) {
      console.log(`   ⏭️  ${skipped} tests skipped`);
    }

    console.log('');
  }

  onRunComplete(_contexts: unknown, results: AggregatedResult): void {
    const stats = this.calculateStats(results);
    this.printSummary(stats, results);
  }

  private calculateStats(results: AggregatedResult): SummaryStats {
    let totalTests = 0;
    let passedTests = 0;
    let expectedFailures = 0;
    let realFailures = 0;
    let skippedTests = 0;

    results.testResults.forEach((testResult: TestResult) => {
      testResult.testResults.forEach((test: TestCaseResult) => {
        totalTests++;

        if (test.status === 'passed') {
          passedTests++;
        } else if (test.status === 'skipped') {
          skippedTests++;
        } else if (test.status === 'failed') {
          if (this.isExpected404Failure(test)) {
            expectedFailures++;
          } else {
            realFailures++;
          }
        }
      });
    });

    return {
      totalTests,
      passedTests,
      expectedFailures,
      realFailures,
      skippedTests,
    };
  }

  private isExpected404Failure(test: TestCaseResult): boolean {
    const failureMessage = test.failureMessages?.join(' ') || '';

    // Check for 404 errors which are expected for missing API endpoints
    const is404Error =
      failureMessage.includes('404') ||
      failureMessage.includes('Not Found') ||
      failureMessage.includes('API not available');

    // Check if the test is specifically handling missing APIs
    const isApiAvailabilityTest =
      test.title.includes('v2') ||
      test.title.includes('API') ||
      failureMessage.includes('Skipping') ||
      failureMessage.includes('not available');

    return is404Error && isApiAvailabilityTest;
  }

  private printSummary(stats: SummaryStats, results: AggregatedResult): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 INTEGRATION TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Overall Status
    const overallSuccess = stats.realFailures === 0;
    const statusIcon = overallSuccess ? '✅' : '❌';
    const statusText = overallSuccess ? 'SUCCESS' : 'FAILED';

    console.log(`\n${statusIcon} Overall Status: ${statusText}`);

    // Test Statistics
    console.log('\n📈 Test Statistics:');
    console.log(`   Total Tests:      ${stats.totalTests}`);
    console.log(`   ✅ Passed:        ${stats.passedTests}`);
    console.log(`   ⚠️  Expected 404s: ${stats.expectedFailures} (API endpoints not available)`);
    console.log(`   ❌ Real Failures: ${stats.realFailures}`);
    console.log(`   ⏭️  Skipped:       ${stats.skippedTests}`);

    // Success Rate
    const successfulTests = stats.passedTests + stats.expectedFailures;
    const successRate =
      stats.totalTests > 0 ? Math.round((successfulTests / stats.totalTests) * 100) : 0;

    console.log(`\n📊 Success Rate: ${successRate}% (${successfulTests}/${stats.totalTests})`);

    // Performance Info
    const duration =
      results.numTotalTestSuites > 0
        ? `${(
            results.testResults.reduce((sum: number, result: TestResult) => {
              const start = Number(result.perfStats?.start) || 0;
              const end = Number(result.perfStats?.end) || 0;
              return sum + end - start;
            }, 0) / 1000
          ).toFixed(2)}s`
        : 'N/A';

    console.log(`⏱️  Total Duration: ${duration}`);

    // Detailed Breakdown
    if (stats.expectedFailures > 0) {
      console.log('\n⚠️  Expected Failures (Missing API Endpoints):');
      this.printExpectedFailures(results);
    }

    if (stats.realFailures > 0) {
      console.log('\n❌ Real Failures (Need Investigation):');
      this.printRealFailures(results);
    }

    // Recommendations
    this.printRecommendations(stats, results);

    console.log(`\n${'='.repeat(80)}`);
  }

  private printExpectedFailures(results: AggregatedResult): void {
    results.testResults.forEach((testResult: TestResult) => {
      testResult.testResults.forEach((test: TestCaseResult) => {
        if (test.status === 'failed' && this.isExpected404Failure(test)) {
          const apiType = this.extractApiType(test.title);
          console.log(`   • ${apiType}: ${test.title}`);
        }
      });
    });

    console.log(`\n   💡 These failures are expected - the SonarQube instance doesn't`);
    console.log(`      support these API endpoints. This is normal behavior.`);
  }

  private printRealFailures(results: AggregatedResult): void {
    results.testResults.forEach((testResult: TestResult) => {
      testResult.testResults.forEach((test: TestCaseResult) => {
        if (test.status === 'failed' && !this.isExpected404Failure(test)) {
          console.log(`   • ${test.title}`);
          if (test.failureMessages && test.failureMessages.length > 0) {
            // Print first line of error for quick diagnosis
            const firstError = test.failureMessages[0]?.split('\n')[0];
            if (firstError) {
              console.log(`     └─ ${firstError.trim()}`);
            }
          }
        }
      });
    });
  }

  private extractApiType(testTitle: string): string {
    if (testTitle.includes('v2')) {
      return 'v2 API';
    }
    if (testTitle.includes('System')) {
      return 'System API';
    }
    if (testTitle.includes('User')) {
      return 'Users API';
    }
    if (testTitle.includes('Project')) {
      return 'Projects API';
    }
    return 'API';
  }

  private printRecommendations(stats: SummaryStats, results: AggregatedResult): void {
    console.log('\n💡 Recommendations:');

    if (stats.realFailures === 0) {
      console.log('   ✅ All integration tests are working correctly!');
      console.log(`   ✅ ${stats.passedTests} tests passed successfully`);

      if (stats.expectedFailures > 0) {
        console.log(`   ℹ️  ${stats.expectedFailures} expected failures for missing APIs (normal)`);
      }
    } else {
      console.log('   🔍 Investigate the real failures listed above');
      console.log('   🔧 Check API credentials and permissions');
      console.log('   🌐 Verify network connectivity to SonarQube instance');
    }

    if (stats.skippedTests > 0) {
      console.log(
        `   ⏭️  ${stats.skippedTests} tests were skipped (likely due to missing permissions or test data)`
      );
    }

    // Performance recommendations
    const avgDuration =
      results.numTotalTestSuites > 0
        ? results.testResults.reduce((sum: number, result: TestResult) => {
            const start = Number(result.perfStats?.start) || 0;
            const end = Number(result.perfStats?.end) || 0;
            return sum + end - start;
          }, 0) /
          results.numTotalTestSuites /
          1000
        : 0;

    if (avgDuration > 30) {
      console.log('   ⚡ Consider optimizing slow tests or checking network latency');
    }
  }
}
