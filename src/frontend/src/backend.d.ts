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
export interface SignupRequest {
    status: string;
    password: string;
    name: string;
    email: string;
    requestedAt: Time;
}
export interface backendInterface {
    approveSignupRequest(email: string): Promise<boolean>;
    createSubmission(companyName: string, contactName: string, phoneNumber: string, emailAddress: string, role: string, positions: string, urgency: string): Promise<void>;
    deleteSubmission(id: bigint): Promise<boolean>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getApprovedRecruiters(): Promise<Array<SignupRequest>>;
    getSignupRequests(): Promise<Array<SignupRequest>>;
    rejectSignupRequest(email: string): Promise<boolean>;
    submitSignupRequest(name: string, email: string, password: string): Promise<void>;
    updateLead(id: bigint, status: string, notes: string, followUpDate: string): Promise<boolean>;
}
