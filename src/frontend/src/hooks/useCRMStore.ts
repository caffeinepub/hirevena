import { createContext, useContext, useEffect, useState } from "react";

export type RecruiterStatus = "approved" | "pending" | "rejected";
export type CandidateStatus =
  | "New"
  | "Called"
  | "Interested"
  | "Not Interested"
  | "Follow-up"
  | "Invalid"
  | "Duplicate";
export type NextAction = "Call" | "WhatsApp" | "Interview";

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  password: string;
  status: RecruiterStatus;
  calls: number;
  interested: number;
  notInterested: number;
  followUps: number;
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: string;
  status: CandidateStatus;
  assignedRecruiter: string;
  notes: string;
  followUpDate: string;
  nextAction: NextAction;
  timestamp: string;
  batchId?: string;
}

export interface Batch {
  id: string;
  assignDate: string;
  totalImported: number;
  recruiterAssignments: { recruiterId: string; count: number }[];
  candidateIds: string[];
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  activeRoles: string;
  notes: string;
}

export interface ActivityLog {
  id: string;
  recruiterId: string;
  recruiterName: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface SignupRequest {
  id: string;
  name: string;
  email: string;
  password: string;
  requestedAt: string;
}

export interface CRMConfig {
  apiUrl: string;
  sheetId: string;
}

export interface CurrentUser {
  role: "admin" | "recruiter";
  id: string;
  name: string;
  email: string;
}

const SEED_RECRUITERS: Recruiter[] = [
  {
    id: "R001",
    name: "Rahul Sharma",
    email: "rahul@hirevena.com",
    password: "Rahul@123",
    status: "approved",
    calls: 0,
    interested: 0,
    notInterested: 0,
    followUps: 0,
  },
  {
    id: "R002",
    name: "Priya Patel",
    email: "priya@hirevena.com",
    password: "Priya@123",
    status: "approved",
    calls: 0,
    interested: 0,
    notInterested: 0,
    followUps: 0,
  },
  {
    id: "R003",
    name: "Amit Kumar",
    email: "amit@hirevena.com",
    password: "Amit@123",
    status: "approved",
    calls: 0,
    interested: 0,
    notInterested: 0,
    followUps: 0,
  },
  {
    id: "R004",
    name: "Sneha Singh",
    email: "sneha@hirevena.com",
    password: "Sneha@123",
    status: "pending",
    calls: 0,
    interested: 0,
    notInterested: 0,
    followUps: 0,
  },
  {
    id: "R005",
    name: "Vikram Joshi",
    email: "vikram@hirevena.com",
    password: "Vikram@123",
    status: "approved",
    calls: 0,
    interested: 0,
    notInterested: 0,
    followUps: 0,
  },
];

const SEED_CANDIDATES: Candidate[] = [];

const SEED_CLIENTS: Client[] = [];

const SEED_LOGS: ActivityLog[] = [];

const SEED_SIGNUP_REQUESTS: SignupRequest[] = [];

const STORAGE_VERSION = "v3_clean";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    // Version migration: clear old data if version mismatch
    const storedVersion = localStorage.getItem("crm_version");
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.clear();
      localStorage.setItem("crm_version", STORAGE_VERSION);
    }
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

interface CRMStore {
  recruiters: Recruiter[];
  candidates: Candidate[];
  clients: Client[];
  activityLogs: ActivityLog[];
  signupRequests: SignupRequest[];
  batches: Batch[];
  crmConfig: CRMConfig;
  currentUser: CurrentUser | null;
  addCandidate: (c: Omit<Candidate, "id" | "timestamp">) => void;
  addCandidateWithBatch: (c: Omit<Candidate, "id" | "timestamp">) => string;
  addBatch: (batch: Batch) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  addRecruiter: (
    r: Omit<
      Recruiter,
      "id" | "calls" | "interested" | "notInterested" | "followUps"
    >,
  ) => void;
  updateRecruiter: (id: string, updates: Partial<Recruiter>) => void;
  deleteRecruiter: (id: string) => void;
  approveRecruiter: (id: string) => void;
  rejectRecruiter: (id: string) => void;
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addActivityLog: (log: Omit<ActivityLog, "id" | "timestamp">) => void;
  addSignupRequest: (req: Omit<SignupRequest, "id" | "requestedAt">) => void;
  updateCRMConfig: (config: CRMConfig) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  bulkAssignCandidates: (
    fromRecruiterId: string,
    toRecruiterId: string,
  ) => void;
  changeRecruiterPassword: (recruiterId: string, newPassword: string) => void;
}

const CRMContext = createContext<CRMStore | null>(null);

export function useCRMStore(): CRMStore {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error("useCRMStore must be used within CRMProvider");
  return ctx;
}

export { CRMContext };

function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export function useCRMState() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>(() =>
    loadFromStorage("crm_recruiters", SEED_RECRUITERS),
  );
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadFromStorage("crm_candidates", SEED_CANDIDATES),
  );
  const [clients, setClients] = useState<Client[]>(() =>
    loadFromStorage("crm_clients", SEED_CLIENTS),
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadFromStorage("crm_logs", SEED_LOGS),
  );
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>(() =>
    loadFromStorage("crm_signups", SEED_SIGNUP_REQUESTS),
  );
  const [batches, setBatches] = useState<Batch[]>(() =>
    loadFromStorage("crm_batches", []),
  );
  const [crmConfig, setCrmConfig] = useState<CRMConfig>(() =>
    loadFromStorage("CRM_CONFIG", { apiUrl: "", sheetId: "" }),
  );
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() =>
    loadFromStorage("crm_session", null),
  );

  useEffect(() => {
    saveToStorage("crm_recruiters", recruiters);
  }, [recruiters]);
  useEffect(() => {
    saveToStorage("crm_candidates", candidates);
  }, [candidates]);
  useEffect(() => {
    saveToStorage("crm_clients", clients);
  }, [clients]);
  useEffect(() => {
    saveToStorage("crm_logs", activityLogs);
  }, [activityLogs]);
  useEffect(() => {
    saveToStorage("crm_signups", signupRequests);
  }, [signupRequests]);
  useEffect(() => {
    saveToStorage("crm_batches", batches);
  }, [batches]);

  const setCurrentUser = (user: CurrentUser | null) => {
    setCurrentUserState(user);
    saveToStorage("crm_session", user);
  };

  const store: CRMStore = {
    recruiters,
    candidates,
    clients,
    activityLogs,
    signupRequests,
    batches,
    crmConfig,
    currentUser,
    addBatch: (batch) => setBatches((prev) => [...prev, batch]),
    addCandidateWithBatch: (c) => {
      const id = genId("C");
      setCandidates((prev) => [
        ...prev,
        { ...c, id, timestamp: new Date().toISOString().split("T")[0] },
      ]);
      return id;
    },
    addCandidate: (c) =>
      setCandidates((prev) => [
        ...prev,
        {
          ...c,
          id: genId("C"),
          timestamp: new Date().toISOString().split("T")[0],
        },
      ]),
    updateCandidate: (id, updates) =>
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      ),
    deleteCandidate: (id) =>
      setCandidates((prev) => prev.filter((c) => c.id !== id)),
    addRecruiter: (r) =>
      setRecruiters((prev) => [
        ...prev,
        {
          ...r,
          id: genId("R"),
          calls: 0,
          interested: 0,
          notInterested: 0,
          followUps: 0,
        },
      ]),
    updateRecruiter: (id, updates) =>
      setRecruiters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      ),
    deleteRecruiter: (id) =>
      setRecruiters((prev) => prev.filter((r) => r.id !== id)),
    approveRecruiter: (id) => {
      setSignupRequests((prev) => prev.filter((s) => s.id !== id));
      setRecruiters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
      );
    },
    rejectRecruiter: (id) => {
      setSignupRequests((prev) => prev.filter((s) => s.id !== id));
      setRecruiters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
      );
    },
    addClient: (c) =>
      setClients((prev) => [...prev, { ...c, id: genId("CL") }]),
    updateClient: (id, updates) =>
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      ),
    addActivityLog: (log) =>
      setActivityLogs((prev) => [
        {
          ...log,
          id: genId("L"),
          timestamp: new Date().toLocaleString("en-IN"),
        },
        ...prev,
      ]),
    addSignupRequest: (req) => {
      const newReq: SignupRequest = {
        ...req,
        id: genId("SR"),
        requestedAt: new Date().toISOString().split("T")[0],
      };
      setSignupRequests((prev) => [...prev, newReq]);
      setRecruiters((prev) => [
        ...prev,
        {
          id: newReq.id,
          name: req.name,
          email: req.email,
          password: req.password,
          status: "pending",
          calls: 0,
          interested: 0,
          notInterested: 0,
          followUps: 0,
        },
      ]);
    },
    updateCRMConfig: (config) => {
      setCrmConfig(config);
      saveToStorage("CRM_CONFIG", config);
    },
    setCurrentUser,
    bulkAssignCandidates: (fromId, toId) =>
      setCandidates((prev) =>
        prev.map((c) =>
          c.assignedRecruiter === fromId
            ? { ...c, assignedRecruiter: toId }
            : c,
        ),
      ),
    changeRecruiterPassword: (recruiterId, newPassword) =>
      setRecruiters((prev) =>
        prev.map((r) =>
          r.id === recruiterId ? { ...r, password: newPassword } : r,
        ),
      ),
  };

  return store;
}
