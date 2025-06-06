#!/usr/bin/env tsx

/**
 * Example: Token Authentication Strategies for Different SonarQube Versions
 * 
 * This example demonstrates how to authenticate with SonarQube using tokens
 * based on the server version.
 */

import { SonarQubeClient } from '../src/index';

async function detectAndAuthenticate() {
  const url = process.env.SONARQUBE_URL || 'https://sonarqube.example.com';
  const token = process.env.SONARQUBE_TOKEN;
  
  if (!token) {
    console.error('❌ Please set SONARQUBE_TOKEN environment variable');
    process.exit(1);
  }

  console.log('🔍 Detecting SonarQube version and optimal authentication method...\n');

  try {
    // First, try Bearer token auth (SonarQube 10.0+)
    console.log('Attempting Bearer token authentication...');
    let client = SonarQubeClient.withToken(url, token);
    
    try {
      const systemInfo = await client.system.status();
      console.log('✅ Bearer token authentication successful!');
      console.log(`   Server version: ${systemInfo.version}`);
      console.log('   Recommended for SonarQube 10.0+\n');
      return client;
    } catch (error) {
      console.log('⚠️  Bearer token authentication failed, trying Basic auth...\n');
    }

    // Fallback to Basic auth with token as username (SonarQube < 10.0)
    console.log('Attempting Basic auth with token as username...');
    client = SonarQubeClient.withBasicAuth(url, token); // No password needed
    
    try {
      const systemInfo = await client.system.status();
      console.log('✅ Basic auth (token as username) successful!');
      console.log(`   Server version: ${systemInfo.version}`);
      console.log('   This is the correct method for SonarQube < 10.0\n');
      return client;
    } catch (error) {
      console.error('❌ Both authentication methods failed');
      throw error;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    process.exit(1);
  }
}

async function demonstrateUsage() {
  console.log('🚀 SonarQube Token Authentication Example\n');
  
  const client = await detectAndAuthenticate();
  
  console.log('📊 Fetching some data to verify authentication...\n');
  
  try {
    // Get projects
    const projects = await client.projects.search()
      .pageSize(5)
      .execute();
    
    console.log(`Found ${projects.paging.total} projects:`);
    projects.components.slice(0, 5).forEach(project => {
      console.log(`   - ${project.key}: ${project.name}`);
    });
    
    // Get metrics
    console.log('\n📈 Available metrics:');
    const metrics = await client.metrics.search()
      .pageSize(5)
      .execute();
    
    metrics.metrics.slice(0, 5).forEach(metric => {
      console.log(`   - ${metric.key}: ${metric.name}`);
    });
    
    console.log('\n✅ Authentication and API access working correctly!');
  } catch (error) {
    console.error('❌ Error accessing API:', error);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateUsage().catch(console.error);
}

export { detectAndAuthenticate };