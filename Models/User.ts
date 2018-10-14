import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";

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
                    var listOfUsers = []
                    querySnapshot.forEach(document => {
                        var userObject = document.data();
                        listOfUsers.push(userObject);
                    })
                    resolve(listOfUsers);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getUserDetailFromUsername_auth(username: string): Promise<object> {
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
                .then(documentSnapshot =>{
                    if (!documentSnapshot){
                        reject(new Error("The user doesn't exist."));
                    }
                    resolve(documentSnapshot.data());
                })
                .catch(error => {
                    reject(Error("Error getting user detail from the database"));
                });
        });
    }

    public createAUser_auth(userID: string, userInfo: object): Promise<object> {
        var usernameToUserIdMap = {
            "userRef": this.firebaseDataStore.doc(User.COLLECTION_ENDPOINT + userID)
        };
        return new Promise<object>((resolve, reject) => {
                // Check if the user exists. 
                this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID)
                .then(documentSnapshot => {
                    if (documentSnapshot.exists){
                        reject(new Error("The user already exists."));
                    }
                })
                .then(_ => {
                    // Check if the username is taken. 
                    return this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, userInfo["username"])
                })
                .then(documentSnapshot => {
                    if (documentSnapshot.exists){
                        reject(new Error("The username is already taken"));
                    }
                    return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(User.COLLECTION_ENDPOINT_USERNAME, usernameToUserIdMap, userInfo["username"])
                .then(postedObject => {
                    return this.fireStoreDataHandler.postRecordForCollectionAtRefWithID(User.COLLECTION_ENDPOINT, userInfo, userID)
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

    public editUserInfo_auth(username: string, userInfo: object): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists){
                        reject(new Error("The user with the username " + username + " does not exist."));
                    }
                    var usernameToUserIdMap = documentSnapshot.data();
                    if (usernameToUserIdMap.userRef) {
                        return usernameToUserIdMap.userRef.id;
                    }
                })
                .then(userID => {
                    return this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID, userInfo)
                })
                .then(updatedObject => {
                    resolve(userInfo);
                })
                .catch(error => {
                    reject(new Error("Error updating User Info."));
                })
        });
    }

    public deleteUserWithUsername(username: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot){
                        reject(new Error("The user with username " + username + "does not exist"));
                    }
                    var usernameToUserIdMap = documentSnapshot.data();
                    if (usernameToUserIdMap.userRef) {
                        return usernameToUserIdMap.userRef.id;
                    }
                })
                .then(userID => {
                    return this.fireStoreDataHandler.deleteRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID);
                })
                .then(isDeleted => {
                    if (!isDeleted){
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
}