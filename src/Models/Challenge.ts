import { JsonObject, JsonProperty, JsonConverter, JsonCustomConvert, JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { Question } from "./Question";
import { Location } from "./Location";

@JsonConverter
class QuestionConverter implements JsonCustomConvert<[Question]>{

    deserialize(questionMapping: object) {
        var jsonConvert = new JsonConvert();
        jsonConvert.operationMode = OperationMode.LOGGING;
        jsonConvert.ignorePrimitiveChecks = false;
        jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;

        var listOfQuestionObjects: [Question];
        for (let key in questionMapping) {
            listOfQuestionObjects.push(jsonConvert.deserialize(questionMapping[key], Question))
        }
        return listOfQuestionObjects;
    }

    serialize(questionList: [object]): object {
        var count = 1;
        var questionMapping = {};
        questionList.forEach(question => {
            questionMapping[count] = question;
            count++;
        })
        return questionMapping;
    }
}

@JsonObject("Challenge")
export class Challenge {
    @JsonProperty("challengeName", String)
    challengeName: string = undefined;

    @JsonProperty("tags", [String])
    tags: string[] = undefined;

    @JsonProperty("location", Location)
    location: Location = undefined;

    @JsonProperty("questions", QuestionConverter)
    questions: object = undefined;

    @JsonProperty("postedBy", String, true)
    postedBy: string;

    @JsonProperty("datePosted", String, true)
    datePosted: string = new Date(Date.now()).toUTCString();

    @JsonProperty("numberOfAttempts", Number, true)
    numberOfAttempts: number = 0;

    @JsonProperty("id", Number, true)
    id: number;

    constructor() {
    }
}