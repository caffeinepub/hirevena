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
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  IndianRupee,
  MapPin,
  Plus,
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
// XLSX loaded dynamically from CDN
declare global {
  interface Window {
    XLSX?: {
      read: (
        data: ArrayBuffer,
        opts: { type: string },
      ) => {
        SheetNames: string[];
        Sheets: Record<string, unknown>;
      };
      utils: {
        sheet_to_json: <T>(sheet: unknown, opts: { header: number }) => T[];
      };
    };
  }
}

async function loadXLSX(): Promise<NonNullable<Window["XLSX"]>> {
  if (window.XLSX) return window.XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX!);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
import { type Batch, type Campaign, useCRMStore } from "../hooks/useCRMStore";

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

async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const XLSX = await loadXLSX();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const dataArr = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
  }) as string[][];
  return parseRowsFromArray(dataArr);
}

const PAGE_SIZE = 15;

const EMPTY_CAMPAIGN_FORM = {
  campaignName: "",
  companyName: "",
  role: "",
  location: "",
  salary: "",
};

import { useActor } from "../hooks/useActor";
import { apiPost, getApiUrl } from "../utils/apiService";
export default function AssignDataSection() {
  const store = useCRMStore();
  const { actor } = useActor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"campaigns" | "tracking">("campaigns");

  // Campaign list / detail view state
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  // Campaign modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN_FORM);
  const [campaignFormError, setCampaignFormError] = useState("");

  // Import state (per detail view)
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
  const [campaignFilter, setCampaignFilter] = useState("");

  // Live canister candidates for accurate tracking stats
  const [canisterCandidates, setCanisterCandidates] = useState<
    import("../hooks/useCRMStore").Candidate[]
  >([]);

  // Auto-refresh tracking tab + fetch canister candidates
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = async () => {
      setTick((p) => p + 1);
      if (actor) {
        try {
          const all = await actor.getAllAssignedCandidates();
          if (all && all.length >= 0) {
            setCanisterCandidates(all as any[]);
          }
        } catch (e) {
          console.error("getAllAssignedCandidates error:", e);
        }
      }
    };
    refresh();
    const t = setInterval(refresh, 4000);
    // Also refresh when a recruiter submits a response
    const handler = () => refresh();
    window.addEventListener("crm:responseSubmitted", handler);
    return () => {
      clearInterval(t);
      window.removeEventListener("crm:responseSubmitted", handler);
    };
  }, [actor]);
  void tick;

  // Load campaigns from canister (shared across all devices)
  // Uses campaign ID for deduplication to prevent race-condition duplicates
  // biome-ignore lint/correctness/useExhaustiveDependencies: store is a zustand store; methods are stable
  useEffect(() => {
    const loadCanisterCampaigns = async () => {
      if (!actor) return;
      try {
        const canisterCampaigns = await actor.getCampaigns();
        if (canisterCampaigns && canisterCampaigns.length > 0) {
          // Build a set of existing names (case-insensitive) to avoid duplicates
          const currentNamesLower = new Set(
            store.campaigns.map((sc) => sc.campaignName.toLowerCase()),
          );
          for (const cc of canisterCampaigns) {
            if (!currentNamesLower.has(cc.campaignName.toLowerCase())) {
              store.addCampaign({
                campaignName: cc.campaignName,
                companyName: cc.companyName,
                role: cc.role,
                location: cc.location,
                salary: cc.salary,
              });
              currentNamesLower.add(cc.campaignName.toLowerCase());
            }
          }
        }
      } catch (e) {
        console.error("Canister getCampaigns error:", e);
      }
    };
    loadCanisterCampaigns();
    const t = setInterval(loadCanisterCampaigns, 10000);
    return () => clearInterval(t);
  }, [actor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor) return;
    actor
      .getApprovedRecruiters()
      .then((approved: any[]) => {
        for (const r of approved) {
          const existingRecruiter = store.recruiters.find(
            (sr: any) => sr.email.toLowerCase() === r.email.toLowerCase(),
          );
          if (!existingRecruiter) {
            store.addSignupRequest({
              name: r.name,
              email: r.email,
              password: r.password || "",
            });
            setTimeout(() => {
              const req = store.signupRequests.find(
                (s: any) => s.email.toLowerCase() === r.email.toLowerCase(),
              );
              if (req) store.approveRecruiter(req.id);
            }, 50);
          } else if (existingRecruiter.status !== "approved") {
            store.approveRecruiter(existingRecruiter.id);
          }
        }
      })
      .catch(() => {});
  }, [actor]);

  const approvedRecruiters = store.recruiters.filter(
    (r) => r.status === "approved",
  );

  const selectedCampaign = activeCampaign?.campaignName || "";

  const totalPages = Math.max(1, Math.ceil(importedRows.length / PAGE_SIZE));
  const pagedRows = importedRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openCampaignDetail = (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setView("detail");
    setImportedRows([]);
    setSelected([]);
    setSelectedRecruiter("");
    setError("");
    setAssignSuccess("");
    setCurrentPage(1);
  };

  const backToList = () => {
    setView("list");
    setActiveCampaign(null);
    setImportedRows([]);
    setSelected([]);
    setError("");
    setAssignSuccess("");
  };

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
      reader.onload = async (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const rows = await parseExcelBuffer(buffer);
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

  // Create Campaign
  const handleCreateCampaign = () => {
    if (!campaignForm.campaignName.trim()) {
      setCampaignFormError("Campaign name is required.");
      return;
    }
    // Duplicate check (case-insensitive)
    const nameLower = campaignForm.campaignName.trim().toLowerCase();
    const alreadyExists = store.campaigns.some(
      (c) => c.campaignName.toLowerCase() === nameLower,
    );
    if (alreadyExists) {
      setCampaignFormError(
        "A campaign with this name already exists. Please use a unique name.",
      );
      return;
    }
    const added = store.addCampaign({
      campaignName: campaignForm.campaignName.trim(),
      companyName: campaignForm.companyName.trim(),
      role: campaignForm.role.trim(),
      location: campaignForm.location.trim(),
      salary: campaignForm.salary.trim(),
    });
    if (!added) {
      setCampaignFormError("Campaign already exists.");
      return;
    }
    if (getApiUrl()) {
      apiPost({
        type: "createCampaign",
        campaignName: campaignForm.campaignName.trim(),
        companyName: campaignForm.companyName.trim(),
        role: campaignForm.role.trim(),
        location: campaignForm.location.trim(),
        salary: campaignForm.salary.trim(),
      }).catch(console.error);
    }
    // Also save to ICP canister for cross-device sync
    if (actor) {
      actor
        .createCampaign(
          campaignForm.campaignName.trim(),
          campaignForm.companyName.trim(),
          campaignForm.role.trim(),
          campaignForm.location.trim(),
          campaignForm.salary.trim(),
        )
        .catch(console.error);
    }
    setShowCampaignModal(false);
    setCampaignForm(EMPTY_CAMPAIGN_FORM);
    setCampaignFormError("");
    // Notify recruiter panel to refresh instantly
    window.dispatchEvent(new CustomEvent("crm:campaignCreated"));
  };

  // Delete Campaign
  const handleDeleteCampaign = async (
    campaign: Campaign,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete campaign "${campaign.campaignName}"? This will also remove all associated leads. This cannot be undone.`,
      )
    )
      return;

    // Remove from local store (campaigns + candidates + batches)
    store.deleteCampaign(campaign.id);

    // Remove from ICP canister
    if (actor) {
      try {
        await (actor as any).deleteCampaign(BigInt(campaign.id));
      } catch (e) {
        console.error("Canister deleteCampaign error:", e);
      }
    }

    // Remove from Google Apps Script API if configured
    if (getApiUrl()) {
      apiPost({
        type: "deleteCampaign",
        campaignName: campaign.campaignName,
      }).catch(console.error);
    }

    // Dispatch event so recruiter panel updates instantly
    window.dispatchEvent(new CustomEvent("crm:campaignDeleted"));
  };

  // Assign
  const handleAssign = () => {
    if (!selectedCampaign) {
      setError("Campaign not selected.");
      return;
    }
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
        campaign: selectedCampaign,
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
      campaign: selectedCampaign,
    });

    store.addActivityLog({
      recruiterId: "admin",
      recruiterName: "Admin",
      action: "Batch Assigned",
      details: `${batchId}: ${selected.length} candidates → ${approvedRecruiters.find((r) => r.id === selectedRecruiter)?.name} [${selectedCampaign}]`,
    });

    const recruiterEmailForAssign =
      approvedRecruiters.find((r) => r.id === selectedRecruiter)?.email ||
      selectedRecruiter;

    if (getApiUrl()) {
      for (const row of candidatesToAdd) {
        apiPost({
          type: "addCandidate",
          name: row.name,
          phone: row.phone,
          email: row.email || "",
          skills: row.skills || "",
          assignedTo: recruiterEmailForAssign,
          campaign: selectedCampaign,
          status: "",
          batchId,
          assignDate,
        }).catch(console.error);
      }
    }

    // Save to ICP canister for cross-device sync
    if (actor) {
      let idxOffset = 0;
      for (const row of candidatesToAdd) {
        const candidateId = addedIds[idxOffset++] || crypto.randomUUID();
        actor
          .addAssignedCandidate(
            candidateId,
            row.name,
            row.phone,
            row.email || "",
            row.skills || "",
            recruiterEmailForAssign.toLowerCase(),
            selectedCampaign,
            batchId,
            assignDate,
          )
          .catch(console.error);
      }
    }

    setAssignSuccess(
      `${batchId} — ${selected.length} candidates assigned to ${selectedCampaign} successfully!`,
    );
    setImportedRows((prev) => prev.filter((_, i) => !selected.includes(i)));
    setSelected([]);
    setTab("tracking");
    setViewBatch(batchId);
  };

  // Per-batch stats — uses live canister data when available for real-time accuracy
  const getBatchStats = (batch: Batch) => {
    // Prefer canister candidates (live, cross-device) over local store
    const liveCandidates =
      canisterCandidates.length > 0 ? canisterCandidates : store.candidates;
    const candidates = liveCandidates.filter((c) => c.batchId === batch.id);
    const total = candidates.length || batch.totalImported;
    // Total Calls = status NOT empty (recruiter has responded)
    const callsDone = candidates.filter(
      (c) =>
        !!c.updatedAt ||
        (c.status &&
          (c.status as string) !== "" &&
          c.status !== "New" &&
          c.status !== "Assigned"),
    ).length;
    const interested = candidates.filter(
      (c) => c.status === "Interested",
    ).length;
    const notInterested = candidates.filter(
      (c) => c.status === "Not Interested",
    ).length;
    const followUps = candidates.filter((c) => c.status === "Follow-up").length;
    // Pending = status empty or "New" / "Assigned"
    const pending = candidates.filter(
      (c) =>
        !c.status ||
        (c.status as string) === "" ||
        c.status === "New" ||
        c.status === "Assigned",
    ).length;
    const joining = candidates.filter((c) => c.status === "Interested").length;
    const convPct = total > 0 ? Math.round((interested / total) * 100) : 0;
    return {
      total,
      callsDone,
      interested,
      notInterested,
      followUps,
      pending,
      joining,
      convPct,
    };
  };

  const getRecruiterStats = (batch: Batch) => {
    const liveCandidates =
      canisterCandidates.length > 0 ? canisterCandidates : store.candidates;
    return batch.recruiterAssignments.map(({ recruiterId, count }) => {
      const recruiter = store.recruiters.find((r) => r.id === recruiterId);
      const recruiterEmail = recruiter?.email?.toLowerCase() || "";
      const batchCands = liveCandidates.filter(
        (c) =>
          c.batchId === batch.id &&
          (c.assignedRecruiter === recruiterId ||
            (recruiterEmail &&
              (c.assignedTo || "").toLowerCase() === recruiterEmail)),
      );
      const callsDone = batchCands.filter(
        (c) =>
          !!c.updatedAt ||
          (c.status &&
            (c.status as string) !== "" &&
            c.status !== "New" &&
            c.status !== "Assigned"),
      ).length;
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

  const exportBatchSummaryCSV = (batch: Batch) => {
    const stats = getBatchStats(batch);
    const recruiterStats = getRecruiterStats(batch);
    let csv = `Batch ID,${batch.id}\nCampaign,${batch.campaign || ""}\nAssign Date,${batch.assignDate}\nTotal Assigned,${stats.total}\nCalls Done,${stats.callsDone}\nInterested,${stats.interested}\nNot Interested,${stats.notInterested}\nFollow-ups,${stats.followUps}\nConversion %,${stats.convPct}%\n\nRecruiter Name,Assigned,Calls Done,Interested,Conversion%\n`;
    for (const r of recruiterStats) {
      csv += `${r.name},${r.assigned},${r.callsDone},${r.interested},${r.convPct}%\n`;
    }
    downloadCSV(csv, `${batch.id}_summary.csv`);
  };

  const exportBatchDetailedCSV = (batch: Batch) => {
    const candidates = store.candidates.filter((c) => c.batchId === batch.id);
    let csv =
      "Name,Phone,Email,Skills,Status,Campaign,Recruiter,Notes,Follow-up Date,Timestamp\n";
    for (const c of candidates) {
      const recruiterName =
        store.recruiters.find((r) => r.id === c.assignedRecruiter)?.name || "";
      csv += `${c.name},${c.phone},${c.email},${c.skills},${c.status},${c.campaign || ""},${recruiterName},${c.notes},${c.followUpDate},${c.timestamp}\n`;
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
        <p>Campaign: <strong>${batch.campaign || "—"}</strong></p>
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

  // Filtered batches for tracking tab
  const filteredBatches = campaignFilter
    ? store.batches.filter((b) => b.campaign === campaignFilter)
    : store.batches;

  // Campaign stats summary for list view — uses canister for live accuracy
  const getCampaignSummary = (campaignName: string) => {
    const batches = store.batches.filter((b) => b.campaign === campaignName);
    const total = batches.reduce((sum, b) => sum + b.totalImported, 0);
    const liveCandidates =
      canisterCandidates.length > 0 ? canisterCandidates : store.candidates;
    const candidates = liveCandidates.filter(
      (c) => c.campaign === campaignName,
    );
    const interested = candidates.filter(
      (c) => c.status === "Interested",
    ).length;
    const pending = candidates.filter(
      (c) =>
        !c.status ||
        (c.status as string) === "" ||
        c.status === "New" ||
        c.status === "Assigned",
    ).length;
    const totalCalls = candidates.filter(
      (c) =>
        !!c.updatedAt ||
        (c.status &&
          (c.status as string) !== "" &&
          c.status !== "New" &&
          c.status !== "Assigned"),
    ).length;
    return {
      total: Math.max(total, candidates.length),
      interested,
      pending,
      totalCalls,
      batchCount: batches.length,
    };
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["campaigns", "tracking"] as const).map((t) => (
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
            {t === "campaigns" ? "📋 Campaigns" : "📊 Live Tracking"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CAMPAIGNS TAB                                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      {tab === "campaigns" && (
        <>
          {/* ── CAMPAIGN LIST VIEW ── */}
          {view === "list" && (
            <div className="space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="font-bold text-base"
                    style={{ color: "oklch(0.28 0.085 245)" }}
                  >
                    All Campaigns
                  </h3>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    Select a campaign to upload data and assign recruiters
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="assign.new_campaign.button"
                  onClick={() => setShowCampaignModal(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ background: "oklch(0.45 0.15 160)" }}
                >
                  <Plus className="w-4 h-4" /> New Campaign
                </button>
              </div>

              {/* Empty state */}
              {store.campaigns.length === 0 ? (
                <div
                  data-ocid="assign.campaigns.empty_state"
                  className="bg-white rounded-xl border-2 border-dashed border-blue-200 p-16 text-center space-y-4"
                >
                  <div className="text-4xl">🎯</div>
                  <div>
                    <p className="font-semibold text-foreground/70">
                      No campaigns yet
                    </p>
                    <p className="text-sm text-foreground/40 mt-1">
                      Create a campaign to start uploading and assigning
                      candidate data
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                    style={{ background: "oklch(0.55 0.17 245)" }}
                  >
                    <Plus className="w-4 h-4" /> Create First Campaign
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {store.campaigns.map((campaign) => {
                    const summary = getCampaignSummary(campaign.campaignName);
                    return (
                      <button
                        key={campaign.id}
                        type="button"
                        data-ocid={"assign.campaign.card"}
                        onClick={() => openCampaignDetail(campaign)}
                        className="bg-white rounded-xl border-2 border-border hover:border-blue-400 hover:shadow-md p-5 text-left transition-all group"
                      >
                        {/* Campaign name */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p
                              className="font-bold text-sm group-hover:text-blue-700 transition-colors"
                              style={{ color: "oklch(0.28 0.085 245)" }}
                            >
                              🎯 {campaign.campaignName}
                            </p>
                            {summary.batchCount > 0 && (
                              <p className="text-xs text-foreground/40 mt-0.5">
                                {summary.batchCount} batch
                                {summary.batchCount !== 1 ? "es" : ""} ·{" "}
                                {summary.total} candidates
                              </p>
                            )}
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: "oklch(0.95 0.05 245)",
                              color: "oklch(0.45 0.15 245)",
                            }}
                          >
                            Upload Data →
                          </span>
                        </div>

                        {/* Badge row */}
                        <div className="flex flex-wrap gap-1.5">
                          {campaign.companyName && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3" />
                              {campaign.companyName}
                            </span>
                          )}
                          {campaign.role && (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                              <Briefcase className="w-3 h-3" />
                              {campaign.role}
                            </span>
                          )}
                          {campaign.location && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              <MapPin className="w-3 h-3" />
                              {campaign.location}
                            </span>
                          )}
                          {campaign.salary && (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                              <IndianRupee className="w-3 h-3" />
                              {campaign.salary}
                            </span>
                          )}
                        </div>

                        {summary.total > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50 flex gap-4">
                            <span className="text-xs text-foreground/50">
                              Total:{" "}
                              <strong className="text-foreground/80">
                                {summary.total}
                              </strong>
                            </span>
                            <span className="text-xs text-foreground/50">
                              Calls:{" "}
                              <strong className="text-blue-600">
                                {summary.totalCalls}
                              </strong>
                            </span>
                            <span className="text-xs text-foreground/50">
                              Interested:{" "}
                              <strong className="text-green-600">
                                {summary.interested}
                              </strong>
                            </span>
                            <span className="text-xs text-foreground/50">
                              Pending:{" "}
                              <strong className="text-yellow-600">
                                {summary.pending}
                              </strong>
                            </span>
                          </div>
                        )}
                        {/* Delete button */}
                        <div className="mt-3 pt-2 flex justify-end">
                          <button
                            type="button"
                            data-ocid="assign.campaign.delete_button"
                            onClick={(e) => handleDeleteCampaign(campaign, e)}
                            className="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-400 transition-colors font-medium"
                          >
                            🗑 Delete Campaign
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CAMPAIGN DETAIL VIEW ── */}
          {view === "detail" && activeCampaign && (
            <div className="space-y-5">
              {/* Back + campaign header */}
              <div className="bg-white rounded-xl border-2 border-blue-200 p-5">
                <button
                  type="button"
                  data-ocid="assign.back.button"
                  onClick={backToList}
                  className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-800 transition-colors mb-3"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Campaigns
                </button>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "oklch(0.28 0.085 245)" }}
                >
                  🎯 {activeCampaign.campaignName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeCampaign.companyName && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <Building2 className="w-3 h-3" />
                      {activeCampaign.companyName}
                    </span>
                  )}
                  {activeCampaign.role && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      <Briefcase className="w-3 h-3" />
                      {activeCampaign.role}
                    </span>
                  )}
                  {activeCampaign.location && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />
                      {activeCampaign.location}
                    </span>
                  )}
                  {activeCampaign.salary && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                      <IndianRupee className="w-3 h-3" />
                      {activeCampaign.salary}
                    </span>
                  )}
                </div>
              </div>

              {/* Import Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    data-ocid="assign.upload.button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-10 text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Choose File
                  </Button>
                </div>

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
                      data-ocid="assign.sheets_id.input"
                      placeholder={store.crmConfig.sheetId || "Enter Sheet ID"}
                      value={gsSheetId}
                      onChange={(e) => setGsSheetId(e.target.value)}
                      className="h-10 text-sm"
                    />
                    <Button
                      data-ocid="assign.sheets_import.button"
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
                <div
                  data-ocid="assign.error_state"
                  className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}
              {assignSuccess && (
                <div
                  data-ocid="assign.success_state"
                  className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium"
                >
                  ✅ {assignSuccess}
                </div>
              )}

              {/* Sticky Assign Bar */}
              {importedRows.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-4 sticky top-[80px] z-10 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-foreground/60">
                      {selected.length} of {importedRows.length} selected
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium text-white"
                      style={{ background: "oklch(0.55 0.17 245)" }}
                    >
                      🎯 {selectedCampaign}
                    </span>
                    <Select
                      value={selectedRecruiter}
                      onValueChange={setSelectedRecruiter}
                    >
                      <SelectTrigger
                        data-ocid="assign.recruiter.select"
                        className="w-48 h-9"
                      >
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
                      data-ocid="assign.data.submit_button"
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
                          {["#", "Name", "Phone", "Email", "Skills"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-3 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase"
                              >
                                {h}
                              </th>
                            ),
                          )}
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
                              <td className="px-3 py-2 font-medium">
                                {row.name}
                              </td>
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
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TRACKING TAB                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {tab === "tracking" && (
        <div className="space-y-4">
          {/* Live indicator */}
          <div className="flex items-center justify-between">
            <h3
              className="font-bold text-sm"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Live Batch Analytics
            </h3>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Auto-refresh
            </span>
          </div>

          {/* Campaign Filter */}
          {store.campaigns.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-3">
              <p className="text-xs font-semibold text-foreground/50 uppercase mb-2">
                Filter by Campaign
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCampaignFilter("")}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    !campaignFilter
                      ? "text-white border-transparent"
                      : "bg-white border-border text-foreground/60"
                  }`}
                  style={
                    !campaignFilter
                      ? { background: "oklch(0.55 0.17 245)" }
                      : {}
                  }
                >
                  All Campaigns
                </button>
                {store.campaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCampaignFilter(c.campaignName)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                      campaignFilter === c.campaignName
                        ? "text-white border-transparent"
                        : "bg-white border-border text-foreground/60"
                    }`}
                    style={
                      campaignFilter === c.campaignName
                        ? { background: "oklch(0.55 0.17 245)" }
                        : {}
                    }
                  >
                    {c.campaignName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredBatches.length === 0 && (
            <div
              data-ocid="assign.batches.empty_state"
              className="bg-white rounded-xl border border-border p-12 text-center text-foreground/40"
            >
              No batches found
              {campaignFilter
                ? ` for "${campaignFilter}"`
                : ". Import and assign data to get started."}
            </div>
          )}

          {[...filteredBatches].reverse().map((batch) => {
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
                data-ocid={`assign.batch.item.${batch.id}`}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  isSelected ? "border-blue-400 shadow-md" : "border-border"
                }`}
              >
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
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {batch.campaign && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ background: "oklch(0.55 0.17 245)" }}
                        >
                          🎯 {batch.campaign}
                        </span>
                      )}
                      <p className="text-xs text-foreground/50">
                        {batch.assignDate} · {stats.total} candidates ·{" "}
                        {stats.convPct}% conversion
                      </p>
                    </div>
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
                                className={`px-3 py-2 font-semibold ${
                                  r.convPct >= 20
                                    ? "text-green-600"
                                    : r.convPct >= 10
                                      ? "text-yellow-600"
                                      : "text-red-500"
                                }`}
                              >
                                {r.convPct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

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

      {/* Create Campaign Modal */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent data-ocid="assign.campaign.modal" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🎯 Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-semibold">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                data-ocid="assign.campaign_name.input"
                placeholder="e.g. ITI Recruitment Drive 2026"
                value={campaignForm.campaignName}
                onChange={(e) =>
                  setCampaignForm((f) => ({
                    ...f,
                    campaignName: e.target.value,
                  }))
                }
              />
              {campaignFormError && (
                <p className="text-xs text-red-500 mt-1">{campaignFormError}</p>
              )}
            </div>
            <div>
              <Label className="font-semibold">Company Name</Label>
              <Input
                data-ocid="assign.campaign_company.input"
                placeholder="e.g. Tata Motors"
                value={campaignForm.companyName}
                onChange={(e) =>
                  setCampaignForm((f) => ({
                    ...f,
                    companyName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label className="font-semibold">Role / Position</Label>
              <Input
                data-ocid="assign.campaign_role.input"
                placeholder="e.g. Welder, Fitter, Operator"
                value={campaignForm.role}
                onChange={(e) =>
                  setCampaignForm((f) => ({ ...f, role: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="font-semibold">Location</Label>
              <Input
                data-ocid="assign.campaign_location.input"
                placeholder="e.g. Pune, Maharashtra"
                value={campaignForm.location}
                onChange={(e) =>
                  setCampaignForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="font-semibold">Salary</Label>
              <Input
                data-ocid="assign.campaign_salary.input"
                placeholder="e.g. ₹18,000 – ₹25,000/month"
                value={campaignForm.salary}
                onChange={(e) =>
                  setCampaignForm((f) => ({ ...f, salary: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="assign.campaign.cancel_button"
              onClick={() => {
                setShowCampaignModal(false);
                setCampaignForm(EMPTY_CAMPAIGN_FORM);
                setCampaignFormError("");
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="assign.campaign.confirm_button"
              onClick={handleCreateCampaign}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
