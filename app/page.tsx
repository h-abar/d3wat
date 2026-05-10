"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  category: string | null;
  type: string;
  parent_name: string | null;
  qr_code: string;
  attended: number;
  invitation_url: string;
}

interface Stats {
  total: number;
  attended: number;
  byType: { type: string; count: number }[];
  byCategory: { category: string; count: number }[];
}

export default function DashboardPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [guestsRes, statsRes] = await Promise.all([
          fetch("/send/api/guests"),
          fetch("/send/api/stats"),
        ]);
        const guestsData = await guestsRes.json();
        const statsData = await statsRes.json();
        setGuests(guestsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const typeLabels: Record<string, string> = {
    winner: "فائز",
    companion: "مرافق",
    judge: "محكّم",
    coordinator: "منسّق",
    media: "إعلامي",
    other: "مدعو",
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.phone && guest.phone.includes(searchTerm)) ||
      (guest.category && guest.category.includes(searchTerm));
    const matchesType = filterType === "all" || guest.type === filterType;
    return matchesSearch && matchesType;
  });

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0d4f4f] text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-center">
            لوحة إدارة الدعوات
          </h1>
          <p className="text-center text-gray-300 text-sm mt-1">
            جائزة الأمير فيصل بن بندر بن عبدالعزيز للتميز والإبداع - الدورة الرابعة
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">إجمالي الدعوات</p>
              <p className="text-3xl font-bold text-[#0d4f4f]">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">تم الحضور</p>
              <p className="text-3xl font-bold text-green-600">{stats.attended}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">لم يحضر بعد</p>
              <p className="text-3xl font-bold text-orange-500">
                {Number(stats.total) - Number(stats.attended)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">نسبة الحضور</p>
              <p className="text-3xl font-bold text-[#c9a351]">
                {stats.total > 0
                  ? Math.round((Number(stats.attended) / Number(stats.total)) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/scanner"
              className="bg-[#0d4f4f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1a6a6a] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              فتح الماسح
            </Link>
            <Link
              href="/api/export"
              className="bg-[#c9a351] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#b8923f] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تصدير كشف Excel
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="بحث بالاسم أو الجوال أو الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-lg p-3 focus:border-[#0d4f4f] focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border-2 border-gray-200 rounded-lg p-3 focus:border-[#0d4f4f] focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="winner">فائزين</option>
              <option value="companion">مرافقين</option>
              <option value="judge">محكّمين</option>
              <option value="coordinator">منسّقين</option>
              <option value="media">إعلاميين</option>
              <option value="other">آخرين</option>
            </select>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            عرض {filteredGuests.length} من أصل {guests.length} دعوة
          </p>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">#</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">الاسم</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">النوع</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">الفئة</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">الحضور</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest, index) => (
                  <tr
                    key={guest.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{guest.name}</div>
                      {guest.parent_name && (
                        <div className="text-xs text-gray-400">
                          مرافق: {guest.parent_name}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          guest.type === "winner"
                            ? "bg-[#c9a351]/20 text-[#c9a351]"
                            : guest.type === "companion"
                            ? "bg-blue-100 text-blue-700"
                            : guest.type === "judge"
                            ? "bg-purple-100 text-purple-700"
                            : guest.type === "coordinator"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {typeLabels[guest.type] || guest.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{guest.category || "-"}</td>
                    <td className="p-3">
                      {guest.attended ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-semibold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          حضر
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => copyLink(guest.invitation_url, guest.id)}
                          className="text-[#0d4f4f] hover:text-[#c9a351] text-sm font-medium transition-colors"
                          title="نسخ الرابط"
                        >
                          {copied === guest.id ? "تم!" : "نسخ"}
                        </button>
                        <span className="text-gray-300">|</span>
                        <a
                          href={guest.invitation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0d4f4f] hover:text-[#c9a351] text-sm font-medium transition-colors"
                        >
                          عرض
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
