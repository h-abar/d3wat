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

  const guests = [
    {
      name: "مشرف مدير تسليق",
      type: "coordinator",
      category: "منسق",
      phone: null
    },
    {
      name: "حمزة العبار",
      type: "coordinator",
      category: "منسق",
      phone: null
    },
    {
      name: "د.رقية بنت صالح السنيدي",
      type: "judge",
      category: "محكم",
      phone: "553418144"
    },
    {
      name: "هلا سعد عبدالله الشقاوي",
      type: "judge",
      category: "محكم",
      phone: "0505399547"
    },
    {
      name: "د. محمد رشيد سعد الرشيد",
      type: "judge",
      category: "محكم",
      phone: "0555494067"
    },
    {
      name: "د. عاليه عبدالعزيز ال عامر",
      type: "other",
      category: "مدعو من إدارة تعليم الرياض",
      phone: "0541294422"
    },
    {
      name: "نوره بنت عبدالله العرفج",
      type: "other",
      category: "مدعو من إدارة تعليم الرياض",
      phone: "0555245401"
    },
    {
      name: "نوره الجبرين",
      type: "judge",
      category: "محكم",
      phone: "555266127"
    },
    {
      name: "حسين عبدالله الخثعمي",
      type: "companion",
      category: "مرافق مع القارئ",
      phone: "530135773",
      parent_name: "عبدالله حسين الخثعمي"
    },
    {
      name: "عبدالله حسين الخثعمي",
      type: "other",
      category: "قارئ القرآن",
      phone: "554048556"
    },
    {
      name: "محمد العتيبي",
      type: "other",
      category: "مقدم الحفل",
      phone: "509371670"
    }
  ];

  for (const guest of guests) {
    const id = uuidv4();
    const qrCode = generateQrCode();
    
    db.run(
      `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, guest.name, guest.phone, guest.category, guest.type, guest.parent_name || null, qrCode, "manual"]
    );
    
    console.log(`✅ Added: ${guest.name} (QR: ${qrCode})`);
  }

  const data = db.export();
  const bufferOut = Buffer.from(data);
  fs.writeFileSync(DB_PATH, bufferOut);

  console.log(`\n🎉 Successfully added ${guests.length} guests to the database`);
}

main().catch(console.error);
