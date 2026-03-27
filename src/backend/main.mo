import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Migration "migration";

(with migration = Migration.run)
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

  let submissions = Map.empty<Nat, Submission>();
  var nextId = 0;
  let signupRequests = Map.empty<Text, SignupRequest>();

  // HireCandidate: (new) Recruiter Signup
  public shared ({ caller }) func submitSignupRequest(name : Text, email : Text, password : Text) : async () {
    let newRequest : SignupRequest = {
      name;
      email;
      password;
      requestedAt = Time.now();
      status = "pending";
    };
    signupRequests.add(email, newRequest);
  };

  public query ({ caller }) func getSignupRequests() : async [SignupRequest] {
    let array = signupRequests.values().toArray();
    array.sort();
  };

  public shared ({ caller }) func approveSignupRequest(email : Text) : async Bool {
    switch (signupRequests.get(email)) {
      case (null) { false };
      case (?request) {
        let updatedRequest = { request with status = "approved" };
        signupRequests.add(email, updatedRequest);
        true;
      };
    };
  };

  public shared ({ caller }) func rejectSignupRequest(email : Text) : async Bool {
    // Remove the SignupRequest (delete)
    if (signupRequests.containsKey(email)) {
      signupRequests.remove(email);
      true;
    } else { false };
  };

  public query ({ caller }) func getApprovedRecruiters() : async [SignupRequest] {
    let allRequests = signupRequests.toArray();
    let filtered = allRequests.filter(
      func((email, r)) { r.status == "approved" }
    );
    filtered.map(func((email, r)) { r });
  };

  // HireCandidate: (original) Submissions
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
};
