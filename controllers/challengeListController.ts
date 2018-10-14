import * as admin from "firebase-admin";
import * as express from "express";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";
import { Challenge } from "./../Models/Challenge";

export class ChallengeListController {

    constructor(challengeModel: Challenge) {
        this.challengeModel = challengeModel;
        this.challengeListController = express.Router();
        this.setupChallengeListController();
    }

    public challengeListController: express.Router;
    private challengeModel: Challenge;

    private setupChallengeListController() {
        /**
         * 1. Get all challenges.
         * 2. Get Challenges from (lat1, long1, lat2, long2)
         * 3. Get Challenges posted by a user. 
         * 4. Get Challenges answered by a user.
         */
        this.challengeListController.get('/', (req, res) => {
            res.type('json');
            this.challengeModel.getListOfChallenges()
                .then(listOfChallenges => {
                    res.status(200).send(listOfChallenges);
                })
                .catch(error => {
                    res.status(400).send(error);
                })
        });

        this.challengeListController.get('/posted/:id', (req, res) => {
            // Get all the challenges posted by the user.
            res.type('json');
            this.challengeModel.getListOfChallengesPostedByUser(req.query.id)
                .then(listOfChallenges => {
                    res.send(200).send(listOfChallenges);
                })
                .catch(error => {
                    res.send(400).send(error);
                })
        });

        this.challengeListController.get('/taken/:id', (req, res) => {
            // Get all the challenges taken by the user. 
            res.type('json');
            this.challengeModel.getListOfChallengesTakenByUser(req.query.id)
                .then(listOfChallenges => {
                    res.status(200).send(listOfChallenges);
                })
                .catch(error => {
                    res.status(400).send(error);
                })
        });

        this.challengeListController.get('/:lat1/:long1/:lat2/:long2', (req, res) => {
            // Get all the challenges from the given latitude and longitude.
            res.type('json');
            res.send({
                "Data": "This endpoint gives all the challenges posted in the given range of latitude and longitude"
            })
        });
    }
}