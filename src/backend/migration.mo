import Map "mo:core/Map";
import List "mo:core/List";

module {
  type OldSubmission = {
    id : Nat;
    companyName : Text;
    contactName : Text;
    phoneNumber : Text;
    emailAddress : Text;
    role : Text;
    positions : Text;
    urgency : Text;
    timestamp : Int;
  };

  type Input = {
    submissions : List.List<OldSubmission>;
  };

  type NewSubmission = {
    id : Nat;
    companyName : Text;
    contactName : Text;
    phoneNumber : Text;
    emailAddress : Text;
    role : Text;
    positions : Text;
    urgency : Text;
    timestamp : Int;
    status : Text;
    notes : Text;
    followUpDate : Text;
  };

  type Output = {
    submissions : Map.Map<Nat, NewSubmission>;
    nextId : Nat;
  };

  public func run(old : Input) : Output {
    let newSubmissions = Map.empty<Nat, NewSubmission>();

    old.submissions.forEach(
      func(oldSubmission) {
        let newSubmission : NewSubmission = {
          oldSubmission with
          status = "New";
          notes = "";
          followUpDate = "";
        };
        newSubmissions.add(oldSubmission.id, newSubmission);
      }
    );

    {
      submissions = newSubmissions;
      nextId = old.submissions.size();
    };
  };
};
