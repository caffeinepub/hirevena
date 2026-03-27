import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileText,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LineChart,
  Pie,
  PieChart,
  Bar as RBar,
  Line as RLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useActor } from "../hooks/useActor";
import {
  type Campaign,
  type Candidate,
  type Client,
  type Recruiter,
  useCRMStore,
} from "../hooks/useCRMStore";
import { apiFetch, apiPost } from "../utils/apiService";
import AssignDataSection from "./AssignDataSection";

type AdminSection =
  | "dashboard"
  | "recruiters"
  | "candidates"
  | "clients"
  | "notifications"
  | "logs"
  | "export"
  | "settings"
  | "assigndata";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-gray-100 text-gray-500",
  Pending: "bg-gray-100 text-gray-500",
  Called: "bg-purple-100 text-purple-700",
  Interested: "bg-green-100 text-green-700",
  "Not Interested": "bg-red-100 text-red-700",
  "Follow-up": "bg-yellow-100 text-yellow-700",
  Invalid: "bg-gray-100 text-gray-500",
  Duplicate: "bg-orange-100 text-orange-700",
};

function getStatusLabel(status: string): string {
  if (!status || status === "" || status === "New" || status === "Assigned")
    return "Pending";
  return status;
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${highlight ? "bg-red-50 border-red-200" : "bg-white border-border"}`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide mb-1 ${highlight ? "text-red-500" : "text-foreground/50"}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-black ${highlight ? "text-red-600" : ""}`}
        style={highlight ? {} : { color: "oklch(0.28 0.085 245)" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-foreground/50 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminCRM({ onLogout }: { onLogout: () => void }) {
  const store = useCRMStore();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());
  const pendingCount = store.signupRequests.length;

  useEffect(() => {
    const t = setInterval(
      () => setLiveTime(new Date().toLocaleTimeString()),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  const navItems: {
    key: AdminSection;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "recruiters", label: "Recruiters", icon: UserCheck },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "clients", label: "Clients", icon: Building2 },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: pendingCount,
    },
    { key: "logs", label: "Activity Logs", icon: Activity },
    { key: "assigndata", label: "Assign Data", icon: Database },
    { key: "export", label: "Export", icon: Download },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "oklch(0.97 0.01 245)" }}
    >
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-border transition-all duration-300 ${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 z-30`}
      >
        <div className="h-16 flex items-center px-3 border-b border-border gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <span
              className="font-black text-base tracking-tight"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              Hirevena
            </span>
          )}
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              type="button"
              data-ocid={`admin.nav.${key}`}
              onClick={() => setSection(key)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                section === key
                  ? "text-white"
                  : "text-foreground/60 hover:bg-muted hover:text-foreground"
              }`}
              style={
                section === key ? { background: "oklch(0.55 0.17 245)" } : {}
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {badge ? (
                <span className="absolute right-2 top-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-border h-16 flex items-center px-6 gap-4 sticky top-0 z-20">
          <h1
            className="font-bold text-base capitalize flex-1"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            {section === "logs"
              ? "Activity Logs"
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </h1>
          <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live · {liveTime}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "oklch(0.55 0.17 245)" }}
          >
            A
          </div>
        </header>

        <div className="p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "recruiters" && <RecruitersSection />}
          {section === "candidates" && <CandidatesSection />}
          {section === "clients" && <ClientsSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "logs" && <LogsSection />}
          {section === "assigndata" && <AssignDataSection />}
          {section === "export" && <ExportSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────
function DashboardSection() {
  const { recruiters, candidates, campaigns } = useCRMStore();
  const { actor } = useActor();
  const [canisterCandidates, setCanisterCandidates] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      try {
        const all = await actor.getAllAssignedCandidates();
        if (all && all.length > 0) setCanisterCandidates(all as any[]);
      } catch (e) {
        console.error("Admin dashboard canister fetch error:", e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [actor]);

  // Use canisterCandidates if available, else fall back to store.candidates
  const allCandidates =
    canisterCandidates.length > 0 ? canisterCandidates : candidates;

  const todayISO = new Date().toISOString().split("T")[0];
  const callsToday = allCandidates.filter((c: any) =>
    c.updatedAt ? c.updatedAt.startsWith(todayISO) : false,
  ).length;

  const totalCalls = allCandidates.filter(
    (c: any) =>
      !!c.updatedAt &&
      c.status !== "" &&
      c.status !== "Assigned" &&
      c.status !== "New",
  ).length;
  const totalInterested = allCandidates.filter(
    (c: any) => c.status === "Interested",
  ).length;
  const totalNotInterested = allCandidates.filter(
    (c: any) => c.status === "Not Interested",
  ).length;

  const convRate =
    totalCalls > 0 ? Math.round((totalInterested / totalCalls) * 100) : 0;
  const perfScore = totalInterested * 2 + totalCalls;

  const todayFollowUps = allCandidates.filter(
    (c: any) => c.followUpDate === today,
  ).length;
  const overdueFollowUps = allCandidates.filter(
    (c: any) => c.followUpDate && c.followUpDate < today,
  ).length;

  // Compute per-recruiter stats from allCandidates
  const approvedRecruiters = recruiters
    .filter((r) => r.status === "approved")
    .map((r) => {
      const rCands = allCandidates.filter(
        (c: any) =>
          c.assignedTo?.toLowerCase() === r.email?.toLowerCase() ||
          c.assignedRecruiter === r.id,
      );
      return {
        ...r,
        calls: rCands.filter(
          (c: any) =>
            !!c.updatedAt &&
            c.status !== "" &&
            c.status !== "Assigned" &&
            c.status !== "New",
        ).length,
        interested: rCands.filter((c: any) => c.status === "Interested").length,
        notInterested: rCands.filter((c: any) => c.status === "Not Interested")
          .length,
        followUps: rCands.filter((c: any) => c.status === "Follow-up").length,
      };
    });

  // blue: oklch(0.55 0.17 245)

  const barData = approvedRecruiters.map((r) => ({
    name: r.name.split(" ")[0],
    Calls: r.calls,
  }));

  const pieData = [
    { name: "Interested", value: totalInterested, fill: "#22c55e" },
    { name: "Not Interested", value: totalNotInterested, fill: "#ef4444" },
  ];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  });
  const lineData = days.map((day, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const dayCands = allCandidates.filter((c: any) =>
      c.updatedAt ? c.updatedAt.startsWith(dateStr) : false,
    );
    return {
      day,
      Calls: dayCands.length,
      Interested: dayCands.filter((c: any) => c.status === "Interested").length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Calls Today" value={callsToday} />
        <StatCard label="Total Calls" value={totalCalls} />
        <StatCard label="Interested" value={totalInterested} />
        <StatCard label="Not Interested" value={totalNotInterested} />
        <StatCard label="Follow-ups Today" value={todayFollowUps} />
        <StatCard
          label="Overdue Follow-ups"
          value={overdueFollowUps}
          highlight={overdueFollowUps > 0}
        />
        <StatCard label="Conversion Rate" value={`${convRate}%`} />
        <StatCard label="Performance Score" value={perfScore} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-border p-4">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            Calls per Recruiter
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <RBar dataKey="Calls" fill="#3b7ef8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            Interested vs Not Interested
          </h3>
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
        <div className="bg-white rounded-xl border border-border p-4">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            Daily Trend (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <RLine
                type="monotone"
                dataKey="Calls"
                stroke="#3b7ef8"
                dot={{ r: 3 }}
              />
              <RLine
                type="monotone"
                dataKey="Interested"
                stroke="#22c55e"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recruiter table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3
            className="font-semibold text-sm"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            Recruiter Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {[
                  "Name",
                  "Calls",
                  "Interested",
                  "Not Interested",
                  "Follow-ups",
                  "Conversion %",
                  "Score",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvedRecruiters.map((r, i) => {
                const conv =
                  r.calls > 0 ? Math.round((r.interested / r.calls) * 100) : 0;
                const score = r.interested * 2 + r.calls;
                return (
                  <tr key={r.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5">{r.calls}</td>
                    <td className="px-4 py-2.5 text-green-600">
                      {r.interested}
                    </td>
                    <td className="px-4 py-2.5 text-red-500">
                      {r.notInterested}
                    </td>
                    <td className="px-4 py-2.5">{r.followUps}</td>
                    <td className="px-4 py-2.5">{conv}%</td>
                    <td className="px-4 py-2.5 font-bold">{score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3
            className="font-semibold text-sm"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            📊 Campaign Performance
          </h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="px-4 py-8 text-center text-foreground/40 text-sm">
            No campaigns created yet. Go to Assign Data to create a campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {[
                    "Campaign",
                    "Company",
                    "Role",
                    "Total Leads",
                    "Interested",
                    "Not Interested",
                    "Pending",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp: Campaign, i: number) => {
                  const campCandidates = allCandidates.filter(
                    (c: any) => c.campaign === camp.campaignName,
                  );
                  const total = campCandidates.length;
                  const interested = campCandidates.filter(
                    (c: any) => c.status === "Interested",
                  ).length;
                  const notInterested = campCandidates.filter(
                    (c: any) => c.status === "Not Interested",
                  ).length;
                  const pending = campCandidates.filter(
                    (c: any) =>
                      !c.status ||
                      c.status === "New" ||
                      c.status === "Assigned",
                  ).length;
                  return (
                    <tr
                      key={camp.id}
                      className={i % 2 === 0 ? "" : "bg-muted/30"}
                    >
                      <td
                        className="px-4 py-2.5 font-semibold"
                        style={{ color: "oklch(0.28 0.085 245)" }}
                      >
                        {camp.campaignName}
                      </td>
                      <td className="px-4 py-2.5 text-foreground/70">
                        {camp.companyName || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-foreground/70">
                        {camp.role || "—"}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-blue-700">
                        {total}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-green-600">
                        {interested}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-red-500">
                        {notInterested}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-orange-500">
                        {pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recruiters ─────────────────────────────────────────────────────
function RecruitersSection() {
  const store = useCRMStore();
  const { actor } = useActor();
  const [showAdd, setShowAdd] = useState(false);
  const [showReassign, setShowReassign] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    status: "approved" as "approved" | "pending",
  });

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
    (r) => r.status === "approved" || r.status === "pending",
  );

  const candidateCount = (rid: string) =>
    store.candidates.filter((c) => c.assignedRecruiter === rid).length;

  return (
    <div className="space-y-5">
      {store.signupRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-yellow-700 mb-3">
            Pending Approval Requests ({store.signupRequests.length})
          </h3>
          <div className="space-y-2">
            {store.signupRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-yellow-100"
              >
                <div>
                  <p className="font-medium text-sm">{req.name}</p>
                  <p className="text-xs text-foreground/50">
                    {req.email} · {req.requestedAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    data-ocid="admin.approve.button"
                    onClick={() => {
                      store.approveRecruiter(req.id);
                      if (actor)
                        actor.approveSignupRequest(req.email).catch(() => {});
                      apiPost({
                        type: "approveRecruiter",
                        email: req.email,
                      }).catch(() => {});
                    }}
                    className="h-8 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="admin.reject.button"
                    onClick={() => {
                      store.rejectRecruiter(req.id);
                      apiPost({
                        type: "rejectRecruiter",
                        email: req.email,
                      }).catch(() => {});
                    }}
                    className="h-8 text-xs border-red-300 text-red-500 hover:bg-red-50"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3
            className="font-semibold text-sm"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            All Recruiters
          </h3>
          <Button
            size="sm"
            data-ocid="admin.add_recruiter.button"
            onClick={() => setShowAdd(true)}
            className="h-8 text-xs"
            style={{ background: "oklch(0.55 0.17 245)" }}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Recruiter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {[
                  "Name",
                  "Email",
                  "Status",
                  "Calls",
                  "Interested",
                  "Conv%",
                  "Candidates",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvedRecruiters.map((r, i) => {
                const conv =
                  r.calls > 0 ? Math.round((r.interested / r.calls) * 100) : 0;
                return (
                  <tr key={r.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5 text-foreground/60">
                      {r.email}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{r.calls}</td>
                    <td className="px-4 py-2.5 text-green-600">
                      {r.interested}
                    </td>
                    <td className="px-4 py-2.5">{conv}%</td>
                    <td className="px-4 py-2.5">{candidateCount(r.id)}</td>
                    <td className="px-4 py-2.5 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setShowReassign(r.id);
                          setReassignTo("");
                        }}
                      >
                        Reassign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-500 hover:bg-red-50"
                        data-ocid={`admin.delete_recruiter.button.${i + 1}`}
                        onClick={() => store.deleteRecruiter(r.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent data-ocid="admin.add_recruiter.dialog">
          <DialogHeader>
            <DialogTitle>Add Recruiter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin.add_recruiter.cancel_button"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.add_recruiter.submit_button"
              onClick={() => {
                if (form.name && form.email && form.password) {
                  store.addRecruiter({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    status: "approved",
                  });
                  setShowAdd(false);
                  setForm({
                    name: "",
                    email: "",
                    password: "",
                    status: "approved",
                  });
                }
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={!!showReassign} onOpenChange={() => setShowReassign(null)}>
        <DialogContent data-ocid="admin.reassign.dialog">
          <DialogHeader>
            <DialogTitle>Reassign Candidates</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/60">
            Reassign all candidates from this recruiter to another.
          </p>
          <Select onValueChange={setReassignTo}>
            <SelectTrigger>
              <SelectValue placeholder="Select target recruiter" />
            </SelectTrigger>
            <SelectContent>
              {store.recruiters
                .filter((r) => r.id !== showReassign && r.status === "approved")
                .map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin.reassign.cancel_button"
              onClick={() => setShowReassign(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.reassign.confirm_button"
              onClick={() => {
                if (showReassign && reassignTo) {
                  store.bulkAssignCandidates(showReassign, reassignTo);
                  setShowReassign(null);
                }
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Candidates ─────────────────────────────────────────────────────
function CandidatesSection() {
  const store = useCRMStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [bulkTo, setBulkTo] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const STATUSES = [
    "New",
    "Called",
    "Interested",
    "Not Interested",
    "Follow-up",
    "Invalid",
    "Duplicate",
  ];
  const ACTIONS = ["Call", "WhatsApp", "Interview"];

  const emptyForm = {
    name: "",
    phone: "",
    email: "",
    skills: "",
    status: "New" as Candidate["status"],
    assignedRecruiter: "",
    notes: "",
    followUpDate: "",
    nextAction: "Call" as Candidate["nextAction"],
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = store.candidates.filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q))
      return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (recruiterFilter !== "all" && c.assignedRecruiter !== recruiterFilter)
      return false;
    return true;
  });

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1);
      for (const line of lines) {
        const [name, phone, email, skills, status, assignedRecruiter, notes] =
          line.split(",").map((s) => s.trim());
        if (name)
          store.addCandidate({
            name,
            phone: phone || "",
            email: email || "",
            skills: skills || "",
            status: (status as Candidate["status"]) || "New",
            assignedRecruiter: assignedRecruiter || "",
            notes: notes || "",
            followUpDate: "",
            nextAction: "Call",
          });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const rowClass = (c: Candidate) => {
    if (c.followUpDate && c.followUpDate < today) return "bg-red-50";
    if (c.followUpDate === today) return "bg-yellow-50";
    return "";
  };

  const openEdit = (c: Candidate) => {
    setEditCandidate(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      skills: c.skills,
      status: c.status,
      assignedRecruiter: c.assignedRecruiter,
      notes: c.notes,
      followUpDate: c.followUpDate,
      nextAction: c.nextAction,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          data-ocid="candidates.search_input"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-40 h-9"
            data-ocid="candidates.status.select"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
          <SelectTrigger
            className="w-40 h-9"
            data-ocid="candidates.recruiter.select"
          >
            <SelectValue placeholder="All Recruiters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recruiters</SelectItem>
            {store.recruiters
              .filter((r) => r.status === "approved")
              .map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <Button
            size="sm"
            data-ocid="candidates.bulk_assign.button"
            onClick={() => setShowBulkDialog(true)}
            variant="outline"
            className="h-9 text-xs"
          >
            Bulk Assign ({selected.length})
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSV}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          data-ocid="candidates.upload_button"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 text-xs"
        >
          <Upload className="w-3 h-3 mr-1" />
          Import CSV
        </Button>
        <Button
          size="sm"
          data-ocid="candidates.add_candidate.button"
          onClick={() => {
            setShowAdd(true);
            setForm(emptyForm);
          }}
          className="h-9 text-xs ml-auto"
          style={{ background: "oklch(0.55 0.17 245)" }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Candidate
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filtered.map((c) => c.id) : [],
                      )
                    }
                  />
                </th>
                {[
                  "Name",
                  "Phone",
                  "Skills",
                  "Status",
                  "Recruiter",
                  "Follow-up",
                  "Next Action",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-semibold text-foreground/60 uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  data-ocid={`candidates.item.${i + 1}`}
                  className={rowClass(c)}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, c.id]
                            : prev.filter((id) => id !== c.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="px-3 py-2 text-foreground/60">{c.phone}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">
                    {c.skills}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[getStatusLabel(c.status)] || "bg-gray-100 text-gray-500"}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/60">
                    {store.recruiters
                      .find((r) => r.id === c.assignedRecruiter)
                      ?.name?.split(" ")[0] || "—"}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap ${c.followUpDate && c.followUpDate < new Date().toISOString().split("T")[0] ? "text-red-600 font-semibold" : c.followUpDate === new Date().toISOString().split("T")[0] ? "text-yellow-600 font-semibold" : ""}`}
                  >
                    {c.followUpDate || "—"}
                  </td>
                  <td className="px-3 py-2">{c.nextAction}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      data-ocid={`candidates.edit_button.${i + 1}`}
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2 border-red-200 text-red-500"
                      data-ocid={`candidates.delete_button.${i + 1}`}
                      onClick={() => store.deleteCandidate(c.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-8 text-foreground/40"
                    data-ocid="candidates.empty_state"
                  >
                    No candidates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog
        open={showAdd || !!editCandidate}
        onOpenChange={(o) => {
          if (!o) {
            setShowAdd(false);
            setEditCandidate(null);
          }
        }}
      >
        <DialogContent
          data-ocid="candidates.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editCandidate ? "Edit Candidate" : "Add Candidate"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Skills</Label>
              <Input
                value={form.skills}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skills: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Candidate["status"] }))
                }
              >
                <SelectTrigger data-ocid="candidates.status_edit.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned Recruiter</Label>
              <Select
                value={form.assignedRecruiter}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, assignedRecruiter: v }))
                }
              >
                <SelectTrigger data-ocid="candidates.recruiter_edit.select">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {store.recruiters
                    .filter((r) => r.status === "approved")
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, followUpDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Next Action</Label>
              <Select
                value={form.nextAction}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    nextAction: v as Candidate["nextAction"],
                  }))
                }
              >
                <SelectTrigger data-ocid="candidates.nextaction.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="candidates.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditCandidate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="candidates.submit_button"
              onClick={() => {
                if (!form.name) return;
                if (editCandidate) {
                  store.updateCandidate(editCandidate.id, form);
                  setEditCandidate(null);
                } else {
                  store.addCandidate(form);
                  setShowAdd(false);
                }
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              {editCandidate ? "Save Changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent data-ocid="candidates.bulk_assign.dialog">
          <DialogHeader>
            <DialogTitle>Bulk Assign Recruiter</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/60">
            {selected.length} candidate(s) selected
          </p>
          <Select onValueChange={setBulkTo}>
            <SelectTrigger data-ocid="candidates.bulk_recruiter.select">
              <SelectValue placeholder="Select recruiter" />
            </SelectTrigger>
            <SelectContent>
              {store.recruiters
                .filter((r) => r.status === "approved")
                .map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="candidates.bulk_assign.cancel_button"
              onClick={() => setShowBulkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="candidates.bulk_assign.confirm_button"
              onClick={() => {
                if (bulkTo) {
                  for (const id of selected)
                    store.updateCandidate(id, { assignedRecruiter: bulkTo });
                  setSelected([]);
                  setShowBulkDialog(false);
                }
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Clients ────────────────────────────────────────────────────────
function ClientsSection() {
  const store = useCRMStore();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const emptyForm = {
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    activeRoles: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditClient(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({
      name: c.name,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.email,
      activeRoles: c.activeRoles,
      notes: c.notes,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          data-ocid="clients.add_client.button"
          onClick={openAdd}
          style={{ background: "oklch(0.55 0.17 245)" }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Client
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {store.clients.map((c, i) => (
          <div
            key={c.id}
            data-ocid={`clients.item.${i + 1}`}
            className="bg-white rounded-xl border border-border p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3
                  className="font-bold text-base"
                  style={{ color: "oklch(0.28 0.085 245)" }}
                >
                  {c.name}
                </h3>
                <p className="text-xs text-foreground/50">{c.contactPerson}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                data-ocid={`clients.edit_button.${i + 1}`}
                onClick={() => openEdit(c)}
                className="h-7 text-xs"
              >
                Edit
              </Button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-foreground/70">📞 {c.phone}</p>
              <p className="text-foreground/70">✉️ {c.email}</p>
              <p className="text-foreground/70">
                <span className="font-medium">Roles:</span> {c.activeRoles}
              </p>
              {c.notes && (
                <p className="text-foreground/50 text-xs mt-2">{c.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent data-ocid="clients.dialog">
          <DialogHeader>
            <DialogTitle>
              {editClient ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPerson: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Active Roles</Label>
              <Input
                value={form.activeRoles}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activeRoles: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="clients.cancel_button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="clients.submit_button"
              onClick={() => {
                if (!form.name) return;
                if (editClient) store.updateClient(editClient.id, form);
                else store.addClient(form);
                setShowModal(false);
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              {editClient ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────────
function NotificationsSection() {
  const store = useCRMStore();
  const { actor } = useActor();

  // Fetch pending recruiter requests from ICP canister (cross-device sync)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time fetch
  useEffect(() => {
    if (!actor) return;
    actor
      .getSignupRequests()
      .then((requests: any[]) => {
        const pending = requests.filter((r: any) => r.status === "pending");
        for (const r of pending) {
          const alreadyIn = store.signupRequests.find(
            (s: any) => s.email.toLowerCase() === r.email.toLowerCase(),
          );
          if (!alreadyIn) {
            store.addSignupRequest({
              name: r.name,
              email: r.email,
              password: r.password || "",
            });
          }
        }
      })
      .catch(() => {
        // Fallback: try localStorage crm_signups
        const stored = localStorage.getItem("crm_signups");
        if (stored) {
          const reqs = JSON.parse(stored);
          for (const r of reqs) {
            const alreadyIn = store.signupRequests.find(
              (s: any) => s.email.toLowerCase() === r.email.toLowerCase(),
            );
            if (!alreadyIn) {
              store.addSignupRequest({
                name: r.name,
                email: r.email,
                password: r.password || "",
              });
            }
          }
        }
      });
  }, [actor]);

  return (
    <div className="space-y-3">
      <h2
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        Signup Requests
      </h2>
      {store.signupRequests.length === 0 ? (
        <div
          data-ocid="notifications.empty_state"
          className="bg-white rounded-xl border border-border p-8 text-center text-foreground/40"
        >
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No pending signup requests
        </div>
      ) : (
        <div className="space-y-3">
          {store.signupRequests.map((req) => (
            <div
              key={req.id}
              data-ocid={`notifications.item.${store.signupRequests.indexOf(req) + 1}`}
              className="bg-white rounded-xl border border-border p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{req.name}</p>
                <p className="text-sm text-foreground/50">
                  {req.email} · Requested {req.requestedAt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  data-ocid={`notifications.approve.button.${store.signupRequests.indexOf(req) + 1}`}
                  onClick={() => {
                    store.approveRecruiter(req.id);
                    // Sync approval to canister for cross-device
                    if (actor)
                      actor.approveSignupRequest(req.email).catch(() => {});
                    apiPost({
                      type: "approveRecruiter",
                      email: req.email,
                    }).catch(() => {});
                    // Update localStorage so recruiter can login on same device
                    const storedR = localStorage.getItem("crm_recruiters");
                    const recs = storedR ? JSON.parse(storedR) : [];
                    const idx = recs.findIndex(
                      (r: any) =>
                        r.email.toLowerCase() === req.email.toLowerCase(),
                    );
                    if (idx >= 0) {
                      recs[idx].status = "approved";
                      localStorage.setItem(
                        "crm_recruiters",
                        JSON.stringify(recs),
                      );
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid={`notifications.reject.button.${store.signupRequests.indexOf(req) + 1}`}
                  onClick={() => {
                    store.rejectRecruiter(req.id);
                    // Sync rejection to canister for cross-device
                    if (actor)
                      actor.rejectSignupRequest(req.email).catch(() => {});
                    apiPost({
                      type: "rejectRecruiter",
                      email: req.email,
                    }).catch(() => {});
                  }}
                  className="border-red-200 text-red-500 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Logs ───────────────────────────────────────────────────────────
function LogsSection() {
  const { activityLogs, recruiters } = useCRMStore();
  const { actor } = useActor();
  const [recruiterF, setRecruiterF] = useState("all");
  const [daysF, setDaysF] = useState("30");
  const [canisterLogs, setCanisterLogs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      try {
        const all = await actor.getAllAssignedCandidates();
        const logs = (all as any[])
          .filter(
            (c) =>
              c.updatedAt &&
              c.status &&
              c.status !== "" &&
              c.status !== "Assigned" &&
              c.status !== "New",
          )
          .map((c) => ({
            id: `canister_${c.id}`,
            recruiterId: c.assignedTo,
            recruiterName: c.assignedTo,
            action: "Campaign Response",
            details: `[${c.campaign}] ${c.name} → ${c.status}`,
            timestamp: c.updatedAt,
          }))
          .sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
        setCanisterLogs(logs);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [actor]);

  // Merge canister logs with local logs, deduplicate by id
  const allLogs = [...canisterLogs, ...activityLogs].filter(
    (log, idx, arr) => arr.findIndex((l) => l.id === log.id) === idx,
  );

  // period filter
  const filtered = allLogs.filter((l) => {
    if (recruiterF !== "all" && l.recruiterId !== recruiterF) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={recruiterF} onValueChange={setRecruiterF}>
          <SelectTrigger className="w-44 h-9" data-ocid="logs.recruiter.select">
            <SelectValue placeholder="All Recruiters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recruiters</SelectItem>
            {recruiters
              .filter((r) => r.status === "approved")
              .map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={daysF} onValueChange={setDaysF}>
          <SelectTrigger className="w-36 h-9" data-ocid="logs.period.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="15">Last 15 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {["Date/Time", "Recruiter", "Action", "Details"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/60 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr
                key={l.id}
                data-ocid={`logs.item.${i + 1}`}
                className={i % 2 === 0 ? "" : "bg-muted/30"}
              >
                <td className="px-4 py-2.5 text-foreground/60 whitespace-nowrap">
                  {l.timestamp}
                </td>
                <td className="px-4 py-2.5 font-medium">{l.recruiterName}</td>
                <td className="px-4 py-2.5">{l.action}</td>
                <td className="px-4 py-2.5 text-foreground/60">{l.details}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-8 text-foreground/40"
                  data-ocid="logs.empty_state"
                >
                  No activity logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────
function ExportSection() {
  const { candidates, recruiters, activityLogs } = useCRMStore();

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, "'")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCandidates = () => {
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Email",
      "Skills",
      "Status",
      "Recruiter",
      "Follow-up Date",
      "Next Action",
      "Notes",
      "Timestamp",
    ];
    const rows = candidates.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.skills,
      c.status,
      recruiters.find((r) => r.id === c.assignedRecruiter)?.name || "",
      c.followUpDate,
      c.nextAction,
      c.notes,
      c.timestamp,
    ]);
    downloadCSV([headers, ...rows], "candidates.csv");
  };

  const exportDashboard = () => {
    const headers = [
      "Name",
      "Calls",
      "Interested",
      "Not Interested",
      "Follow-ups",
      "Conversion%",
      "Score",
    ];
    const rows = recruiters
      .filter((r) => r.status === "approved")
      .map((r) => [
        r.name,
        String(r.calls),
        String(r.interested),
        String(r.notInterested),
        String(r.followUps),
        `${r.calls > 0 ? Math.round((r.interested / r.calls) * 100) : 0}%`,
        String(r.interested * 2 + r.calls),
      ]);
    downloadCSV([headers, ...rows], "dashboard-summary.csv");
  };

  const exportLogs = () => {
    const headers = ["Date", "Recruiter", "Action", "Details"];
    const rows = activityLogs.map((l) => [
      l.timestamp,
      l.recruiterName,
      l.action,
      l.details,
    ]);
    downloadCSV([headers, ...rows], "activity-logs.csv");
  };

  return (
    <div className="space-y-4">
      <h2
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        Export Data
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Export Candidates CSV",
            desc: "All candidate records",
            action: exportCandidates,
            ocid: "export.candidates.button",
          },
          {
            label: "Export Dashboard CSV",
            desc: "Recruiter performance summary",
            action: exportDashboard,
            ocid: "export.dashboard.button",
          },
          {
            label: "Export Activity Logs CSV",
            desc: "All recruiter activity",
            action: exportLogs,
            ocid: "export.logs.button",
          },
        ].map(({ label, desc, action, ocid }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-border p-5"
          >
            <FileText
              className="w-8 h-8 mb-3"
              style={{ color: "oklch(0.55 0.17 245)" }}
            />
            <h3 className="font-semibold mb-1">{label}</h3>
            <p className="text-sm text-foreground/50 mb-4">{desc}</p>
            <Button
              size="sm"
              data-ocid={ocid}
              onClick={action}
              className="w-full"
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────
function SettingsSection() {
  const store = useCRMStore();
  const [apiUrl, setApiUrl] = useState(store.crmConfig.apiUrl);
  const [sheetId, setSheetId] = useState(store.crmConfig.sheetId);
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-xl space-y-5">
      <h2
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        Integration Settings
      </h2>
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div>
          <Label>Google Sheet ID</Label>
          <Input
            data-ocid="settings.sheet_id.input"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          />
          <p className="text-xs text-foreground/40 mt-1">
            Found in your Google Sheets URL
          </p>
        </div>
        <div>
          <Label>Apps Script Web App URL</Label>
          <Input
            data-ocid="settings.api_url.input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
          <p className="text-xs text-foreground/40 mt-1">
            Deploy your Apps Script as a web app and paste the URL
          </p>
        </div>
        <Button
          data-ocid="settings.save.button"
          onClick={() => {
            store.updateCRMConfig({ apiUrl, sheetId });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          style={{ background: "oklch(0.55 0.17 245)" }}
        >
          {saved ? "✓ Saved!" : "Save Configuration"}
        </Button>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <h4 className="font-semibold mb-1">How to connect Google Sheets</h4>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>
            Create a Google Sheet with columns: Name, Phone, Email, Skills,
            Status, Recruiter, Notes
          </li>
          <li>Go to Extensions → Apps Script in your sheet</li>
          <li>
            Paste the provided backend code and deploy as Web App (Anyone can
            access)
          </li>
          <li>Copy the Web App URL and paste it above</li>
          <li>Copy the Sheet ID from the URL and paste it above</li>
        </ol>
      </div>
    </div>
  );
}
