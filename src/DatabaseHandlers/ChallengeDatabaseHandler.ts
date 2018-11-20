import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "../DatabaseWrapper/firebaseDatabaseHandler";
import { UserDatabaseHandler } from "./UserDatabaseHandler";
import { Challenge } from "../Models/Challenge";
import { ChallengeResponse } from "./../Models/ChallengeResponse";
import { JsonConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { Constants } from "../Constants";

export class ChallengeDatabaseHandler {

    constructor(datastore: admin.firestore.Firestore) {
        this.setupJsonConverter();
        this.firebaseDataStore = datastore;
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore);
    }

    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;
    private jsonConvert: JsonConvert;

    /**
     * Using JSON converter for converting JSON requests to User Objects. 
     * Checks for field names and returns error if field name is invalid. 
     */
    private setupJsonConverter(): void {
        this.jsonConvert = new JsonConvert();
        this.jsonConvert.operationMode = OperationMode.LOGGING;
        this.jsonConvert.ignorePrimitiveChecks = false;
        this.jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;
    }

    /**
     * 
     * @param id Challenge ID
     * Get the challenge with the ID given.
     */
    public getChallengeWithId(id: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, id)
                .then(documentSnapshot => {
                    resolve(documentSnapshot.data());
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param userID User ID of the user 
     * @param challengeID Challenge ID for the challenge to update. 
     * @param challengeInfoToUpdate Object containing the fields to update.
     * Update the challenge with the fields provided. 
     * Restricts updating the following fields from Challenge object:
     *  - postedBy
     *  - datePosted
     *  - dateModified
     *  - numberOfAttempts
     *  - id
     *  - questions
     */
    public updateChallengeWithId(userID: string, challengeID: string, challengeInfoToUpdate: object): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist."));
                    } else {
                        var listOfChallengesPostedRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                        var listOfChallengesPostedId = listOfChallengesPostedRef.map(challengeRef => challengeRef.id);

                        if (!listOfChallengesPostedId.includes(challengeID)) {
                            reject(new Error("The user is not authorized to edit this challenge."));
                        } else {
                            if (!this.IsFieldsInTheObjectToUpdateValid(challengeInfoToUpdate)) {
                                reject(new Error("Some of the fields specified cannot be updated"));
                            } else {
                                challengeInfoToUpdate[Constants.CHALLENGE_FIELDS.DATE_MODIFIED] = new Date(Date.now()).toUTCString();
                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, challengeID, challengeInfoToUpdate)
                                    .then(_ => {
                                        this.getChallengeWithId(challengeID)
                                            .then(challenge => {
                                                resolve(challenge);
                                            })
                                    })
                            }
                        }
                    }

                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param userID User Id of the user.
     * @param challenge Challenge object to post to the database. 
     * Checks if the user exists.
     * If the user exists, post the challenge object.
     * Add the reference to the challengesPostedRef for the user. 
     * Increase the numberOfChallengesPosted for the user. 
     */
    public createNewChallengeAndUpdateUserObject(userID: string, challenge: Challenge): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with userID " + userID + " does not exist"));
                    }
                    else {
                        this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID)
                            .then(userSnapshot => {
                                if (!userSnapshot.exists) {
                                    reject(new Error("The user does not exist"));
                                } else {
                                    var username: string = userSnapshot.data()[Constants.USER_FIELDS.USERNAME];
                                    challenge.postedBy = username;
                                    this.fireStoreDataHandler.postRecordForCollectionAtRef(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, JSON.parse(JSON.stringify(challenge)))
                                        .then(postedObject => {
                                            var listOfChallengesPostedRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                                            listOfChallengesPostedRef.push(this.firebaseDataStore.doc(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT + postedObject["id"]));
                                            var numberOfChallengesPosted: number = Number(documentSnapshot.data()[Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_POSTED]);
                                            numberOfChallengesPosted += 1;

                                            var updateObject = {
                                                [Constants.USER_FIELDS.CHALLENGES_POSTED_REF]: listOfChallengesPostedRef,
                                                [Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_POSTED]: numberOfChallengesPosted
                                            };
                                            this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID, updateObject)
                                                .then(_ => {
                                                    resolve(postedObject);
                                                })
                                        })
                                }
                            })
                    }
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param userID User ID of the user. 
     * @param challengeId Challenge ID of the challenge to delete. 
     * Check if the user exists. 
     * If the user exists, check if the user posted this challenge. 
     * If true, delete the challenge and remove the challenge from the challengesPostedRef.
     * Also, reduce the count of number of challengesPosted. 
     */
    public deleteAChallenge(userID: string, challengeId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist."));
                    } else {
                        var listOfChallengesPostedRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                        var listOfChallengesPostedId = listOfChallengesPostedRef.map(challengeRef => challengeRef.id);
                        if (!listOfChallengesPostedId.includes(challengeId)) {
                            reject(new Error("The user is not authorized to delete this challenge."));
                        } else {
                            listOfChallengesPostedRef = listOfChallengesPostedRef.filter(challengeRef => challengeRef.id !== challengeId);
                            var numberOfChallengesPosted = Number(documentSnapshot.data()[Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_POSTED]);
                            numberOfChallengesPosted--;

                            var updateObject = {
                                [Constants.USER_FIELDS.CHALLENGES_POSTED_REF]: listOfChallengesPostedRef,
                                [Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_POSTED]: numberOfChallengesPosted
                            };
                            this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID, updateObject)
                                .then(_ => {
                                    this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, challengeId)
                                        .then(isDeleted => {
                                            resolve({
                                                "status": isDeleted
                                            })
                                        })
                                })
                        }
                    }

                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param limit Number of challenges required
     * @param sortBy Sort By parameter. 
     * Get List of Challenges with optional limit and sortBy parameters. 
     * Sorted in order of the timePosted by default. 
     */
    public getListOfChallenges(limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, limit, sortBy)
                .then(querySnapshot => {
                    var listOfChallenges: object[] = []
                    querySnapshot.forEach(document => {
                        var challengeObject = document.data();
                        // Remove the correctAnswers when requesting for a challenge. 
                        challengeObject["questions"].forEach(question => {
                            delete question.correctAnswerIndex;
                        })
                        listOfChallenges.push(challengeObject);
                    })
                    resolve(listOfChallenges);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param userID User ID of the User.
     * @param challengeID Challenge ID of the challenges responding to. 
     * @param challengeResponse Object that contains the challenge response. 
     * Check if the user has taken this challenge before. 
     * If not, Use challengeId to get challenge object. 
     * Using the correct answer index, score the reponse. 
     * Add challenge response to challengesTaken collection. 
     * Update the challengesTaken and numberOfChallengesTaken for the user. 
     */
    public calculateScoreAndPostUserResponseForChallenge(userID: string, challengeID: string, challengeResponse: ChallengeResponse): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist."));
                    } else {
                        var challengesTaken = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                        if (challengesTaken === undefined) challengesTaken = [];

                        var challengesTakenIds = Object.keys(challengesTaken);
                        if (challengesTakenIds.includes(challengeID)) {
                            reject(new Error("The user has already taken this challenge."));
                        } else {
                            this.getChallengeWithId(challengeID)
                                .then(challengeObject => {
                                    if (challengeObject === undefined) {
                                        reject(new Error("The challenge for challengeId " + challengeID + " does not exist"));
                                    } else {
                                        var challenge: Challenge = this.jsonConvert.deserialize(challengeObject, Challenge);
                                        var challengeResponseScore: number = Challenge.ScoreChallengeForResponse(challenge, challengeResponse);
                                        challengeResponse.score = challengeResponseScore;
                                        challengeResponse.challenge = challenge;
                                        challengeResponse.correctChoices = challenge.getCorrectAnswerChoices();

                                        this.fireStoreDataHandler.postRecordForCollectionAtRef(Constants.COLLECTION_ENDPOINTS.CHALLENGE_RESPONSE_COLLECTION_ENDPOINT, JSON.parse(JSON.stringify(challengeResponse)))
                                            .then(postedObject => {
                                                challengesTaken[challengeID] = this.firebaseDataStore.doc(Constants.COLLECTION_ENDPOINTS.CHALLENGE_RESPONSE_COLLECTION_ENDPOINT + postedObject['id']);

                                                var totalScore = Number(documentSnapshot.data()[Constants.USER_FIELDS.TOTAL_SCORE]);
                                                var numberOfChallengesTaken = Number(documentSnapshot.data()[Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_TAKEN]);

                                                numberOfChallengesTaken += 1;
                                                totalScore += challengeResponseScore;

                                                var numberOfAttemptsForChallenge = challenge.numberOfAttempts;
                                                numberOfAttemptsForChallenge++;


                                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.CHALLENGE_COLLECTION_ENDPOINT, challengeID, {
                                                    [Constants.CHALLENGE_FIELDS.NUMBER_OF_ATTEMPTS]: numberOfAttemptsForChallenge
                                                })

                                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userID, {
                                                    [Constants.USER_FIELDS.CHALLENGES_TAKEN_REF]: challengesTaken,
                                                    [Constants.USER_FIELDS.NUMBER_OF_CHALLENGES_TAKEN]: numberOfChallengesTaken,
                                                    [Constants.USER_FIELDS.TOTAL_SCORE]: totalScore
                                                })
                                                    .then(_ => {
                                                        resolve(challengeResponse);
                                                    })
                                                    .catch(error => {
                                                        reject(error);
                                                    })
                                            })
                                    }
                                })
                        }
                    }
                }).catch(error => {
                    reject(error);
                })

        })
    }

    public getResponseForChallengeWithId(challengeId: string, userId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userId)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist"));
                    } else {
                        var challengesTakenRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                        if (!(challengesTakenRef.includes(challengeId))) {
                            reject(new Error("The user has not taken this challenges yet."));
                        } else {
                            challengesTakenRef[challengeId].get()
                                .then(documentSnapshot => {
                                    resolve(documentSnapshot.data());
                                })
                        }
                    }
                })
                .catch(error => {
                    reject(error);
                })
        })
    }

    private IsFieldsInTheObjectToUpdateValid(objectToUpdate: object): boolean {
        if (Object.keys(objectToUpdate) !== Constants.CHALLENGE_FIELDS.CHALLENGE_UPDATE_KEYS) return false;
        var keysToUpdate: string[] = Object.keys(objectToUpdate).sort((one, two) => (one > two ? -1 : 1));
        var count = 0;
        keysToUpdate.forEach(updateKey => {
            if (updateKey !== Constants.CHALLENGE_FIELDS.CHALLENGE_UPDATE_KEYS[count]) return false;
            count++;
        })
        return true;
    }
}