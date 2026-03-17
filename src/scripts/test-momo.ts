/**
 * Automated test runner for MoMo payment integration
 * Run this script to test all payment flows
 * 
 * Usage:
 *   pnpm tsx src/scripts/test-momo.ts
 */

import type { TestResult } from "../lib/momo/test-utils";
import {
  generateTestOrder,
  TEST_SCENARIOS,
  validateTestOrder,
  formatVND,
  parseResultCode,
  generateTestReport,
  delay,
} from "../lib/momo/test-utils";

const API_BASE = process.env.APP_API_BASE_URL || "http://localhost:3000";

/**
 * Test: Initialize Payment
 */
async function testInitializePayment(): Promise<TestResult> {
  const startTime = Date.now();
  const testOrder = generateTestOrder(TEST_SCENARIOS.SUCCESS);

  try {
    console.log(`\n🧪 Testing: Initialize Payment`);
    console.log(`   Order ID: ${testOrder.orderId}`);
    console.log(`   Amount: ${formatVND(testOrder.amount)}`);

    const response = await fetch(`${API_BASE}/api/test/momo-initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Payment initialization failed");
    }

    const { resultCode, message, payUrl, qrCodeUrl } = data.data;

    if (resultCode !== 0) {
      throw new Error(`MoMo returned error: ${message} (code: ${resultCode})`);
    }

    if (!payUrl || !qrCodeUrl) {
      throw new Error("Missing payUrl or qrCodeUrl in response");
    }

    console.log(`   ✅ Payment URL: ${payUrl.substring(0, 50)}...`);
    console.log(`   ✅ QR Code URL: ${qrCodeUrl.substring(0, 50)}...`);

    return {
      name: "Initialize Payment",
      passed: true,
      duration: Date.now() - startTime,
      details: { orderId: testOrder.orderId, payUrl },
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Initialize Payment",
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Query Payment Status (simulated)
 */
async function testQueryPaymentStatus(): Promise<TestResult> {
  const startTime = Date.now();
  const testOrder = generateTestOrder();

  try {
    console.log(`\n🧪 Testing: Query Payment Status`);
    console.log(`   Order ID: ${testOrder.orderId}`);

    // First initialize a payment
    const initResponse = await fetch(`${API_BASE}/api/test/momo-initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    if (!initResponse.ok) {
      throw new Error("Failed to initialize payment for query test");
    }

    const initData = await initResponse.json();
    const { requestId } = initData.data;

    // Wait a bit before querying
    await delay(1000);

    // Query the payment status
    const queryResponse = await fetch(`${API_BASE}/api/test/momo-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: testOrder.orderId,
        requestId,
      }),
    });

    if (!queryResponse.ok) {
      throw new Error(`HTTP ${queryResponse.status}: ${queryResponse.statusText}`);
    }

    const queryData = await queryResponse.json();

    if (!queryData.success) {
      throw new Error(queryData.error || "Query failed");
    }

    const { resultCode, message } = queryData.data;
    const parsed = parseResultCode(resultCode);

    console.log(`   ℹ️  Status: ${parsed.status} - ${parsed.message}`);
    console.log(`   ℹ️  Result Code: ${resultCode}`);

    // Consider both 0 (success) and 1002 (pending) as valid for query
    if (resultCode !== 0 && resultCode !== 1002) {
      console.log(`   ⚠️  Warning: Unexpected result code ${resultCode}`);
    }

    return {
      name: "Query Payment Status",
      passed: true,
      duration: Date.now() - startTime,
      details: { orderId: testOrder.orderId, resultCode, status: parsed.status },
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Query Payment Status",
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Validate Test Data
 */
async function testDataValidation(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🧪 Testing: Data Validation`);

    // Test valid order
    const validOrder = generateTestOrder();
    const validResult = validateTestOrder(validOrder);

    if (!validResult.valid) {
      throw new Error(`Valid order failed validation: ${validResult.errors.join(", ")}`);
    }

    console.log(`   ✅ Valid order passed validation`);

    // Test invalid amount
    const invalidOrder = generateTestOrder({ amount: -100 });
    const invalidResult = validateTestOrder(invalidOrder);

    if (invalidResult.valid) {
      throw new Error("Invalid order passed validation");
    }

    if (!invalidResult.errors.includes("Amount must be greater than 0")) {
      throw new Error("Expected validation error for negative amount");
    }

    console.log(`   ✅ Invalid order correctly rejected`);

    // Test minimum amount
    const smallOrder = generateTestOrder({ amount: 5000 });
    const smallResult = validateTestOrder(smallOrder);

    if (smallResult.valid) {
      throw new Error("Order below minimum amount passed validation");
    }

    console.log(`   ✅ Minimum amount validation works`);

    return {
      name: "Data Validation",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Data Validation",
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Special Characters in Order Info
 */
async function testSpecialCharacters(): Promise<TestResult> {
  const startTime = Date.now();
  const testOrder = generateTestOrder(TEST_SCENARIOS.SPECIAL_CHARACTERS);

  try {
    console.log(`\n🧪 Testing: Special Characters`);
    console.log(`   Order Info: ${testOrder.orderInfo}`);

    const response = await fetch(`${API_BASE}/api/test/momo-initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Request failed");
    }

    const { resultCode } = data.data;

    if (resultCode !== 0) {
      throw new Error(`MoMo rejected special characters (code: ${resultCode})`);
    }

    console.log(`   ✅ Special characters handled correctly`);

    return {
      name: "Special Characters",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Special Characters",
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Large Amount Payment
 */
async function testLargeAmount(): Promise<TestResult> {
  const startTime = Date.now();
  const testOrder = generateTestOrder(TEST_SCENARIOS.LARGE_AMOUNT);

  try {
    console.log(`\n🧪 Testing: Large Amount`);
    console.log(`   Amount: ${formatVND(testOrder.amount)}`);

    const response = await fetch(`${API_BASE}/api/test/momo-initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Request failed");
    }

    const { resultCode } = data.data;

    if (resultCode !== 0) {
      throw new Error(`MoMo rejected large amount (code: ${resultCode})`);
    }

    console.log(`   ✅ Large amount handled correctly`);

    return {
      name: "Large Amount",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Large Amount",
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("🚀 MoMo Payment Integration - Automated Tests");
  console.log("═══════════════════════════════════════════════");
  console.log(`API Base: ${API_BASE}`);
  console.log("");

  const results: TestResult[] = [];

  // Run tests
  results.push(await testDataValidation());
  results.push(await testInitializePayment());
  results.push(await testQueryPaymentStatus());
  results.push(await testSpecialCharacters());
  results.push(await testLargeAmount());

  // Generate report
  console.log("\n═══════════════════════════════════════════════");
  console.log("📊 Test Report");
  console.log("═══════════════════════════════════════════════");

  const report = generateTestReport(results);

  console.log(`\nTotal Tests: ${report.total}`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`❌ Failed: ${report.failed}`);
  console.log(`Success Rate: ${report.successRate}`);

  console.log("\nDetailed Results:");
  results.forEach((result, index) => {
    const icon = result.passed ? "✅" : "❌";
    const duration = `${result.duration}ms`;
    console.log(`${index + 1}. ${icon} ${result.name} (${duration})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log("\n═══════════════════════════════════════════════\n");

  // Exit with error code if any tests failed
  process.exit(report.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("\n❌ Test runner failed:", error);
  process.exit(1);
});
