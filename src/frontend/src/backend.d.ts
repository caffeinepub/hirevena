import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type Time = bigint;
export interface backendInterface {
    createSubmission(companyName: string, contactName: string, phoneNumber: string, emailAddress: string, role: string, positions: string, urgency: string): Promise<void>;
    deleteSubmission(id: bigint): Promise<boolean>;
    getAllSubmissions(): Promise<Array<Submission>>;
    updateLead(id: bigint, status: string, notes: string, followUpDate: string): Promise<boolean>;
}
