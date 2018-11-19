import { JsonObject, JsonProperty } from 'json2typescript';
import { Challenge } from './Challenge';

@JsonObject
export class ChallengeResponse {

    @JsonProperty("numberOfQuestions", Number)
    numberOfQuestions: number = undefined

    @JsonProperty("questionChoices", [Number])
    questionChoices: number[] = undefined;

    @JsonProperty("correctChoices", [Number], true)
    correctChoices: number[] = undefined;

    @JsonProperty("score", Number, true)
    score: number = undefined;

    @JsonProperty("challengeId", String, true)
    challengeId: number = undefined;

    @JsonProperty("challenge", Challenge, true)
    challenge: Challenge = undefined;

    constructor() {

    }
}