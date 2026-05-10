"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ScanResult {
  id: string;
  name: string;
  category: string | null;
  type: string;
  parent_name: string | null;
  attended: number;
  attended_at: string | null;
}

export default function ScannerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "already" | "error">("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const ORGANIZER_PIN = "2026";

  const handleLogin = () => {
    if (pin === ORGANIZER_PIN) {
      setIsAuthenticated(true);
    } else {
      setMessage("الرقم السري غير صحيح");
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) return;

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Extract QR code from URL
          const qrCode = decodedText.split("/invitation/").pop()?.split("?")[0] || decodedText;
          await handleScan(qrCode);
          // Pause scanning after successful read
          await scanner.pause();
          setTimeout(async () => {
            try {
              await scanner.resume();
            } catch {
              // Scanner might have been stopped
            }
          }, 3000);
        },
        () => {
          // QR code not detected - ignore
        }
      );
      setScanning(true);
    } catch (err) {
      console.error("Scanner error:", err);
      setMessage("لم يتم العثور على الكاميرا أو تم رفض الإذن");
    }
  };

  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Ignore
      }
    }
    setScanning(false);
  };

  const handleScan = async (qrCode: string) => {
    try {
      // First check guest info
      const checkRes = await fetch(`/send/api/verify/${qrCode}`);
      if (!checkRes.ok) {
        setStatus("error");
        setMessage("الدعوة غير موجودة في النظام");
        setResult(null);
        return;
      }

      const guestData = await checkRes.json();

      if (guestData.attended) {
        setStatus("already");
        setMessage(`تم تسجيل الحضور مسبقاً في: ${new Date(guestData.attended_at).toLocaleTimeString("ar-SA")}`);
        setResult(guestData);
        return;
      }

      // Mark attendance
      const res = await fetch(`/send/api/verify/${qrCode}`, { method: "POST" });
      if (res.ok) {
        const updatedGuest = await res.json();
        setStatus("success");
        setMessage("تم تأكيد الحضور بنجاح!");
        setResult(updatedGuest);
      } else {
        setStatus("error");
        setMessage("حدث خطأ في تسجيل الحضور");
      }
    } catch {
      setStatus("error");
      setMessage("حدث خطأ في الاتصال");
    }
  };

  // Manual QR code input
  const [manualCode, setManualCode] = useState("");
  const handleManualScan = () => {
    if (manualCode.trim()) {
      const qrCode = manualCode.includes("/invitation/")
        ? manualCode.split("/invitation/").pop() || manualCode
        : manualCode;
      handleScan(qrCode.trim());
      setManualCode("");
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d4f4f] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
          <div className="w-16 h-16 bg-[#0d4f4f] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#e6c872]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">دخول المنظمين</h1>
          <p className="text-gray-500 text-sm mb-6">أدخل الرقم السري للوصول إلى الماسح</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="الرقم السري"
            className="w-full border-2 border-gray-200 rounded-lg p-3 text-center text-lg focus:border-[#0d4f4f] focus:outline-none mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[#0d4f4f] text-white py-3 rounded-lg font-bold hover:bg-[#1a6a6a] transition-colors"
          >
            دخول
          </button>
          {message && <p className="text-red-500 text-sm mt-3">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a3a3a] flex flex-col">
      {/* Header */}
      <div className="bg-[#0d4f4f] p-4 shadow-lg">
        <h1 className="text-white text-xl font-bold text-center">ماسح الدعوات</h1>
        <p className="text-gray-300 text-sm text-center">جائزة الأمير فيصل بن بندر - الدورة الرابعة</p>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center p-4">
        {/* QR Scanner */}
        <div className="w-full max-w-sm mb-4">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full rounded-xl overflow-hidden"
          ></div>

          <div className="flex gap-2 mt-3">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 bg-[#c9a351] text-[#0d4f4f] font-bold py-3 rounded-lg hover:bg-[#e6c872] transition-colors"
              >
                تشغيل الكاميرا
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                إيقاف الكاميرا
              </button>
            )}
          </div>
        </div>

        {/* Manual Input */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
              placeholder="أو أدخل رمز الدعوة يدوياً"
              className="flex-1 border-2 border-gray-600 bg-[#0d4f4f] text-white rounded-lg p-3 text-sm focus:border-[#c9a351] focus:outline-none"
            />
            <button
              onClick={handleManualScan}
              className="bg-[#0d4f4f] border-2 border-[#c9a351] text-[#c9a351] px-4 rounded-lg font-bold hover:bg-[#c9a351] hover:text-[#0d4f4f] transition-colors"
            >
              تحقق
            </button>
          </div>
        </div>

        {/* Result Display */}
        {(result || status === "error") && (
          <div
            className={`w-full max-w-sm rounded-xl p-5 ${
              status === "success"
                ? "bg-green-900/50 border-2 border-green-400"
                : status === "already"
                ? "bg-yellow-900/50 border-2 border-yellow-400"
                : "bg-red-900/50 border-2 border-red-400"
            }`}
          >
            {/* Status Icon */}
            <div className="flex justify-center mb-3">
              {status === "success" && (
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {status === "already" && (
                <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
              {status === "error" && (
                <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            <p
              className={`text-center font-bold text-lg mb-2 ${
                status === "success"
                  ? "text-green-300"
                  : status === "already"
                  ? "text-yellow-300"
                  : "text-red-300"
              }`}
            >
              {message}
            </p>

            {result && (
              <div className="text-center text-white mt-3">
                <p className="text-xl font-bold">{result.name}</p>
                <p className="text-gray-300 text-sm mt-1">
                  {result.type === "winner" && "فائز"}
                  {result.type === "companion" && "مرافق"}
                  {result.type === "judge" && "محكّم"}
                  {result.type === "coordinator" && "منسّق"}
                  {result.type === "media" && "إعلامي"}
                  {result.type === "other" && "مدعو"}
                </p>
                {result.category && (
                  <p className="text-gray-400 text-xs mt-1">{result.category}</p>
                )}
                {result.parent_name && (
                  <p className="text-gray-400 text-xs mt-1">مرافق: {result.parent_name}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with link to dashboard */}
      <div className="p-4 text-center">
        <Link href="/" className="text-gray-400 text-sm hover:text-[#c9a351] transition-colors">
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
