import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";

export class User {
    constructor(datastore: admin.firestore.Firestore) {
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore)

    }

    private static COLLECTION_ENDPOINT = "/Users"
    private static COLLECTION_ENDPOINT_USERNAME = "/Username_UserID"
    private fireStoreDataHandler: FirebaseDatabaseHandler;

    public getListOfAllUsers_auth(): Promise<[any]> {
        return new Promise<any>(function (resolve, reject) {
            this.fireStoreDataHandler.getListOfRecordsForCollectionAtRef(User.COLLECTION_ENDPOINT)
                .then(querySnapshot => {
                    var listOfUsers = []
                    querySnapshot.forEach(document => {
                        listOfUsers.push(document.data());
                    })
                    resolve(listOfUsers);
                })
                .catch(error => {
                    return new Error("Error getting all list of users from the database.");
                });
        });
    }

    public getUserDetailFromUsername_auth(username: string): Promise<object> {
        return new Promise<object>(function (resolve, reject) {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        reject(new Error("The user with the username does not exist"));
                    } else {
                        var userID = documentSnapshot.data()["userID"];
                        this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID)
                            .then(documentSnapshot => {
                                resolve(documentSnapshot.data());
                            })
                    }
                })
                .catch(error => {
                    reject(Error("Error getting user detail from the database"));
                });
        });
    }

    public createAUser_auth(userInfo: object): Promise<object> {
        var username: string = userInfo["username"];
        return new Promise<object>(function (resolve, reject) {
            this.fireStoreDataHandler.postRecordForCollectionAtRef(User.COLLECTION_ENDPOINT, userInfo)
                .then(postedObject => {
                    var userID = postedObject["id"];
                    var userNameToUserId = {
                        "userID": userID
                    };
                    this.firebaseDatabaseHandler.postRecordForCollectionAtRefWithID(User.COLLECTION_ENDPOINT_USERNAME, userNameToUserId, username)
                        .then(postedObject => {
                            resolve(postedObject);
                        })
                        .catch(error => {
                            reject(new Error("The username already exists."));
                        })
                })
                .catch(error => {
                    return new Error("Error creating a new user");
                })
        });
    }

    public editUserInfo_auth(userInfo: object): Promise<object> {
        return new Promise<object>(function (resolve, reject) {
            var username: string = userInfo["userName"];
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(User.COLLECTION_ENDPOINT_USERNAME, username)
                .then(documentSnapshot => {
                    var userID = documentSnapshot.data()["userID"];
                    this.fireStoreDataHandler.patchRecordForCollectionAtRefAndId(User.COLLECTION_ENDPOINT, userID, userInfo)
                        .then(updatedObject => {
                            resolve(updatedObject);
                        })
                })
                .catch(error => {
                    reject(new Error("Error updating User Info."));
                })
        });
    }
}