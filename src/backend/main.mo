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

  // ── Stable storage (survives upgrades) ──────────────────────────
  stable var _submissionEntries : [(Nat, Submission)] = [];
  stable var _signupRequestEntries : [(Text, SignupRequest)] = [];
  stable var _campaignEntries : [(Nat, Campaign)] = [];
  stable var _candidateEntries : [(Text, AssignedCandidate)] = [];
  stable var _nextId : Nat = 0;
  stable var _nextCampaignId : Nat = 1;

  // ── Runtime maps (rebuilt from stable on postupgrade) ───────────
  let submissions = Map.empty<Nat, Submission>();
  let signupRequests = Map.empty<Text, SignupRequest>();
  var nextId = _nextId;
  var nextCampaignId = _nextCampaignId;
  let campaigns = Map.empty<Nat, Campaign>();
  let assignedCandidates = Map.empty<Text, AssignedCandidate>();

  // ── Upgrade hooks ────────────────────────────────────────────────
  system func preupgrade() {
    _submissionEntries := submissions.toArray();
    _signupRequestEntries := signupRequests.toArray();
    _campaignEntries := campaigns.toArray();
    _candidateEntries := assignedCandidates.toArray();
    _nextId := nextId;
    _nextCampaignId := nextCampaignId;
  };

  system func postupgrade() {
    for ((k, v) in _submissionEntries.vals()) { submissions.add(k, v) };
    for ((k, v) in _signupRequestEntries.vals()) { signupRequests.add(k, v) };
    for ((k, v) in _campaignEntries.vals()) { campaigns.add(k, v) };
    for ((k, v) in _candidateEntries.vals()) { assignedCandidates.add(k, v) };
    nextId := _nextId;
    nextCampaignId := _nextCampaignId;
    // Clear stable arrays to free memory
    _submissionEntries := [];
    _signupRequestEntries := [];
    _campaignEntries := [];
    _candidateEntries := [];
  };

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

  // Create campaign — prevents duplicates by checking existing names (case-insensitive)
  public shared ({ caller }) func createCampaign(campaignName : Text, companyName : Text, role : Text, location : Text, salary : Text) : async Nat {
    let nameLower = campaignName.toLower();
    // Check for existing campaign with same name
    let existing = campaigns.toArray().filter(func((id, c)) {
      c.campaignName.toLower() == nameLower
    });
    if (existing.size() > 0) {
      // Return existing campaign id (no duplicate created)
      return existing[0].0;
    };
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

  // Delete campaign and all associated candidates
  public shared ({ caller }) func deleteCampaign(id : Nat) : async Bool {
    switch (campaigns.get(id)) {
      case (null) { false };
      case (?campaign) {
        campaigns.remove(id);
        // Remove all candidates linked to this campaign
        let toDelete = assignedCandidates.toArray().filter(
          func((cid, c)) { c.campaign == campaign.campaignName }
        ).map(func((cid, c)) { cid });
        for (cid in toDelete.vals()) {
          assignedCandidates.remove(cid);
        };
        true;
      };
    };
  };

  // status = "" (empty), updatedAt = "" (empty) — never auto-fill
  public shared ({ caller }) func addAssignedCandidate(id : Text, name : Text, phone : Text, email : Text, skills : Text, assignedTo : Text, campaign : Text, batchId : Text, assignDate : Text) : async Bool {
    let candidate : AssignedCandidate = {
      id;
      name;
      phone;
      email;
      skills;
      assignedTo = assignedTo.toLower();
      campaign;
      status = "";       // always empty on assign
      batchId;
      assignDate;
      updatedAt = "";    // empty until recruiter submits response
    };
    assignedCandidates.add(id, candidate);
    true;
  };

  // exact email match (toLower comparison)
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

  // update status + updatedAt only when recruiter explicitly acts
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
