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
  ArrowLeft,
  Briefcase,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import {
  type Campaign,
  type Candidate,
  type CandidateStatus,
  type CurrentUser,
  useCRMStore,
} from "../hooks/useCRMStore";
import { apiFetch, apiPost, getApiUrl } from "../utils/apiService";

type RecruiterTab =
  | "dashboard"
  | "candidates"
  | "followups"
  | "activity"
  | "profile"
  | "campaigns";

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

function getStatusLabel(status: string): string {
  if (!status || status === "New" || status === "Assigned") return "Pending";
  return status;
}

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
    { key: "campaigns", label: "Campaigns", icon: Briefcase },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "oklch(0.97 0.01 245)" }}
    >
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

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {tab === "dashboard" && (
          <RecruiterDashboardTab
            recruiterId={currentUser.id}
            recruiterEmail={currentUser.email}
          />
        )}
        {tab === "candidates" && (
          <MyCandidatesTab recruiterId={currentUser.id} />
        )}
        {tab === "followups" && <FollowUpsTab recruiterId={currentUser.id} />}
        {tab === "activity" && (
          <ActivityTab
            recruiterId={currentUser.id}
            recruiterEmail={currentUser.email}
          />
        )}
        {tab === "profile" && (
          <ProfileTab currentUser={currentUser} onLogout={onLogout} />
        )}
        {tab === "campaigns" && (
          <CampaignsTab
            recruiterId={currentUser.id}
            recruiterEmail={currentUser.email}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 flex">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            data-ocid={`recruiter.nav.${key}.tab`}
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

// ── Campaigns Tab (two-view flow) ─────────────────────────────────
function CampaignsTab({
  recruiterId,
  recruiterEmail,
}: { recruiterId: string; recruiterEmail?: string }) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  if (selectedCampaign) {
    return (
      <CampaignDetailView
        recruiterId={recruiterId}
        recruiterEmail={recruiterEmail}
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <CampaignListView
      recruiterId={recruiterId}
      recruiterEmail={recruiterEmail}
      onSelect={setSelectedCampaign}
    />
  );
}

// ── Campaign List View ─────────────────────────────────────────────
function CampaignListView({
  recruiterId,
  recruiterEmail,
  onSelect,
}: {
  recruiterId: string;
  recruiterEmail?: string;
  onSelect: (c: Campaign) => void;
}) {
  const store = useCRMStore();
  const [apiCandidates, setApiCandidates] = useState<
    import("../hooks/useCRMStore").Candidate[]
  >([]);
  const [apiCampaigns, setApiCampaigns] = useState<Campaign[]>([]);

  const { actor } = useActor();

  useEffect(() => {
    const load = async () => {
      const userEmail = (recruiterEmail || "").toLowerCase();
      if (!userEmail) return;

      // Primary: ICP canister (works cross-device, no config needed)
      if (actor) {
        try {
          const [canisterCandidates, canisterCampaigns] = await Promise.all([
            actor.getAssignedCandidates(userEmail, ""),
            actor.getCampaigns(),
          ]);
          console.log("Logged user:", userEmail);
          console.log("Fetched data (canister):", canisterCandidates);
          if (canisterCandidates && canisterCandidates.length > 0) {
            setApiCandidates(canisterCandidates as any);
          }
          if (canisterCampaigns && canisterCampaigns.length > 0) {
            setApiCampaigns(
              canisterCampaigns.map((c) => ({
                id: String(c.id),
                campaignName: c.campaignName,
                companyName: c.companyName,
                role: c.role,
                location: c.location,
                salary: c.salary,
                createdAt: c.createdAt,
              })),
            );
          }
          return; // canister data loaded, skip API fallback
        } catch (e) {
          console.error("Canister fetch error:", e);
        }
      }

      // Fallback: Google Apps Script API
      if (!getApiUrl()) return;
      try {
        const [leadsData, campaignsData] = await Promise.all([
          apiFetch({ type: "leads", recruiter: userEmail }),
          apiFetch({ type: "campaigns" }),
        ]);
        const leads = (leadsData as any)?.data || leadsData || [];
        const campaigns = (campaignsData as any)?.data || campaignsData || [];
        console.log("Fetched data (API):", leads);
        setApiCandidates(Array.isArray(leads) ? leads : []);
        setApiCampaigns(Array.isArray(campaigns) ? campaigns : []);
      } catch (e) {
        console.error("API fetch error:", e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [actor, recruiterEmail]);

  const myCandidates =
    apiCandidates.length > 0
      ? apiCandidates.filter(
          (c) =>
            (
              (c as any).assignedTo ||
              c.assignedRecruiter ||
              ""
            ).toLowerCase() === (recruiterEmail || "").toLowerCase(),
        )
      : store.candidates.filter((c) => c.assignedRecruiter === recruiterId);

  const allCampaigns = [
    ...store.campaigns,
    ...apiCampaigns.filter(
      (ac) =>
        !store.campaigns.find((sc) => sc.campaignName === ac.campaignName),
    ),
  ];

  // Get unique campaign names from my candidates
  const myCampaignNames = Array.from(
    new Set(myCandidates.map((c) => c.campaign).filter(Boolean) as string[]),
  );

  // Map to campaign objects
  const myCampaigns = myCampaignNames.map((name) => {
    const campaignObj = allCampaigns.find((c) => c.campaignName === name);
    const leads = myCandidates.filter((c) => c.campaign === name);
    const pending = leads.filter(
      (c) =>
        !c.status ||
        (c.status as string) === "New" ||
        (c.status as string) === "Assigned",
    ).length;
    const interested = leads.filter((c) => c.status === "Interested").length;
    return {
      campaign:
        campaignObj ||
        ({
          id: name,
          campaignName: name,
          companyName: "",
          role: "",
          location: "",
          salary: "",
          createdAt: "",
        } as Campaign),
      totalLeads: leads.length,
      pending,
      interested,
    };
  });

  return (
    <div className="space-y-4">
      <h1
        className="font-bold text-lg"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        🎯 My Campaigns
      </h1>

      {myCampaigns.length === 0 ? (
        <div
          data-ocid="recruiter.campaigns.empty_state"
          className="bg-white rounded-xl border border-border p-10 text-center"
        >
          <Briefcase className="w-10 h-10 mx-auto text-foreground/20 mb-3" />
          <p className="font-semibold text-foreground/50">
            No campaigns assigned yet
          </p>
          <p className="text-xs text-foreground/30 mt-1">
            Ask your admin to assign leads under a campaign.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myCampaigns.map(
            ({ campaign, totalLeads, pending, interested }, i) => (
              <button
                key={campaign.id}
                type="button"
                data-ocid={`recruiter.campaigns.item.${i + 1}`}
                onClick={() => onSelect(campaign)}
                className="w-full bg-white rounded-xl border border-border p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p
                      className="font-bold text-base"
                      style={{ color: "oklch(0.28 0.085 245)" }}
                    >
                      {campaign.campaignName}
                    </p>
                    {campaign.companyName && (
                      <p className="text-sm text-foreground/60">
                        {campaign.companyName}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground/30 mt-0.5" />
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {campaign.role && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      💼 {campaign.role}
                    </span>
                  )}
                  {campaign.location && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {campaign.location}
                    </span>
                  )}
                  {campaign.salary && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                      💰 {campaign.salary}
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="text-center">
                    <p
                      className="text-xl font-black"
                      style={{ color: "oklch(0.55 0.17 245)" }}
                    >
                      {totalLeads}
                    </p>
                    <p className="text-[10px] text-foreground/40 uppercase">
                      Total
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-orange-500">
                      {pending}
                    </p>
                    <p className="text-[10px] text-foreground/40 uppercase">
                      Pending
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-green-600">
                      {interested}
                    </p>
                    <p className="text-[10px] text-foreground/40 uppercase">
                      Interested
                    </p>
                  </div>
                </div>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Campaign Detail View ──────────────────────────────────────────
function CampaignDetailView({
  recruiterId,
  recruiterEmail,
  campaign,
  onBack,
}: {
  recruiterId: string;
  recruiterEmail?: string;
  campaign: Campaign;
  onBack: () => void;
}) {
  const store = useCRMStore();
  const { actor } = useActor();
  const [responseCandidate, setResponseCandidate] = useState<Candidate | null>(
    null,
  );
  const [responseStatus, setResponseStatus] = useState<
    "Interested" | "Not Interested"
  >("Interested");
  const [toast, setToast] = useState("");
  const [apiLeads, setApiLeads] = useState<Candidate[]>([]);

  useEffect(() => {
    const load = async () => {
      const userEmail = (recruiterEmail || "").toLowerCase();
      if (!userEmail) return;

      // Primary: ICP canister
      if (actor) {
        try {
          const canisterLeads = await actor.getAssignedCandidates(
            userEmail,
            campaign.campaignName,
          );
          if (canisterLeads && canisterLeads.length > 0) {
            console.log("Fetched data (canister):", canisterLeads);
            setApiLeads(canisterLeads as any);
            return;
          }
        } catch (e) {
          console.error("Canister detail fetch error:", e);
        }
      }

      // Fallback: Google Apps Script API
      if (!getApiUrl()) return;
      try {
        const data = await apiFetch({
          type: "leads",
          recruiter: userEmail,
          campaign: campaign.campaignName,
        });
        const fetchedLeads = (data as any)?.data || data || [];
        if (Array.isArray(fetchedLeads)) setApiLeads(fetchedLeads);
        console.log("Fetched data (API):", fetchedLeads);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [actor, recruiterEmail, campaign.campaignName]);

  const leads =
    apiLeads.length > 0
      ? apiLeads
      : store.candidates.filter(
          (c) =>
            c.assignedRecruiter === recruiterId &&
            c.campaign === campaign.campaignName,
        );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmitResponse = () => {
    if (!responseCandidate) return;
    const updatedAt = new Date().toLocaleString("en-IN");
    // Optimistically update apiLeads immediately so UI reflects change
    setApiLeads((prev) =>
      prev.map((c) =>
        c.id === responseCandidate.id
          ? { ...c, status: responseStatus as CandidateStatus, updatedAt }
          : c,
      ),
    );
    if (getApiUrl()) {
      apiPost({
        type: "updateCandidate",
        id: responseCandidate.id,
        status: responseStatus,
        updatedAt,
      }).catch(console.error);
    }
    // Sync to ICP canister for cross-device visibility
    if (actor) {
      actor
        .updateCandidateStatus(responseCandidate.id, responseStatus, updatedAt)
        .catch(console.error);
    }
    store.updateCandidate(responseCandidate.id, {
      status: responseStatus as CandidateStatus,
      updatedAt,
    });
    store.addActivityLog({
      recruiterId,
      recruiterName:
        store.recruiters.find((r) => r.id === recruiterId)?.name || "",
      action: "Campaign Response",
      details: `[${campaign.campaignName}] ${responseCandidate.name} → ${responseStatus}`,
    });
    showToast(`✅ ${responseCandidate.name} marked as ${responseStatus}`);
    setResponseCandidate(null);
  };

  const today = new Date().toISOString().split("T")[0];

  const totalLeads = leads.length;
  const pending = leads.filter(
    (c) =>
      !c.status ||
      (c.status as string) === "New" ||
      (c.status as string) === "Assigned",
  ).length;
  const interested = leads.filter((c) => c.status === "Interested").length;
  const notInterested = leads.filter(
    (c) => c.status === "Not Interested",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="recruiter.campaign_detail.back_button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1
            className="font-bold text-lg leading-tight"
            style={{ color: "oklch(0.28 0.085 245)" }}
          >
            {campaign.campaignName}
          </h1>
          {campaign.companyName && (
            <p className="text-xs text-foreground/50">{campaign.companyName}</p>
          )}
        </div>
      </div>

      {/* Campaign info tags */}
      {(campaign.role || campaign.location || campaign.salary) && (
        <div className="flex flex-wrap gap-2">
          {campaign.role && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
              💼 {campaign.role}
            </span>
          )}
          {campaign.location && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
              📍 {campaign.location}
            </span>
          )}
          {campaign.salary && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
              💰 {campaign.salary}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: totalLeads, color: "text-blue-700" },
          { label: "Pending", value: pending, color: "text-orange-500" },
          { label: "Interested", value: interested, color: "text-green-600" },
          { label: "Not Int.", value: notInterested, color: "text-red-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-border p-2.5 text-center"
          >
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-foreground/40 uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Candidate Cards */}
      {leads.length === 0 ? (
        <div
          data-ocid="recruiter.campaign_detail.empty_state"
          className="bg-white rounded-xl border border-border p-10 text-center text-foreground/40"
        >
          No leads assigned in this campaign yet.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((c, i) => {
            const finalized = isStatusFinalized(c.status);
            const isFollowUpToday = c.followUpDate === today;
            const borderClass =
              !c.status ||
              (c.status as string) === "New" ||
              (c.status as string) === "Assigned"
                ? "border-l-4 border-l-red-400"
                : isFollowUpToday
                  ? "border-l-4 border-l-yellow-400"
                  : "";

            return (
              <div
                key={c.id}
                data-ocid={`recruiter.campaign_detail.item.${i + 1}`}
                className={`bg-white rounded-xl border border-border p-4 ${borderClass}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-base">{c.name}</h3>
                    <p className="text-xs text-foreground/50">{c.phone}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[getStatusLabel(c.status)] ||
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {getStatusLabel(c.status)}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <a
                    href={`tel:${c.phone}`}
                    data-ocid={`recruiter.campaign_detail.call.button.${i + 1}`}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm text-white"
                    style={{ background: "oklch(0.55 0.17 245)" }}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <button
                    type="button"
                    data-ocid={`recruiter.campaign_detail.response.button.${i + 1}`}
                    onClick={() => {
                      if (!finalized) {
                        setResponseCandidate(c);
                        setResponseStatus("Interested");
                      }
                    }}
                    disabled={finalized}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm border-2 border-border transition-colors ${
                      finalized
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted"
                    }`}
                  >
                    {finalized ? "✅ Updated" : "📝 Response"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      <Dialog
        open={!!responseCandidate}
        onOpenChange={(o) => !o && setResponseCandidate(null)}
      >
        <DialogContent
          data-ocid="recruiter.campaign_detail.response.dialog"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>📝 Response — {responseCandidate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Campaign: <strong>{campaign.campaignName}</strong>
            </p>
            <div>
              <Label className="font-semibold mb-2 block">
                Select Response
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-ocid="recruiter.campaign_detail.interested.button"
                  onClick={() => setResponseStatus("Interested")}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    responseStatus === "Interested"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border hover:border-green-300"
                  }`}
                >
                  ✅ Interested
                </button>
                <button
                  type="button"
                  data-ocid="recruiter.campaign_detail.not_interested.button"
                  onClick={() => setResponseStatus("Not Interested")}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    responseStatus === "Not Interested"
                      ? "border-red-400 bg-red-50 text-red-600"
                      : "border-border hover:border-red-300"
                  }`}
                >
                  ❌ Not Interested
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="recruiter.campaign_detail.response.cancel_button"
              onClick={() => setResponseCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="recruiter.campaign_detail.response.confirm_button"
              onClick={handleSubmitResponse}
              style={{ background: "oklch(0.55 0.17 245)" }}
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div
          data-ocid="recruiter.campaign_detail.toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg z-50"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Tab ───────────────────────────────────────────────────
function RecruiterDashboardTab({
  recruiterId,
  recruiterEmail,
}: { recruiterId: string; recruiterEmail?: string }) {
  const { recruiters, candidates, activityLogs } = useCRMStore();
  const recruiter = recruiters.find((r) => r.id === recruiterId);
  const myLogs = activityLogs
    .filter((l) => l.recruiterId === recruiterId)
    .slice(0, 5);
  const [apiLeads, setApiLeads] = useState<
    import("../hooks/useCRMStore").Candidate[]
  >([]);

  const { actor } = useActor();

  useEffect(() => {
    const load = async () => {
      // Primary: ICP canister
      if (actor) {
        try {
          const canisterLeads = await actor.getAssignedCandidates(
            (recruiterEmail || "").toLowerCase(),
            "",
          );
          if (canisterLeads && canisterLeads.length > 0) {
            setApiLeads(canisterLeads as any);
            console.log("Logged user:", recruiterEmail);
            console.log("Fetched data:", canisterLeads);
            return;
          }
        } catch (e) {
          console.error("Canister dashboard fetch error:", e);
        }
      }
      // Fallback: Google Apps Script API
      if (!recruiterEmail || !getApiUrl()) return;
      try {
        const data = await apiFetch({
          type: "leads",
          recruiter: recruiterEmail.toLowerCase(),
        });
        const leads = (data as any)?.data || data || [];
        if (Array.isArray(leads) && leads.length > 0) setApiLeads(leads);
        console.log("Logged user:", recruiterEmail);
        console.log("Fetched data:", leads);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [actor, recruiterEmail]);

  const myCandidates =
    apiLeads.length > 0
      ? apiLeads
      : candidates.filter((c) => c.assignedRecruiter === recruiterId);

  const todayFormatted = new Date().toLocaleDateString("en-IN");
  const callsTodayCount = myCandidates.filter((c) =>
    c.updatedAt?.startsWith(todayFormatted),
  ).length;
  const interestedCount = myCandidates.filter(
    (c) => c.status === "Interested",
  ).length;
  const notInterestedCount = myCandidates.filter(
    (c) => c.status === "Not Interested",
  ).length;
  const followUpsCount = myCandidates.filter(
    (c) => c.status === "Follow-up",
  ).length;

  const stats = [
    { label: "Calls Today", value: callsTodayCount },
    { label: "Interested", value: interestedCount },
    { label: "Not Interested", value: notInterestedCount },
    { label: "Follow-ups", value: followUpsCount },
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
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  STATUS_COLORS[getStatusLabel(c.status)] ||
                  "bg-gray-100 text-gray-500"
                }`}
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
          className={`text-xs px-2 py-0.5 rounded-full ${
            STATUS_COLORS[getStatusLabel(c.status)] ||
            "bg-gray-100 text-gray-500"
          }`}
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
function ActivityTab({
  recruiterId,
  recruiterEmail,
}: { recruiterId: string; recruiterEmail?: string }) {
  const { recruiters, candidates, activityLogs } = useCRMStore();
  const _recruiter = recruiters.find((r) => r.id === recruiterId);
  const myLogs = activityLogs.filter((l) => l.recruiterId === recruiterId);
  const [apiLeads, setApiLeads] = useState<
    import("../hooks/useCRMStore").Candidate[]
  >([]);

  const { actor: actorActivity } = useActor();

  useEffect(() => {
    const load = async () => {
      // Primary: ICP canister
      if (actorActivity) {
        try {
          const canisterLeads = await actorActivity.getAssignedCandidates(
            (recruiterEmail || "").toLowerCase(),
            "",
          );
          if (canisterLeads && canisterLeads.length > 0) {
            setApiLeads(canisterLeads as any);
            return;
          }
        } catch (e) {
          console.error("Canister activity fetch error:", e);
        }
      }
      // Fallback: Google Apps Script API
      if (!recruiterEmail || !getApiUrl()) return;
      try {
        const data = await apiFetch({
          type: "leads",
          recruiter: recruiterEmail.toLowerCase(),
        });
        const leads = (data as any)?.data || data || [];
        if (Array.isArray(leads) && leads.length > 0) setApiLeads(leads);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [actorActivity, recruiterEmail]);

  const myCandidates = (
    apiLeads.length > 0
      ? apiLeads
      : candidates.filter((c) => c.assignedRecruiter === recruiterId)
  ).filter((c) => c.updatedAt);

  const last7: {
    date: string;
    responses: number;
    interested: number;
    notInterested: number;
  }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-IN");
    const dayLabel = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const dayCands = myCandidates.filter((c) =>
      c.updatedAt?.startsWith(dateStr),
    );
    last7.push({
      date: dayLabel,
      responses: dayCands.length,
      interested: dayCands.filter((c) => c.status === "Interested").length,
      notInterested: dayCands.filter((c) => c.status === "Not Interested")
        .length,
    });
  }

  const allMyCandidates =
    apiLeads.length > 0
      ? apiLeads
      : candidates.filter((c) => c.assignedRecruiter === recruiterId);
  const totalResponses = allMyCandidates.filter(
    (c) => c.status === "Interested" || c.status === "Not Interested",
  ).length;
  const interestedCnt = allMyCandidates.filter(
    (c) => c.status === "Interested",
  ).length;
  const notInterestedCnt = allMyCandidates.filter(
    (c) => c.status === "Not Interested",
  ).length;
  const convRate =
    totalResponses > 0 ? Math.round((interestedCnt / totalResponses) * 100) : 0;
  const totalResponsesCnt = allMyCandidates.filter(
    (c) =>
      !!c.updatedAt &&
      (c.status as string) !== "" &&
      c.status !== "New" &&
      (c.status as string) !== "Assigned",
  ).length;

  const stats = [
    { label: "Total Responses", value: totalResponsesCnt },
    { label: "Interested", value: interestedCnt },
    { label: "Not Interested", value: notInterestedCnt },
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

      {/* Daily Activity from candidates' updatedAt */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">
            Daily Activity (Last 7 Days)
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60">
                Responses
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-green-600">
                Interested
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-red-500">
                Not Int.
              </th>
            </tr>
          </thead>
          <tbody>
            {last7.map((row, i) => (
              <tr key={row.date} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                <td className="px-3 py-2 text-xs text-foreground/60 whitespace-nowrap">
                  {row.date}
                </td>
                <td className="px-3 py-2 font-semibold">{row.responses}</td>
                <td className="px-3 py-2 text-green-600">{row.interested}</td>
                <td className="px-3 py-2 text-red-500">{row.notInterested}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent log entries */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Recent Log</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/60">
                Time
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
            {myLogs.slice(0, 15).map((l, i) => (
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
