import * as express from "express";
import { Challenge } from "./../Models/Challenge";

export class ChallengeController {
    constructor(challengeModel: Challenge) {
        this.challengeController = express.Router();
        this.setupChallengeController();
        this.challengeModel = challengeModel;
    }

    public challengeController: express.Router;
    private challengeModel: Challenge;
    private static COLLECTION_NAME: string = "Challenges";

    private setupChallengeController() {
        /**
         * GET / => Get list of all challenges. 
            GET /:challengeID => Get a challenge.
            PATCH /:challengeID => Edit a challenge.
            DELETE /:challengeID => Delete a challenge.
            POST / => create a new challenge.
            POST/:challengeID => Submit response for a challenge.
         */

        this.challengeController.get('/:id', (req, res) => {
            res.type('json');
            console.log(req.params.id);
            this.challengeModel.getChallengeWithId(req.params.id)
                .then(challengeObject => {
                    res.status(200).send(challengeObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.challengeController.get('/', (req, res) => {
            res.type('json');
            this.challengeModel.getListOfChallenges()
                .then(listOfChallenges => {
                    res.status(200).send(listOfChallenges);
                })
                .catch(error => {
                    res.status(400).send(error);
                });
        })

        this.challengeController.post('/', (req, res) => {
            res.type('json');
            this.challengeModel.createNewChallenge(req["id"], req.body)
                .then(challengeObject => {
                    res.status(200).send(challengeObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.challengeController.post('/:id', (req, res) => {

        });

        this.challengeController.patch('/:id', (req, res) => {
            res.type('json');
            this.challengeModel.updateChallengeWithId(req.query.id, req.body)
                .then(challengeObject => {
                    res.status(200).send(challengeObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.challengeController.delete('/:id', (req, res) => {
            res.type('json');
            console.log(req.params.id);
            this.challengeModel.deleteNewChallenge(req.params.id)
                .then(isDeleted => {
                    res.status(200).send(isDeleted);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });
    }

    private createErrorJsonResponse(error: any): object {
        return {
            "Error": error.message
        };
    }
}