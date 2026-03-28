import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    deleteCampaign(id: bigint): Promise<boolean>;
    createSubmission(companyName: string, contactName: string, phoneNumber: string, emailAddress: string, role: string, positions: string, urgency: string): Promise<void>;
    deleteSubmission(id: bigint): Promise<boolean>;
    getAllAssignedCandidates(): Promise<Array<AssignedCandidate>>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getApprovedRecruiters(): Promise<Array<SignupRequest>>;
    getAssignedCandidates(recruiterEmail: string, campaign: string): Promise<Array<AssignedCandidate>>;
    getCampaigns(): Promise<Array<Campaign>>;
    getSignupRequests(): Promise<Array<SignupRequest>>;
    rejectSignupRequest(email: string): Promise<boolean>;
    submitSignupRequest(name: string, email: string, password: string): Promise<void>;
    updateCandidateStatus(id: string, status: string, updatedAt: string): Promise<boolean>;
    updateLead(id: bigint, status: string, notes: string, followUpDate: string): Promise<boolean>;
}
