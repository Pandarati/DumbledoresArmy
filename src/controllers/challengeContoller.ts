import * as express from "express";
import { ChallengeDatabaseHandler } from "./../DatabaseHandlers/ChallengeDatabaseHandler";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import {Challenge} from "./../Models/Challenge";

export class ChallengeController {
    constructor(challengeModel: ChallengeDatabaseHandler) {
        this.challengeController = express.Router();
        this.setupChallengeController();
        this.challengeModel = challengeModel;
    }

    public challengeController: express.Router;
    private challengeModel: ChallengeDatabaseHandler;
    private static COLLECTION_NAME: string = "Challenges";
    private jsonConvert: JsonConvert;

    private setupJsonConverter(): void {
        this.jsonConvert = new JsonConvert();
        this.jsonConvert.operationMode = OperationMode.LOGGING;
        this.jsonConvert.ignorePrimitiveChecks = false;
        this.jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;
    }

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
            var challengeID = req.params.id;

            this.challengeModel.getChallengeWithId(challengeID)
                .then(challengeObject => {
                    res.status(200).send(this.wrapResponse(200, challengeObject));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        });

        this.challengeController.get('/', (req, res) => {
            res.type('json');
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;

            this.challengeModel.getListOfChallenges(limit, sortBy)
                .then(listOfChallenges => {
                    res.status(200).send(this.wrapResponse(200, listOfChallenges));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                });
        })

        this.challengeController.post('/', (req, res) => {
            /**
             * 1. Post the challenge object.
             * 2. Update the user challenges Posted.
             */
            res.type('json');
            var userID = req["id"];
            try{
                var challenge = this.jsonConvert.deserialize(req.body, Challenge);
            }
            catch(e){
                res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(e)));
            }
            this.challengeModel.createNewChallengeAndUpdateUserObject(userID, challenge)
                .then(challengeObject => {
                    res.status(200).send(this.wrapResponse(200, challengeObject));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        });

        this.challengeController.patch('/:id', (req, res) => {
            res.type('json');
            var userID = req["id"];
            var challengeID = req.params.id;

            this.challengeModel.updateChallengeWithId(userID, challengeID, req.body)
                .then(challengeObject => {
                    res.status(200).send(this.wrapResponse(200, challengeObject));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        });

        this.challengeController.delete('/:id', (req, res) => {
            res.type('json');
            var userID = req["id"];
            var challengeID = req.params.id;

            this.challengeModel.deleteAChallenge(userID, challengeID)
                .then(deleteStatus => {
                    res.status(200).send(this.wrapResponse(200, deleteStatus));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        });
    }

    private createErrorJsonResponse(error: any): object {
        return {
            "Error": error.message
        };
    }

    private wrapResponse(status_code: number, res: object): object {
        var status = "";
        if (Math.floor(status_code / 100) === 4 || Math.floor(status_code / 100) === 5) {
            status = "Error"
        } else {
            status = "OK"
        }
        return {
            "status": status,
            "code": status_code,
            "messages": [],
            "result": res
        }
    }
}