import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "../DatabaseWrapper/firebaseDatabaseHandler";
import * as Promise from "bluebird";

/**
 * Database handler for Tags. 
 * TODO 
 * Second iteration. 
 */
export class TagDatabaseHandler {
    constructor(dataStore: admin.firestore.Firestore) {
        this.firebaseDataStore = dataStore;
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(dataStore);
    }

    private static TAG_COLLECTION_NAME = "/tags/";
    private fireStoreDataHandler: FirebaseDatabaseHandler;
    private firebaseDataStore: admin.firestore.Firestore;

    public getListOfChallengesWithTag(tag: string): Promise<object[]> {
        return new Promise<object[]>((resolve, reject) => {
            this.fireStoreDataHandler.getDocumentSnapshotForCollectionAtRefAndId(TagDatabaseHandler.TAG_COLLECTION_NAME, tag)
                .then(documentSnapshot => {
                    if (!documentSnapshot.exists) {
                        throw new Error("The tag" + tag + "does not exist");
                    } else {
                        var listOfChallengesForTagRef = documentSnapshot.data();
                        Promise.mapSeries(listOfChallengesForTagRef, (challengeRef) => {
                            return challengeRef.get();
                        })
                            .then(listOfChallenges => {
                                resolve(listOfChallenges);
                            })
                    }
                })
                .catch(error => {
                    reject(error);
                })
        })
    }
}