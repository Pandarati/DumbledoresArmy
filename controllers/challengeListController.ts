import * as admin from "firebase-admin";
import * as express from "express";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";

export class ChallengeListController{

    constructor(database: admin.firestore.Firestore){
        this.firebaseDatabaseHandler = new FirebaseDatabaseHandler(database);
        this.challengeListController = express.Router();
        this.setupChallengeListController();
    }

    public challengeListController: express.Router;
    private firebaseDatabaseHandler: FirebaseDatabaseHandler;
    private static CHALLENGE_REFERENCE_KEY: string = "/Challenges";

    private setupChallengeListController(){
        /**
         * 1. Get all challenges.
         * 2. Get Challenges from (lat1, long1, lat2, long2)
         * 3. Get Challenges posted by a user. 
         * 4. Get Challenges answered by a user.
         */
        this.challengeListController.get('/', (req, res) => {
            // Get all the challenges posted so far. 
            console.log("Making req for list of challenges.");
            res.type('json');
            this.firebaseDatabaseHandler.getListOfRecordsForCollectionAtRef(ChallengeListController.CHALLENGE_REFERENCE_KEY)
            .then(value => {
                console.log(value);
                res.status(200).send(value);
            })
            .catch(error => {
                res.status(400);
            })
        });
        this.challengeListController.get('/:lat1/:long1/:lat2/:long2', (req, res) => {
            // Get all the challenges from the given latitude and longitude.
            res.type('json');
            res.send({
                "Data": "This endpoint gives all the challenges posted in the given range of latitude and longitude"
            })
        });
        this.challengeListController.get('/posted', (req, res) => {
            // Get all the challenges posted by the user.
            res.type('json');
            res.send({
                "Data": "This endpoint all the challenges posted by the current user."
            })
        });
        this.challengeListController.get('/taken', (req, res) => {
            // Get all the challenges taken by the user. 
            res.type('json');
            res.send({
                "Data": "This endpoint gives all the challenges taken by the current user."
            })
        });
    }
}