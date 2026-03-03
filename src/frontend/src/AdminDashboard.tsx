import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Submission } from "./backend";
import { useActor } from "./hooks/useActor";

// ─── Types ────────────────────────────────────────────────────────
type NavSection = "dashboard" | "leads" | "export";

type StatusOption = "New" | "Contacted" | "In Progress" | "Closed" | "Rejected";

const STATUS_OPTIONS: StatusOption[] = [
  "New",
  "Contacted",
  "In Progress",
  "Closed",
  "Rejected",
];

// ─── Helpers ──────────────────────────────────────────────────────
function formatTimestamp(ts: bigint): string {
  // Backend timestamp is in nanoseconds
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUrgency(urgency: string): string {
  switch (urgency) {
    case "immediate":
      return "Immediate";
    case "within_7_days":
      return "Within 7 Days";
    case "within_30_days":
      return "Within 30 Days";
    default:
      return urgency;
  }
}

function isToday(ts: bigint): boolean {
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isThisMonth(ts: bigint): boolean {
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

// ─── Status Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    New: { bg: "oklch(0.93 0.06 245)", text: "oklch(0.30 0.10 245)" },
    Contacted: { bg: "oklch(0.96 0.10 80)", text: "oklch(0.45 0.15 60)" },
    "In Progress": { bg: "oklch(0.95 0.08 55)", text: "oklch(0.45 0.14 45)" },
    Closed: { bg: "oklch(0.92 0.09 145)", text: "oklch(0.35 0.12 145)" },
    Rejected: { bg: "oklch(0.95 0.06 27)", text: "oklch(0.45 0.15 27)" },
  };
  const s = styles[status] ?? styles.New;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────
function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-display font-black"
          style={{ color: "oklch(0.28 0.085 245)" }}
        >
          {value}
        </p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Inline Lead Row ──────────────────────────────────────────────
function LeadRow({
  lead,
  index,
  onUpdate,
  onDelete,
  isDeleting,
  isUpdating,
}: {
  lead: Submission;
  index: number;
  onUpdate: (
    id: bigint,
    status: string,
    notes: string,
    followUpDate: string,
  ) => void;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}) {
  const [status, setStatus] = useState(lead.status || "New");
  const [notes, setNotes] = useState(lead.notes || "");
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate || "");
  const [notesEditing, setNotesEditing] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onUpdate(lead.id, newStatus, notes, followUpDate);
  };

  const handleNotesBlur = () => {
    setNotesEditing(false);
    onUpdate(lead.id, status, notes, followUpDate);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFollowUpDate(val);
    onUpdate(lead.id, status, notes, val);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete lead from ${lead.companyName}? This action cannot be undone.`,
      )
    ) {
      onDelete(lead.id);
    }
  };

  return (
    <tr
      data-ocid={`leads.item.${index}`}
      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
    >
      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap min-w-[120px]">
        {formatTimestamp(lead.timestamp)}
      </td>

      {/* Company */}
      <td
        className="px-4 py-3 font-semibold text-sm min-w-[140px]"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate max-w-[130px]" title={lead.companyName}>
            {lead.companyName}
          </span>
        </div>
      </td>

      {/* Contact Person */}
      <td className="px-4 py-3 text-sm min-w-[120px]">
        <span className="truncate block max-w-[110px]" title={lead.contactName}>
          {lead.contactName}
        </span>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-sm min-w-[120px]">
        <a
          href={`tel:${lead.phoneNumber}`}
          className="hover:underline"
          style={{ color: "oklch(0.45 0.12 245)" }}
        >
          {lead.phoneNumber}
        </a>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm min-w-[160px]">
        <a
          href={`mailto:${lead.emailAddress}`}
          className="hover:underline truncate block max-w-[150px]"
          style={{ color: "oklch(0.45 0.12 245)" }}
          title={lead.emailAddress}
        >
          {lead.emailAddress}
        </a>
      </td>

      {/* Hiring Position */}
      <td className="px-4 py-3 text-sm min-w-[120px]">
        <span className="truncate block max-w-[110px]" title={lead.role}>
          {lead.role || "—"}
        </span>
      </td>

      {/* Candidates */}
      <td className="px-4 py-3 text-sm text-center min-w-[80px]">
        {lead.positions || "—"}
      </td>

      {/* Urgency */}
      <td className="px-4 py-3 text-xs min-w-[120px]">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
          style={{
            backgroundColor:
              lead.urgency === "immediate"
                ? "oklch(0.95 0.06 27)"
                : lead.urgency === "within_7_days"
                  ? "oklch(0.95 0.08 55)"
                  : "oklch(0.93 0.06 245)",
            color:
              lead.urgency === "immediate"
                ? "oklch(0.45 0.15 27)"
                : lead.urgency === "within_7_days"
                  ? "oklch(0.45 0.14 45)"
                  : "oklch(0.30 0.10 245)",
          }}
        >
          {formatUrgency(lead.urgency)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <select
            data-ocid={`leads.status.select.${index}`}
            value={status}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className="text-xs rounded-lg border px-2 py-1.5 font-medium focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: "oklch(0.88 0.03 240)",
              color: "oklch(0.28 0.085 245)",
              backgroundColor: "white",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {isUpdating && (
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
          )}
        </div>
      </td>

      {/* Notes */}
      <td className="px-4 py-3 min-w-[160px]">
        <input
          data-ocid={`leads.notes.input.${index}`}
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesEditing(true);
          }}
          onBlur={handleNotesBlur}
          onKeyDown={handleNotesKeyDown}
          placeholder="Add notes..."
          className="w-full text-xs rounded-lg border px-2.5 py-1.5 transition-colors outline-none focus:ring-2"
          style={{
            borderColor: notesEditing
              ? "oklch(0.55 0.17 245)"
              : "oklch(0.90 0.02 240)",
            maxWidth: "150px",
          }}
        />
      </td>

      {/* Follow-up Date */}
      <td className="px-4 py-3 min-w-[140px]">
        <input
          data-ocid={`leads.followup.input.${index}`}
          type="date"
          value={followUpDate}
          onChange={handleFollowUpChange}
          className="text-xs rounded-lg border px-2 py-1.5 outline-none focus:ring-2 transition-colors"
          style={{
            borderColor: "oklch(0.90 0.02 240)",
            color: "oklch(0.28 0.085 245)",
          }}
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3 min-w-[80px]">
        <button
          type="button"
          data-ocid={`leads.delete_button.${index}`}
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete lead"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
          style={{ color: "oklch(0.55 0.18 27)" }}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // ── Fetch leads ──
  const {
    data: leads = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Submission[]>({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubmissions();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 mins
  });

  // ── Update lead mutation ──
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
      followUpDate,
    }: {
      id: bigint;
      status: string;
      notes: string;
      followUpDate: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateLead(id, status, notes, followUpDate);
    },
    onMutate: ({ id }) => {
      setUpdatingIds((prev) => new Set(prev).add(id.toString()));
    },
    onSettled: (_, __, { id }) => {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id.toString());
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
  });

  // ── Delete lead mutation ──
  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteSubmission(id);
    },
    onMutate: (id) => {
      setDeletingIds((prev) => new Set(prev).add(id.toString()));
    },
    onSettled: (_, __, id) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id.toString());
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
  });

  // ── Summary stats ──
  const stats = useMemo(() => {
    const total = leads.length;
    const today = leads.filter((l) => isToday(l.timestamp)).length;
    const pending = leads.filter(
      (l) => l.status === "New" || l.status === "Contacted" || !l.status,
    ).length;
    const inProgress = leads.filter((l) => l.status === "In Progress").length;
    const closed = leads.filter((l) => l.status === "Closed").length;
    const thisMonth = leads.filter((l) => isThisMonth(l.timestamp)).length;
    return { total, today, pending, inProgress, closed, thisMonth };
  }, [leads]);

  // ── Filtered leads ──
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchQuery ||
        lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phoneNumber.includes(searchQuery) ||
        lead.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        lead.status === statusFilter ||
        (statusFilter === "New" && !lead.status);

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // ── Monthly analytics ──
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const lead of leads) {
      const ms = Number(lead.timestamp / BigInt(1_000_000));
      const d = new Date(ms);
      const key = d.toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      months[key] = (months[key] || 0) + 1;
    }
    return Object.entries(months)
      .slice(-6)
      .map(([month, count]) => ({ month, count }));
  }, [leads]);

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = [
      "Date",
      "Company Name",
      "Contact Person",
      "Phone",
      "Email",
      "Hiring Position",
      "Candidates",
      "Location",
      "Urgency",
      "Status",
      "Notes",
      "Follow-up Date",
    ];

    const rows = filteredLeads.map((lead) => [
      formatTimestamp(lead.timestamp),
      lead.companyName,
      lead.contactName,
      lead.phoneNumber,
      lead.emailAddress,
      lead.role,
      lead.positions,
      "", // location not in schema but included for completeness
      formatUrgency(lead.urgency),
      lead.status || "New",
      lead.notes,
      lead.followUpDate,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hirevena-leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "leads",
      label: "Lead Management",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "export",
      label: "Export & Reports",
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "oklch(0.96 0.015 240)" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col shadow-xl"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.20 0.075 245) 0%, oklch(0.25 0.08 245) 100%)",
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <img
            src="/assets/uploads/IMG_20260303_130341.jpg-1.jpeg"
            alt="Hirevena"
            className="h-12 w-auto object-contain"
          />
          <p className="text-white/50 text-xs mt-2 font-medium tracking-wide uppercase">
            CRM Dashboard
          </p>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-5 space-y-1"
          aria-label="Admin navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`admin_nav.${item.id}.button`}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor:
                  activeSection === item.id
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                color:
                  activeSection === item.id
                    ? "white"
                    : "rgba(255,255,255,0.60)",
              }}
            >
              {item.icon}
              {item.label}
              {activeSection === item.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div
          className="px-3 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <button
            type="button"
            data-ocid="admin_nav.logout.button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="bg-white border-b px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm"
          style={{ borderColor: "oklch(0.90 0.02 240)" }}
        >
          <div>
            <h1
              className="text-xl font-display font-black"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              {activeSection === "dashboard" && "Overview Dashboard"}
              {activeSection === "leads" && "Lead Management"}
              {activeSection === "export" && "Export & Reports"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Hirevena Recruitment CRM ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              data-ocid="admin_header.refresh.button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 text-xs h-8"
              style={{ borderColor: "oklch(0.88 0.03 240)" }}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              {isFetching ? "Syncing..." : "Refresh"}
            </Button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Loading */}
          {isLoading && (
            <div
              data-ocid="admin_dashboard.loading_state"
              className="flex items-center justify-center py-20"
            >
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2
                  className="w-6 h-6 animate-spin"
                  style={{ color: "oklch(0.55 0.17 245)" }}
                />
                <span className="font-medium">Loading inquiries...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div
              data-ocid="admin_dashboard.error_state"
              className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
            >
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="font-semibold text-red-700">Failed to load leads</p>
              <p className="text-sm text-red-500 mt-1">
                Check your connection and try refreshing.
              </p>
              <Button
                data-ocid="admin_dashboard.retry.button"
                onClick={() => refetch()}
                size="sm"
                className="mt-4"
                style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {/* ─── DASHBOARD SECTION ─── */}
              {activeSection === "dashboard" && (
                <div className="space-y-8" data-ocid="admin_dashboard.section">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <SummaryCard
                      icon={<Users className="w-5 h-5" />}
                      label="Total Leads"
                      value={stats.total}
                      accent="oklch(0.55 0.17 245)"
                    />
                    <SummaryCard
                      icon={<Inbox className="w-5 h-5" />}
                      label="New Today"
                      value={stats.today}
                      accent="oklch(0.65 0.15 145)"
                    />
                    <SummaryCard
                      icon={<ClipboardList className="w-5 h-5" />}
                      label="Pending Follow-ups"
                      value={stats.pending}
                      accent="oklch(0.65 0.15 60)"
                    />
                    <SummaryCard
                      icon={<TrendingUp className="w-5 h-5" />}
                      label="In Progress"
                      value={stats.inProgress}
                      accent="oklch(0.65 0.15 45)"
                    />
                    <SummaryCard
                      icon={<CheckCircle className="w-5 h-5" />}
                      label="Closed Deals"
                      value={stats.closed}
                      accent="oklch(0.55 0.15 145)"
                    />
                    <SummaryCard
                      icon={<BarChart3 className="w-5 h-5" />}
                      label="This Month"
                      value={stats.thisMonth}
                      accent="oklch(0.50 0.15 300)"
                    />
                  </div>

                  {/* Monthly Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2
                      className="font-display font-bold text-base mb-6"
                      style={{ color: "oklch(0.28 0.085 245)" }}
                    >
                      Monthly Lead Intake
                    </h2>
                    {monthlyData.length === 0 ? (
                      <div
                        data-ocid="admin_chart.empty_state"
                        className="text-center py-12 text-gray-400"
                      >
                        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No historical data yet.</p>
                      </div>
                    ) : (
                      <div className="flex items-end gap-3 h-40">
                        {monthlyData.map(({ month, count }) => {
                          const maxCount = Math.max(
                            ...monthlyData.map((d) => d.count),
                            1,
                          );
                          const heightPct = (count / maxCount) * 100;
                          return (
                            <div
                              key={month}
                              className="flex-1 flex flex-col items-center gap-2"
                            >
                              <span
                                className="text-xs font-bold"
                                style={{ color: "oklch(0.55 0.17 245)" }}
                              >
                                {count}
                              </span>
                              <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(heightPct, 4)}%`,
                                  background:
                                    "linear-gradient(180deg, oklch(0.60 0.17 245), oklch(0.35 0.10 245))",
                                  maxHeight: "100%",
                                  minHeight: "4px",
                                }}
                              />
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2
                      className="font-display font-bold text-base mb-5"
                      style={{ color: "oklch(0.28 0.085 245)" }}
                    >
                      Lead Status Breakdown
                    </h2>
                    <div className="space-y-3">
                      {STATUS_OPTIONS.map((status) => {
                        const count = leads.filter(
                          (l) =>
                            l.status === status ||
                            (!l.status && status === "New"),
                        ).length;
                        const pct =
                          leads.length > 0 ? (count / leads.length) * 100 : 0;
                        return (
                          <div key={status} className="flex items-center gap-4">
                            <div className="w-24 flex-shrink-0">
                              <StatusBadge status={status} />
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    status === "New"
                                      ? "oklch(0.55 0.17 245)"
                                      : status === "Contacted"
                                        ? "oklch(0.65 0.14 80)"
                                        : status === "In Progress"
                                          ? "oklch(0.65 0.14 55)"
                                          : status === "Closed"
                                            ? "oklch(0.55 0.14 145)"
                                            : "oklch(0.60 0.15 27)",
                                }}
                              />
                            </div>
                            <span
                              className="text-sm font-semibold w-8 text-right"
                              style={{ color: "oklch(0.40 0.08 245)" }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent leads quick view */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2
                        className="font-display font-bold text-base"
                        style={{ color: "oklch(0.28 0.085 245)" }}
                      >
                        Recent Inquiries
                      </h2>
                      <button
                        type="button"
                        data-ocid="admin_dashboard.view_all_leads.button"
                        onClick={() => setActiveSection("leads")}
                        className="text-xs font-semibold flex items-center gap-1 hover:underline"
                        style={{ color: "oklch(0.55 0.17 245)" }}
                      >
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {leads.length === 0 ? (
                      <div
                        data-ocid="admin_recent.empty_state"
                        className="text-center py-8 text-gray-400"
                      >
                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No inquiries submitted yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...leads]
                          .sort((a, b) => Number(b.timestamp - a.timestamp))
                          .slice(0, 5)
                          .map((lead, i) => (
                            <div
                              key={lead.id.toString()}
                              data-ocid={`admin_recent.item.${i + 1}`}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                            >
                              <div>
                                <p
                                  className="text-sm font-semibold"
                                  style={{ color: "oklch(0.28 0.085 245)" }}
                                >
                                  {lead.companyName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {lead.contactName} · {lead.phoneNumber}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={lead.status || "New"} />
                                <span className="text-xs text-gray-400">
                                  {formatTimestamp(lead.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── LEADS SECTION ─── */}
              {activeSection === "leads" && (
                <div className="space-y-5" data-ocid="admin_leads.section">
                  {/* Toolbar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          data-ocid="leads.search_input"
                          type="search"
                          placeholder="Search by company, contact, email, phone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm rounded-lg"
                          style={{ borderColor: "oklch(0.88 0.03 240)" }}
                        />
                      </div>

                      {/* Status filter */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {["All", ...STATUS_OPTIONS].map((s) => (
                          <button
                            key={s}
                            type="button"
                            data-ocid="leads.filter.tab"
                            onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                statusFilter === s
                                  ? "oklch(0.28 0.085 245)"
                                  : "oklch(0.96 0.015 240)",
                              color:
                                statusFilter === s
                                  ? "white"
                                  : "oklch(0.45 0.06 245)",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Leads count */}
                      <div className="ml-auto flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold"
                        >
                          {filteredLeads.length} leads
                        </Badge>
                        <Button
                          type="button"
                          data-ocid="leads.export_csv.button"
                          onClick={exportCSV}
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-white"
                          style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
                          disabled={filteredLeads.length === 0}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredLeads.length === 0 ? (
                      <div
                        data-ocid="leads.empty_state"
                        className="text-center py-16"
                      >
                        <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-semibold text-gray-500">
                          {searchQuery || statusFilter !== "All"
                            ? "No leads match your filters"
                            : "No inquiries submitted yet"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchQuery || statusFilter !== "All"
                            ? "Try adjusting your search or filter."
                            : "Leads from the website form will appear here."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table
                          className="w-full text-sm"
                          data-ocid="leads.table"
                        >
                          <thead>
                            <tr
                              className="text-xs font-semibold uppercase tracking-wide border-b"
                              style={{
                                backgroundColor: "oklch(0.96 0.015 240)",
                                borderColor: "oklch(0.90 0.02 240)",
                                color: "oklch(0.45 0.06 245)",
                              }}
                            >
                              <th className="px-4 py-3 text-left">Date</th>
                              <th className="px-4 py-3 text-left">Company</th>
                              <th className="px-4 py-3 text-left">Contact</th>
                              <th className="px-4 py-3 text-left">Phone</th>
                              <th className="px-4 py-3 text-left">Email</th>
                              <th className="px-4 py-3 text-left">Position</th>
                              <th className="px-4 py-3 text-center">
                                Candidates
                              </th>
                              <th className="px-4 py-3 text-left">Urgency</th>
                              <th className="px-4 py-3 text-left">Status</th>
                              <th className="px-4 py-3 text-left">Notes</th>
                              <th className="px-4 py-3 text-left">Follow-up</th>
                              <th className="px-4 py-3 text-center">Del</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLeads.map((lead, index) => (
                              <LeadRow
                                key={lead.id.toString()}
                                lead={lead}
                                index={index + 1}
                                onUpdate={(id, status, notes, followUpDate) =>
                                  updateMutation.mutate({
                                    id,
                                    status,
                                    notes,
                                    followUpDate,
                                  })
                                }
                                onDelete={(id) => deleteMutation.mutate(id)}
                                isDeleting={deletingIds.has(lead.id.toString())}
                                isUpdating={updatingIds.has(lead.id.toString())}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── EXPORT SECTION ─── */}
              {activeSection === "export" && (
                <div className="space-y-6" data-ocid="admin_export.section">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CSV Export */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          backgroundColor: "oklch(0.93 0.06 145)",
                          color: "oklch(0.40 0.12 145)",
                        }}
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <h3
                        className="font-display font-bold text-base mb-1"
                        style={{ color: "oklch(0.28 0.085 245)" }}
                      >
                        Export All Leads (CSV)
                      </h3>
                      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                        Download a complete CSV file of all {leads.length} leads
                        for analysis in Excel, Google Sheets, or any CRM.
                      </p>
                      <Button
                        type="button"
                        data-ocid="export.all_csv.button"
                        onClick={exportCSV}
                        className="gap-2 text-white font-semibold"
                        style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
                        disabled={leads.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        Download Full CSV ({leads.length} records)
                      </Button>
                    </div>

                    {/* This month export */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          backgroundColor: "oklch(0.93 0.06 245)",
                          color: "oklch(0.35 0.12 245)",
                        }}
                      >
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <h3
                        className="font-display font-bold text-base mb-1"
                        style={{ color: "oklch(0.28 0.085 245)" }}
                      >
                        This Month's Report
                      </h3>
                      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                        Export only the {stats.thisMonth} leads received this
                        month for your monthly HR reporting.
                      </p>
                      <Button
                        type="button"
                        data-ocid="export.monthly_csv.button"
                        onClick={() => {
                          const monthLeads = leads.filter((l) =>
                            isThisMonth(l.timestamp),
                          );
                          const headers = [
                            "Date",
                            "Company Name",
                            "Contact Person",
                            "Phone",
                            "Email",
                            "Hiring Position",
                            "Candidates",
                            "Urgency",
                            "Status",
                            "Notes",
                            "Follow-up Date",
                          ];
                          const rows = monthLeads.map((lead) => [
                            formatTimestamp(lead.timestamp),
                            lead.companyName,
                            lead.contactName,
                            lead.phoneNumber,
                            lead.emailAddress,
                            lead.role,
                            lead.positions,
                            formatUrgency(lead.urgency),
                            lead.status || "New",
                            lead.notes,
                            lead.followUpDate,
                          ]);
                          const csvContent = [headers, ...rows]
                            .map((row) =>
                              row
                                .map(
                                  (cell) =>
                                    `"${String(cell).replace(/"/g, '""')}"`,
                                )
                                .join(","),
                            )
                            .join("\n");
                          const blob = new Blob([csvContent], {
                            type: "text/csv;charset=utf-8;",
                          });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          const now = new Date();
                          link.download = `hirevena-${now.toLocaleString("en", { month: "long" }).toLowerCase()}-${now.getFullYear()}-leads.csv`;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        variant="outline"
                        className="gap-2 font-semibold"
                        style={{
                          borderColor: "oklch(0.55 0.17 245)",
                          color: "oklch(0.45 0.12 245)",
                        }}
                        disabled={stats.thisMonth === 0}
                      >
                        <Download className="w-4 h-4" />
                        Download Monthly Report ({stats.thisMonth} records)
                      </Button>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3
                      className="font-display font-bold text-base mb-5"
                      style={{ color: "oklch(0.28 0.085 245)" }}
                    >
                      Lead Pipeline Summary
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            className="border-b text-xs font-semibold uppercase tracking-wide"
                            style={{
                              borderColor: "oklch(0.90 0.02 240)",
                              color: "oklch(0.45 0.06 245)",
                            }}
                          >
                            <th className="py-3 text-left">Status</th>
                            <th className="py-3 text-center">Count</th>
                            <th className="py-3 text-left">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {STATUS_OPTIONS.map((status, i) => {
                            const count = leads.filter(
                              (l) =>
                                l.status === status ||
                                (!l.status && status === "New"),
                            ).length;
                            const pct =
                              leads.length > 0
                                ? ((count / leads.length) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <tr
                                key={status}
                                data-ocid={`export.summary.row.${i + 1}`}
                                className="border-b"
                                style={{ borderColor: "oklch(0.94 0.015 240)" }}
                              >
                                <td className="py-3">
                                  <StatusBadge status={status} />
                                </td>
                                <td
                                  className="py-3 text-center font-bold"
                                  style={{ color: "oklch(0.28 0.085 245)" }}
                                >
                                  {count}
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${pct}%`,
                                          backgroundColor:
                                            "oklch(0.55 0.17 245)",
                                        }}
                                      />
                                    </div>
                                    <span className="text-gray-500 text-xs w-10">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="font-bold">
                            <td className="py-3 text-xs uppercase tracking-wide text-gray-500">
                              Total
                            </td>
                            <td
                              className="py-3 text-center"
                              style={{ color: "oklch(0.28 0.085 245)" }}
                            >
                              {leads.length}
                            </td>
                            <td className="py-3 text-gray-400 text-xs">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
