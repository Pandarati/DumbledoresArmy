import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "../DatabaseWrapper/firebaseDatabaseHandler";
import { UserDatabaseHandler } from "./UserDatabaseHandler";
import { Challenge } from "../Models/Challenge";

export class ChallengeDatabaseHandler {
    constructor(datastore: admin.firestore.Firestore) {
        this.firebaseDataStore = datastore;
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore);
    }

    public static COLLECTION_ENDPOINT = "/Challenges/"
    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    public getChallengeWithId(id: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(ChallengeDatabaseHandler.COLLECTION_ENDPOINT, id)
                .then(documentSnapshot => {
                    var challengeObject = documentSnapshot.data();
                    resolve(challengeObject);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public updateChallengeWithId(userID: string, challengeID: string, challengeInfoToUpdate: object): Promise<object> {
        // Check if the fields are okay to be updated. 
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist."));
                    } else {
                        var listOfChallengesPostedRef = documentSnapshot.data()["challengesPosted"];
                        var listOfChallengesPostedId = listOfChallengesPostedRef.map(challengeRef => challengeRef.id);
                        if (!listOfChallengesPostedId.includes(challengeID)) {
                            reject(new Error("The user is not authorized to edit this challenge."));
                        } else {
                            this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(ChallengeDatabaseHandler.COLLECTION_ENDPOINT, challengeID, challengeInfoToUpdate)
                                .then(writeTime => {
                                    this.getChallengeWithId(challengeID)
                                    .then(challenge => {
                                        resolve(challenge);
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

    public createNewChallengeAndUpdateUserObject(userID: string, challenge: Challenge): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with userID " + userID + " does not exist"));
                    }
                    else {
                        this.fireStoreDataHandler.postRecordForCollectionAtRef(ChallengeDatabaseHandler.COLLECTION_ENDPOINT, JSON.parse(JSON.stringify(challenge)))
                            .then(postedObject => {
                                var listOfChallengesPostedRef = documentSnapshot.data()["challengesPosted"];
                                listOfChallengesPostedRef.push(this.firebaseDataStore.doc(ChallengeDatabaseHandler.COLLECTION_ENDPOINT + postedObject["id"]));
                                var numberOfChallengesPosted: number = Number(documentSnapshot.data()["numberOfChallengesPosted"]);
                                numberOfChallengesPosted += 1;

                                var updateObject = {
                                    "challengesPosted": listOfChallengesPostedRef,
                                    "numberOfChallengesPosted": numberOfChallengesPosted
                                };
                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userID, updateObject)
                                    .then(_ => {
                                        resolve(postedObject);
                                    })
                            })
                    }
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public deleteAChallenge(userID: string, challengeId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user does not exist."));
                    } else {
                        var listOfChallengesPostedRef = documentSnapshot.data()["challengesPosted"];
                        var listOfChallengesPostedId = listOfChallengesPostedRef.map(challengeRef => challengeRef.id);
                        if (!listOfChallengesPostedId.includes(challengeId)) {
                            reject(new Error("The user is not authorized to delete this challenge."));
                        } else {
                            // Remove the challenge from listOfChallengesPosted.
                            listOfChallengesPostedId = listOfChallengesPostedId.filter(cId => cId !== challengeId)
                            listOfChallengesPostedRef = listOfChallengesPostedId.map(cId => this.firebaseDataStore.doc(UserDatabaseHandler.COLLECTION_ENDPOINT + cId));
                            // Reduce the number of challenges posted by 1.
                            var numberOfChallengesPosted = Number(documentSnapshot.data()["numberOfChallengesPosted"]);
                            numberOfChallengesPosted -= 1
                            var updateObject = {
                                "challengesPosted": listOfChallengesPostedRef,
                                "numberOfChallengesPosted": numberOfChallengesPosted
                            };
                            this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userID, updateObject)
                                .then(_ => {
                                    this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(ChallengeDatabaseHandler.COLLECTION_ENDPOINT, challengeId)
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

    public getListOfChallenges(limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(ChallengeDatabaseHandler.COLLECTION_ENDPOINT, limit, sortBy)
                .then(querySnapshot => {
                    var listOfChallenges = []
                    querySnapshot.forEach(document => {
                        var challengeObject = document.data();
                        listOfChallenges.push(challengeObject);
                    })
                    resolve(listOfChallenges);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }
}