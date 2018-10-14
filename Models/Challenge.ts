import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";
import { User } from "./User";

export class Challenge {
    constructor(datastore: admin.firestore.Firestore) {
        this.firebaseDataStore = datastore;
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore);
    }

    private static COLLECTION_ENDPOINT = "/Challenges/"
    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    public getChallengeWithId(id: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, id)
                .then(documentSnapshot => {
                    var challengeObject = documentSnapshot.data();
                    resolve(challengeObject);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public updateChallengeWithId(id: string, challenge: object): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, id)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The challenge with id " + id + " does not exist."));
                    }
                    return this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, id, challenge);
                })
                .then(updatedObject => {
                    resolve(challenge);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public createNewChallenge(userID: string, challenge: object): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with userID " + userID + " does not exist"));
                    }
                    return this.fireStoreDataHandler.postRecordForCollectionAtRef(Challenge.COLLECTION_ENDPOINT, challenge)
                        .then(postedObject => {
                            var challengesPostedRef = documentSnapshot.data()["challengesPostedRef"];
                            challengesPostedRef.push(postedObject["id"]);
                            this.firebaseDataStore.collection(User.COLLECTION_ENDPOINT).doc(userID).set({
                                "challengesPostedRef": challengesPostedRef
                            })
                            .then(writeResult => {
                                resolve(postedObject);
                            })
                        })
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public deleteNewChallenge(id: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, id)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The challenge with id " + id + " does not exist"));
                    }
                    return this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, id)
                })
                .then(isDeleted => {
                    resolve({
                        "status": true
                    });
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public getListOfChallenges(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(Challenge.COLLECTION_ENDPOINT)
                .then(querySnapshot => {
                    var listOfChallenges = []
                    querySnapshot.forEach(document => {
                        var challengeObject = document.data();
                        listOfChallenges.push(challengeObject);
                    })
                    resolve(listOfChallenges);
                })
        });
    }

    public getListOfChallengesPostedByUser(username: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    }
                    return documentSnapshot.data().userRef.get();
                })
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("Error retrieving challenges posted by user"));
                    }
                    var listOfChallengesPosted =  documentSnapshot.data()["challengesPostedRef"];
                    var listOfChallegeObjects = [];
                    listOfChallengesPosted.forEach((challengeId) => {
                        console.log(challengeId);
                        this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, challengeId)
                            .then(documentSnapshot => {
                                if (documentSnapshot.exists) {
                                    listOfChallegeObjects.push(documentSnapshot.data());
                                }
                            })
                    })
                    resolve(listOfChallegeObjects);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public getListOfChallengesTakenByUser(username: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    }
                    return documentSnapshot.data().userRef.get();
                })
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("Error retrieving challenges posted by user"));
                    }
                    return documentSnapshot.data().challengesTakenRef;
                })
                .then(listOfChallengesTakenRef => {
                    var listOfChallegeObjects = [];
                    listOfChallengesTakenRef.forEach((challengeRef) => {
                        challengeRef.get()
                            .then(documentSnapshot => {
                                if (documentSnapshot.exists) {
                                    listOfChallegeObjects.push(documentSnapshot.data());
                                }
                            })
                    })
                    resolve(listOfChallegeObjects);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }
}