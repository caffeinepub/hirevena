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
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Phone,
  PhoneCall,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  type Candidate,
  type CurrentUser,
  useCRMStore,
} from "../hooks/useCRMStore";

type RecruiterTab =
  | "dashboard"
  | "candidates"
  | "followups"
  | "activity"
  | "profile"
  | "callingdata";

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

// Helper: display label for status
function getStatusLabel(status: string): string {
  if (!status || status === "New") return "Pending";
  return status;
}

// Helper: is status already finalized by recruiter (disable further response)
function isStatusFinalized(status: string): boolean {
  return status === "Interested" || status === "Not Interested";
}

interface Props {
  currentUser: CurrentUser;
  onLogout: () => void;
}

export default function RecruiterPanel({ currentUser, onLogout }: Props) {
  const [tab, setTab] = useState<RecruiterTab>("dashboard");

  const navItems: {
    key: RecruiterTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "followups", label: "Follow-ups", icon: ChevronRight },
    { key: "activity", label: "Activity", icon: Activity },
    { key: "profile", label: "Profile", icon: User },
    { key: "callingdata", label: "Calling", icon: PhoneCall },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "oklch(0.97 0.01 245)" }}
    >
      {/* Header */}
      <header className="bg-white border-b border-border h-14 flex items-center px-4 sticky top-0 z-20">
        <span
          className="font-black text-lg tracking-tight flex-1"
          style={{ color: "oklch(0.28 0.085 245)" }}
        >
          Hirevena
        </span>
        <span className="text-sm font-medium text-foreground/60 mr-3">
          {currentUser.name}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "oklch(0.45 0.15 160)" }}
        >
          {currentUser.name.charAt(0)}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {tab === "dashboard" && (
          <RecruiterDashboardTab recruiterId={currentUser.id} />
        )}
        {tab === "candidates" && (
          <MyCandidatesTab recruiterId={currentUser.id} />
        )}
        {tab === "followups" && <FollowUpsTab recruiterId={currentUser.id} />}
        {tab === "activity" && <ActivityTab recruiterId={currentUser.id} />}
        {tab === "profile" && (
          <ProfileTab currentUser={currentUser} onLogout={onLogout} />
        )}
        {tab === "callingdata" && (
          <CallingDataTab recruiterId={currentUser.id} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 flex">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            data-ocid={
              key === "callingdata"
                ? "recruiter.callingdata.nav"
                : `recruiter.nav.${key}`
            }
            onClick={() => setTab(key)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 font-medium transition-colors ${
              tab === key
                ? "text-white"
                : "text-foreground/50 hover:text-foreground"
            }`}
            style={tab === key ? { background: "oklch(0.55 0.17 245)" } : {}}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px]">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Calling Data Tab ───────────────────────────────────────────────
function CallingDataTab({ recruiterId }: { recruiterId: string }) {
  const store = useCRMStore();
  const [, setTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");
  const [responseCandidate, setResponseCandidate] = useState<Candidate | null>(
    null,
  );
  const [responseForm, setResponseForm] = useState({
    status: "Called" as Candidate["status"],
    notes: "",
    followUpDate: "",
    nextAction: "Call" as Candidate["nextAction"],
  });
  const [followUpError, setFollowUpError] = useState("");
  const [toast, setToast] = useState("");

  // Auto-refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const allMyCandidates = store.candidates.filter(
    (c) => c.assignedRecruiter === recruiterId,
  );

  // Apply filters
  const filtered = allMyCandidates.filter((c) => {
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (timeFilter === "Today") {
      return c.followUpDate === today || c.timestamp?.startsWith(today);
    }
    if (timeFilter === "Pending") {
      return c.status === "New" || c.status === "Follow-up";
    }
    if (timeFilter === "Completed") {
      return (
        c.status === "Interested" ||
        c.status === "Not Interested" ||
        c.status === "Called"
      );
    }
    return true;
  });

  // Stats
  const totalAssigned = allMyCandidates.length;
  const callsDone = allMyCandidates.filter((c) => c.status !== "New").length;
  const pendingCalls = allMyCandidates.filter((c) => c.status === "New").length;
  const interested = allMyCandidates.filter(
    (c) => c.status === "Interested",
  ).length;
  const notInterested = allMyCandidates.filter(
    (c) => c.status === "Not Interested",
  ).length;
  const followUps = allMyCandidates.filter(
    (c) => c.status === "Follow-up",
  ).length;

  const progressPct =
    totalAssigned > 0 ? Math.round((callsDone / totalAssigned) * 100) : 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleStartCalling = () => {
    const next = allMyCandidates.find((c) => c.status === "New");
    if (!next) {
      showToast("No more new candidates");
      return;
    }
    // Open phone dialer
    window.location.href = `tel:${next.phone}`;
    // Open response modal
    openResponseModal(next);
  };

  const openResponseModal = (c: Candidate) => {
    setResponseCandidate(c);
    setResponseForm({
      status: "Called",
      notes: "",
      followUpDate: "",
      nextAction: "Call",
    });
    setFollowUpError("");
  };

  const handleResponseSubmit = () => {
    if (!responseCandidate) return;
    const needsDate =
      responseForm.status === "Interested" ||
      responseForm.status === "Follow-up";
    if (needsDate && !responseForm.followUpDate) {
      setFollowUpError("Follow-up date is required for this status.");
      return;
    }
    store.updateCandidate(responseCandidate.id, {
      status: responseForm.status,
      notes: responseForm.notes,
      followUpDate: responseForm.followUpDate,
      nextAction: responseForm.nextAction,
    });
    store.addActivityLog({
      recruiterId,
      recruiterName:
        store.recruiters.find((r) => r.id === recruiterId)?.name || "",
      action: "Call Response",
      details: `${responseCandidate.name} → ${responseForm.status}`,
    });
    setResponseCandidate(null);
    setFollowUpError("");
  };

  const getCardBorder = (c: Candidate) => {
    if (c.status === "New") return "border-l-4 border-l-red-400";
    if (c.followUpDate === today) return "border-l-4 border-l-yellow-400";
    return "";
  };

  const CALLING_STATUSES = [
    "Called",
    "Interested",
    "Not Interested",
    "Follow-up",
  ];

  return (
    <div className="space-y-4">
      <h1
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        📞 Calling Data
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: totalAssigned, color: "text-blue-700" },
          { label: "Done", value: callsDone, color: "text-green-700" },
          { label: "Pending", value: pendingCalls, color: "text-orange-600" },
          { label: "Interested", value: interested, color: "text-emerald-700" },
          { label: "Not Int.", value: notInterested, color: "text-red-600" },
          { label: "Follow-ups", value: followUps, color: "text-yellow-700" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-border p-2.5 text-center"
          >
            <p className="text-[10px] text-foreground/50 uppercase font-medium mb-0.5">
              {s.label}
            </p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-border p-3">
        <div className="flex justify-between text-xs text-foreground/60 mb-1.5">
          <span>Calls Done / Total Assigned</span>
          <span className="font-semibold">
            {callsDone}/{totalAssigned} ({progressPct}%)
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "oklch(0.55 0.17 245)",
            }}
          />
        </div>
      </div>

      {/* Start Calling Button */}
      <Button
        data-ocid="recruiter.callingdata.start_calling"
        className="w-full h-12 text-base font-bold"
        style={{ background: "oklch(0.45 0.20 145)" }}
        onClick={handleStartCalling}
      >
        🚀 Start Calling
      </Button>

      {/* Status Filter */}
      <div>
        <p className="text-xs font-semibold text-foreground/50 uppercase mb-2">
          Status
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", "New", "Called", "Follow-up"].map((s) => (
            <button
              key={s}
              type="button"
              data-ocid="recruiter.callingdata.status.tab"
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                statusFilter === s
                  ? "text-white border-transparent"
                  : "bg-white border-border text-foreground/60"
              }`}
              style={
                statusFilter === s ? { background: "oklch(0.55 0.17 245)" } : {}
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div>
        <p className="text-xs font-semibold text-foreground/50 uppercase mb-2">
          Time
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", "Today", "Pending", "Completed"].map((t) => (
            <button
              key={t}
              type="button"
              data-ocid="recruiter.callingdata.time.tab"
              onClick={() => setTimeFilter(t)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                timeFilter === t
                  ? "text-white border-transparent"
                  : "bg-white border-border text-foreground/60"
              }`}
              style={
                timeFilter === t ? { background: "oklch(0.45 0.15 160)" } : {}
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div
            data-ocid="recruiter.callingdata.empty_state"
            className="bg-white rounded-xl border border-border p-8 text-center text-foreground/40"
          >
            No candidates found
          </div>
        )}
        {filtered.map((c, i) => (
          <div
            key={c.id}
            data-ocid={`recruiter.callingdata.item.${i + 1}`}
            className={`bg-white rounded-xl border border-border p-4 ${getCardBorder(c)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-base">{c.name}</h3>
                <p className="text-xs text-foreground/50">{c.phone}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[getStatusLabel(c.status)] || "bg-gray-100 text-gray-500"}`}
              >
                {getStatusLabel(c.status)}
              </span>
            </div>

            {c.followUpDate && (
              <p className="text-xs text-foreground/50 mb-2">
                📅 Follow-up:{" "}
                <span
                  className={
                    c.followUpDate === today
                      ? "text-yellow-600 font-semibold"
                      : ""
                  }
                >
                  {c.followUpDate}
                </span>
              </p>
            )}
            {c.notes && (
              <p className="text-xs text-foreground/40 mb-2 line-clamp-1">
                📝 {c.notes}
              </p>
            )}
            {c.timestamp && (
              <p className="text-xs text-foreground/30 mb-3">
                Last updated: {c.timestamp}
              </p>
            )}

            <div className="flex gap-2">
              <a
                href={`tel:${c.phone}`}
                data-ocid={`recruiter.callingdata.call.button.${i + 1}`}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white"
                style={{ background: "oklch(0.55 0.17 245)" }}
              >
                <Phone className="w-4 h-4" /> 📞 Call
              </a>
              <button
                type="button"
                data-ocid={`recruiter.callingdata.response.button.${i + 1}`}
                onClick={() =>
                  !isStatusFinalized(c.status) && openResponseModal(c)
                }
                disabled={isStatusFinalized(c.status)}
                title={
                  isStatusFinalized(c.status)
                    ? "Status already updated"
                    : "Submit response"
                }
                className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm border-2 border-border transition-colors ${isStatusFinalized(c.status) ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}`}
              >
                {isStatusFinalized(c.status) ? "✅ Updated" : "📝 Response"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      <Dialog
        open={!!responseCandidate}
        onOpenChange={(o) => !o && setResponseCandidate(null)}
      >
        <DialogContent
          data-ocid="recruiter.callingdata.response.dialog"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>📝 Response — {responseCandidate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Status */}
            <div>
              <Label className="font-semibold">Status</Label>
              <Select
                value={responseForm.status}
                onValueChange={(v) => {
                  setResponseForm((f) => ({
                    ...f,
                    status: v as Candidate["status"],
                  }));
                  setFollowUpError("");
                }}
              >
                <SelectTrigger data-ocid="recruiter.callingdata.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALLING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="font-semibold">Notes</Label>
              <Textarea
                data-ocid="recruiter.callingdata.notes.textarea"
                value={responseForm.notes}
                onChange={(e) =>
                  setResponseForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
                placeholder="Add call notes..."
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <Label className="font-semibold">
                Next Follow-up Date
                {(responseForm.status === "Interested" ||
                  responseForm.status === "Follow-up") && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Input
                type="date"
                data-ocid="recruiter.callingdata.followup.input"
                value={responseForm.followUpDate}
                onChange={(e) => {
                  setResponseForm((f) => ({
                    ...f,
                    followUpDate: e.target.value,
                  }));
                  setFollowUpError("");
                }}
              />
              {followUpError && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="recruiter.callingdata.followup.error_state"
                >
                  {followUpError}
                </p>
              )}
            </div>

            {/* Next Action */}
            <div>
              <Label className="font-semibold">Next Action</Label>
              <Select
                value={responseForm.nextAction}
                onValueChange={(v) =>
                  setResponseForm((f) => ({
                    ...f,
                    nextAction: v as Candidate["nextAction"],
                  }))
                }
              >
                <SelectTrigger data-ocid="recruiter.callingdata.action.select">
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
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="recruiter.callingdata.response.cancel_button"
              onClick={() => setResponseCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="recruiter.callingdata.response.submit_button"
              onClick={handleResponseSubmit}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Save Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div
          data-ocid="recruiter.callingdata.toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg z-50"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Tab ───────────────────────────────────────────────────
function RecruiterDashboardTab({ recruiterId }: { recruiterId: string }) {
  const { recruiters, activityLogs } = useCRMStore();
  const today = new Date().toISOString().split("T")[0];
  const recruiter = recruiters.find((r) => r.id === recruiterId);
  const myLogs = activityLogs
    .filter((l) => l.recruiterId === recruiterId)
    .slice(0, 5);

  const callsToday = myLogs.filter(
    (l) =>
      l.timestamp.startsWith(today) && l.action.toLowerCase().includes("call"),
  ).length;

  const stats = [
    { label: "Calls Today", value: callsToday },
    { label: "Interested", value: recruiter?.interested || 0 },
    { label: "Not Interested", value: recruiter?.notInterested || 0 },
    { label: "Follow-ups", value: recruiter?.followUps || 0 },
  ];

  return (
    <div className="space-y-4">
      <h1
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        Good {getGreeting()}, {recruiter?.name.split(" ")[0]} 👋
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-border p-4"
          >
            <p className="text-xs text-foreground/50 uppercase font-medium mb-1">
              {s.label}
            </p>
            <p
              className="text-2xl font-black"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
        {myLogs.length === 0 ? (
          <p className="text-foreground/40 text-sm text-center py-4">
            No activity yet
          </p>
        ) : (
          <div className="space-y-2">
            {myLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{l.action}</p>
                  <p className="text-xs text-foreground/50">
                    {l.details} · {l.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Candidates Tab ─────────────────────────────────────────────
function MyCandidatesTab({ recruiterId }: { recruiterId: string }) {
  const store = useCRMStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updateCandidate, setUpdateCandidate] = useState<Candidate | null>(
    null,
  );
  const [showAdd, setShowAdd] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "New" as Candidate["status"],
    notes: "",
    followUpDate: "",
    nextAction: "Call" as Candidate["nextAction"],
  });
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    email: "",
    skills: "",
    notes: "",
  });

  const myCandidates = store.candidates.filter((c) => {
    if (c.assignedRecruiter !== recruiterId) return false;
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q))
      return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const openUpdate = (c: Candidate) => {
    setUpdateCandidate(c);
    setUpdateForm({
      status: c.status,
      notes: c.notes,
      followUpDate: c.followUpDate,
      nextAction: c.nextAction,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          data-ocid="recruiter.search.search_input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1"
        />
        <Button
          size="sm"
          data-ocid="recruiter.add_candidate.button"
          onClick={() => setShowAdd(true)}
          className="h-9"
          style={{ background: "oklch(0.55 0.17 245)" }}
        >
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            data-ocid="recruiter.status_filter.tab"
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              statusFilter === s
                ? "text-white"
                : "bg-white border border-border text-foreground/60"
            }`}
            style={
              statusFilter === s ? { background: "oklch(0.55 0.17 245)" } : {}
            }
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {myCandidates.length === 0 && (
          <div
            data-ocid="recruiter.candidates.empty_state"
            className="bg-white rounded-xl border border-border p-8 text-center text-foreground/40"
          >
            No candidates found
          </div>
        )}
        {myCandidates.map((c, i) => (
          <div
            key={c.id}
            data-ocid={`recruiter.candidates.item.${i + 1}`}
            className="bg-white rounded-xl border border-border p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-base">{c.name}</h3>
                {c.followUpDate && (
                  <p className="text-xs text-foreground/50">
                    Follow-up: {c.followUpDate}
                  </p>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[getStatusLabel(c.status)] || "bg-gray-100 text-gray-500"}`}
              >
                {getStatusLabel(c.status)}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <a
                href={`tel:${c.phone}`}
                data-ocid={`recruiter.call.button.${i + 1}`}
                className="flex items-center gap-1.5 text-sm font-medium py-1.5 px-3 rounded-lg border border-border hover:bg-muted"
              >
                <Phone className="w-4 h-4" />
                {c.phone}
              </a>
              <a
                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${c.name}, I'm calling from Hirevena regarding a job opportunity.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`recruiter.whatsapp.button.${i + 1}`}
                className="flex items-center gap-1.5 text-sm font-medium py-1.5 px-3 rounded-lg bg-green-50 text-green-700 border border-green-200"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <Button
              size="sm"
              variant="outline"
              data-ocid={`recruiter.update.button.${i + 1}`}
              onClick={() => openUpdate(c)}
              className="w-full h-8 text-xs"
            >
              Update Status
            </Button>
          </div>
        ))}
      </div>

      {/* Update Modal */}
      <Dialog
        open={!!updateCandidate}
        onOpenChange={(o) => !o && setUpdateCandidate(null)}
      >
        <DialogContent data-ocid="recruiter.update.dialog">
          <DialogHeader>
            <DialogTitle>Update {updateCandidate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Status</Label>
              <Select
                value={updateForm.status}
                onValueChange={(v) =>
                  setUpdateForm((f) => ({
                    ...f,
                    status: v as Candidate["status"],
                  }))
                }
              >
                <SelectTrigger data-ocid="recruiter.update.status.select">
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
              <Label>Notes</Label>
              <Textarea
                data-ocid="recruiter.update.notes.textarea"
                value={updateForm.notes}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Next Follow-up Date</Label>
              <Input
                type="date"
                data-ocid="recruiter.update.followup.input"
                value={updateForm.followUpDate}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, followUpDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Next Action</Label>
              <Select
                value={updateForm.nextAction}
                onValueChange={(v) =>
                  setUpdateForm((f) => ({
                    ...f,
                    nextAction: v as Candidate["nextAction"],
                  }))
                }
              >
                <SelectTrigger data-ocid="recruiter.update.action.select">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="recruiter.update.cancel_button"
              onClick={() => setUpdateCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="recruiter.update.submit_button"
              onClick={() => {
                if (updateCandidate) {
                  store.updateCandidate(updateCandidate.id, updateForm);
                  store.addActivityLog({
                    recruiterId,
                    recruiterName:
                      store.recruiters.find((r) => r.id === recruiterId)
                        ?.name || "",
                    action: "Status Updated",
                    details: `${updateCandidate.name} → ${updateForm.status}`,
                  });
                  setUpdateCandidate(null);
                }
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent data-ocid="recruiter.add_candidate.dialog">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                data-ocid="recruiter.add_candidate.name.input"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                data-ocid="recruiter.add_candidate.phone.input"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                data-ocid="recruiter.add_candidate.email.input"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Skills</Label>
              <Input
                data-ocid="recruiter.add_candidate.skills.input"
                value={addForm.skills}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, skills: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="recruiter.add_candidate.notes.textarea"
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="recruiter.add_candidate.cancel_button"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="recruiter.add_candidate.submit_button"
              onClick={() => {
                if (!addForm.name) return;
                store.addCandidate({
                  ...addForm,
                  status: "New",
                  assignedRecruiter: recruiterId,
                  followUpDate: "",
                  nextAction: "Call",
                });
                store.addActivityLog({
                  recruiterId,
                  recruiterName:
                    store.recruiters.find((r) => r.id === recruiterId)?.name ||
                    "",
                  action: "Candidate Added",
                  details: `Added ${addForm.name}`,
                });
                setShowAdd(false);
                setAddForm({
                  name: "",
                  phone: "",
                  email: "",
                  skills: "",
                  notes: "",
                });
              }}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Follow-ups Tab ────────────────────────────────────────────────
function FollowUpsTab({ recruiterId }: { recruiterId: string }) {
  const store = useCRMStore();
  const today = new Date().toISOString().split("T")[0];

  const myFollowUps = store.candidates.filter(
    (c) => c.assignedRecruiter === recruiterId && c.followUpDate,
  );
  const overdue = myFollowUps.filter((c) => c.followUpDate < today);
  const todayItems = myFollowUps.filter((c) => c.followUpDate === today);
  const upcoming = myFollowUps.filter((c) => c.followUpDate > today);

  const FollowItem = ({ c, idx }: { c: Candidate; idx: number }) => (
    <div
      data-ocid={`recruiter.followups.item.${idx}`}
      className="bg-white rounded-xl border border-border p-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-semibold text-sm">{c.name}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[getStatusLabel(c.status)] || "bg-gray-100 text-gray-500"}`}
        >
          {getStatusLabel(c.status)}
        </span>
      </div>
      <p className="text-xs text-foreground/50 mb-2">
        {c.followUpDate} · {c.nextAction}
      </p>
      <div className="flex gap-2">
        <a
          href={`tel:${c.phone}`}
          className="flex-1 text-center text-xs py-1.5 rounded-lg border border-border font-medium hover:bg-muted"
        >
          📞 Call
        </a>
        <a
          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${c.name}, calling from Hirevena.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium"
        >
          💬 WhatsApp
        </a>
        <button
          type="button"
          className="flex-1 text-center text-xs py-1.5 rounded-lg border font-medium hover:bg-muted"
          onClick={() =>
            store.updateCandidate(c.id, { followUpDate: "", status: "Called" })
          }
        >
          ✓ Done
        </button>
      </div>
    </div>
  );

  const Section = ({
    title,
    items,
    headerClass,
  }: { title: string; items: Candidate[]; headerClass: string }) => (
    <div>
      <h3
        className={`text-sm font-bold px-3 py-1.5 rounded-t-lg mb-2 ${headerClass}`}
      >
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-center text-foreground/30 text-sm py-2">None</p>
      ) : (
        <div className="space-y-2">
          {items.map((c, i) => (
            <FollowItem key={c.id} c={c} idx={i + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <Section
        title="🚨 Overdue"
        items={overdue}
        headerClass="bg-red-100 text-red-700"
      />
      <Section
        title="⏰ Today"
        items={todayItems}
        headerClass="bg-yellow-100 text-yellow-700"
      />
      <Section
        title="🗓 Upcoming"
        items={upcoming}
        headerClass="bg-blue-100 text-blue-700"
      />
    </div>
  );
}

// ── Activity Tab ───────────────────────────────────────────────────
function ActivityTab({ recruiterId }: { recruiterId: string }) {
  const { recruiters, activityLogs } = useCRMStore();
  const recruiter = recruiters.find((r) => r.id === recruiterId);
  const myLogs = activityLogs.filter((l) => l.recruiterId === recruiterId);
  const convRate =
    recruiter && recruiter.calls > 0
      ? Math.round((recruiter.interested / recruiter.calls) * 100)
      : 0;

  const stats = [
    { label: "Total Calls", value: recruiter?.calls || 0 },
    { label: "Interested", value: recruiter?.interested || 0 },
    { label: "Not Interested", value: recruiter?.notInterested || 0 },
    { label: "Conversion %", value: `${convRate}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-border p-3"
          >
            <p className="text-xs text-foreground/50 uppercase">{s.label}</p>
            <p
              className="text-2xl font-black"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Last 7 Days Activity</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/60">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/60">
                Action
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/60">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {myLogs.slice(0, 20).map((l, i) => (
              <tr
                key={l.id}
                data-ocid={`recruiter.logs.item.${i + 1}`}
                className={i % 2 === 0 ? "" : "bg-muted/30"}
              >
                <td className="px-4 py-2 text-xs text-foreground/50 whitespace-nowrap">
                  {l.timestamp}
                </td>
                <td className="px-4 py-2">{l.action}</td>
                <td className="px-4 py-2 text-foreground/60 text-xs">
                  {l.details}
                </td>
              </tr>
            ))}
            {myLogs.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-6 text-foreground/30"
                  data-ocid="recruiter.logs.empty_state"
                >
                  No activity yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────
function ProfileTab({
  currentUser,
  onLogout,
}: { currentUser: CurrentUser; onLogout: () => void }) {
  const store = useCRMStore();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  const recruiter = store.recruiters.find((r) => r.id === currentUser.id);

  const handleChangePwd = () => {
    setPwdMsg("");
    setPwdError("");
    if (!recruiter) return;
    if (currentPwd !== recruiter.password) {
      setPwdError("Current password is incorrect.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match.");
      return;
    }
    store.changeRecruiterPassword(currentUser.id, newPwd);
    setPwdMsg("Password changed successfully!");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "oklch(0.45 0.15 160)" }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-base">{currentUser.name}</p>
            <p className="text-sm text-foreground/50">{currentUser.email}</p>
          </div>
        </div>
        <div className="text-xs text-foreground/40 bg-muted/50 rounded-lg px-3 py-2">
          Recruiter ID: {currentUser.id}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold text-sm">Change Password</h3>
        <div>
          <Label>Current Password</Label>
          <Input
            type="password"
            data-ocid="recruiter.current_pwd.input"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
        </div>
        <div>
          <Label>New Password</Label>
          <Input
            type="password"
            data-ocid="recruiter.new_pwd.input"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            data-ocid="recruiter.confirm_pwd.input"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
        </div>
        {pwdError && (
          <p
            className="text-xs text-red-600"
            data-ocid="recruiter.pwd.error_state"
          >
            {pwdError}
          </p>
        )}
        {pwdMsg && (
          <p
            className="text-xs text-green-600"
            data-ocid="recruiter.pwd.success_state"
          >
            {pwdMsg}
          </p>
        )}
        <Button
          data-ocid="recruiter.change_pwd.button"
          onClick={handleChangePwd}
          className="w-full"
          style={{ background: "oklch(0.55 0.17 245)" }}
        >
          Update Password
        </Button>
      </div>

      <Button
        data-ocid="recruiter.logout.button"
        variant="outline"
        onClick={onLogout}
        className="w-full border-red-200 text-red-500 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
