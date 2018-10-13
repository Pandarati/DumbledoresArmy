import * as admin from "firebase-admin";
import * as express from "express";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";
import {Challenge} from "./../Models/Challenge";

export class ChallengeController{
    constructor(challengeModel: Challenge){
        this.challengeController = express.Router();
        this.setupChallengeController();
        this.challengeModel = challengeModel;
    }

    public challengeController: express.Router;
    private challengeModel: Challenge;
    private static COLLECTION_NAME: string = "Challenges";

    private setupChallengeController(){
        /**
         * 1. Get Challenge with id. 
         * 2. Post a new Challenge. 
         * 3. Edit a new Challenge. 
         * 4. Delete a Challenge.
         */

        this.challengeController.get('/:id', (req, res) => {
            // Get challenge with id. 
            // Get the user id from req,
            // Check if the user has this challenge in the list of challenges posted.
            // If not, return unauthorized access. 
            // If true, get the challenge from the challengeCollection. 
            res.type('json');
            this.challengeModel.
            // this.firebaseDatabaseHandler.getRecordForCollectionAtRefAndId(ChallengeController.COLLECTION_NAME, req.query.id);
        });

        this.challengeController.post('/', (req, res) => {
            // Post a challenge for that user.
            // Add the userID field to the Challenge. 
            // After you get the challenge back, append it
            // the Challenges Posted by the user. 
            res.type('json');
            res.send({
                "Data": "This endpoint is used to post a challenge for the user"
            })
        });

        this.challengeController.patch('/:id', (req, res) => {
            // Get challenge with id. 
            // Get the user id from req,
            // Check if the user has this challenge in the list of challenges posted.
            // If not, return unauthorized access. 
            // If true, get the challenge object from the req. 
            // Check for fields that are immutable to be the same. 
            // Update the challenge object. 
            res.type('json');
            res.send({
                "Data": "This endpoint is used to update a challenge."
            })
        });

        this.challengeController.delete('/:id', (req, res) => {
            // Get challenge with id. 
            // Get the user id from req,
            // Check if the user has this challenge in the list of challenges posted.
            // If not, return unauthorized access. 
            // If true, delete the object and return 200 OK status. 
            res.type('json');
            res.send({
                "Data": "This endpoint is used to delete a challenge with the given challenge_id"
            })
        });
    }
}