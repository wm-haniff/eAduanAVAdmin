"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  MapPin,
  Monitor,
  User,
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

/* =======================
   TYPE DEFINITION
   ======================= */
interface Report {
  id: string;
  name: string;
  equipment: string;
  description: string;
  created_at: string;
  status: "pending" | "completed";
  buildings?: { name: string };
  floors?: { floor_name: string };
  rooms?: { room_name: string };
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayReports();
  }, []);

  /* =======================
     FETCH TODAY REPORTS
     ======================= */
  const fetchTodayReports = async () => {
    setLoading(true);
    setFetchError(null);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("reports")
      .select(`
  id,
  name,
  equipment,
  description,
  created_at,
  status,
  rooms (
    room_name,
    floors (
      floor_name,
      buildings (
        name
      )
    )
  )
`)

      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      setFetchError(error.message);
      setReports([]);
    } else {
      setReports((data as unknown as Report[]) ?? []);
    }

    setLoading(false);
  };

  /* =======================
     MARK AS COMPLETED
     ======================= */
  const markAsCompleted = async (id: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: "completed" })
      .eq("id", id);

    if (!error) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "completed" } : r
        )
      );
    }
  };

  /* =======================
     DELETE REPORT
     ======================= */
  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to remove this report?")) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black md:flex">
      {/* SIDEBAR */}
      <aside className="hidden md:block w-64 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-indigo-700">Admin Panel</h2>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="block px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700"
          >
            Today Dashboard
          </Link>

          <Link
            href="/report"
            className="block px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            All Reports
          </Link>
        </nav>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white shadow p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-indigo-700">Admin Panel</h2>
        <Link
          href="/report"
          className="text-sm font-semibold text-indigo-600"
        >
          All Reports
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-8 bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-xl md:text-3xl font-extrabold flex items-center justify-center gap-2 md:gap-3">
            <FileText className="w-7 h-7 text-indigo-600" />
            Today Reports
          </h1>
          <p className="mt-2 font-medium">Aduan yang diterima hari ini</p>
        </div>

        {loading && (
          <p className="text-center font-medium">Loading reports...</p>
        )}

        {fetchError && (
          <p className="text-center text-red-600 font-medium">
            {fetchError}
          </p>
        )}

        {!loading && !fetchError && reports.length === 0 && (
          <p className="text-center font-medium">
            No reports submitted today
          </p>
        )}

        {!loading && !fetchError && reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className={`bg-white rounded-2xl shadow-xl border-t-4 ${
                  report.status === "completed"
                    ? "border-green-600"
                    : "border-red-600"
                } p-6 flex flex-col justify-between`}
              >
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">
                      Report {index + 1}
                    </h2>
                    <p className="text-sm flex justify-center items-center gap-1 mt-1 font-medium">
                      <Clock className="w-4 h-4" />
                      {new Date(report.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm font-medium">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      Name: {report.name}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Building: {report.buildings?.name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Floor: {report.floors?.floor_name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Room: {report.rooms?.room_name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-indigo-600" />
                      Equipment: {report.equipment}
                    </p>

                    <div className="mt-3 bg-gray-100 p-3 rounded-lg text-sm font-normal">
                      {report.description}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={report.status === "completed"}
                    onClick={() => markAsCompleted(report.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold ${
                      report.status === "completed"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {report.status === "completed" ? "COMPLETED" : "DONE"}
                  </button>

                  <button
                    onClick={() => deleteReport(report.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                    REMOVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
