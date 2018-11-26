import { JsonObject, JsonProperty } from "json2typescript";

@JsonObject("Question")
export class Question {

    @JsonProperty("questionText", String)
    questionText: string = undefined;

    @JsonProperty("choices", [String])
    choices: string[] = undefined;

    @JsonProperty("correctAnswerIndex", Number)
    correctAnswerIndex: number = undefined;

    constructor(questionObject: Object) {
        Object.assign(this, questionObject);
    }
}