#!/bin/bash
# Validate VNPay environment configuration
# Usage: ./validate-vnpay-config.sh [local|production]

ENV=${1:-local}

echo "🔍 Validating VNPay Configuration for: $ENV"
echo "================================================"
echo ""

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation functions
validate_url() {
  local var_name=$1
  local var_value=$2
  local should_contain=$3
  local should_not_contain=$4
  
  if [ -z "$var_value" ]; then
    echo -e "${RED}❌ $var_name is not set!${NC}"
    return 1
  fi
  
  if [[ ! "$var_value" =~ ^https?:// ]]; then
    echo -e "${RED}❌ $var_name must start with http:// or https://${NC}"
    echo "   Current: $var_value"
    return 1
  fi
  
  if [[ "$var_value" =~ /$ ]]; then
    echo -e "${YELLOW}⚠️  $var_name should not end with /${NC}"
    echo "   Current: $var_value"
  fi
  
  if [ -n "$should_contain" ] && [[ ! "$var_value" =~ $should_contain ]]; then
    echo -e "${YELLOW}⚠️  $var_name might be incorrect${NC}"
    echo "   Expected to contain: $should_contain"
    echo "   Current: $var_value"
  fi
  
  if [ -n "$should_not_contain" ] && [[ "$var_value" =~ $should_not_contain ]]; then
    echo -e "${RED}❌ $var_name contains forbidden pattern: $should_not_contain${NC}"
    echo "   Current: $var_value"
    return 1
  fi
  
  echo -e "${GREEN}✅ $var_name: $var_value${NC}"
  return 0
}

echo "📋 Required Environment Variables:"
echo ""

# Validate Storefront URL
echo "1. Storefront URL (where VNPay redirects users)"
if [ "$ENV" = "local" ]; then
  validate_url "NEXT_PUBLIC_STOREFRONT_URL" "$NEXT_PUBLIC_STOREFRONT_URL" "localhost:3001" "payment-vnpay"
else
  validate_url "NEXT_PUBLIC_STOREFRONT_URL" "$NEXT_PUBLIC_STOREFRONT_URL" "vercel.app" "payment-vnpay"
fi
echo ""

# Validate IPN URL
echo "2. IPN URL (VNPay backend webhook to payment app)"
if [ "$ENV" = "local" ]; then
  validate_url "VNPAY_IPN_URL" "$VNPAY_IPN_URL" "localhost:3000" ""
else
  validate_url "VNPAY_IPN_URL" "$VNPAY_IPN_URL" "payment-vnpay" ""
fi
echo ""

# Validate VNPay Credentials
echo "3. VNPay Credentials"
if [ -z "$VNPAY_TMN_CODE" ]; then
  echo -e "${RED}❌ VNPAY_TMN_CODE is not set!${NC}"
else
  echo -e "${GREEN}✅ VNPAY_TMN_CODE: ${VNPAY_TMN_CODE:0:8}...${NC}"
fi

if [ -z "$VNPAY_HASH_SECRET" ]; then
  echo -e "${RED}❌ VNPAY_HASH_SECRET is not set!${NC}"
else
  echo -e "${GREEN}✅ VNPAY_HASH_SECRET: ${VNPAY_HASH_SECRET:0:8}...${NC}"
fi
echo ""

# Validate Saleor API
echo "4. Saleor API URL"
validate_url "NEXT_PUBLIC_SALEOR_API_URL" "$NEXT_PUBLIC_SALEOR_API_URL" "graphql" ""
echo ""

# Common mistakes check
echo "================================================"
echo "🔍 Checking for common mistakes..."
echo ""

ERRORS=0

# Check 1: Storefront URL should NOT be payment app
if [[ "$NEXT_PUBLIC_STOREFRONT_URL" =~ "payment-vnpay" ]]; then
  echo -e "${RED}❌ CRITICAL: NEXT_PUBLIC_STOREFRONT_URL points to payment app!${NC}"
  echo "   This will cause popup not to close and order not to complete!"
  echo "   Fix: Set it to your storefront domain"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: IPN URL should be payment app (not storefront)
if [[ "$VNPAY_IPN_URL" =~ "vnpay-return" ]]; then
  echo -e "${RED}❌ CRITICAL: VNPAY_IPN_URL contains 'vnpay-return'!${NC}"
  echo "   IPN should go to payment app backend, not storefront!"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: URLs should match environment
if [ "$ENV" = "local" ]; then
  if [[ ! "$NEXT_PUBLIC_STOREFRONT_URL" =~ "localhost" ]]; then
    echo -e "${YELLOW}⚠️  Running in local mode but storefront URL is not localhost${NC}"
    echo "   This might be intentional (testing with prod storefront)"
  fi
elif [ "$ENV" = "production" ]; then
  if [[ "$NEXT_PUBLIC_STOREFRONT_URL" =~ "localhost" ]]; then
    echo -e "${RED}❌ Running in production mode but storefront URL is localhost!${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 4: Exchange rates configured
if [ -z "$EXCHANGE_RATE_USD_TO_VND" ]; then
  echo -e "${YELLOW}⚠️  EXCHANGE_RATE_USD_TO_VND not set (will use default: 25000)${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Configuration looks good.${NC}"
  echo ""
  echo "🚀 Summary:"
  echo "   VNPay will redirect users → $NEXT_PUBLIC_STOREFRONT_URL/vnpay-return"
  echo "   VNPay will send IPN webhook → $VNPAY_IPN_URL"
  echo ""
  echo "🧪 Test flow:"
  echo "   1. Start payment app: npm run dev"
  echo "   2. Go to checkout and pay with VNPay"
  echo "   3. After payment, you should be redirected to storefront"
  echo "   4. Order should be created in Saleor"
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS critical error(s)!${NC}"
  echo ""
  echo "🔧 Fix steps:"
  echo "   1. Edit .env file"
  echo "   2. Set NEXT_PUBLIC_STOREFRONT_URL to your storefront domain"
  echo "   3. Set VNPAY_IPN_URL to payment app backend"
  echo "   4. Run this script again: ./validate-vnpay-config.sh $ENV"
  exit 1
fi
