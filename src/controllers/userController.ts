import * as express from "express";
import { UserDatabaseHandler } from "../DatabaseHandlers/UserDatabaseHandler";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { User } from "./../Models/User";
export class UserController {
    constructor(userModel: UserDatabaseHandler) {
        this.userController = express.Router();
        this.setupUserController();
        this.setupJsonConverter();
        this.userModel = userModel;
    }

    public userController: express.Router;
    private userModel: UserDatabaseHandler;
    private jsonConvert: JsonConvert;
    private static COLLECTION_NAME: string = "/Users";

    private setupJsonConverter(): void {
        this.jsonConvert = new JsonConvert();
        this.jsonConvert.operationMode = OperationMode.LOGGING;
        this.jsonConvert.ignorePrimitiveChecks = false;
        this.jsonConvert.valueCheckingMode = ValueCheckingMode.DISALLOW_NULL;
    }

    private setupUserController() {
        /**
            GET / => Get list of all users. 
            GET /:username => Get detail for a user. 
            GET /:username/challengesPosted => Get challenges posted by a user.
            GET /:username/challengesTaken => Get challenges taken by a user.
            PATCH /:username => Edit user info.
            DELETE /:username => Delete a user.
            POST / => Create a new user.
         */

        this.userController.get('/', (req, res) => {
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;
            this.userModel.getListOfAllUsers_auth(limit, sortBy)
                .then(listOfUsers => {
                    res.status(200).send(this.wrapResponse(200, listOfUsers));
                })
                .catch(error => {
                    res.status(404).send(this.wrapResponse(404, this.createErrorJsonResponse(error)));
                })
        })

        this.userController.get('/:username', (req, res) => {
            const username: string = req.params.username;
            this.userModel.getUserDetailFromUsername_auth(req["id"], username)
                .then(userDetail => {
                    res.status(200).send(this.wrapResponse(200, userDetail));
                })
                .catch(error => {
                    res.status(401).send(this.wrapResponse(401, this.createErrorJsonResponse(error)));
                })
        });

        this.userController.get('/:username/challengesPosted', (req, res) => {
            const userID = req["id"]
            const username: string = req.params.username;
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;

            this.userModel.getListOfChallengesPostedByUser(userID, username, limit, sortBy)
                .then(listOfChallengesPosted => {
                    res.status(200).send(listOfChallengesPosted);
                })
                .catch(error => {
                    res.status(404).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.get('/:username/challengesTaken', (req, res) => {
            const userID = req["id"]
            const username: string = req.params.username;
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;
            
            this.userModel.getListOfChallengesTakenByUser(userID, username, limit, sortBy)
                .then(listOfChallengesTaken => {
                    res.status(200).send(listOfChallengesTaken);
                })
                .catch(error => {
                    res.status(404).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.post('/', (req, res) => {
            try {
                var user: User = this.jsonConvert.deserialize(req.body, User);
            } catch (e) {
                res.status(400).send(this.createErrorJsonResponse(e));
            }
            var userId = req["id"];
            this.userModel.createAUser_auth(user, userId)
                .then(userObject => {
                    res.status(201).send(this.wrapResponse(201, userObject));
                })
                .catch(error => {
                    res.status(400).send(this.wrapResponse(400, this.createErrorJsonResponse(error)));
                })
        });

        this.userController.patch('/:username', (req, res) => {
            // Get request.body and verify all the fields are allowed to be updated. 
            var userInfoToUpdate: object = req.body;
            var username = req.params.username;
            var userID = req["id"];
            this.userModel.editUserInfo_auth(userInfoToUpdate, username, userID)
                .then(userObject => {
                    res.status(200).send(userObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.delete('/:username', (req, res) => {
            const username = req.params.username;
            var userID = req["id"];
            this.userModel.deleteUserWithUsername(userID, username)
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