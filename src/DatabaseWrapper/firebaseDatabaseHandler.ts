import * as admin from "firebase-admin"
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";

export class FirebaseDatabaseHandler {

    constructor(database: admin.firestore.Firestore) {
        this.firebaseDatastore = database;
    }

    private firebaseDatastore: admin.firestore.Firestore;

    public getDocumentSnapshotForCollectionAtRefAndId(collectionName: string, id: string): Promise<DocumentSnapshot> {
        /**
         * Returns DocumentSnapshot for the requested data. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return collectionReference.doc(id).get();
    }

    public patchRecordForCollectionAtRefAndId(collectionName: string, id: string, objectToUpdate: object): Promise<object> {
        /**
         * Patch data for collection with id. 
         * Returns the same object is successful. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function (resolve, reject) {
            collectionReference.doc(id).update(objectToUpdate)
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public postRecordForCollectionAtRef(collectionName: string, objectToPost: object): Promise<object> {
        /**
         * Post data for a given collection.
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function (resolve, reject) {
            var documentReference = collectionReference.doc();
            objectToPost["id"] = documentReference.id;
            documentReference.set(objectToPost)
                .then(result => {
                    resolve(objectToPost);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public postRecordForCollectionAtRefWithID(collectionName: string, objectToPost: object, id: string): Promise<object> {
        /**
         * Post data with the objectId for a given collection.
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function (resolve, reject) {
            collectionReference.doc(id).set(objectToPost)
                .then(result => {
                    resolve(objectToPost);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    public deleteRecordForCollectionAtRefAndId(collectionName: string, id: string): Promise<boolean> {
        /**
         * Delete record with id in collection.
         * Returns boolean true if delete complete. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<boolean>((resolve, reject) => {
            collectionReference.doc(id).delete()
                .then(writeResult => {
                    resolve(true);
                })
                .catch(error => {
                    reject(error);
                })
        })
    }

    public getListOfRecordsForCollectionAtRef(collectionName: string, limit: number, sortBy: string): Promise<QuerySnapshot> {
        /**
         * Returns QuerySnapshot for a listOfTheRecords. 
         */
        if (sortBy != undefined && limit != undefined){
            return this.firebaseDatastore.collection(collectionName).orderBy(sortBy).limit(Number(limit)).get();
        }else if (sortBy != undefined){
            return this.firebaseDatastore.collection(collectionName).orderBy(sortBy).get();
        }else if (limit != undefined){
            return this.firebaseDatastore.collection(collectionName).limit(Number(limit)).get();
        }
        return this.firebaseDatastore.collection(collectionName).get();
    }
}