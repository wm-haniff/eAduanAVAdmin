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

interface Building {
  name: string;
}

interface Floor {
  floor_name: string;
  buildings?: Building;
}

interface Room {
  room_name: string;
  floors?: Floor;
}

interface Report {
  report_id: string;
  name: string;
  equipment: string;
  description: string;
  action_taken?: string;
  created_at: string;
  status: "pending" | "completed";
  rooms?: Room[];  // <-- Changed to array
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [actionText, setActionText] = useState("");

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
        report_id,
        name,
        equipment,
        description,
        action_taken,
        created_at,
        status,
        rooms!reports_id_room_fkey (
          room_name,
          floors!rooms_id_floor_fkey (
            floor_name,
            buildings!floors_id_building_fkey (
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
  const markAsCompleted = async (report_id: string) => {
    if (
      !confirm(
        "Mark this report as completed? This action cannot be undone."
      )
    )
      return;

    const { error } = await supabase
      .from("reports")
      .update({ status: "completed" })
      .eq("report_id", report_id);

    if (error) {
      alert("Failed to mark as completed: " + error.message);
    } else {
      setReports((prev) =>
        prev.map((r) => (r.report_id === report_id ? { ...r, status: "completed" } : r))
      );
    }
  };

  /* =======================
     DELETE REPORT
  ======================= */
  const deleteReport = async (report_id: string) => {
    if (!confirm("Are you sure you want to remove this report?")) return;

    const { error } = await supabase.from("reports").delete().eq("report_id", report_id);

    if (error) {
      alert("Failed to delete report: " + error.message);
    } else {
      setReports((prev) => prev.filter((r) => r.report_id !== report_id));
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
        <Link href="/report" className="text-sm font-semibold text-indigo-600">
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
          <p className="text-center text-red-600 font-medium">{fetchError}</p>
        )}

        {!loading && !fetchError && reports.length === 0 && (
          <p className="text-center font-medium">No reports submitted today</p>
        )}

        {!loading && !fetchError && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <div
                key={report.report_id}
                className={`bg-white rounded-2xl shadow-xl border-t-4 ${
                  report.status === "completed"
                    ? "border-green-600"
                    : "border-red-600"
                } p-6 flex flex-col justify-between min-h-115 hover:shadow-2xl transition`}
              >
                <div className="space-y-3 text-sm font-medium">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Name: {report.name}
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Building: {report.rooms?.[0]?.floors?.buildings?.name ?? "N/A"}
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Floor: {report.rooms?.[0]?.floors?.floor_name ?? "N/A"}
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Room: {report.rooms?.[0]?.room_name ?? "N/A"}
                  </p>

                  <p className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    Equipment: {report.equipment}
                  </p>

                  <div className="mt-3 bg-gray-100 p-3 rounded-lg text-sm font-normal">
                    <strong>Description:</strong>
                    <p className="mt-1">{report.description}</p>
                  </div>

                  {report.action_taken && (
                    <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                      <strong>Action Taken:</strong>
                      <p className="mt-1">{report.action_taken}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setActiveReport(report.report_id);
                      setActionText(report.action_taken || "");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                      report.status === "completed"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {report.status === "completed" ? "EDIT" : "DONE"}
                  </button>

                  <button
                    onClick={() => deleteReport(report.report_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                    REMOVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTION MODAL */}
        {activeReport && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-3">Action Taken</h2>

              <textarea
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                rows={4}
                className="w-full border rounded-lg p-3"
                placeholder="Describe the action taken..."
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setActiveReport(null);
                    setActionText("");
                  }}
                  className="flex-1 border rounded-lg py-2 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    const { error } = await supabase
                      .from("reports")
                      .update({
                        status: "completed",
                        action_taken: actionText,
                      })
                      .eq("report_id", activeReport);

                    if (!error) {
                      setReports((prev) =>
                        prev.map((r) =>
                          r.report_id === activeReport
                            ? {
                                ...r,
                                status: "completed",
                                action_taken: actionText,
                              }
                            : r
                        )
                      );
                    }

                    setActiveReport(null);
                    setActionText("");
                  }}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
