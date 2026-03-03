import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
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
  };

  module Submission {
    public func compare(sub1 : Submission, sub2 : Submission) : Order.Order {
      Nat.compare(sub1.id, sub2.id);
    };
  };

  let submissions = List.empty<Submission>();

  public shared ({ caller }) func createSubmission(companyName : Text, contactName : Text, phoneNumber : Text, emailAddress : Text, role : Text, positions : Text, urgency : Text) : async () {
    let newSubmission : Submission = {
      id = submissions.size();
      companyName;
      contactName;
      phoneNumber;
      emailAddress;
      role;
      positions;
      urgency;
      timestamp = Time.now();
    };
    submissions.add(newSubmission);
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    submissions.toArray().sort();
  };
};
