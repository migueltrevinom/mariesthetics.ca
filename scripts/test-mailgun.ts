import { Buffer } from "buffer";

async function testMailgun() {
  const apiKey = process.env.MAILGUN_API_KEY || "";
  const domain = "mg.mariesthetics.ca";
  const recipient = process.argv[2]; // Optional recipient email from CLI args

  console.log("=== Mailgun API Key Validation ===");
  console.log(`Testing domain: ${domain}`);
  console.log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`);

  const authHeader = "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");
  const headers = {
    Authorization: authHeader,
  };

  let region = "US";
  let domainInfo: any = null;
  let errorMsg = "";

  // 1. Try US API endpoint
  try {
    console.log("\nTrying Mailgun US API (api.mailgun.net)...");
    const response = await fetch(`https://api.mailgun.net/v3/domains/${domain}`, { headers });
    if (response.status === 200) {
      domainInfo = await response.json();
      region = "US";
      console.log("✅ Success! Authenticated via Mailgun US API.");
    } else {
      errorMsg += `US API returned status ${response.status} (${response.statusText})\n`;
    }
  } catch (err: any) {
    errorMsg += `US API network error: ${err.message}\n`;
  }

  // 2. Try EU API endpoint if US failed
  if (!domainInfo) {
    try {
      console.log("Trying Mailgun EU API (api.eu.mailgun.net)...");
      const response = await fetch(`https://api.eu.mailgun.net/v3/domains/${domain}`, { headers });
      if (response.status === 200) {
        domainInfo = await response.json();
        region = "EU";
        console.log("✅ Success! Authenticated via Mailgun EU API.");
      } else {
        errorMsg += `EU API returned status ${response.status} (${response.statusText})\n`;
      }
    } catch (err: any) {
      errorMsg += `EU API network error: ${err.message}\n`;
    }
  }

  // 3. Output domain status if found
  if (domainInfo) {
    console.log("\n=== Domain Information ===");
    console.log(`Domain Name: ${domainInfo.domain?.name}`);
    console.log(`State: ${domainInfo.domain?.state}`);
    console.log(`Created At: ${domainInfo.domain?.created_at}`);
    console.log(`SMTP Login: ${domainInfo.domain?.smtp_login}`);
    console.log(`Wildcard: ${domainInfo.domain?.wildcard}`);
    console.log(`Region: ${region}`);
    
    // 4. Try sending a test email if a recipient is specified
    if (recipient) {
      console.log(`\n=== Sending Test Email to ${recipient} ===`);
      const baseUrl = region === "US" ? "https://api.mailgun.net/v3" : "https://api.eu.mailgun.net/v3";
      
      const formData = new URLSearchParams();
      formData.append("from", `Mailgun Test <test@${domain}>`);
      formData.append("to", recipient);
      formData.append("subject", "Mailgun Sending Key Test");
      formData.append("text", `Hello!\n\nThis is a test email to verify that the Mailgun sending key works for domain: ${domain}.\n\nSent at: ${new Date().toISOString()}`);

      try {
        const sendResponse = await fetch(`${baseUrl}/${domain}/messages`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const resultText = await sendResponse.text();
        if (sendResponse.ok) {
          console.log("✅ Email sent successfully!");
          console.log("Response:", resultText);
        } else {
          console.error(`❌ Failed to send email (Status ${sendResponse.status}):`);
          console.error(resultText);
        }
      } catch (err: any) {
        console.error("❌ Error sending email:", err.message);
      }
    } else {
      console.log("\n💡 To test sending an actual email, pass a recipient email address as a parameter:");
      console.log(`   npx tsx scripts/test-mailgun.ts your-email@example.com`);
    }
  } else {
    console.error("\n❌ Could not validate key for domain mg.mariesthetics.ca.");
    console.error("Errors encountered:");
    console.error(errorMsg);
    
    // Let's also try to just check the keys by listing domains generally.
    console.log("\nTrying generic key verification (listing all domains)...");
    for (const apiBase of ["https://api.mailgun.net/v3", "https://api.eu.mailgun.net/v3"]) {
      try {
        const response = await fetch(`${apiBase}/domains`, { headers });
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Key is valid on API ${apiBase}! Associated domains:`);
          const domainsList = data.items || [];
          if (domainsList.length === 0) {
            console.log("   (No domains associated with this key)");
          } else {
            domainsList.forEach((d: any) => console.log(`   - ${d.name} (${d.state})`));
          }
          return;
        }
      } catch (e) {}
    }
    console.error("❌ Key verification failed completely. The key appears to be invalid or deactivated.");
  }
}

testMailgun().catch(console.error);
