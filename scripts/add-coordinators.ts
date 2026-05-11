import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";

const DB_PATH = path.join(process.cwd(), "data", "da3awat.db");

function generateQrCode(): string {
  return crypto.randomBytes(8).toString("hex");
}

async function main() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(DB_PATH)) {
    console.error("❌ Database not found. Please run the import script first.");
    process.exit(1);
  }

  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const coordinators = [
    {
      name: "مشرف مدير تسويق",
      type: "coordinator",
      category: "منسق"
    },
    {
      name: "حمزة العبار",
      type: "coordinator",
      category: "منسق"
    }
  ];

  for (const coord of coordinators) {
    const id = uuidv4();
    const qrCode = generateQrCode();
    
    db.run(
      `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, coord.name, null, coord.category, coord.type, null, qrCode, "manual"]
    );
    
    console.log(`✅ Added: ${coord.name} (QR: ${qrCode})`);
  }

  const data = db.export();
  const bufferOut = Buffer.from(data);
  fs.writeFileSync(DB_PATH, bufferOut);

  console.log(`\n🎉 Successfully added ${coordinators.length} coordinators to the database`);
}

main().catch(console.error);
