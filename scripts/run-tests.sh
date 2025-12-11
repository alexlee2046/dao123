#!/bin/bash
set -e

echo "Starting generic tests..."

echo "1. Running Lint..."
npm run lint

echo "2. Running Unit Tests with Coverage..."
npm run test:coverage

echo "Generic tests passed!"
echo "To run E2E tests, use: npm run test:e2e"
