#!/bin/bash
# Script to run Jest tests one at a time
# This is useful for debugging tests that might interfere with each other

# Set the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to run a single test file
run_single_test() {
  local test_file=$1
  local test_name=$(basename "$test_file")
  
  echo -e "\n${YELLOW}Running test: ${test_name}${NC}"
  echo "========================================"
  
  # Run the test with Jest
  npx jest "$test_file" --verbose
  
  # Check the result
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed: ${test_name}${NC}"
    return 0
  else
    echo -e "${RED}✗ Test failed: ${test_name}${NC}"
    return 1
  fi
}

# Find all test files
echo -e "${YELLOW}Finding test files...${NC}"
TEST_FILES=$(find tests -name "*.test.js")

# Count total tests
TOTAL_TESTS=$(echo "$TEST_FILES" | wc -l)
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${YELLOW}Found ${TOTAL_TESTS} test files${NC}"
echo "========================================"

# Run each test file individually
for test_file in $TEST_FILES; do
  run_single_test "$test_file"
  if [ $? -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  # Add a small delay between tests to ensure cleanup
  sleep 1
done

# Print summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo "========================================"
echo -e "Total tests: ${TOTAL_TESTS}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed!${NC}"
  exit 1
fi