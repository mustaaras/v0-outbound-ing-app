/**
 * Local test script to diagnose Snov token exchange.
 * 
 * Run this with:
 *   npx ts-node scripts/test-snov-token.ts
 * 
 * Set environment variables before running:
 *   export SNOV_API_USER_ID="your_api_user_id"
 *   export SNOV_API_SECRET="your_api_secret"
 */

const apiUserID = process.env.SNOV_API_USER_ID;
const apiSecret = process.env.SNOV_API_SECRET;

if (!apiUserID || !apiSecret) {
  console.error("❌ Missing environment variables!");
  console.error("   Set SNOV_API_USER_ID and SNOV_API_SECRET before running this script.");
  process.exit(1);
}

// Assert they are defined for TypeScript
const clientId = apiUserID as string;
const clientSecret = apiSecret as string;

console.log("🔍 Testing Snov token exchange...");
console.log(`   API User ID: ${clientId.slice(0, 4)}...${clientId.slice(-4)}`);
console.log(`   API Secret: ${clientSecret.slice(0, 4)}...${clientSecret.slice(-4)}\n`);

// Candidate token endpoints
const candidateUrls = [
  "https://api.snov.io/v1/oauth/access_token",
  "https://api.snov.io/v2/oauth/token",
  "https://api.snov.io/oauth/token",
];

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  errors?: any;
  [key: string]: any;
}

async function testTokenEndpoint(
  url: string,
  clientId: string,
  clientSecret: string,
  useBasicAuth: boolean
): Promise<{ success: boolean; data: TokenResponse | string; status: number }> {
  const form = new URLSearchParams();
  form.append("grant_type", "client_credentials");

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let body = form.toString();

  if (useBasicAuth) {
    // Use HTTP Basic auth
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
  } else {
    // Include credentials in body
    form.append("client_id", clientId);
    form.append("client_secret", clientSecret);
    body = form.toString();
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const text = await response.text();
    let data: TokenResponse | string = text;

    try {
      data = JSON.parse(text);
    } catch {
      // Keep raw text
    }

    return {
      success: response.ok,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      data: error instanceof Error ? error.message : "Unknown error",
      status: 0,
    };
  }
}

async function runTests() {
  console.log("📋 Testing token endpoints:\n");

  for (const url of candidateUrls) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔗 ${url}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Test with credentials in body
    console.log("  📝 Attempt 1: Credentials in POST body");
    const bodyResult = await testTokenEndpoint(url, clientId, clientSecret, false);
    console.log(
      `     Status: ${bodyResult.status} ${bodyResult.success ? "✅" : "❌"}`
    );
    console.log(
      `     Response: ${JSON.stringify(bodyResult.data, null, 2)
        .split("\n")
        .join("\n     ")}`
    );
    console.log();

    if (bodyResult.success && typeof bodyResult.data === "object" && "access_token" in bodyResult.data) {
      console.log("   ✨ SUCCESS! Token obtained with body credentials.\n");
      return { url, method: "body", data: bodyResult.data };
    }

    // Test with Basic auth
    console.log("  🔐 Attempt 2: HTTP Basic auth");
    const basicResult = await testTokenEndpoint(url, clientId, clientSecret, true);
    console.log(
      `     Status: ${basicResult.status} ${basicResult.success ? "✅" : "❌"}`
    );
    console.log(
      `     Response: ${JSON.stringify(basicResult.data, null, 2)
        .split("\n")
        .join("\n     ")}`
    );
    console.log();

    if (
      basicResult.success &&
      typeof basicResult.data === "object" &&
      "access_token" in basicResult.data
    ) {
      console.log("   ✨ SUCCESS! Token obtained with Basic auth.\n");
      return { url, method: "basic", data: basicResult.data };
    }
  }

  console.log(
    "❌ No token endpoint succeeded. Debugging notes:\n"
  );
  console.log(
    "1. Verify your API User ID and API Secret are correct."
  );
  console.log(
    "2. Check Snov documentation for the correct token endpoint URL."
  );
  console.log(
    "3. Ensure your Snov account has OAuth/API access enabled."
  );
  console.log(
    "4. Contact Snov support with the URLs and responses above.\n"
  );
}

runTests().catch(console.error);
