import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "جائزة الأمير فيصل بن بندر بن عبدالعزيز للتميز والإبداع",
  description: "نظام إدارة الدعوات - الدورة الرابعة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-tajawal)]">
        {children}
      </body>
    </html>
  );
}
