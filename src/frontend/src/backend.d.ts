import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AssignedCandidate {
    id: string;
    status: string;
    assignDate: string;
    assignedTo: string;
    campaign: string;
    name: string;
    email: string;
    updatedAt: string;
    batchId: string;
    phone: string;
    skills: string;
}
export type Time = bigint;
export interface Submission {
    id: bigint;
    status: string;
    contactName: string;
    urgency: string;
    role: string;
    notes: string;
    timestamp: Time;
    companyName: string;
    emailAddress: string;
    phoneNumber: string;
    positions: string;
    followUpDate: string;
}
export interface Client {
    id: string;
    contactName: string;
    activeRoles: string;
    createdAt: string;
    email: string;
    notes: string;
    companyName: string;
    phone: string;
    location: string;
}
export interface Campaign {
    id: bigint;
    salary: string;
    createdAt: string;
    role: string;
    companyName: string;
    campaignName: string;
    location: string;
}
export interface SignupRequest {
    status: string;
    password: string;
    name: string;
    email: string;
    requestedAt: Time;
}
export interface backendInterface {
    addAssignedCandidate(id: string, name: string, phone: string, email: string, skills: string, assignedTo: string, campaign: string, batchId: string, assignDate: string): Promise<boolean>;
    approveSignupRequest(email: string): Promise<boolean>;
    createCampaign(campaignName: string, companyName: string, role: string, location: string, salary: string): Promise<bigint>;
    createClient(id: string, companyName: string, contactName: string, phone: string, email: string, location: string, activeRoles: string, notes: string, createdAt: string): Promise<string>;
    createSubmission(companyName: string, contactName: string, phoneNumber: string, emailAddress: string, role: string, positions: string, urgency: string): Promise<void>;
    deleteCampaign(id: bigint): Promise<boolean>;
    deleteClient(id: string): Promise<string>;
    deleteSubmission(id: bigint): Promise<boolean>;
    getAllAssignedCandidates(): Promise<Array<AssignedCandidate>>;
    getAllClients(): Promise<Array<Client>>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getApprovedRecruiters(): Promise<Array<SignupRequest>>;
    getAssignedCandidates(recruiterEmail: string, campaign: string): Promise<Array<AssignedCandidate>>;
    getCampaigns(): Promise<Array<Campaign>>;
    getSignupRequests(): Promise<Array<SignupRequest>>;
    rejectSignupRequest(email: string): Promise<boolean>;
    submitSignupRequest(name: string, email: string, password: string): Promise<void>;
    updateCandidateStatus(id: string, status: string, updatedAt: string): Promise<boolean>;
    updateClient(id: string, companyName: string, contactName: string, phone: string, email: string, location: string, activeRoles: string, notes: string): Promise<string>;
    updateLead(id: bigint, status: string, notes: string, followUpDate: string): Promise<boolean>;
}
