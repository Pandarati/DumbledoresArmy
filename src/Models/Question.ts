import { JsonObject, JsonProperty } from "json2typescript";

export class QuestionDictionary{

}

@JsonObject("Question")
export class Question{

    @JsonProperty("quesitonText", String, false)
    questionText: string = undefined;

    @JsonProperty("choices", [String], false)
    choices: string[] = undefined;

    @JsonProperty("correctAnswerIndex", Number, false)
    correctAnswerIndex: number = undefined;

    constructor(){

    }
}