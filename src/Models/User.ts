import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "./../DatabaseWrapper/firebaseDatabaseHandler";
import * as Promise from "bluebird";
import { Challenge } from "./Challenge";

export class User {
    constructor(datastore: admin.firestore.Firestore) {
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore)
        this.firebaseDataStore = datastore;
    }

    public static COLLECTION_ENDPOINT = "/Users/";
    public static COLLECTION_ENDPOINT_USERNAME = "/Username_UserID/";

    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    public getListOfAllUsers_auth(): Promise<[any]> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(User.COLLECTION_ENDPOINT)
                .then(querySnapshot => {
                    var listOfUsers: [object];
                    querySnapshot.forEach(document => {
                        var userObject = document.data();
                        listOfUsers.push(userObject);
                    })
                    resolve(this.filterUserInfoForListOfUsers(listOfUsers));
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getUserDetailFromUsername_auth(userID: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username does not exist."));
                    } else {
                        var usernameToUserIdMap = documentSnapshot.data();
                        if (usernameToUserIdMap.userRef) {
                            return usernameToUserIdMap.userRef.get();
                        }
                    }
                })
                .then(documentSnapshot => {
                    if (!documentSnapshot) {
                        reject(new Error("The user doesn't exist."));
                    }
                    if (userID != documentSnapshot.ref.id) {
                        resolve(this.filterUserInfoForOneUser(documentSnapshot.data()));
                    }
                    resolve(documentSnapshot.data());
                })
                .catch(error => {
                    reject(Error("Error getting user detail from the database"));
                });
        });
    }

    public createAUser_auth(userID: string, userInfo: object): Promise<object> {
        // Add additional fields to userInfo.
        var usernameToUserIdMap = {
            "userRef": this.firebaseDataStore.doc(User.COLLECTION_ENDPOINT + userID)
        };
        return new Promise<object>((resolve, reject) => {
            // Check if the user exists. 
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (documentSnapshot.exists) {
                        reject(new Error("The user already exists."));
                    }
                })
                .then(_ => {
                    // Check if the username is taken. 
                    return this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, userInfo["username"])
                })
                .then(documentSnapshot => {
                    if (documentSnapshot.exists) {
                        reject(new Error("The username is already taken"));
                    }
                    return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(User.COLLECTION_ENDPOINT_USERNAME, usernameToUserIdMap, userInfo["username"])
                        .then(postedObject => {
                            return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(User.COLLECTION_ENDPOINT, this.createUserInfoObjectToPose(userInfo), userID)
                                .then(postedObject => {
                                    resolve(userInfo);
                                })
                        })
                        .catch(error => {
                            reject(error);
                        })
                })
        });
    }

    public editUserInfo_auth(userId: string, username: string, userInfo: object): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username " + username + " does not exist."));
                    }
                    var usernameToUserIdMap = documentSnapshot.data();
                    if (usernameToUserIdMap.userRef) {
                        return usernameToUserIdMap.userRef.id;
                    }
                })
                .then(usernameId => {
                    if (usernameId != userId) {
                        reject(new Error("You don't have permission to update the user info"));
                    }
                    return this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, usernameId, userInfo)
                })
                .then(updatedObject => {
                    resolve(userInfo);
                })
                .catch(error => {
                    reject(new Error("Error updating User Info."));
                })
        });
    }

    public deleteUserWithUsername(userId: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot) {
                        reject(new Error("The user with username " + username + "does not exist"));
                    }
                    var usernameToUserIdMap = documentSnapshot.data();
                    if (usernameToUserIdMap.userRef) {
                        return usernameToUserIdMap.userRef.id;
                    }
                })
                .then(usernameId => {
                    if (usernameId != userId) {
                        reject(new Error("You don't have permission to delete this user."));
                    }
                    return this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, usernameId);
                })
                .then(isDeleted => {
                    if (!isDeleted) {
                        reject(new Error("Error deleting user " + username));
                    }
                    return this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                })
                .then(isDeleted => {
                    resolve({
                        "status": "True"
                    })
                })
                .catch(error => {
                    reject(error)
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
                    var listOfChallengesPosted = documentSnapshot.data()["challengesPosted"];
                    Promise.mapSeries(listOfChallengesPosted, (challengeId) => {
                        return this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, challengeId);
                    })
                        .then(listOfChallengeId => {
                            resolve(listOfChallengeId.reduce((documentSnapshot) => documentSnapshot.data()));
                        })
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
                    var listOfChallengesPosted = documentSnapshot.data()["challengesTaken"];
                    Promise.mapSeries(listOfChallengesPosted, (challengeId) => {
                        return this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Challenge.COLLECTION_ENDPOINT, challengeId);
                    })
                        .then(listOfChallengeObjects => {
                            resolve(listOfChallengeObjects.reduce((documentSnapshot) => documentSnapshot.data()));
                        })
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    private createUserInfoObjectToPose(userInfo: object): object {
        return {
            "username": userInfo['username'],
            'challengesTakenRef': {},
            "challengesPostedRef": [],
            "dob": userInfo['dob'] == null ? new Date() : userInfo['dob'],
            "score": 0,
            "numberOfChallengesTaken": 0,
            "numberOfChallengesPosted": 0
        };
    }

    private filterUserInfoForListOfUsers(listofUserObjects: [object]): [object] {
        var returnListOfUserObjects: [object];
        listofUserObjects.forEach((userObject) => {
            returnListOfUserObjects.push({
                "username": userObject["username"],
                "dob": userObject['dob'],
                "score": userObject['score'],
                "numberOfChallengesTaken": userObject['numberOfChallengesTaken'],
                "numberOfChallengesPosted": userObject['numberOfChallengesPosted']
            });
        })
        return returnListOfUserObjects;
    }

    private filterUserInfoForOneUser(userObject: object): object {
        return {
            "username": userObject["username"],
            "dob": userObject['dob'],
            "score": userObject['score'],
            "numberOfChallengesTaken": userObject['numberOfChallengesTaken'],
            "numberOfChallengesPosted": userObject['numberOfChallengesPosted']
        }
    }
}