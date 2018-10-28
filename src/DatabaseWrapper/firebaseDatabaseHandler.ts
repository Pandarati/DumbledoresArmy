import * as admin from "firebase-admin"
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";

/**
 * Class to handle interactions with the Firebase Database. 
 */
export class FirebaseDatabaseHandler {

    constructor(datastore: admin.firestore.Firestore) {
        this.firebaseDatastore = datastore;
    }

    private firebaseDatastore: admin.firestore.Firestore;

    /**
     * 
     * @param collectionName Collection Name 
     * @param id Document ID
     * GET documentSnapshot for documentID in the collectionName.
     */
    public getDocumentSnapshotForCollectionAtRefAndId(collectionName: string, id: string): Promise<DocumentSnapshot> {
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return collectionReference.doc(id).get();
    }

    /**
     * 
     * @param collectionName Collection Name
     * @param id Document ID
     * @param objectToUpdate Object that includes the fields to update. 
     * PATCH document with the fields in the objectToUpdate. 
     */
    public patchRecordForCollectionAtRefAndId(collectionName: string, id: string, objectToUpdate: object): Promise<object> {
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return collectionReference.doc(id).update(objectToUpdate);
    }

    /**
     * 
     * @param collectionName Collection Name
     * @param objectToPost Object to post.
     * POST new document objectToPost in the collectionName given, automatically assigns the new Id. 
     */
    public postRecordForCollectionAtRef(collectionName: string, objectToPost: object): Promise<object> {
        var collectionReference = this.firebaseDatastore.collection(collectionName);
        return new Promise<object>(function (resolve, reject) {
            var documentReference = collectionReference.doc();
            objectToPost["id"] = documentReference.id;
            documentReference.set(objectToPost)
                .then(_ => {
                    resolve(objectToPost);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param collectionName CollectionName
     * @param objectToPost Object to post.
     * @param id Object to post. 
     * POST new document objectToPost in the collectionName given, with the id provided. 
     */
    public postRecordForCollectionAtRefWithID(collectionName: string, objectToPost: object, id: string): Promise<object> {
        var collectionReference = this.firebaseDatastore.collection(collectionName);

        return new Promise<object>(function (resolve, reject) {
            collectionReference.doc(id).set(objectToPost)
                .then(_ => {
                    resolve(objectToPost);
                })
                .catch(error => {
                    reject(error);
                })
        });
    }

    /**
     * 
     * @param collectionName Collection Name
     * @param id Document ID
     * Delete a document with the document ID in the collection name. 
     */
    public deleteRecordForCollectionAtRefAndId(collectionName: string, id: string): Promise<boolean> {
        var collectionReference = this.firebaseDatastore.collection(collectionName);

        return new Promise<boolean>((resolve, reject) => {
            collectionReference.doc(id).delete()
                .then(_ => {
                    resolve(true);
                })
                .catch(error => {
                    reject(error);
                })
        })
    }

    /**
     * 
     * @param collectionName Collection Name
     * @param limit Number of documents
     * @param sortBy Sort parameter
     * Get list of documents in a collection. Option to limit the number of documents 
     * Sort parameter to sort the records. 
     */
    public getListOfRecordsForCollectionAtRef(collectionName: string, limit: number, sortBy: string): Promise<QuerySnapshot> {
        if (sortBy != undefined && limit != undefined) {
            return this.firebaseDatastore.collection(collectionName).orderBy(sortBy).limit(Number(limit)).get();
        } else if (sortBy != undefined) {
            return this.firebaseDatastore.collection(collectionName).orderBy(sortBy).get();
        } else if (limit != undefined) {
            return this.firebaseDatastore.collection(collectionName).limit(Number(limit)).get();
        }
        return this.firebaseDatastore.collection(collectionName).get();
    }
}