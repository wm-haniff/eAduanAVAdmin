"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  User,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Report {
  id: string;
  name: string;
  equipment: string;
  description: string;
  created_at: string;
  buildings?: { name: string };
  floors?: { floor_name: string };
  rooms?: { room_name: string };
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (selectedDate?: string) => {
    setLoading(true);
    setFetchError(null);

    try {
      let query = supabase
        .from("reports")
        .select(`
          id,
          name,
          equipment,
          description,
          created_at,
          buildings ( name ),
          floors ( floor_name ),
          rooms ( room_name )
        `)
        .order("created_at", { ascending: false });

      if (selectedDate) {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        query = query
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        setFetchError(error.message);
        setReports([]);
      } else if (data && Array.isArray(data)) {
        setReports(data as unknown as Report[]);
      }
    } catch (err) {
      setFetchError("Unexpected error fetching reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to remove this report?")) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    } else {
      console.error("Failed to delete report:", error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100 text-black">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-indigo-700">Admin Panel</h2>
        </div>

        <nav className="p-4 space-y-2">
          <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-gray-100">
            Today Dashboard
          </Link>

          <Link
            href="/report"
            className="block px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-medium"
          >
            All Reports
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        {/* HEADER */}
        <div className="mb-8 bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-3xl font-extrabold flex items-center justify-center gap-3">
            <FileText className="w-7 h-7 text-indigo-600" />
            All Reports
          </h1>
          <p className="mt-2 font-medium">Senarai semua aduan mengikut tarikh</p>
        </div>

        {/* DATE FILTER */}
        <div className="mb-8 flex items-center gap-3 bg-white p-4 rounded-xl shadow w-fit">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              fetchReports(e.target.value);
            }}
            className="border rounded-lg px-4 py-2 font-medium text-black"
          />
        </div>

        {/* LOADING */}
        {loading && <p className="text-center font-medium">Loading reports...</p>}

        {/* FETCH ERROR */}
        {fetchError && (
          <p className="text-center text-red-600 font-medium">{fetchError}</p>
        )}

        {/* EMPTY */}
        {!loading && !fetchError && reports.length === 0 && (
          <p className="text-center font-medium">No reports found</p>
        )}

        {/* REPORT CARDS */}
        {!loading && !fetchError && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-xl border-t-4 border-indigo-600
                   p-6 flex flex-col justify-between min-h-115
                   hover:shadow-2xl transition"
              >
                {/* TOP */}
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">Report {index + 1}</h2>
                    <p className="text-sm flex justify-center items-center gap-1 mt-1 font-medium">
                      <Clock className="w-4 h-4" />
                      {new Date(report.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* DETAILS */}
                  <div className="space-y-3 text-sm font-medium">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Name:</span> {report.name}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Building:</span> {report.buildings?.name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Floor:</span> {report.floors?.floor_name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Room:</span> {report.rooms?.room_name ?? "N/A"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-indigo-600" />
                      <span>Equipment:</span> {report.equipment}
                    </p>

                    <div className="mt-3 bg-gray-100 p-3 rounded-lg text-sm font-normal">
                      {report.description}
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-6 flex gap-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-2
                       px-4 py-2 bg-green-600 text-white rounded-xl
                       font-semibold hover:bg-green-700 transition"
                    onClick={() => alert("Done clicked!")}
                  >
                    <CheckCircle className="w-5 h-5" />
                    DONE
                  </button>

                  <button
                    onClick={() => deleteReport(report.id)}
                    className="flex-1 flex items-center justify-center gap-2
                       px-4 py-2 bg-red-600 text-white rounded-xl
                       font-semibold hover:bg-red-700 transition"
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
