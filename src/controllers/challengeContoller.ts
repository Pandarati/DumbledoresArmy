import * as express from "express";
import { ChallengeDatabaseHandler } from "./../DatabaseHandlers/ChallengeDatabaseHandler";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { Challenge } from "./../Models/Challenge";
import { ChallengeResponse } from "../Models/ChallengeResponse";

export class ChallengeController {
    constructor(challengeModel: ChallengeDatabaseHandler) {
        this.challengeController = express.Router();
        this.setupJsonConverter();
        this.setupChallengeController();
        this.challengeModel = challengeModel;
    }

    public challengeController: express.Router;
    private challengeModel: ChallengeDatabaseHandler;
    private static COLLECTION_NAME: string = "Challenges";
    private jsonConvert: JsonConvert;

    /**
     * Using JSON converter for converting JSON requests to User Objects. 
     * Checks for field names and returns error if field name is invalid. 
     */
    private setupJsonConverter(): void {
        this.jsonConvert = new JsonConvert();
        this.jsonConvert.operationMode = OperationMode.LOGGING;
        this.jsonConvert.ignorePrimitiveChecks = false;
        this.jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;
    }

    /**
     * GET /?limit= ?sortBy= => Get list of challenges. 
     * GET /:challengeID => Get a challenge detail.
     * GET /:challengeID/response => Get response for a challenge. 
     * PATCH /:challengeID => Edit a challenge.
     * DELETE /:challengeID => Delete a challenge. 
     * POST / => Create a new challenge.
     * POST /:challengeID/response => Submit response for a challenge. 
     */
    private setupChallengeController() {
        this.challengeController.get('/', (req, res) => {
            res.type('json');
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;

            this.challengeModel.getListOfChallenges(limit, sortBy)
                .then(listOfChallenges => {
                    res.status(200).send(this.wrapResponse(200, listOfChallenges));
                })
                .catch(error => {
                    res.status(404).send(this.wrapResponse(404, this.createErrorJsonResponse(error)));
                });
        })

        this.challengeController.get('/:id', (req, res) => {
            res.type('json');
            var challengeID = req.params.id;

            this.challengeModel.getChallengeWithId(challengeID)
                .then(challengeObject => {
                    res.status(200).send(this.wrapResponse(200, challengeObject));
                })
                .catch(error => {
                    res.status(404).send(this.wrapResponse(404, this.createErrorJsonResponse(error)));
                })
        });

        this.challengeController.post('/', (req, res) => {
            res.type('json');
            var userID = req["id"];

            try {
                var challenge: Challenge = this.jsonConvert.deserialize(req.body, Challenge);
            }
            catch (e) {
                res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(e)));
            }

            this.challengeModel.createNewChallengeAndUpdateUserObject(userID, challenge)
                .then(challengeObject => {
                    res.status(201).send(this.wrapResponse(201, challengeObject));
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

        this.challengeController.get('/:id/response', (req, res) => {
            res.type('json');
            var userID = req["id"];
            var challengeID = req.params.id;

            this.challengeModel.getResponseForChallengeWithId(challengeID, userID)
                .then(challengeResponse => {
                    res.status(200).send(this.wrapResponse(200, challengeResponse));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        })

        this.challengeController.post('/:id/response', (req, res) => {
            res.type('json');
            var userID = req["id"];
            var challengeID = req.params.id;
            var challengeResponse = req.body;

            try {
                var challengeResponse = this.jsonConvert.deserialize(req.body, ChallengeResponse);
            } catch (e) {
                res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(e)));
            }

            this.challengeModel.calculateScoreAndPostUserResponseForChallenge(userID, challengeID, challengeResponse)
                .then(challengeResponseMarked => {
                    res.status(201).send(this.wrapResponse(201, challengeResponseMarked));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        })
    }

    /**
     * 
     * @param error Error message
     * Wrapper method for error response. 
     */
    private createErrorJsonResponse(error: any): object {
        return {
            "Error": error.message
        };
    }

    /**
     * 
     * @param status_code Status code for response
     * @param res Response Object
     * Wrapper method for response. 
     */
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