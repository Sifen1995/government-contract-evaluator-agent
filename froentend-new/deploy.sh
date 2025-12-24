#!/bin/bash

# GovAI Frontend v2 Deployment Script
# Deploys Vite/React frontend to S3 + CloudFront

set -e  # Exit on any error

# Configuration
S3_BUCKET="govcontract-ai-2.hapotech.com"
CLOUDFRONT_DISTRIBUTION_ID="E2ZB5OYHI5GR82"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting GovAI Frontend v2 deployment...${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Step 2: Build for production
echo -e "${YELLOW}Building for production...${NC}"
npm run build

# Step 3: Sync to S3
echo -e "${YELLOW}Syncing to S3 bucket: ${S3_BUCKET}...${NC}"
aws s3 sync dist s3://${S3_BUCKET} --delete

# Step 4: Invalidate CloudFront cache
echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}CloudFront invalidation created: ${INVALIDATION_ID}${NC}"

# Step 5: Wait for invalidation to complete (optional)
echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"
aws cloudfront wait invalidation-completed \
    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
    --id ${INVALIDATION_ID}

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "   - S3 Bucket: ${S3_BUCKET}"
echo -e "   - CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID}"
echo -e "   - URL: https://govcontract-ai-2.hapotech.com"
