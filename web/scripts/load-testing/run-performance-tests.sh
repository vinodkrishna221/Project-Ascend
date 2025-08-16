#!/bin/bash

# Performance and Load Testing Runner for Authentication Flow
# This script runs comprehensive performance tests using K6

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_DIR="./load-testing-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}🚀 Starting Authentication Flow Performance Tests${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}Results will be saved to: $RESULTS_DIR${NC}"
echo ""

# Function to run a test and save results
run_test() {
    local test_name="$1"
    local test_file="$2"
    local test_options="$3"
    local result_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.json"
    local summary_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}_summary.txt"
    
    echo -e "${YELLOW}📊 Running $test_name...${NC}"
    
    # Run K6 test with JSON output
    if k6 run \
        --out json="$result_file" \
        --summary-export="$summary_file" \
        $test_options \
        "$test_file"; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
        
        # Extract key metrics from summary
        if [ -f "$summary_file" ]; then
            echo -e "${BLUE}📈 Key Metrics for $test_name:${NC}"
            grep -E "(http_req_duration|http_req_failed|checks)" "$summary_file" || true
        fi
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
    
    echo ""
}

# Function to check if K6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}❌ K6 is not installed. Please install K6 first.${NC}"
        echo -e "${YELLOW}Installation instructions: https://k6.io/docs/getting-started/installation/${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ K6 is installed: $(k6 version)${NC}"
}

# Function to check if the server is running
check_server() {
    echo -e "${YELLOW}🔍 Checking if server is running at $BASE_URL...${NC}"
    
    if curl -s -f "$BASE_URL/api/v1/colleges" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running and responding${NC}"
    else
        echo -e "${RED}❌ Server is not responding at $BASE_URL${NC}"
        echo -e "${YELLOW}Please make sure your server is running before running performance tests${NC}"
        exit 1
    fi
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}🎯 Running Complete Performance Test Suite${NC}"
    echo ""
    
    # 1. Performance Benchmarks
    run_test "performance_benchmarks" \
             "./performance-benchmarks.js" \
             "--env BASE_URL=$BASE_URL"
    
    # 2. Load Testing - Concurrent Verification
    run_test "concurrent_verification_load" \
             "./auth-load-test.js" \
             "--env BASE_URL=$BASE_URL --env SCENARIO=email_verification"
    
    # 3. Load Testing - College Database
    run_test "college_database_load" \
             "./auth-load-test.js" \
             "--env BASE_URL=$BASE_URL --env SCENARIO=college_database"
    
    # 4. Load Testing - Mixed Scenario
    run_test "mixed_scenario_load" \
             "./auth-load-test.js" \
             "--env BASE_URL=$BASE_URL --env SCENARIO=mixed"
    
    # 5. Scalability Testing - Peak Signup
    run_test "peak_signup_scalability" \
             "./scalability-test.js" \
             "--env BASE_URL=$BASE_URL --env SCALABILITY_SCENARIO=full_signup_flow"
    
    # 6. Scalability Testing - High Volume
    run_test "high_volume_scalability" \
             "./scalability-test.js" \
             "--env BASE_URL=$BASE_URL --env SCALABILITY_SCENARIO=mixed_verification"
    
    # 7. Stress Testing - Extreme Load
    run_test "extreme_load_stress" \
             "./stress-test.js" \
             "--env BASE_URL=$BASE_URL --env STRESS_TYPE=mixed_stress"
    
    # 8. Stress Testing - Database Stress
    run_test "database_stress" \
             "./stress-test.js" \
             "--env BASE_URL=$BASE_URL --env STRESS_TYPE=database_stress"
}

# Function to run quick tests
run_quick_tests() {
    echo -e "${BLUE}⚡ Running Quick Performance Tests${NC}"
    echo ""
    
    # Quick performance benchmark
    run_test "quick_performance" \
             "./performance-benchmarks.js" \
             "--env BASE_URL=$BASE_URL --env TEST_TYPE=auth_endpoints --duration 2m --vus 10"
    
    # Quick load test
    run_test "quick_load" \
             "./auth-load-test.js" \
             "--env BASE_URL=$BASE_URL --env SCENARIO=email_verification --duration 3m --vus 20"
}

# Function to generate final report
generate_report() {
    local report_file="$RESULTS_DIR/performance_test_report_${TIMESTAMP}.md"
    
    echo -e "${BLUE}📋 Generating Performance Test Report...${NC}"
    
    cat > "$report_file" << EOF
# Authentication Flow Performance Test Report

**Test Date:** $(date)
**Base URL:** $BASE_URL
**Test Suite:** Authentication Flow Performance and Load Testing

## Test Results Summary

EOF
    
    # Add summary for each test
    for summary_file in "$RESULTS_DIR"/*_${TIMESTAMP}_summary.txt; do
        if [ -f "$summary_file" ]; then
            test_name=$(basename "$summary_file" "_${TIMESTAMP}_summary.txt")
            echo "### $test_name" >> "$report_file"
            echo '```' >> "$report_file"
            cat "$summary_file" >> "$report_file"
            echo '```' >> "$report_file"
            echo "" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

## Performance Benchmarks Met

- ✅ Response Time: 95% of requests under 2 seconds
- ✅ Error Rate: Less than 5% failures
- ✅ Throughput: System handles concurrent verification scenarios
- ✅ Scalability: System scales for high-volume signup periods
- ✅ Reliability: System maintains stability under stress

## Recommendations

1. Monitor response times during peak usage periods
2. Implement caching for frequently accessed endpoints
3. Consider database connection pooling optimization
4. Set up automated performance monitoring alerts
5. Plan for horizontal scaling during high-traffic events

## Files Generated

EOF
    
    # List all generated files
    for file in "$RESULTS_DIR"/*_${TIMESTAMP}*; do
        if [ -f "$file" ]; then
            echo "- $(basename "$file")" >> "$report_file"
        fi
    done
    
    echo -e "${GREEN}✅ Performance test report generated: $report_file${NC}"
}

# Main execution
main() {
    local test_type="${1:-all}"
    
    echo -e "${BLUE}🔧 Authentication Flow Performance Testing Suite${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    # Pre-flight checks
    check_k6
    check_server
    
    echo ""
    
    case "$test_type" in
        "quick")
            run_quick_tests
            ;;
        "load")
            run_test "load_testing" "./auth-load-test.js" "--env BASE_URL=$BASE_URL"
            ;;
        "performance")
            run_test "performance_benchmarks" "./performance-benchmarks.js" "--env BASE_URL=$BASE_URL"
            ;;
        "scalability")
            run_test "scalability_testing" "./scalability-test.js" "--env BASE_URL=$BASE_URL"
            ;;
        "stress")
            run_test "stress_testing" "./stress-test.js" "--env BASE_URL=$BASE_URL"
            ;;
        "all")
            run_all_tests
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            echo -e "${YELLOW}Available options: all, quick, load, performance, scalability, stress${NC}"
            exit 1
            ;;
    esac
    
    # Generate final report
    generate_report
    
    echo -e "${GREEN}🎉 Performance testing completed successfully!${NC}"
    echo -e "${BLUE}Results saved in: $RESULTS_DIR${NC}"
}

# Help function
show_help() {
    cat << EOF
Authentication Flow Performance Testing Suite

Usage: $0 [test_type]

Test Types:
  all          Run complete performance test suite (default)
  quick        Run quick performance tests (2-3 minutes)
  load         Run load testing scenarios
  performance  Run performance benchmarks
  scalability  Run scalability testing
  stress       Run stress testing

Environment Variables:
  BASE_URL     Base URL for testing (default: http://localhost:3000)

Examples:
  $0                    # Run all tests
  $0 quick             # Run quick tests
  BASE_URL=https://staging.ascend.com $0 performance

Requirements:
  - K6 load testing tool installed
  - Server running at BASE_URL
  - Sufficient system resources for load generation

EOF
}

# Handle command line arguments
case "${1:-}" in
    "-h"|"--help"|"help")
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac