#!/bin/bash

# License header checking script for depmanager
# 
# Copyright (c) 2024, depmanager contributors
# 
# This source code is licensed under the ISC license found in the
# LICENSE file in the root directory of this source tree.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Required license text to check for
REQUIRED_TEXT="Copyright (c) 2024, depmanager contributors"
LICENSE_TEXT="This source code is licensed under the ISC license found in the"

echo "🔍 Checking license headers in source files..."

# Files to check
FILES_TO_CHECK=$(find . -name "*.ts" -o -name "*.js" | grep -E "\.(ts|js)$" | grep -v node_modules | grep -v dist | grep -v coverage | grep -v verify-tests.js)

MISSING_FILES=()
CHECKED_COUNT=0

for file in $FILES_TO_CHECK; do
  # Skip if it's a generated file or config
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist/"* ]] || [[ "$file" == *"coverage/"* ]]; then
    continue
  fi
  
  CHECKED_COUNT=$((CHECKED_COUNT + 1))
  
  # Check if the file contains the required license text
  if ! grep -q "$REQUIRED_TEXT" "$file" || ! grep -q "$LICENSE_TEXT" "$file"; then
    MISSING_FILES+=("$file")
    echo -e "${RED}✗${NC} Missing license header: $file"
  else
    echo -e "${GREEN}✓${NC} License header found: $file"
  fi
done

echo ""
echo "📊 Summary:"
echo "   Files checked: $CHECKED_COUNT"
echo "   Files with valid license headers: $((CHECKED_COUNT - ${#MISSING_FILES[@]}))"
echo "   Files missing license headers: ${#MISSING_FILES[@]}"

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All source files have valid license headers!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ The following files are missing valid license headers:${NC}"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo -e "${YELLOW}Expected header format:${NC}"
  echo "/**"
  echo " * [Description of the file]"
  echo " * "
  echo " * Copyright (c) 2024, depmanager contributors"
  echo " * "
  echo " * This source code is licensed under the ISC license found in the"
  echo " * LICENSE file in the root directory of this source tree."
  echo " */"
  exit 1
fi
