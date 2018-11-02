/**
 * Constants for field names and the collection names. 
 */
export class Constants {

    public static COLLECTION_ENDPOINTS = class {
        public static CHALLENGE_COLLECTION_ENDPOINT = "/Challenges/";
        public static USER_COLLECTION_ENDPOINT = "/Users";
        public static CHALLENGE_RESPONSE_COLLECTION_ENDPOINT = "/Challenges_Response/";
        public static USERNAME_USERID_COLLECTION_ENDPOINT = "/Username_UserID";
    }

    public static USER_FIELDS = class {
        public static USERNAME = "username";
        public static NAME = "name";
        public static DATE_OF_BIRTH = "dateOfBirth";
        public static EMAIL_ADDRESS = "emailAddress";
        public static PROFILE_IMAGE_URL = "profileImageUrl";
        public static TOTAL_SCORE = "totalScore"; 
        public static CHALLENGES_POSTED_REF = "challengesPostedRef";
        public static CHALLENGES_TAKEN_REF = "challengesTakenRef"; 
        public static NUMBER_OF_CHALLENGES_POSTED = "numberOfChallengesPosted";
        public static NUMBER_OF_CHALLENGES_TAKEN = "numberOfChallengesTaken";
        public static DATE_CREATED = "dateCreated";
        public static DATE_MODIFIED = "dateModified";
        public static USER_REF = "userRef";
        public static USER_UPDATE_KEYS = ["name", "dateOfBirth", "emailAddress", "profileImageUrl"];
    }

    public static CHALLENGE_FIELDS = class {
        public static CHALLENGE_NAME = "challengeName";
        public static TAGS = "tags";
        public static LOCATION = "location";
        public static POSTED_BY = "postedBy";
        public static DATE_POSTED = "datePosted";
        public static DATE_MODIFIED = "dateModified";
        public static NUMBER_OF_ATTEMPTS = "numberOfAttempts";
        public static ID = "id";
        public static CHALLENGE_UPDATE_KEYS = ["challengeName", "tags", "location"];
 
        public static QUESTIONS = class {
            public static QUESTION_TEXT = "questionText";
            public static QUESTION_CHOICES = "choices";
            public static CORRECT_ANSWER_INDEX = "correctAnswerIndex";
        }
    }

    public static CHALLENGE_RESPONSE = class {
        public static NUMBER_OF_QUESTIONS = "numberOfQuestions";
        public static QUESTION_CHOICES = "questionChoices";
        public static SCORE = "score";
        public static CHALLENGE_ID = "challengeId";
        public static CHALLENGE = "challenge";
    }

}