import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";



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

  let submissions = Map.empty<Nat, Submission>();
  var nextId = 0;

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
