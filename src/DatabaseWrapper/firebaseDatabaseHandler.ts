import * as admin from "firebase-admin"
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";

export class FirebaseDatabaseHandler{

    constructor(database: admin.firestore.Firestore){
        this.firebaseDatastore = database;
    }

    private firebaseDatastore: admin.firestore.Firestore;

    public getDocumentSnapshotForCollectionAtRefAndId(collectionName: string, id: string): Promise<DocumentSnapshot>{
        /**
         * Returns DocumentSnapshot for the requested data. 
         * Add id to the data you get.
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<DocumentSnapshot>(function(resolve, reject){
            collectionReference.doc(id).get()
            .then(snapshot => {
                if (snapshot.exists){
                    resolve(snapshot);
                }else{
                    reject(new Error("Document does not exist"));
                }
            })
            .catch(error => {
                reject(error);
            })
        });
    }

    public patchRecordForCollectionAtRefAndId(collectionName: string, id: string, objectToUpdate: object): Promise<object>{
        /**
         * Patch data for collection with id. 
         * Returns the same object is successful. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function(resolve, reject){
            collectionReference.doc(id).set(objectToUpdate)
            .then(result => {
                return objectToUpdate;
            })
            .catch(error => {
                return new Error("Error Patching record in the database for collection" + collectionName + ": " + error);
            })
        });
    }

    public postRecordForCollectionAtRef(collectionName: string, objectToPost: object): Promise<object>{
        /**
         * Post data for a given collection.
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function(resolve, reject){
            collectionReference.doc().set(objectToPost)
            .then(result => {
                objectToPost["id"] = collectionReference.id;
                objectToPost["timePosted"] = result.writeTime;
                return objectToPost;
            })
            .catch(error => {
                return new Error("Error writing to the database for collection " + collectionName + ": " + error);
            })
        });
    } 

    public postRecordForCollectionAtRefWithID(collectionName: string, objectToPost: object, id: string): Promise<object>{
        /**
         * Post data with the objectId for a given collection.
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function(resolve, reject){
            collectionReference.doc(id).set(objectToPost)
            .then(result => {
                objectToPost["id"] = collectionReference.id;
                objectToPost["timePosted"] = result.writeTime;
                return objectToPost;
            })
            .catch(error => {
                return new Error("Error writing to the database for collection " + collectionName + ": " + error);
            })
        });
    } 

    public deleteRecordForCollectionAtRefAndId(collectionName: string, id: string): Promise<boolean>{
        /**
         * Delete record with id in collection.
         * Returns boolean true if delete complete. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<boolean>(function(resolve, reject){
            collectionReference.doc(id).delete()
            .then(writeResult => {
                return true;
            })
            .catch(error => {
                return new Error("Error deleting record with id " + id + " for collection " + collectionName + ": " + error);
            })
        })
    }

    public getListOfRecordsForCollectionAtRef(collectionName: string): Promise<QuerySnapshot>{
        /**
         * Returns QuerySnapshot for a listOfTheRecords. 
         */
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return collectionReference.get();
    }
}