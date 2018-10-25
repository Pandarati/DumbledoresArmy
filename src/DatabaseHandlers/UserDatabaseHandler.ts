import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "../DatabaseWrapper/firebaseDatabaseHandler";
import * as Promise from "bluebird";
import { ChallengeDatabaseHandler } from "./ChallengeDatabaseHandler";
import { User } from "./../Models/User";
import { rejects } from "assert";

export class UserDatabaseHandler {
    constructor(datastore: admin.firestore.Firestore) {
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore)
        this.firebaseDataStore = datastore;
    }

    public static COLLECTION_ENDPOINT = "/Users/";
    public static COLLECTION_ENDPOINT_USERNAME = "/Username_UserID/";

    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    public getListOfAllUsers_auth(limit: number, sortBy: string): Promise<[any]> {
        // Just return the data as it is because posted after verification. 
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(UserDatabaseHandler.COLLECTION_ENDPOINT, limit, sortBy)
                .then(querySnapshot => {
                    if (querySnapshot == null) {
                        reject(new Error("No users in the database."));
                    }
                    var listOfUsers = [];
                    querySnapshot.forEach(document => {
                        var userObject = document.data();
                        // Remove certain fields for userObject List view if not the current user. 
                        delete userObject.listOfChallengesPostedRef
                        delete userObject.listOfChallengesTakenRef
                        listOfUsers.push(userObject);
                    })
                    resolve(listOfUsers);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getUserDetailFromUsername_auth(userID: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username does not exist."));
                    } else {
                        var usernameToUserIdMap = documentSnapshot.data();
                        if (usernameToUserIdMap.userRef) {
                            usernameToUserIdMap.userRef.get()
                                .then(documentSnapshot => {
                                    if (!documentSnapshot) {
                                        reject(new Error("The user doesn't exist."));
                                    } else {
                                        var userInfo = documentSnapshot.data();
                                        delete userInfo.listOfChallengesPostedRef
                                        delete userInfo.listOfChallengesTakenRef
                                        if (userID !== documentSnapshot.ref.id) {
                                            // When the user requesting the data is not the same user. 
                                            delete userInfo.emailAddress;
                                            resolve(userInfo);
                                        } else {
                                            resolve(userInfo);
                                        }
                                    }
                                })
                        }
                    }
                })

                .catch(error => {
                    reject(Error("Error getting user detail from the database"));
                });
        });
    }

    public createAUser_auth(user: User, userId: string): Promise<object> {
        var usernameToUserIdMap = {
            "userRef": this.firebaseDataStore.doc(UserDatabaseHandler.COLLECTION_ENDPOINT + userId)
        };
        return new Promise<object>((resolve, reject) => {
            // Check if the user exists. 
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, userId)
                .then(documentSnapshot => {
                    if (documentSnapshot.exists) {
                        reject(new Error("The user already exists."));
                    }
                    else {
                        this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, user.username)
                            .then(documentSnapshot => {
                                if (documentSnapshot.exists) {
                                    reject(new Error("The username is already taken"));
                                }
                                else {
                                    this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, usernameToUserIdMap, user.username)
                                        .then(_ => {
                                            return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(UserDatabaseHandler.COLLECTION_ENDPOINT, JSON.parse(JSON.stringify(user)), userId)
                                        })
                                        .then(postedObject => {
                                            return resolve(postedObject)
                                        })
                                }
                            })
                            .catch(error => {
                                return reject(error);
                            })
                    }
                });
        });
    }

    public editUserInfo_auth(userInfoToUpdate: object, username: string, userId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username " + username + " does not exist."));
                    } else {
                        var usernameToUserIdMap = documentSnapshot.data();
                        if (usernameToUserIdMap.userRef) {
                            var fetchedUserId = usernameToUserIdMap.userRef.id;
                            if (fetchedUserId != userId) {
                                reject(new Error("You don't have permission to update the user info"));
                            } else if (!this.IsFieldsUpdateAuthorized(userInfoToUpdate)) {
                                reject(new Error("One of the fields cannot be updated."));
                            } else {
                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, fetchedUserId, userInfoToUpdate)
                                    .then(writeTimeForUpdatedObject => {
                                        return this.getUserDetailFromUsername_auth(userId, username);
                                    })
                                    .then(userObject => {
                                        resolve(userObject);
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

    public deleteUserWithUsername(userId: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot) {
                        reject(new Error("The user with username " + username + "does not exist"));
                    } else {
                        var usernameToUserIdMap = documentSnapshot.data();
                        if (usernameToUserIdMap.userRef) {
                            var fetchedUserId = usernameToUserIdMap.userRef.id;
                            if (fetchedUserId != userId) {
                                reject(new Error("You don't have permission to delete this user."));
                            } else {
                                this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT, fetchedUserId)
                                    .then(isDeleted => {
                                        resolve({
                                            "status": isDeleted
                                        })
                                    })
                            }
                        }
                    }

                })
                .catch(error => {
                    reject(error)
                })
        });
    }

    public getListOfChallengesPostedByUser(userID: string, username: string, limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    } else {
                        documentSnapshot.data().userRef.get()
                            .then(documentSnapshot => {
                                var listOfChallengesPostedRef = documentSnapshot.data()["challengesPosted"];
                                Promise.mapSeries(listOfChallengesPostedRef, (challengeRef) => {
                                    return challengeRef.get();
                                })
                                    .then(listOfChallenges => {
                                        listOfChallenges = listOfChallenges.map(challengeSnapshot => challengeSnapshot.data());
                                        if (sortBy != undefined){
                                            listOfChallenges = listOfChallenges.sort((challenge1, challenge2) => challenge1[sortBy] - challenge2[sortBy])
                                        }   
                                        if (limit != undefined){
                                            listOfChallenges = listOfChallenges.slice(0, limit);
                                        }
                                        resolve(listOfChallenges);
                                    })
                            })
                    }
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public getListOfChallengesTakenByUser(userID: number, username: string, limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(UserDatabaseHandler.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    } else {
                        documentSnapshot.data().userRef.get()
                            .then(documentSnapshot => {
                                var listOfChallengesTakenRef = documentSnapshot.data()["challengesTaken"];
                                Promise.mapSeries(listOfChallengesTakenRef, (challengeRef) => {
                                    return challengeRef.get();
                                })
                                    .then(listOfChallenges => {
                                        listOfChallenges = listOfChallenges.map(challengeSnapshot => challengeSnapshot.data());
                                        if (sortBy != undefined){
                                            listOfChallenges = listOfChallenges.sort((challenge1, challenge2) => challenge1[sortBy] - challenge2[sortBy])
                                        }   
                                        if (limit != undefined){
                                            console.log("Lol");
                                            listOfChallenges = listOfChallenges.slice(0, limit);
                                        }
                                        resolve(listOfChallenges);
                                    })
                            })
                    }
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    private IsFieldsUpdateAuthorized(userInfoToUpdate) {
        // Username, totalscore, challengesPosted, challengesTaken, datePosted, dateTaken 
        // Account for fields that don't exist. 
        if ('userName' in userInfoToUpdate || 'totalScore' in userInfoToUpdate ||
            'challengesPosted' in userInfoToUpdate || 'challengesTaken' in userInfoToUpdate ||
            'datePosted' in userInfoToUpdate || 'dateTaken' in userInfoToUpdate) {
            return false
        }
        return true;
    }
}