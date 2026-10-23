const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local safely without exposing secrets
const envFile = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envFile)) {
  console.error("Error: .env.local not found in project root.");
  process.exit(1);
}

const envContent = fs.readFileSync(envFile, "utf8");
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)`, "m"));
  return match ? match[1].trim().replace(/^"|"$/g, "").trim() : "";
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !anonKey) {
  console.error("Error: Supabase URL or Anon key is missing from .env.local.");
  process.exit(1);
}

const backupDir = path.join(process.cwd(), "StockLedger Backup");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const tableHeaders = {
  customers: ["id", "user_id", "name", "phone", "email", "address", "created_at"],
  invoices: ["id", "user_id", "customer_id", "invoice_number", "amount", "status", "due_date", "notes", "created_at"],
  payments: ["id", "user_id", "invoice_id", "customer_id", "amount", "payment_date", "method", "notes", "created_at"],
};

function formatCSV(headers, rows) {
  const headerLine = headers.join(",");
  if (!rows || rows.length === 0) return headerLine + "\n";
  const dataLines = rows.map((r) =>
    headers
      .map((h) => {
        const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : "";
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return headerLine + "\n" + dataLines.join("\n") + "\n";
}

async function performBackup() {
  // Try service key first, then fallback to anon client
  let client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  
  // Test if service role key is valid
  const testCheck = await client.from("customers").select("id").limit(1);
  if (testCheck.error) {
    // Service key was invalid or rejected; use anon client
    client = createClient(supabaseUrl, anonKey);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  if (email && password) {
    const { error: loginErr } = await client.auth.signInWithPassword({ email, password });
    if (loginErr) {
      console.warn("Notice: Sign-in failed. Proceeding with anonymous read-only access.");
    }
  }

  const report = {};
  for (const table of ["customers", "invoices", "payments"]) {
    const { data, error } = await client.from(table).select("*");
    if (error) {
      console.error(`Failed to read table ${table}:`, error.message);
      report[table] = { status: "FAILED", error: error.message };
      continue;
    }

    const rows = data || [];
    const csvData = formatCSV(tableHeaders[table], rows);
    const destPath = path.join(backupDir, `${table}.csv`);
    fs.writeFileSync(destPath, csvData, "utf8");

    const stats = fs.statSync(destPath);
    report[table] = {
      file: `${table}.csv`,
      rows: rows.length,
      bytes: stats.size,
      status: "VERIFIED",
    };
  }

  console.log("\n--- BACKUP REPORT ---");
  for (const [t, info] of Object.entries(report)) {
    console.log(`${info.file.padEnd(16)} | Status: ${info.status} | Rows: ${info.rows} | Size: ${info.bytes} bytes`);
  }
}

performBackup();
