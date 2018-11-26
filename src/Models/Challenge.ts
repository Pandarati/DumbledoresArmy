import { JsonObject, JsonProperty, JsonConverter, JsonCustomConvert, JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { Question } from "./Question";
import { ChallengeResponse } from "./ChallengeResponse";

/**
 * Custom converter for Question mapping in the Challenge object. 
 */
@JsonConverter
class QuestionConverter implements JsonCustomConvert<Question[]>{

    constructor() {
        this.jsonConvert = new JsonConvert();
        this.jsonConvert.operationMode = OperationMode.ENABLE;
        this.jsonConvert.ignorePrimitiveChecks = false;
        this.jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;
    }

    jsonConvert: JsonConvert;

    deserialize(questionObjects: any): Question[] {
        var listOfQuestionObjects: Question[] = [];
        questionObjects.forEach(qObject => {
            listOfQuestionObjects.push(new Question(qObject));
        })
        return listOfQuestionObjects;
    }

    serialize(questionList: Question[]): any {
        var listOfQuestionObjects = [];
        questionList.forEach(question => {
            listOfQuestionObjects.push(JSON.stringify(question));
        })
        return listOfQuestionObjects;
    }
}

@JsonObject("Challenge")
export class Challenge {

    @JsonProperty("challengeName", String)
    challengeName: string = undefined;

    @JsonProperty("tags", [String])
    tags: string[] = undefined;

    @JsonProperty("location", Object)
    location: object = undefined;

    @JsonProperty("questions", QuestionConverter)
    questions: Question[] = undefined;

    @JsonProperty("postedBy", String, true)
    postedBy: string;

    @JsonProperty("datePosted", String, true)
    datePosted: string = new Date(Date.now()).toUTCString();

    @JsonProperty("dateModified", String, true)
    dateModified: string = new Date(Date.now()).toUTCString();

    @JsonProperty("numberOfAttempts", Number, true)
    numberOfAttempts: number = 0;

    @JsonProperty("id", Number, true)
    id: number;

    constructor() {
    }

    public getQuestions(): Question[] {
        return this.questions;
    }

    public static ScoreChallengeForResponse(challenge: Challenge, challengeResponse: ChallengeResponse): number {
        var questions = challenge.getQuestions();
        var counter = 0;
        var score = 0;
        questions.forEach(question => {
            if (question.correctAnswerIndex === challengeResponse.questionChoices[counter]) score++;
            counter += 1
        })
        return score;
    }

    public getCorrectAnswerChoices(): number[] {
        const correctAnswerChoices = [];
        this.questions.forEach(question => {
            correctAnswerChoices.push(question.correctAnswerIndex);
        })
        return correctAnswerChoices;
    }
}