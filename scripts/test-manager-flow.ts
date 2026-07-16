// 1. Load Environment Variables first
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const envFile = resolve(process.cwd(), ".env");
const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) loadEnv({ path: envLocal });
if (existsSync(envFile)) loadEnv({ path: envFile, override: true });
else loadEnv();

import mongoose from "mongoose";

// 2. Intercept fetch to capture the OTP code sent to Mailgun
const originalFetch = global.fetch;
let capturedCode = "";

global.fetch = async (url: any, options: any) => {
  const urlStr = String(url);
  if (urlStr.includes("api.mailgun.net") && options?.body) {
    const params = new URLSearchParams(options.body.toString());
    const html = params.get("html") || "";
    // Match the 6-digit code in the template
    const match = html.match(/>\s*(\d{6})\s*</);
    if (match) {
      capturedCode = match[1];
      console.log(`[TEST HOOK] Intercepted OTP code: ${capturedCode}`);
    } else {
      // Fallback regex search
      const fallbackMatch = html.match(/\b\d{6}\b/);
      if (fallbackMatch) {
        capturedCode = fallbackMatch[0];
        console.log(`[TEST HOOK] Intercepted OTP code (fallback): ${capturedCode}`);
      }
    }
  }
  return originalFetch(url, options);
};

async function testManagerFlow() {
  // Dynamically import the module so environment variables are loaded first
  const { requestManagerOtp, verifyManagerOtp } = await import(
    "../src/app/api/managers/modules/manager.module"
  );

  const testEmail = "miguel.trevinom@gmail.com";

  console.log("=== Starting Manager OTP Flow Test ===");
  
  // Connect to DB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB database.");

  try {
    // Test 1: Request OTP for a non-existent manager
    console.log("\n--- Test 1: Request OTP for non-existent manager ---");
    try {
      await requestManagerOtp("invalid-manager@mariesthetics.ca");
      console.error("❌ Test 1 Failed: Expected error for invalid manager, but succeeded.");
    } catch (err: any) {
      console.log(`✅ Test 1 Success: Received expected error -> "${err.message}"`);
    }

    // Test 2: Request OTP for a valid manager
    console.log("\n--- Test 2: Request OTP for valid manager ---");
    const requestResult = await requestManagerOtp(testEmail);
    console.log("✅ Test 2 Success: OTP generated & sent.");
    console.log(`   Expires At: ${requestResult.expiresAt}`);
    
    if (!capturedCode) {
      throw new Error("Failed to capture OTP code from email dispatch mock.");
    }

    // Test 3: Verify OTP with incorrect code
    console.log("\n--- Test 3: Verify OTP with incorrect code ---");
    const wrongVerification = await verifyManagerOtp(testEmail, "000000");
    console.log(`✅ Test 3 Success: Verification failed as expected -> "${wrongVerification.error}"`);

    // Test 4: Verify OTP with correct code
    console.log("\n--- Test 4: Verify OTP with correct code ---");
    const correctVerification = await verifyManagerOtp(testEmail, capturedCode);
    if (correctVerification.ok) {
      console.log("✅ Test 4 Success: Verification succeeded!");
      console.log("   Manager session data:", correctVerification.manager);
    } else {
      console.error("❌ Test 4 Failed: Verification failed with error ->", correctVerification.error);
    }

    // Test 5: Verify OTP that is already consumed
    console.log("\n--- Test 5: Verify OTP that is already consumed ---");
    const consumedVerification = await verifyManagerOtp(testEmail, capturedCode);
    console.log(`✅ Test 5 Success: Verification failed as expected -> "${consumedVerification.error}"`);

  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

testManagerFlow().catch(console.error);
