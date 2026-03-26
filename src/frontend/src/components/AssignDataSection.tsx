import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Bar as RBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { type Batch, useCRMStore } from "../hooks/useCRMStore";

interface ParsedRow {
  name: string;
  phone: string;
  email: string;
  skills: string;
}

function generateBatchId(count: number): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(count + 1).padStart(3, "0");
  return `BATCH_${y}_${m}_${day}_${seq}`;
}

// Parse rows from a header+data array (used for both CSV and Excel)
function parseRowsFromArray(dataArr: string[][]): ParsedRow[] {
  if (dataArr.length < 2) return [];
  const header = dataArr[0].map((h) =>
    String(h || "")
      .toLowerCase()
      .trim(),
  );
  const nameIdx = header.findIndex((h) => h.includes("name"));
  const phoneIdx = header.findIndex(
    (h) => h.includes("phone") || h.includes("mobile") || h.includes("contact"),
  );
  const emailIdx = header.findIndex((h) => h.includes("email"));
  const skillsIdx = header.findIndex(
    (h) =>
      h.includes("skill") || h.includes("trade") || h.includes("qualification"),
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < dataArr.length; i++) {
    const cols = dataArr[i].map((c) => String(c || "").trim());
    const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];
    if (!name || !phone) continue;
    rows.push({
      name,
      phone,
      email: emailIdx >= 0 ? cols[emailIdx] || "" : "",
      skills: skillsIdx >= 0 ? cols[skillsIdx] || "" : "",
    });
  }
  return rows;
}

function parseCSVText(text: string): ParsedRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const dataArr = lines.map((line) =>
    line.split(",").map((c) => c.trim().replace(/"/g, "")),
  );
  return parseRowsFromArray(dataArr);
}

function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const dataArr = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
  }) as string[][];
  return parseRowsFromArray(dataArr);
}

const PAGE_SIZE = 15;

export default function AssignDataSection() {
  const store = useCRMStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"import" | "tracking">("import");

  // Import state
  const [importedRows, setImportedRows] = useState<ParsedRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [gsSheetId, setGsSheetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // Tracking state
  const [viewBatch, setViewBatch] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const approvedRecruiters = store.recruiters.filter(
    (r) => r.status === "approved",
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(importedRows.length / PAGE_SIZE));
  const pagedRows = importedRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // CSV / Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.type.includes("spreadsheet") ||
      file.type.includes("excel");

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const rows = parseExcelBuffer(buffer);
          if (rows.length === 0) {
            setError(
              "No valid data found. Ensure Excel has Name and Mobile columns.",
            );
            return;
          }
          setImportedRows(rows);
          setSelected([]);
          setCurrentPage(1);
          setAssignSuccess("");
        } catch {
          setError("Failed to read Excel file. Please try again.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setError(
            "No valid data found. Ensure CSV has Name and Phone columns.",
          );
          return;
        }
        setImportedRows(rows);
        setSelected([]);
        setCurrentPage(1);
        setAssignSuccess("");
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  // Google Sheets import
  const handleGSImport = async () => {
    const sheetId = gsSheetId.trim() || store.crmConfig.sheetId;
    if (!sheetId) {
      setError("Please enter a Google Sheet ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      const resp = await fetch(url);
      if (!resp.ok)
        throw new Error(
          "Could not fetch sheet. Make sure it's publicly shared.",
        );
      const text = await resp.text();
      const rows = parseCSVText(text);
      if (rows.length === 0)
        throw new Error(
          "No valid data found. Ensure sheet has Name and Phone columns.",
        );
      setImportedRows(rows);
      setSelected([]);
      setCurrentPage(1);
      setAssignSuccess("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  // Assign
  const handleAssign = () => {
    if (!selectedRecruiter) {
      setError("Please select a recruiter.");
      return;
    }
    if (selected.length === 0) {
      setError("Please select at least one candidate.");
      return;
    }
    setError("");
    const batchId = generateBatchId(store.batches.length);
    const assignDate = new Date().toISOString().split("T")[0];
    const candidatesToAdd = selected.map((idx) => importedRows[idx]);

    const addedIds: string[] = [];
    for (const row of candidatesToAdd) {
      const id = store.addCandidateWithBatch({
        name: row.name,
        phone: row.phone,
        email: row.email,
        skills: row.skills,
        status: "New",
        assignedRecruiter: selectedRecruiter,
        notes: "",
        followUpDate: "",
        nextAction: "Call",
        batchId,
      });
      addedIds.push(id);
    }

    store.addBatch({
      id: batchId,
      assignDate,
      totalImported: selected.length,
      recruiterAssignments: [
        { recruiterId: selectedRecruiter, count: selected.length },
      ],
      candidateIds: addedIds,
    });

    store.addActivityLog({
      recruiterId: "admin",
      recruiterName: "Admin",
      action: "Batch Assigned",
      details: `${batchId}: ${selected.length} candidates → ${approvedRecruiters.find((r) => r.id === selectedRecruiter)?.name}`,
    });

    setAssignSuccess(
      `${batchId} — ${selected.length} candidates assigned successfully!`,
    );
    setImportedRows((prev) => prev.filter((_, i) => !selected.includes(i)));
    setSelected([]);
    setTab("tracking");
    setViewBatch(batchId);
  };

  // Per-batch stats
  const getBatchStats = (batch: Batch) => {
    const candidates = store.candidates.filter((c) => c.batchId === batch.id);
    const total = candidates.length;
    const callsDone = candidates.filter((c) => c.status !== "New").length;
    const interested = candidates.filter(
      (c) => c.status === "Interested",
    ).length;
    const notInterested = candidates.filter(
      (c) => c.status === "Not Interested",
    ).length;
    const followUps = candidates.filter((c) => c.status === "Follow-up").length;
    const joining = candidates.filter(
      (c) => c.nextAction === "Interview" && c.status === "Interested",
    ).length;
    const convPct = total > 0 ? Math.round((interested / total) * 100) : 0;
    return {
      total,
      callsDone,
      interested,
      notInterested,
      followUps,
      joining,
      convPct,
    };
  };

  const getRecruiterStats = (batch: Batch) => {
    return batch.recruiterAssignments.map(({ recruiterId, count }) => {
      const recruiter = store.recruiters.find((r) => r.id === recruiterId);
      const batchCands = store.candidates.filter(
        (c) => c.batchId === batch.id && c.assignedRecruiter === recruiterId,
      );
      const callsDone = batchCands.filter((c) => c.status !== "New").length;
      const interested = batchCands.filter(
        (c) => c.status === "Interested",
      ).length;
      const convPct = count > 0 ? Math.round((interested / count) * 100) : 0;
      return {
        name: recruiter?.name || recruiterId,
        assigned: count,
        callsDone,
        interested,
        convPct,
      };
    });
  };

  // Export
  const exportBatchSummaryCSV = (batch: Batch) => {
    const stats = getBatchStats(batch);
    const recruiterStats = getRecruiterStats(batch);
    let csv = `Batch ID,${batch.id}\nAssign Date,${batch.assignDate}\nTotal Assigned,${stats.total}\nCalls Done,${stats.callsDone}\nInterested,${stats.interested}\nNot Interested,${stats.notInterested}\nFollow-ups,${stats.followUps}\nConversion %,${stats.convPct}%\n\nRecruiter Name,Assigned,Calls Done,Interested,Conversion%\n`;
    for (const r of recruiterStats) {
      csv += `${r.name},${r.assigned},${r.callsDone},${r.interested},${r.convPct}%\n`;
    }
    downloadCSV(csv, `${batch.id}_summary.csv`);
  };

  const exportBatchDetailedCSV = (batch: Batch) => {
    const candidates = store.candidates.filter((c) => c.batchId === batch.id);
    let csv =
      "Name,Phone,Email,Skills,Status,Recruiter,Notes,Follow-up Date,Timestamp\n";
    for (const c of candidates) {
      const recruiterName =
        store.recruiters.find((r) => r.id === c.assignedRecruiter)?.name || "";
      csv += `${c.name},${c.phone},${c.email},${c.skills},${c.status},${recruiterName},${c.notes},${c.followUpDate},${c.timestamp}\n`;
    }
    downloadCSV(csv, `${batch.id}_detailed.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (batch: Batch) => {
    const stats = getBatchStats(batch);
    const recruiterStats = getRecruiterStats(batch);
    const html = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e3a6e; } h2 { color: #2c5282; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th { background: #2c5282; color: white; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .stat { display: inline-block; margin: 5px 10px; }
        .stat-val { font-size: 24px; font-weight: bold; color: #1a365d; }
      </style></head><body>
        <h1>Batch Report — ${batch.id}</h1>
        <p>Date: ${batch.assignDate}</p>
        <h2>Summary</h2>
        <div>
          ${[
            ["Total Assigned", stats.total],
            ["Calls Done", stats.callsDone],
            ["Interested", stats.interested],
            ["Not Interested", stats.notInterested],
            ["Follow-ups", stats.followUps],
            ["Conversion", `${stats.convPct}%`],
          ]
            .map(
              ([l, v]) =>
                `<div class="stat"><div class="stat-val">${v}</div><div>${l}</div></div>`,
            )
            .join("")}
        </div>
        <h2>Recruiter Performance</h2>
        <table><tr><th>Name</th><th>Assigned</th><th>Calls</th><th>Interested</th><th>Conversion%</th></tr>
          ${recruiterStats.map((r) => `<tr><td>${r.name}</td><td>${r.assigned}</td><td>${r.callsDone}</td><td>${r.interested}</td><td>${r.convPct}%</td></tr>`).join("")}
        </table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["import", "tracking"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors border ${
              tab === t
                ? "text-white border-transparent"
                : "bg-white border-border text-foreground/60 hover:bg-muted"
            }`}
            style={tab === t ? { background: "oklch(0.55 0.17 245)" } : {}}
          >
            {t === "import" ? "📥 Import & Assign" : "📊 Live Tracking"}
          </button>
        ))}
      </div>

      {tab === "import" && (
        <div className="space-y-5">
          {/* Import Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSV/Excel Upload */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3
                className="font-semibold text-sm mb-3 flex items-center gap-2"
                style={{ color: "oklch(0.28 0.085 245)" }}
              >
                <Upload className="w-4 h-4" /> Upload CSV / Excel
              </h3>
              <p className="text-xs text-foreground/50 mb-3">
                Required columns: Name, Phone · Optional: Email, Skills
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-10 text-sm"
              >
                <Upload className="w-4 h-4 mr-2" /> Choose File
              </Button>
            </div>

            {/* Google Sheets */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3
                className="font-semibold text-sm mb-3 flex items-center gap-2"
                style={{ color: "oklch(0.28 0.085 245)" }}
              >
                <FileSpreadsheet className="w-4 h-4" /> Import from Google
                Sheets
              </h3>
              <p className="text-xs text-foreground/50 mb-3">
                Sheet must be publicly shared (View access)
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder={store.crmConfig.sheetId || "Enter Sheet ID"}
                  value={gsSheetId}
                  onChange={(e) => setGsSheetId(e.target.value)}
                  className="h-10 text-sm"
                />
                <Button
                  onClick={handleGSImport}
                  disabled={loading}
                  className="h-10 whitespace-nowrap text-sm"
                  style={{ background: "oklch(0.55 0.17 245)" }}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {assignSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
              ✅ {assignSuccess}
            </div>
          )}

          {/* Assign Bar */}
          {importedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-4 sticky top-[80px] z-10 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground/60">
                  {selected.length} of {importedRows.length} selected
                </span>
                <Select
                  value={selectedRecruiter}
                  onValueChange={setSelectedRecruiter}
                >
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Select Recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedRecruiters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={selected.length === 0 || !selectedRecruiter}
                  className="h-9 text-sm font-semibold"
                  style={{ background: "oklch(0.45 0.20 145)" }}
                >
                  Assign Data ({selected.length})
                </Button>
                <span className="text-xs text-foreground/40 ml-auto">
                  Batch ID: {generateBatchId(store.batches.length)}
                </span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {importedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "oklch(0.28 0.085 245)" }}
                >
                  Data Preview — {importedRows.length} records
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.length === importedRows.length}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? importedRows.map((_, i) => i)
                                : [],
                            )
                          }
                        />
                      </th>
                      {["#", "Name", "Phone", "Email", "Skills"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, pi) => {
                      const globalIdx = (currentPage - 1) * PAGE_SIZE + pi;
                      return (
                        <tr
                          key={globalIdx}
                          className={pi % 2 === 0 ? "" : "bg-muted/30"}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selected.includes(globalIdx)}
                              onChange={(e) =>
                                setSelected((prev) =>
                                  e.target.checked
                                    ? [...prev, globalIdx]
                                    : prev.filter((i) => i !== globalIdx),
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-foreground/40 text-xs">
                            {globalIdx + 1}
                          </td>
                          <td className="px-3 py-2 font-medium">{row.name}</td>
                          <td className="px-3 py-2 text-foreground/70">
                            {row.phone}
                          </td>
                          <td className="px-3 py-2 text-foreground/60">
                            {row.email || "—"}
                          </td>
                          <td className="px-3 py-2 text-foreground/60">
                            {row.skills || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-foreground/50 text-xs">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {importedRows.length === 0 && !assignSuccess && (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-foreground/40">
                Upload a CSV file or import from Google Sheets to get started
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "tracking" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3
              className="w-5 h-5"
              style={{ color: "oklch(0.55 0.17 245)" }}
            />
            <h2
              className="font-bold text-base"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              Batch Tracking — Live
            </h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
              Auto-refreshing
            </span>
          </div>

          {store.batches.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-10 text-center text-foreground/40">
              No batches assigned yet. Import and assign data first.
            </div>
          )}

          {store.batches.map((batch) => {
            const stats = getBatchStats(batch);
            const recruiterStats = getRecruiterStats(batch);
            const isExpanded = expandedBatch === batch.id;
            const isSelected = viewBatch === batch.id;

            const pieData = [
              { name: "Interested", value: stats.interested, fill: "#22c55e" },
              {
                name: "Not Interested",
                value: stats.notInterested,
                fill: "#ef4444",
              },
              { name: "Follow-up", value: stats.followUps, fill: "#f59e0b" },
              {
                name: "New/Called",
                value:
                  stats.total -
                  stats.interested -
                  stats.notInterested -
                  stats.followUps,
                fill: "#3b82f6",
              },
            ].filter((d) => d.value > 0);

            return (
              <div
                key={batch.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  isSelected ? "border-blue-400 shadow-md" : "border-border"
                }`}
              >
                {/* Batch Header */}
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 text-left"
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                >
                  <div>
                    <p
                      className="font-bold text-sm"
                      style={{ color: "oklch(0.28 0.085 245)" }}
                    >
                      {batch.id}
                    </p>
                    <p className="text-xs text-foreground/50">
                      Assigned: {batch.assignDate} · {stats.total} candidates ·{" "}
                      {stats.convPct}% conversion
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        stats.convPct >= 30
                          ? "bg-green-100 text-green-700"
                          : stats.convPct >= 15
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {stats.convPct >= 30
                        ? "High"
                        : stats.convPct >= 15
                          ? "Medium"
                          : "Low"}{" "}
                      Performance
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        ["Total", stats.total, "text-blue-700"],
                        ["Calls Done", stats.callsDone, "text-purple-700"],
                        ["Interested", stats.interested, "text-green-700"],
                        ["Not Int.", stats.notInterested, "text-red-600"],
                        ["Follow-ups", stats.followUps, "text-yellow-700"],
                        [
                          "Conv %",
                          `${stats.convPct}%`,
                          stats.convPct >= 20
                            ? "text-green-700"
                            : "text-red-600",
                        ],
                      ].map(([label, val, cls]) => (
                        <div
                          key={label as string}
                          className="text-center rounded-lg border border-border p-3"
                        >
                          <p className={`text-xl font-black ${cls}`}>{val}</p>
                          <p className="text-[10px] text-foreground/50 uppercase font-medium mt-0.5">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Chart + Recruiter Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/60 uppercase mb-2">
                          Status Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={65}
                              innerRadius={30}
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/60 uppercase mb-2">
                          Recruiter Performance
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={recruiterStats}
                            margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend />
                            <RBar
                              dataKey="assigned"
                              name="Assigned"
                              fill="#3b82f6"
                              radius={[3, 3, 0, 0]}
                            />
                            <RBar
                              dataKey="interested"
                              name="Interested"
                              fill="#22c55e"
                              radius={[3, 3, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recruiter Table */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground/60 uppercase mb-2">
                        Recruiter-wise Breakdown
                      </h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            {[
                              "Recruiter",
                              "Assigned",
                              "Calls Done",
                              "Interested",
                              "Conversion %",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2 text-left text-xs font-semibold text-foreground/60 uppercase"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {recruiterStats.map((r, i) => (
                            <tr
                              key={r.name}
                              className={i % 2 === 0 ? "" : "bg-muted/30"}
                            >
                              <td className="px-3 py-2 font-medium">
                                {r.name}
                              </td>
                              <td className="px-3 py-2">{r.assigned}</td>
                              <td className="px-3 py-2">{r.callsDone}</td>
                              <td className="px-3 py-2 text-green-600">
                                {r.interested}
                              </td>
                              <td
                                className={`px-3 py-2 font-semibold ${r.convPct >= 20 ? "text-green-600" : r.convPct >= 10 ? "text-yellow-600" : "text-red-500"}`}
                              >
                                {r.convPct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => exportBatchSummaryCSV(batch)}
                      >
                        <Download className="w-3 h-3 mr-1" /> Batch Summary CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => exportBatchDetailedCSV(batch)}
                      >
                        <Download className="w-3 h-3 mr-1" /> Detailed Report
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => exportPDF(batch)}
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
