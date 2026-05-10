import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "da3awat.db");

function generateQrCode(): string {
  return crypto.randomBytes(8).toString("hex");
}

function cleanStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  return String(val).trim() || null;
}

async function main() {
  // Initialize database
  const SQL = await initSqlJs();
  let db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      category TEXT,
      type TEXT NOT NULL,
      parent_name TEXT,
      qr_code TEXT UNIQUE NOT NULL,
      attended INTEGER DEFAULT 0,
      attended_at TEXT,
      source_file TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  let totalImported = 0;

  // === File 1: Winners and Companions ===
  const file1Path = path.join(process.cwd(), "تأكيد حضور الحفل للفائزين والمرافق (الردود).xlsx");
  if (fs.existsSync(file1Path)) {
    console.log("📄 Importing File 1: Winners and Companions...");
    const workbook1 = XLSX.readFile(file1Path);
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const data1 = XLSX.utils.sheet_to_json<Record<string, string>>(sheet1);

    for (const row of data1) {
      const name = cleanStr(row["الاسم :"]);
      const category = cleanStr(row["فئة الفوز:"]);
      const phone = cleanStr(row["الجوال:"]);
      const companion1Name = cleanStr(row["اسم المرافق الأول:"]);
      const companion1Phone = cleanStr(row["جوال المرافق الأول:"]);
      const companion2Name = cleanStr(row["اسم المرافق الثاني :"]);
      const companion2Phone = cleanStr(row["جوال المرافق الثاني :"]);

      if (!name) continue;

      // Add winner
      db.run(
        `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), name, phone || null, category || null, "winner", null, generateQrCode(), "winners"]
      );
      totalImported++;

      // Add companion 1
      if (companion1Name) {
        db.run(
          `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), companion1Name, companion1Phone || null, category || null, "companion", name, generateQrCode(), "winners"]
        );
        totalImported++;
      }

      // Add companion 2
      if (companion2Name) {
        db.run(
          `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), companion2Name, companion2Phone || null, category || null, "companion", name, generateQrCode(), "winners"]
        );
        totalImported++;
      }
    }
    console.log(`   ✅ File 1 processed: ${data1.length} winners`);
  } else {
    console.log("⚠️  File 1 not found:", file1Path);
  }

  // === File 2: Judges, Media, Coordinators ===
  const file2Path = path.join(process.cwd(), "تأكيد حضور الحفل للمحكمين والاعلامين والمنسقين وغيرهم (الردود).xlsx");
  if (fs.existsSync(file2Path)) {
    console.log("📄 Importing File 2: Judges/Coordinators/Others...");
    const workbook2 = XLSX.readFile(file2Path);
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const data2 = XLSX.utils.sheet_to_json<Record<string, string>>(sheet2);

    for (const row of data2) {
      const name = cleanStr(row["الاسم :"]);
      const role = cleanStr(row["الصفة:"]);
      const phone = cleanStr(row["رقم الجوال (05XXXXXXXX):"]);

      if (!name) continue;

      // Determine type based on role
      let type = "other";
      if (role?.includes("محكم")) type = "judge";
      else if (role?.includes("منسق")) type = "coordinator";
      else if (role?.includes("إعلام") || role?.includes("اعلام")) type = "media";

      db.run(
        `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), name, phone || null, role || null, type, null, generateQrCode(), "others"]
      );
      totalImported++;
    }
    console.log(`   ✅ File 2 processed: ${data2.length} entries`);
  } else {
    console.log("⚠️  File 2 not found:", file2Path);
  }

  // Save database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);

  console.log(`\n🎉 Import complete! Total invitations created: ${totalImported}`);
  console.log(`💾 Database saved to: ${DB_PATH}`);

  // Print summary
  const stats = db.exec("SELECT type, COUNT(*) as count FROM guests GROUP BY type");
  if (stats.length > 0) {
    console.log("\n📊 Summary by type:");
    for (const row of stats[0].values) {
      console.log(`   ${row[0]}: ${row[1]}`);
    }
  }
}

main().catch(console.error);
