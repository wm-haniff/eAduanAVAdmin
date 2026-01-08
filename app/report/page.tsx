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
  status: "pending" | "completed";
  buildings?: { name: string };
  floors?: { floor_name: string };
  rooms?: { room_name: string };
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [date, setDate] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  

  useEffect(() => {
  fetchReports();
  fetchDropdownData();
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
          status,
          buildings!inner ( name ),
          floors!inner ( floor_name ),
          rooms!inner ( room_name )

        `);

      // DATE FILTER
      if (selectedDate) {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        query = query
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());
      }

      // BUILDING FILTER
      if (building) query = query.eq("buildings.name", building);

      // FLOOR FILTER
      if (floor) query = query.eq("floors.floor_name", floor);

      // ROOM FILTER
      if (room) query = query.eq("rooms.room_name", room);

      const { data, error } = await query;

      if (error) {
        setFetchError(error.message);
        setReports([]);
      } else if (data) {
        // SORT: pending first, completed last
        const sorted = [...data].sort((a, b) => {
          if (a.status === b.status) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
          return a.status === "pending" ? -1 : 1;
        });

        setReports(sorted as unknown as Report[]);
      }
    } catch {
      setFetchError("Unexpected error fetching reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to remove this report?")) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const fetchDropdownData = async () => {
      const { data: b } = await supabase.from("buildings").select("id, name");
      const { data: f } = await supabase.from("floors").select("id, floor_name");
      const { data: r } = await supabase.from("rooms").select("id, room_name");

      setBuildings(b || []);
      setFloors(f || []);
      setRooms(r || []);
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
          <p className="mt-2 font-medium">
            Senarai semua aduan mengikut tarikh
          </p>
        </div>

        {/* FILTER ROW */}
<div className="mb-8 bg-white p-4 rounded-xl shadow grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
  {/* DATE */}
  <div className="flex items-center gap-2">
    <Calendar className="w-5 h-5 text-indigo-600" />
    <input
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="border rounded-lg px-3 py-2 font-medium text-black w-full"
    />
  </div>

  {/* BUILDING */}
  <select
    value={building}
    onChange={(e) => setBuilding(e.target.value)}
    className="border rounded-lg px-3 py-2 font-medium"
  >
    <option value="">All Buildings</option>
    {buildings.map((b) => (
      <option key={b.id} value={b.name}>
        {b.name}
      </option>
    ))}
  </select>

  {/* FLOOR */}
  <select
    value={floor}
    onChange={(e) => setFloor(e.target.value)}
    className="border rounded-lg px-3 py-2 font-medium"
  >
    <option value="">All Floors</option>
    {floors.map((f) => (
      <option key={f.id} value={f.floor_name}>
        {f.floor_name}
      </option>
    ))}
  </select>

  {/* ROOM */}
  <select
    value={room}
    onChange={(e) => setRoom(e.target.value)}
    className="border rounded-lg px-3 py-2 font-medium"
  >
    <option value="">All Rooms</option>
    {rooms.map((r) => (
      <option key={r.id} value={r.room_name}>
        {r.room_name}
      </option>
    ))}
  </select>

  {/* APPLY */}
  <button
    onClick={() => fetchReports(date)}
    className="bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
  >
    Apply
  </button>
</div>


        {loading && <p className="text-center font-medium">Loading reports...</p>}

        {fetchError && (
          <p className="text-center text-red-600 font-medium">
            {fetchError}
          </p>
        )}

        {!loading && !fetchError && reports.length === 0 && (
          <p className="text-center font-medium">No reports found</p>
        )}

        {!loading && !fetchError && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className={`
                  bg-white rounded-2xl shadow-xl border-t-4
                  ${
                    report.status === "completed"
                      ? "border-green-600"
                      : "border-red-600"
                  }
                  p-6 flex flex-col justify-between min-h-115
                  hover:shadow-2xl transition
                `}
              >
                {/* TOP */}
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

                  <div className="space-y-3 text-sm font-medium">
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

                <div className="mt-6 flex gap-3">
                  <button
                    disabled={report.status === "completed"}
                    onClick={() => markAsCompleted(report.id)}
                    className={`flex-1 flex items-center justify-center gap-2
                      px-4 py-2 rounded-xl font-semibold transition
                      ${
                        report.status === "completed"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {report.status === "completed"
                      ? "COMPLETED"
                      : "DONE"}
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
