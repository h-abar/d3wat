"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface GuestData {
  id: string;
  name: string;
  phone: string | null;
  category: string | null;
  type: string;
  parent_name: string | null;
  qr_code: string;
  qr_image: string;
}

export default function InvitationPage() {
  const params = useParams();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invitationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchGuest() {
      try {
        const res = await fetch(`/send/api/verify/${params.id}`);
        if (!res.ok) {
          setError("الدعوة غير موجودة");
          return;
        }
        const data = await res.json();
        setGuest(data);
      } catch {
        setError("حدث خطأ في تحميل الدعوة");
      } finally {
        setLoading(false);
      }
    }
    fetchGuest();
  }, [params.id]);

  const downloadImage = async () => {
    if (!invitationRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(invitationRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#0d4f4f",
    });
    const link = document.createElement("a");
    link.download = `invitation-${guest?.name || "guest"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d4f4f]">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d4f4f]">
        <div className="text-white text-xl">{error || "الدعوة غير موجودة"}</div>
      </div>
    );
  }

  const typeLabel =
    guest.type === "winner"
      ? "فائز"
      : guest.type === "companion"
      ? "مرافق"
      : guest.type === "judge"
      ? "محكّم"
      : guest.type === "coordinator"
      ? "منسّق"
      : guest.type === "media"
      ? "إعلامي"
      : "مدعو";

  return (
    <div className="min-h-screen bg-[#0a3a3a] flex flex-col items-center justify-center p-4">
      {/* Invitation Card */}
      <div
        ref={invitationRef}
        className="w-full max-w-[500px] bg-[#0d4f4f] rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Decorative top pattern */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#c9a351] via-[#e6c872] to-[#c9a351]"></div>

        {/* Header */}
        <div className="pt-10 px-8 text-center">
          <p className="text-[#e6c872] text-sm mb-2">يسرنا دعوتكم لحضور حفل تكريم الفائزين</p>
          <h1 className="text-white text-2xl font-bold leading-tight mb-1">
            بجائزة الأمير فيصل بن بندر بن عبدالعزيز
          </h1>
          <h2 className="text-[#e6c872] text-xl font-bold mb-2">
            للتميز والإبداع في دورتها الرابعة
          </h2>
          <div className="w-24 h-[2px] bg-[#c9a351] mx-auto my-4"></div>
        </div>

        {/* Guest Info */}
        <div className="px-8 py-4 text-center">
          <div className="bg-[#0a3a3a] rounded-xl p-5 border border-[#1a6a6a]">
            <p className="text-[#e6c872] text-sm mb-1">{typeLabel}</p>
            <h3 className="text-white text-2xl font-bold mb-2">{guest.name}</h3>
            {guest.category && (
              <p className="text-gray-300 text-sm">{guest.category}</p>
            )}
            {guest.parent_name && (
              <p className="text-gray-400 text-xs mt-1">مرافق: {guest.parent_name}</p>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="px-8 py-4 flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <img
              src={guest.qr_image}
              alt="QR Code"
              className="w-40 h-40"
            />
          </div>
        </div>

        {/* Event Details */}
        <div className="px-8 py-4 text-center">
          <p className="text-gray-300 text-sm mb-1">المقام في رحاب جامعة المعرفة بالدرعية</p>
          <p className="text-white text-base font-semibold">
            الثلاثاء 25 ذو القعدة 1447 هـ
          </p>
          <p className="text-gray-300 text-sm">الموافق 12 مايو 2026</p>
        </div>

        {/* Decorative bottom pattern */}
        <div className="h-3 bg-gradient-to-r from-[#c9a351] via-[#e6c872] to-[#c9a351]"></div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadImage}
        className="mt-6 bg-[#c9a351] hover:bg-[#e6c872] text-[#0d4f4f] font-bold py-3 px-8 rounded-full transition-colors shadow-lg"
      >
        تحميل الدعوة كصورة
      </button>
    </div>
  );
}
