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

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const nextWeek = new Date(Date.now() + 7 * 86400000)
  .toISOString()
  .split("T")[0];
const pastOverdue = new Date(Date.now() - 3 * 86400000)
  .toISOString()
  .split("T")[0];

const SEED_RECRUITERS: Recruiter[] = [
  {
    id: "R001",
    name: "Rahul Sharma",
    email: "rahul@hirevena.com",
    password: "Rahul@123",
    status: "approved",
    calls: 45,
    interested: 18,
    notInterested: 12,
    followUps: 8,
  },
  {
    id: "R002",
    name: "Priya Patel",
    email: "priya@hirevena.com",
    password: "Priya@123",
    status: "approved",
    calls: 38,
    interested: 15,
    notInterested: 10,
    followUps: 6,
  },
  {
    id: "R003",
    name: "Amit Kumar",
    email: "amit@hirevena.com",
    password: "Amit@123",
    status: "approved",
    calls: 52,
    interested: 22,
    notInterested: 14,
    followUps: 10,
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
    calls: 29,
    interested: 11,
    notInterested: 9,
    followUps: 5,
  },
];

const SEED_CANDIDATES: Candidate[] = [
  {
    id: "C001",
    name: "Arjun Mehta",
    phone: "+91 9876543210",
    email: "arjun@gmail.com",
    skills: "Welding, Fabrication",
    status: "Interested",
    assignedRecruiter: "R001",
    notes: "Strong candidate",
    followUpDate: today,
    nextAction: "Interview",
    timestamp: yesterday,
  },
  {
    id: "C002",
    name: "Sunita Rao",
    phone: "+91 9876543211",
    email: "sunita@gmail.com",
    skills: "Electrician, Wiring",
    status: "Follow-up",
    assignedRecruiter: "R001",
    notes: "Needs to confirm",
    followUpDate: pastOverdue,
    nextAction: "Call",
    timestamp: yesterday,
  },
  {
    id: "C003",
    name: "Ravi Gupta",
    phone: "+91 9876543212",
    email: "ravi@gmail.com",
    skills: "Plumbing, Maintenance",
    status: "Called",
    assignedRecruiter: "R002",
    notes: "Called twice",
    followUpDate: tomorrow,
    nextAction: "WhatsApp",
    timestamp: yesterday,
  },
  {
    id: "C004",
    name: "Meena Jain",
    phone: "+91 9876543213",
    email: "meena@gmail.com",
    skills: "Quality Control",
    status: "New",
    assignedRecruiter: "R002",
    notes: "",
    followUpDate: nextWeek,
    nextAction: "Call",
    timestamp: today,
  },
  {
    id: "C005",
    name: "Deepak Verma",
    phone: "+91 9876543214",
    email: "deepak@gmail.com",
    skills: "CNC Machine, Lathe",
    status: "Not Interested",
    assignedRecruiter: "R003",
    notes: "Not looking",
    followUpDate: "",
    nextAction: "Call",
    timestamp: yesterday,
  },
  {
    id: "C006",
    name: "Kavita Sharma",
    phone: "+91 9876543215",
    email: "kavita@gmail.com",
    skills: "Packaging, Assembly",
    status: "Interested",
    assignedRecruiter: "R003",
    notes: "Ready for interview",
    followUpDate: today,
    nextAction: "Interview",
    timestamp: today,
  },
  {
    id: "C007",
    name: "Rohit Yadav",
    phone: "+91 9876543216",
    email: "rohit@gmail.com",
    skills: "Forklift, Warehouse",
    status: "Follow-up",
    assignedRecruiter: "R003",
    notes: "Confirm location",
    followUpDate: pastOverdue,
    nextAction: "Call",
    timestamp: yesterday,
  },
  {
    id: "C008",
    name: "Anjali Mishra",
    phone: "+91 9876543217",
    email: "anjali@gmail.com",
    skills: "Data Entry, Admin",
    status: "Called",
    assignedRecruiter: "R005",
    notes: "",
    followUpDate: tomorrow,
    nextAction: "WhatsApp",
    timestamp: today,
  },
  {
    id: "C009",
    name: "Suresh Patil",
    phone: "+91 9876543218",
    email: "suresh@gmail.com",
    skills: "Driving, Logistics",
    status: "New",
    assignedRecruiter: "R005",
    notes: "",
    followUpDate: nextWeek,
    nextAction: "Call",
    timestamp: today,
  },
  {
    id: "C010",
    name: "Pooja Tiwari",
    phone: "+91 9876543219",
    email: "pooja@gmail.com",
    skills: "Stitching, Textile",
    status: "Interested",
    assignedRecruiter: "R001",
    notes: "Very eager",
    followUpDate: tomorrow,
    nextAction: "Interview",
    timestamp: today,
  },
  {
    id: "C011",
    name: "Manoj Singh",
    phone: "+91 9876543220",
    email: "manoj@gmail.com",
    skills: "Security, Surveillance",
    status: "Invalid",
    assignedRecruiter: "R002",
    notes: "Wrong number",
    followUpDate: "",
    nextAction: "Call",
    timestamp: yesterday,
  },
  {
    id: "C012",
    name: "Rekha Das",
    phone: "+91 9876543221",
    email: "rekha@gmail.com",
    skills: "Cooking, Housekeeping",
    status: "Duplicate",
    assignedRecruiter: "R003",
    notes: "Already in system",
    followUpDate: "",
    nextAction: "Call",
    timestamp: yesterday,
  },
  {
    id: "C013",
    name: "Anil Bhatt",
    phone: "+91 9876543222",
    email: "anil@gmail.com",
    skills: "Painting, Civil Work",
    status: "New",
    assignedRecruiter: "R005",
    notes: "",
    followUpDate: nextWeek,
    nextAction: "Call",
    timestamp: today,
  },
  {
    id: "C014",
    name: "Nisha Gupta",
    phone: "+91 9876543223",
    email: "nisha@gmail.com",
    skills: "Sales, Marketing",
    status: "Follow-up",
    assignedRecruiter: "R001",
    notes: "Interested in retail",
    followUpDate: today,
    nextAction: "WhatsApp",
    timestamp: yesterday,
  },
  {
    id: "C015",
    name: "Pramod Kumar",
    phone: "+91 9876543224",
    email: "pramod@gmail.com",
    skills: "ITI Fitter, Mechanic",
    status: "Called",
    assignedRecruiter: "R002",
    notes: "Good fit",
    followUpDate: tomorrow,
    nextAction: "Interview",
    timestamp: today,
  },
];

const SEED_CLIENTS: Client[] = [
  {
    id: "CL001",
    name: "Bharat Steel Works",
    contactPerson: "Mr. Agrawal",
    phone: "+91 9900112233",
    email: "hr@bharatsteel.com",
    activeRoles: "Welder x5, Fitter x3",
    notes: "Urgent hiring",
  },
  {
    id: "CL002",
    name: "Techno Pack India",
    contactPerson: "Ms. Kapoor",
    phone: "+91 9900112244",
    email: "kapoor@technopack.com",
    activeRoles: "Packer x10, QC x2",
    notes: "Monthly intake",
  },
  {
    id: "CL003",
    name: "Ravi Logistics",
    contactPerson: "Mr. Sharma",
    phone: "+91 9900112255",
    email: "ops@ravilogistics.com",
    activeRoles: "Driver x8, Helper x5",
    notes: "Pan-India",
  },
  {
    id: "CL004",
    name: "Sun Pharma Plant",
    contactPerson: "Dr. Mehta",
    phone: "+91 9900112266",
    email: "recruit@sunpharma.com",
    activeRoles: "Lab Tech x3, Operator x6",
    notes: "Compliance required",
  },
];

const SEED_LOGS: ActivityLog[] = [
  {
    id: "L001",
    recruiterId: "R001",
    recruiterName: "Rahul Sharma",
    action: "Status Updated",
    timestamp: `${today} 09:30`,
    details: "Arjun Mehta → Interested",
  },
  {
    id: "L002",
    recruiterId: "R002",
    recruiterName: "Priya Patel",
    action: "Candidate Added",
    timestamp: `${today} 10:15`,
    details: "Added Meena Jain",
  },
  {
    id: "L003",
    recruiterId: "R003",
    recruiterName: "Amit Kumar",
    action: "Follow-up Set",
    timestamp: `${yesterday} 14:00`,
    details: "Kavita Sharma → Interview tomorrow",
  },
  {
    id: "L004",
    recruiterId: "R005",
    recruiterName: "Vikram Joshi",
    action: "Status Updated",
    timestamp: `${yesterday} 16:30`,
    details: "Anjali Mishra → Called",
  },
  {
    id: "L005",
    recruiterId: "R001",
    recruiterName: "Rahul Sharma",
    action: "WhatsApp Sent",
    timestamp: `${today} 11:00`,
    details: "Nisha Gupta – job opportunity message",
  },
];

const SEED_SIGNUP_REQUESTS: SignupRequest[] = [
  {
    id: "SR001",
    name: "Sneha Singh",
    email: "sneha@hirevena.com",
    password: "Sneha@123",
    requestedAt: today,
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
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
