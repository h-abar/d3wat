import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";

const DB_PATH = path.join(process.cwd(), "data", "da3awat.db");

async function main() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(DB_PATH)) {
    console.error("❌ Database not found.");
    process.exit(1);
  }

  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  // Update phone number for نجلاء مزيد العصيمي
  db.run(
    "UPDATE guests SET phone = ? WHERE name = ?",
    ["0559271301", "نجلاء مزيد العصيمي"]
  );

  const results = db.exec("SELECT changes() as count");
  const count = results[0]?.values[0]?.[0] || 0;

  if (count as number > 0) {
    console.log(`✅ Updated phone number for نجلاء مزيد العصيمي to 0559271301`);
  } else {
    console.log(`⚠️  Guest not found: نجلاء مزيد العصيمي`);
  }

  const data = db.export();
  const bufferOut = Buffer.from(data);
  fs.writeFileSync(DB_PATH, bufferOut);
}

main().catch(console.error);
