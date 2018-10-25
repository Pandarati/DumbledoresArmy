import { Challenge } from "./Challenge";
import { JsonObject, JsonProperty } from "json2typescript";
@JsonObject("User")
export class User {

    @JsonProperty("userName", String)
    username: string = undefined;

    @JsonProperty("name", String)
    name: string = undefined;

    @JsonProperty("dateOfBirth", String)
    dateOfBirth: string = new Date(Date.now()).toUTCString();

    @JsonProperty("emailAddress", String)
    emailAddress: string = undefined;

    @JsonProperty("profileImageUrl", String)
    profileImageUrl: string = undefined;

    @JsonProperty("totalScore", Number)
    totalScore: number = 0;

    @JsonProperty("challengesPosted", [Challenge], true)
    challengesPosted: Challenge[] = [];

    @JsonProperty("challengesTaken", [Challenge], true)
    challengesTaken: Challenge[] = [];

    @JsonProperty("numberOfChallengesPosted", Number, true)
    numberOfChallengesPosted: number = 0;

    @JsonProperty("numberOfChallengesTaken", Number, true)
    numberOfChallengesTaken: number = 0;    

    @JsonProperty("datePosted", String, true)
    datePosted: string = new Date(Date.now()).toUTCString();

    @JsonProperty("dateModified", String, true)
    dateModified: string = new Date(Date.now()).toUTCString();

    constructor() {
    }
}