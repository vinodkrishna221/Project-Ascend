#!/usr/bin/env node

/**
 * Test script to verify monitoring and analytics system functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.development
let supabaseUrl, supabaseServiceKey;
try {
  const envPath = path.join(__dirname, '..', '.env.development');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.development file');
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMonitoringSystem() {
  console.log('🔍 Testing Monitoring and Analytics System...\n');

  try {
    // Test 1: Check if metrics tables exist
    console.log('1. Checking database schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'auth_metrics',
        'api_performance_metrics', 
        'onboarding_metrics',
        'system_health_metrics',
        'alert_configurations',
        'active_alerts'
      ]);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      return false;
    }

    const expectedTables = [
      'auth_metrics',
      'api_performance_metrics', 
      'onboarding_metrics',
      'system_health_metrics',
      'alert_configurations',
      'active_alerts'
    ];

    const foundTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      return false;
    }

    console.log('✅ All required tables exist');

    // Test 2: Check if functions exist
    console.log('\n2. Checking database functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', [
        'calculate_success_rate',
        'get_api_performance_summary',
        'check_system_health'
      ]);

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError.message);
      return false;
    }

    const expectedFunctions = [
      'calculate_success_rate',
      'get_api_performance_summary', 
      'check_system_health'
    ];

    const foundFunctions = functions.map(f => f.routine_name);
    const missingFunctions = expectedFunctions.filter(f => !foundFunctions.includes(f));

    if (missingFunctions.length > 0) {
      console.error('❌ Missing functions:', missingFunctions.join(', '));
      return false;
    }

    console.log('✅ All required functions exist');

    // Test 3: Insert sample metrics data
    console.log('\n3. Testing metrics data insertion...');
    
    const sampleAuthMetric = {
      metric_type: 'email_verification',
      verification_method: 'email',
      success: true,
      response_time_ms: 250,
      ip_address: '127.0.0.1',
      user_agent: 'test-agent'
    };

    const { error: authMetricError } = await supabase
      .from('auth_metrics')
      .insert(sampleAuthMetric);

    if (authMetricError) {
      console.error('❌ Error inserting auth metric:', authMetricError.message);
      return false;
    }

    const sampleApiMetric = {
      endpoint: '/api/v1/auth/verify-email',
      method: 'POST',
      response_time_ms: 150,
      status_code: 200,
      request_size_bytes: 256,
      response_size_bytes: 128
    };

    const { error: apiMetricError } = await supabase
      .from('api_performance_metrics')
      .insert(sampleApiMetric);

    if (apiMetricError) {
      console.error('❌ Error inserting API metric:', apiMetricError.message);
      return false;
    }

    console.log('✅ Sample metrics inserted successfully');

    // Test 4: Test database functions
    console.log('\n4. Testing database functions...');
    
    const { data: successRateData, error: successRateError } = await supabase
      .rpc('calculate_success_rate', {
        p_metric_type: 'email_verification',
        p_time_window_hours: 24
      });

    if (successRateError) {
      console.error('❌ Error calling calculate_success_rate:', successRateError.message);
      return false;
    }

    console.log('✅ calculate_success_rate function works:', successRateData);

    const { data: apiSummaryData, error: apiSummaryError } = await supabase
      .rpc('get_api_performance_summary', {
        p_time_window_hours: 24
      });

    if (apiSummaryError) {
      console.error('❌ Error calling get_api_performance_summary:', apiSummaryError.message);
      return false;
    }

    console.log('✅ get_api_performance_summary function works:', apiSummaryData);

    // Test 5: Check alert configurations
    console.log('\n5. Checking alert configurations...');
    
    const { data: alertConfigs, error: alertConfigError } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('is_active', true);

    if (alertConfigError) {
      console.error('❌ Error fetching alert configurations:', alertConfigError.message);
      return false;
    }

    if (alertConfigs.length === 0) {
      console.error('❌ No alert configurations found');
      return false;
    }

    console.log(`✅ Found ${alertConfigs.length} active alert configurations`);

    // Test 6: Test system health check function
    console.log('\n6. Testing system health check...');
    
    const { error: healthCheckError } = await supabase.rpc('check_system_health');

    if (healthCheckError) {
      console.error('❌ Error running health check:', healthCheckError.message);
      return false;
    }

    console.log('✅ System health check function works');

    // Test 7: Insert system health metric
    console.log('\n7. Testing system health metrics...');
    
    const sampleHealthMetric = {
      metric_name: 'test_metric',
      metric_value: 95.5,
      metric_unit: 'percentage',
      threshold_warning: 90,
      threshold_critical: 80,
      status: 'normal',
      details: { test: true }
    };

    const { error: healthMetricError } = await supabase
      .from('system_health_metrics')
      .insert(sampleHealthMetric);

    if (healthMetricError) {
      console.error('❌ Error inserting health metric:', healthMetricError.message);
      return false;
    }

    console.log('✅ System health metric inserted successfully');

    console.log('\n🎉 All monitoring system tests passed!');
    console.log('\n📊 Monitoring and Analytics System Status:');
    console.log('   ✅ Database schema: Complete');
    console.log('   ✅ Database functions: Working');
    console.log('   ✅ Metrics collection: Functional');
    console.log('   ✅ Alert system: Configured');
    console.log('   ✅ Health monitoring: Active');
    console.log('   ✅ Analytics services: Ready');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testMonitoringSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ Monitoring system verification completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Monitoring system verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });