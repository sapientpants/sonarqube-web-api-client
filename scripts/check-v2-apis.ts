#!/usr/bin/env ts-node

/**
 * Script to check for new v2 API endpoints in a SonarQube instance
 * Usage: ts-node scripts/check-v2-apis.ts --url=https://sonarqube.example.com --token=your-token
 */

import { SonarQubeClient } from '../src';

interface V2ApiEndpoint {
  path: string;
  methods: string[];
  description?: string;
  since?: string;
}

async function checkV2Apis(baseUrl: string, token?: string) {
  console.log(`🔍 Checking for v2 APIs at ${baseUrl}\n`);

  const client = new SonarQubeClient(baseUrl, token);
  
  // Known v2 endpoints to check
  const v2Endpoints: V2ApiEndpoint[] = [
    { path: '/api/v2/users/search', methods: ['GET'], since: '10.4' },
    { path: '/api/v2/projects', methods: ['GET', 'POST'], since: '10.5' },
    { path: '/api/v2/projects/{id}', methods: ['GET', 'PATCH', 'DELETE'], since: '10.5' },
    { path: '/api/v2/issues', methods: ['GET'], since: '10.6' },
    { path: '/api/v2/issues/{id}', methods: ['GET', 'PATCH'], since: '10.6' },
    { path: '/api/v2/rules', methods: ['GET'], since: '10.6' },
    { path: '/api/v2/quality-gates', methods: ['GET', 'POST'], since: '10.7' },
    { path: '/api/v2/quality-profiles', methods: ['GET'], since: '10.7' },
    { path: '/api/v2/metrics', methods: ['GET'], since: '10.8' },
    { path: '/api/v2/settings', methods: ['GET', 'PATCH'], since: '10.8' },
    { path: '/api/v2/system/health', methods: ['GET'], since: '10.6' },
    { path: '/api/v2/system/liveness', methods: ['GET'], since: '10.6' },
    { path: '/api/v2/system/migrations-status', methods: ['GET'], since: '10.6' },
    // Note: /api/v2/system/status and /api/v2/system/info are NOT available yet
  ];

  const results: Array<{endpoint: V2ApiEndpoint, available: boolean, error?: string}> = [];

  for (const endpoint of v2Endpoints) {
    try {
      // Try a simple HEAD request first, fallback to GET if HEAD fails
      const testPath = endpoint.path.replace('{id}', 'test-id');
      let response = await fetch(`${baseUrl}${testPath}`, {
        method: 'HEAD',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      // If HEAD method is not allowed or causes an error, try GET
      if (response.status === 405 || response.status === 501) {
        response = await fetch(`${baseUrl}${testPath}`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
      }

      const available = response.status !== 404;
      results.push({ endpoint, available });
      
      if (available) {
        console.log(`✅ ${endpoint.path} - Available (since ${endpoint.since})`);
      } else {
        console.log(`❌ ${endpoint.path} - Not found`);
      }
    } catch (error) {
      results.push({ 
        endpoint, 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log(`⚠️  ${endpoint.path} - Error: ${error}`);
    }
  }

  // Check for OpenAPI spec
  try {
    const openApiResponse = await fetch(`${baseUrl}/api/v2/openapi.json`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (openApiResponse.ok) {
      console.log('\n📋 OpenAPI Specification available at /api/v2/openapi.json');
      const spec = await openApiResponse.json();
      console.log(`   Version: ${spec.info?.version || 'Unknown'}`);
      console.log(`   Endpoints: ${Object.keys(spec.paths || {}).length}`);
    }
  } catch (error) {
    console.log('\n❌ OpenAPI Specification not available');
  }

  // Summary
  const availableCount = results.filter(r => r.available).length;
  console.log(`\n📊 Summary: ${availableCount}/${results.length} v2 endpoints available`);

  // Check which client methods need v2 implementation
  console.log('\n🔧 Implementation Status:');
  
  const implementationStatus = [
    { api: 'Users', v1: 'search()', v2: 'searchV2()', implemented: true },
    { api: 'Projects', v1: 'search()', v2: 'searchV2()', implemented: false },
    { api: 'Issues', v1: 'search()', v2: 'searchV2()', implemented: false },
    { api: 'Rules', v1: 'search()', v2: 'searchV2()', implemented: false },
    { api: 'QualityGates', v1: 'list()', v2: 'listV2()', implemented: false },
    { api: 'QualityProfiles', v1: 'search()', v2: 'searchV2()', implemented: false },
    { api: 'Metrics', v1: 'search()', v2: 'searchV2()', implemented: false },
    { api: 'Settings', v1: 'list()', v2: 'listV2()', implemented: false },
  ];

  for (const status of implementationStatus) {
    const icon = status.implemented ? '✅' : '🔲';
    console.log(`${icon} ${status.api}: ${status.v2} ${status.implemented ? '(implemented)' : '(pending)'}`);
  }

  // Generate implementation priority
  console.log('\n📝 Recommended Implementation Priority:');
  const priorities = results
    .filter(r => r.available && !implementationStatus.find(s => 
      s.api.toLowerCase() === r.endpoint.path.split('/')[3]?.replace('-', '')
    )?.implemented)
    .sort((a, b) => (a.endpoint.since || '').localeCompare(b.endpoint.since || ''))
    .slice(0, 5);

  priorities.forEach((p, i) => {
    console.log(`${i + 1}. ${p.endpoint.path} (available since ${p.endpoint.since})`);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const tokenArg = args.find(arg => arg.startsWith('--token='));

if (!urlArg) {
  console.error('Usage: ts-node scripts/check-v2-apis.ts --url=https://sonarqube.example.com [--token=your-token]');
  process.exit(1);
}

const url = urlArg.split('=')[1];
const token = tokenArg?.split('=')[1];

checkV2Apis(url, token).catch(console.error);