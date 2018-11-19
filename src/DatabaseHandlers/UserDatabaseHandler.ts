import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "../DatabaseWrapper/firebaseDatabaseHandler";
import * as Promise from "bluebird";
import { User } from "./../Models/User";
import { ChallengeResponse } from "./../Models/ChallengeResponse";
import { Constants } from "./../Constants";

export class UserDatabaseHandler {
    constructor(datastore: admin.firestore.Firestore) {
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore)
        this.firebaseDataStore = datastore;
    }

    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    /**
     * 
     * @param limit Maximum number of users requested. 
     * @param sortBy Sort By parameter. 
     * Get list of users.
     * Sorted by dateCreated in default. 
     * Delete the challengesTakenRef and challengesPostedRef fields to reduce response size. 
     */
    public getListOfAllUsers_auth(limit: number, sortBy: string): Promise<[any]> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, limit, sortBy)
                .then(querySnapshot => {
                    if (querySnapshot == null) {
                        reject(new Error("No users in the database."));
                    } else {
                        var listOfUsers = [];
                        querySnapshot.forEach(document => {
                            var userObject: object = document.data();

                            delete userObject[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                            delete userObject[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                            listOfUsers.push(userObject);
                        })
                        resolve(listOfUsers);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * 
     * @param userID User ID of the current user. 
     * @param username Username to get detail for. 
     * Checks if the username exists. 
     * If it does, gets the user and removes the challengesTakenRef and challengesPostedRef fields
     * to minimize the response size. 
     * Removes the email address if the userID is not the same as that of username. 
     */
    public getUserDetailFromUsername_auth(userID: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, username)
                .then(userNameToUserIDSnapshot => {
                    if (!userNameToUserIDSnapshot.exists) {
                        reject(new Error("The user with the username does not exist."));
                    } else {
                        var usernameToUserIdMap: object = userNameToUserIDSnapshot.data();
                        if (usernameToUserIdMap[Constants.USER_FIELDS.USER_REF]) {
                            usernameToUserIdMap[Constants.USER_FIELDS.USER_REF].get()
                                .then(documentSnapshot => {
                                    if (!documentSnapshot.exists) {
                                        reject(new Error("The user doesn't exist."));
                                    } else {
                                        var userInfo: object = documentSnapshot.data();
                                        delete userInfo[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                                        delete userInfo[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                                        if (documentSnapshot.id !== userID) {
                                            delete userInfo[Constants.USER_FIELDS.EMAIL_ADDRESS];
                                        }
                                        resolve(userInfo)
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

    getUserDetailFromUserId(userId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userId)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user doesn't exist."));
                    } else {
                        var userInfo: object = documentSnapshot.data();
                        delete userInfo[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                        delete userInfo[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                        resolve(userInfo)
                    }
                })
                .catch(error => {
                    reject(Error("Error getting user detail from the database"));
                });
        })
    }

    /**
     * 
     * @param user User object to create new user. 
     * @param userId User ID from the JWT token, not reqgitered in our database. 
     * Check if the userID is already in the database. 
     * If not, check if the username provided is already taken. 
     * If not, add the usernameToUserId map to the Username_UserId collection. 
     * Add the User object to the collection with the userID. 
     */
    public createAUser_auth(user: User, userId: string): Promise<object> {
        let usernameToUserIdMap: object = {
            [Constants.USER_FIELDS.USER_REF]: this.firebaseDataStore.doc(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT + "/" + userId)
        };
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userId)
                .then(documentSnapshot => {
                    if (documentSnapshot.exists) {
                        reject(new Error("The user already exists."));
                    }
                    else {
                        this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, user.username)
                            .then(documentSnapshot => {
                                if (documentSnapshot.exists) {
                                    reject(new Error("The username is already taken"));
                                }
                                else {
                                    this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, usernameToUserIdMap, user.username)
                                        .then(_ => {
                                            return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, JSON.parse(JSON.stringify(user)), userId)
                                        })
                                        .then(postedObject => {
                                            return resolve(postedObject)
                                        })
                                }
                            })
                    }
                })
                .catch(error => {
                    return reject(error);
                });
        });
    }

    /**
     * 
     * @param userInfoToUpdate Object containing the fields to update for the user. 
     * @param username Username of the profile to update. 
     * @param userId UserId of the current user. 
     * Check if the username and userId correspond to the same user. 
     * If yes, check if the userInfoToUpdate object only has keys that can be updated. 
     * If yes, update the dateModified key for User object. 
     * Return the updated user object.
     */
    public editUserInfo_auth(userInfoToUpdate: object, username: string, userId: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username " + username + " does not exist."));
                    } else {
                        var usernameToUserIdMap: object = documentSnapshot.data();
                        if (usernameToUserIdMap[Constants.USER_FIELDS.USER_REF]) {
                            var fetchedUserId = usernameToUserIdMap[Constants.USER_FIELDS.USER_REF].id;
                            if (fetchedUserId !== userId) {
                                reject(new Error("You don't have permission to update the user info"));
                            } else if (!this.IsFieldsInTheObjectToUpdateValid(userInfoToUpdate)) {
                                reject(new Error("One of the fields cannot be updated."));
                            } else {
                                userInfoToUpdate[Constants.USER_FIELDS.DATE_MODIFIED] = new Date(Date.now()).toUTCString();
                                this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, fetchedUserId, userInfoToUpdate)
                                    .then(_ => {
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

    /**
     * 
     * @param userId UserId of the current user. 
     * @param username Username of the user to delete profile. 
     * Check if the userId and username correspond to the same user. 
     */
    public deleteUserWithUsername(userId: string, username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with username " + username + "does not exist"));
                    } else {
                        var usernameToUserIdMap: object = documentSnapshot.data();
                        if (usernameToUserIdMap[Constants.USER_FIELDS.USER_REF]) {
                            var fetchedUserId = usernameToUserIdMap[Constants.USER_FIELDS.USER_REF].id;
                            if (fetchedUserId !== userId) {
                                reject(new Error("You don't have permission to delete this user."));
                            } else {
                                this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, fetchedUserId)
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

    /**
     * 
     * @param userID userID of the current user. 
     * @param username Username of the challengesPosted request user. 
     * @param limit Maximum number of challenges posted. 
     * @param sortBy Sort By parameter. Sorted in dateCreated order by default. 
     * Check if user with the given username exists. 
     * If yes, check if the userID and the username correspond to the same user. 
     * If true, get list of challenges posted by the user. 
     */
    public getListOfChallengesPostedByUser(userId: string, username: string, limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, username)
                .then(usernameToUserIdDocumentSnapshot => {
                    if (!usernameToUserIdDocumentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    } else {
                        var usernameToUserIdMap: object = usernameToUserIdDocumentSnapshot.data();
                        if (usernameToUserIdMap[Constants.USER_FIELDS.USER_REF]) {
                            var fetchedUserId = usernameToUserIdMap[Constants.USER_FIELDS.USER_REF].id;
                            if (fetchedUserId !== userId) {
                                reject(new Error("You don't have permission to access this resource"));
                            } else {
                                this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userId)
                                    .then(documentSnapshot => {
                                        var listOfChallengesPostedRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_POSTED_REF];
                                        Promise.mapSeries(listOfChallengesPostedRef, (challengeRef) => {
                                            return challengeRef.get();
                                        })
                                            .then(listOfChallenges => {
                                                listOfChallenges = listOfChallenges.map(challengeSnapshot => challengeSnapshot.data());
                                                if (sortBy != undefined) {
                                                    listOfChallenges = listOfChallenges.sort((challenge1, challenge2) => (challenge1[sortBy] > challenge2[sortBy] ? 1 : -1))
                                                }
                                                if (limit != undefined) {
                                                    listOfChallenges = listOfChallenges.slice(0, limit);
                                                }
                                                resolve(listOfChallenges);
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
     * @param userId UserID for the current user. 
     * @param username Username of the challengesTaken requested user. 
     * @param limit Maximum number of challenges taken.
     * @param sortBy Sort by parameter. Sorted by the timePosted in default. 
     * Check if user with the given username exists. 
     * If yes, check if the userID and the username correspond to the same user. 
     * If true, get list of challenges taken along with the response for the user. 
     */
    public getListOfChallengesTakenByUser(userId: string, username: string, limit: number, sortBy: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USERNAME_USERID_COLLECTION_ENDPOINT, username)
                .then(usernameToUserIdDocumentSnapshot => {
                    if (!usernameToUserIdDocumentSnapshot.exists) {
                        reject(new Error("The user with username " + username + " does not exist"));
                    } else {
                        var usernameToUserIdMap: object = usernameToUserIdDocumentSnapshot.data();
                        if (!usernameToUserIdMap[Constants.USER_FIELDS.USER_REF]) {
                            reject(new Error("The user doesn't exist."));
                        } else {
                            var fetchedUserId = usernameToUserIdMap[Constants.USER_FIELDS.USER_REF].id;
                            if (fetchedUserId !== userId) {
                                reject(new Error("You don't have permission to access this resource"));
                            } else {
                                this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(Constants.COLLECTION_ENDPOINTS.USER_COLLECTION_ENDPOINT, userId)
                                    .then(documentSnapshot => {
                                        var listOfChallengesTakenRef = documentSnapshot.data()[Constants.USER_FIELDS.CHALLENGES_TAKEN_REF];
                                        var listOfChallengesTakenKeys = Object.keys(listOfChallengesTakenRef);

                                        Promise.mapSeries(listOfChallengesTakenKeys, (challengeTakenKey) => {
                                            return listOfChallengesTakenRef[challengeTakenKey].get();
                                        })
                                            .then(listOfChallenges => {
                                                listOfChallenges = listOfChallenges.map(challengeSnapshot => challengeSnapshot.data());
                                                if (sortBy != undefined) {
                                                    listOfChallenges = listOfChallenges.sort((challenge1, challenge2) => (challenge1[sortBy] > challenge2[sortBy] ? -1 : 1));
                                                }
                                                if (limit != undefined) {
                                                    listOfChallenges = listOfChallenges.slice(0, limit);
                                                }
                                                resolve(listOfChallenges);
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
     * @param userInfoToUpdate Object that contains the fields to update. 
     * Only the following fields can be updated. 
     *  - name
     *  - dateOfBirth
     *  - emailAddress
     *  - profileImageurl
     */
    private IsFieldsInTheObjectToUpdateValid(objectToUpdate: object): boolean {
        console.log(objectToUpdate);
        if (Object.keys(objectToUpdate).length > Constants.USER_FIELDS.USER_UPDATE_KEYS.length) return false;
        var keysToUpdate: string[] = Object.keys(objectToUpdate).sort((one, two) => (one > two ? -1 : 1));
        console.log(keysToUpdate);
        var count = 0;
        keysToUpdate.forEach(updateKey => {
            if (updateKey !== Constants.USER_FIELDS.USER_UPDATE_KEYS[count]) return false;
            count++;
        })
        return true;
    }
}