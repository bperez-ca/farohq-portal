#!/bin/bash

# Generate TypeScript SDK from OpenAPI specification
# This script reads the OpenAPI spec from farohq-core-app and generates the SDK

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CORE_APP_DIR="$(cd "$PROJECT_ROOT/../farohq-core-app" && pwd)"
OPENAPI_SPEC="$CORE_APP_DIR/api/openapi.yaml"
SDK_OUTPUT_DIR="$PROJECT_ROOT/src/lib/sdk"

# Check if OpenAPI spec exists
if [ ! -f "$OPENAPI_SPEC" ]; then
    echo "Error: OpenAPI specification not found at $OPENAPI_SPEC"
    exit 1
fi

echo "Generating TypeScript SDK from OpenAPI specification..."
echo "Source: $OPENAPI_SPEC"
echo "Output: $SDK_OUTPUT_DIR"

# Create output directory if it doesn't exist
mkdir -p "$SDK_OUTPUT_DIR"

# Generate SDK using OpenAPI Generator
cd "$PROJECT_ROOT"
npx @openapitools/openapi-generator-cli generate \
    -i "$OPENAPI_SPEC" \
    -g typescript-fetch \
    -o "$SDK_OUTPUT_DIR" \
    --additional-properties=typescriptThreePlus=true,supportsES6=true,npmName=@farohq/sdk,npmVersion=1.0.0

echo "SDK generation complete!"
echo "Generated SDK is available at: $SDK_OUTPUT_DIR"
