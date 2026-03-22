#!/bin/bash

# VNPay Configuration Validator (New Version)
# ===========================================
# Validates all environment variables with defaults

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' #No Color

# Check .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ .env file not found!${NC}"
  echo "Create .env file with required variables"
  exit 1
fi

# Source .env
set -a
source .env
set +a

echo -e "${BLUE}🔍 VNPay Configuration Validation${NC}"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# 1. Base URLs
echo -e "${BLUE}1. Base URLs${NC}"
echo "-------------------"

if [ -z "$PAYMENT_APP_BASE_URL" ]; then
  echo -e "${YELLOW}⚠️  PAYMENT_APP_BASE_URL not set (will default to http://localhost:3000)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ PAYMENT_APP_BASE_URL: $PAYMENT_APP_BASE_URL${NC}"
fi

if [ -z "$STOREFRONT_BASE_URL" ]; then
  echo -e "${YELLOW}⚠️  STOREFRONT_BASE_URL not set (will default to http://localhost:3000)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ STOREFRONT_BASE_URL: $STOREFRONT_BASE_URL${NC}"
fi

echo ""

# 2. VNPay Callbacks
echo -e "${BLUE}2. VNPay Callback URLs${NC}"
echo "-------------------"

if [ -z "$VNPAY_RETURN_URL" ]; then
  echo -e "${YELLOW}⚠️  VNPAY_RETURN_URL not set (will auto-detect)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ VNPAY_RETURN_URL: $VNPAY_RETURN_URL${NC}"
  
  # Check if pointing to payment app (except localhost:3000 which is OK for integrated mode)
  if [[ "$VNPAY_RETURN_URL" == *"payment-vnpay"* ]]; then
    echo -e "${RED}❌ VNPAY_RETURN_URL points to payment-vnpay domain! Should be storefront.${NC}"
    ERRORS=$((ERRORS+1))
  elif [[ "$VNPAY_RETURN_URL" == *"localhost:3000/vnpay-return"* ]] && [[ "$STOREFRONT_BASE_URL" == *"localhost:3000"* ]]; then
    echo -e "${BLUE}ℹ️  Note: Using integrated mode (payment app + storefront on same domain)${NC}"
  fi
fi

if [ -z "$VNPAY_IPN_WEBHOOK_URL" ]; then
  echo -e "${YELLOW}⚠️  VNPAY_IPN_WEBHOOK_URL not set (will use default)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ VNPAY_IPN_WEBHOOK_URL: $VNPAY_IPN_WEBHOOK_URL${NC}"
  
  # Check if ends with correct path
  if [[ "$VNPAY_IPN_WEBHOOK_URL" != *"/api/vnpay/ipn" ]]; then
    echo -e "${RED}❌ VNPAY_IPN_WEBHOOK_URL must end with /api/vnpay/ipn${NC}"
    ERRORS=$((ERRORS+1))
  fi
fi

echo ""

# 3. Credentials
echo -e "${BLUE}3. VNPay Credentials${NC}"
echo "-------------------"

if [ -z "$VNPAY_TMN_CODE" ]; then
  echo -e "${RED}❌ VNPAY_TMN_CODE is required!${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ VNPAY_TMN_CODE: ${VNPAY_TMN_CODE:0:8}...${NC}"
fi

if [ -z "$VNPAY_HASH_SECRET" ]; then
  echo -e "${RED}❌ VNPAY_HASH_SECRET is required!${NC}"
  ERRORS=$((ERRORS+1))
else
  echo -e "${GREEN}✅ VNPAY_HASH_SECRET: ${VNPAY_HASH_SECRET:0:8}...${NC}"
fi

if [ -z "$VNPAY_ENVIRONMENT" ]; then
  echo -e "${YELLOW}⚠️  VNPAY_ENVIRONMENT not set (will default to sandbox)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ VNPAY_ENVIRONMENT: $VNPAY_ENVIRONMENT${NC}"
fi

echo ""

# 4. Exchange Rates
echo -e "${BLUE}4. Currency Exchange Rates${NC}"
echo "-------------------"

if [ -z "$EXCHANGE_RATE_USD_TO_VND" ]; then
  echo -e "${YELLOW}⚠️  EXCHANGE_RATE_USD_TO_VND not set (will default to 25000)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ Exchange USD→VND: $EXCHANGE_RATE_USD_TO_VND${NC}"
fi

if [ -z "$EXCHANGE_RATE_EUR_TO_VND" ]; then
  echo -e "${YELLOW}⚠️  EXCHANGE_RATE_EUR_TO_VND not set (will default to 27000)${NC}"
  WARNINGS=$((WARNINGS+1))
else
  echo -e "${GREEN}✅ Exchange EUR→VND: $EXCHANGE_RATE_EUR_TO_VND${NC}"
fi

echo ""
echo "================================================"

# Summary
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Validation FAILED: $ERRORS error(s)${NC}"
  echo "Fix errors above before running app."
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Passed with $WARNINGS warning(s)${NC}"
  echo "Defaults will be used for missing values."
else
  echo -e "${GREEN}✅ Perfect! All variables configured.${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Payment Flow:${NC}"
echo ""
echo "1. VNPay redirects users to:"
echo -e "   ${GREEN}${VNPAY_RETURN_URL:-${STOREFRONT_BASE_URL:-http://localhost:3000}/vnpay-return}${NC}"
echo ""
echo "2. VNPay sends webhook to:"
echo -e "   ${GREEN}${VNPAY_IPN_WEBHOOK_URL:-${PAYMENT_APP_BASE_URL:-http://localhost:3000}/api/vnpay/ipn}${NC}"
echo ""

exit 0
