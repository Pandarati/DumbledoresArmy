import * as admin from "firebase-admin";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";

export class Challenge{
    constructor(datastore: admin.firestore.Firestore){
        this.fireStoreDataHandler = new FirebaseDatabaseHandler(datastore);
    }

    private static COLLECTION_ENDPOINT = "/Challenges"
    private fireStoreDataHandler: FirebaseDatabaseHandler;

    public getChallengeWithId(id: string): Promise<object>{
        return new Promise<object>(function(resolve, reject){
            this.fireStoreDataHandler.
        });
    }

    public updateChallengeWithId(id: string, challenge: object): Promise<object>{
        return new Promise<object>(function(resolve, reject){

        });
    }   

    public createNewChallenge(id: string, challenge: object): Promise<object>{
        return new Promise<object>(function(resolve, reject){

        });
    } 

    public deleteNewChallenge(id: string): Promise<boolean>{
        return new Promise<boolean>(function(resolve, reject){

        });
    }

    public getListOfChallenges(): Promise<any>{
        return new Promise<any>(function(resolve, reject){

        });
    }

    public getListOfChallengesPostedByUser(id: string): Promise<any>{
        return new Promise<any>(function(resolve, reject){

        });
    }

    public getListOfChallengesTakenByUser(id: string): Promise<any>{
        return new Promise<any>(function(resolve, reject){

        });
    }
    /**
     * 1. Get a challenge. 
     * 2. Update a challenge. 
     * 3. POST a challenge. 
     * 4. Delete a challenge. 
     * 
     * Internal: 
     * 1. Check if challenge belongs to the user. 
     * 2. Add challenge to challenge list of the user. 
     * 3. 
     */

     /**
     * 1. Get all the challeges. 
     * 2. Get all the challenges posted by a user.
     * 3. Get all the challenges taken by a user. 
     */
}