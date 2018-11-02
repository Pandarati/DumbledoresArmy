import { Challenge } from "./Challenge";
import { JsonObject, JsonProperty } from "json2typescript";
@JsonObject("User")
export class User {

    @JsonProperty("username", String)
    username: string = undefined;

    @JsonProperty("name", String)
    name: string = undefined;

    @JsonProperty("dateOfBirth", String)
    dateOfBirth: string = new Date(Date.now()).toUTCString();

    @JsonProperty("emailAddress", String)
    emailAddress: string = undefined;

    @JsonProperty("profileImageUrl", String)
    profileImageUrl: string = undefined;

    @JsonProperty("totalScore", Number, true)
    totalScore: number = 0;

    @JsonProperty("challengesPostedRef", [Challenge], true)
    challengesPostedRef: Challenge[] = [];

    @JsonProperty("challengesTakenRef", Object, true)
    challengesTakenRef: Object = {};

    @JsonProperty("numberOfChallengesPosted", Number, true)
    numberOfChallengesPosted: number = 0;

    @JsonProperty("numberOfChallengesTaken", Number, true)
    numberOfChallengesTaken: number = 0;

    @JsonProperty("dateCreated", String, true)
    datePosted: string = new Date(Date.now()).toUTCString();

    @JsonProperty("dateModified", String, true)
    dateModified: string = new Date(Date.now()).toUTCString();

    constructor() {
    }
}