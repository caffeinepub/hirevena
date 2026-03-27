import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
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

  type SignupRequest = {
    name : Text;
    email : Text;
    password : Text;
    requestedAt : Time.Time;
    status : Text;
  };

  type OldActor = {
    submissions : Map.Map<Nat, Submission>;
    nextId : Nat;
  };

  type NewActor = {
    submissions : Map.Map<Nat, Submission>;
    signupRequests : Map.Map<Text, SignupRequest>;
    nextId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      signupRequests = Map.empty<Text, SignupRequest>();
    };
  };
};
