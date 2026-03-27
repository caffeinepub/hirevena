import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Array "mo:core/Array";



actor {
  type Submission = {
    id : Nat;
    companyName : Text;
    contactName : Text;
    phoneNumber : Text;
    emailAddress : Text;
    role : Text;
    positions : Text;
    urgency : Text;
    timestamp : Time.Time;
    status : Text;
    notes : Text;
    followUpDate : Text;
  };

  module Submission {
    public func compare(a : Submission, b : Submission) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type SignupRequest = {
    name : Text;
    email : Text;
    password : Text;
    requestedAt : Time.Time;
    status : Text;
  };

  module SignupRequest {
    public func compare(a : SignupRequest, b : SignupRequest) : Order.Order {
      a.email.compare(b.email);
    };
  };

  type Campaign = {
    id : Nat;
    campaignName : Text;
    companyName : Text;
    role : Text;
    location : Text;
    salary : Text;
    createdAt : Text;
  };

  module Campaign {
    public func compare(a : Campaign, b : Campaign) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type AssignedCandidate = {
    id : Text;
    name : Text;
    phone : Text;
    email : Text;
    skills : Text;
    assignedTo : Text;
    campaign : Text;
    status : Text;
    batchId : Text;
    assignDate : Text;
    updatedAt : Text;
  };

  module AssignedCandidate {
    public func compare(a : AssignedCandidate, b : AssignedCandidate) : Order.Order {
      a.id.compare(b.id);
    };
  };

  let submissions = Map.empty<Nat, Submission>();
  let signupRequests = Map.empty<Text, SignupRequest>();
  var nextId = 0;
  var nextCampaignId = 1;
  let campaigns = Map.empty<Nat, Campaign>();
  let assignedCandidates = Map.empty<Text, AssignedCandidate>();

  public shared ({ caller }) func submitSignupRequest(name : Text, email : Text, password : Text) : async () {
    let newRequest : SignupRequest = {
      name;
      email;
      password;
      requestedAt = Time.now();
      status = "pending";
    };
    signupRequests.add(email.toLower(), newRequest);
  };

  public query ({ caller }) func getSignupRequests() : async [SignupRequest] {
    let array = signupRequests.values().toArray();
    array.sort();
  };

  public shared ({ caller }) func approveSignupRequest(email : Text) : async Bool {
    let key = email.toLower();
    switch (signupRequests.get(key)) {
      case (null) { false };
      case (?request) {
        let updatedRequest = { request with status = "approved" };
        signupRequests.add(key, updatedRequest);
        true;
      };
    };
  };

  public shared ({ caller }) func rejectSignupRequest(email : Text) : async Bool {
    let key = email.toLower();
    if (signupRequests.containsKey(key)) {
      signupRequests.remove(key);
      true;
    } else { false };
  };

  public query ({ caller }) func getApprovedRecruiters() : async [SignupRequest] {
    signupRequests.toArray().filter(func((email, r)) { r.status == "approved" }).map(func((email, r)) { r });
  };

  public shared ({ caller }) func createSubmission(
    companyName : Text,
    contactName : Text,
    phoneNumber : Text,
    emailAddress : Text,
    role : Text,
    positions : Text,
    urgency : Text,
  ) : async () {
    let submission : Submission = {
      id = nextId;
      companyName;
      contactName;
      phoneNumber;
      emailAddress;
      role;
      positions;
      urgency;
      timestamp = Time.now();
      status = "New";
      notes = "";
      followUpDate = "";
    };
    submissions.add(nextId, submission);
    nextId += 1;
  };

  public shared ({ caller }) func updateLead(id : Nat, status : Text, notes : Text, followUpDate : Text) : async Bool {
    switch (submissions.get(id)) {
      case (null) { false };
      case (?oldSubmission) {
        let submission = {
          oldSubmission with
          status;
          notes;
          followUpDate;
        };
        submissions.add(id, submission);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteSubmission(id : Nat) : async Bool {
    if (submissions.containsKey(id)) {
      submissions.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    let array = submissions.values().toArray();
    array.sort();
  };

  public shared ({ caller }) func createCampaign(campaignName : Text, companyName : Text, role : Text, location : Text, salary : Text) : async Nat {
    let campaign : Campaign = {
      id = nextCampaignId;
      campaignName;
      companyName;
      role;
      location;
      salary;
      createdAt = Time.now().toText();
    };
    campaigns.add(nextCampaignId, campaign);
    nextCampaignId += 1;
    campaign.id;
  };

  // FIX: status = "" (empty), updatedAt = "" (empty) — never auto-fill
  public shared ({ caller }) func addAssignedCandidate(id : Text, name : Text, phone : Text, email : Text, skills : Text, assignedTo : Text, campaign : Text, batchId : Text, assignDate : Text) : async Bool {
    let candidate : AssignedCandidate = {
      id;
      name;
      phone;
      email;
      skills;
      assignedTo = assignedTo.toLower();
      campaign;
      status = "";       // FIXED: always empty on assign
      batchId;
      assignDate;
      updatedAt = "";    // FIXED: empty until recruiter submits response
    };
    assignedCandidates.add(id, candidate);
    true;
  };

  // FIX: exact email match (toLower comparison) instead of substring contains
  public query ({ caller }) func getAssignedCandidates(recruiterEmail : Text, campaign : Text) : async [AssignedCandidate] {
    let emailLower = recruiterEmail.trim(#char(' ')).toLower();
    assignedCandidates.toArray().filter(
      func((cid, c)) {
        (emailLower == "" or c.assignedTo == emailLower) and
        (campaign == "" or c.campaign == campaign)
      }
    ).map(func((cid, c)) { c });
  };

  public query ({ caller }) func getAllAssignedCandidates() : async [AssignedCandidate] {
    let array = assignedCandidates.values().toArray();
    array.sort();
  };

  // FIX: update status + updatedAt only when recruiter explicitly acts
  public shared ({ caller }) func updateCandidateStatus(id : Text, status : Text, updatedAt : Text) : async Bool {
    switch (assignedCandidates.get(id)) {
      case (null) { false };
      case (?oldCandidate) {
        let updatedCandidate = {
          oldCandidate with
          status;
          updatedAt;
        };
        assignedCandidates.add(id, updatedCandidate);
        true;
      };
    };
  };

  public query ({ caller }) func getCampaigns() : async [Campaign] {
    let array = campaigns.values().toArray();
    array.sort();
  };
};
