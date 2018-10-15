import * as express from "express";
import { User } from "./../Models/User";

export class UserController {
    constructor(userModel: User) {
        this.userController = express.Router();
        this.setupUserController();
        this.userModel = userModel;
    }

    public userController: express.Router;
    private userModel: User;
    private static COLLECTION_NAME: string = "/Users";

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
            this.userModel.getListOfAllUsers_auth()
                .then(listOfUsers => {
                    res.status(200).send(listOfUsers);
                })
                .catch(error => {
                    res.status(404).send(this.createErrorJsonResponse(error));
                })
        })

        this.userController.get('/:username', (req, res) => {
            const username: string = req.params.username;
            this.userModel.getUserDetailFromUsername_auth(req["id"], username)
                .then(userDetail => {
                    res.status(200).send(userDetail);
                })
                .catch(error => {
                    res.status(401).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.get('/:username/challengesPosted', (req, res) => {
            this.userModel.getListOfChallengesPostedByUser(req.params.username)
                .then(listOfChallengesPosted => {
                    res.status(200).send(listOfChallengesPosted);
                })
                .catch(error => {
                    res.status(404).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.get('/:username/challengesTaken', (req, res) => {
            this.userModel.getListOfChallengesTakenByUser(req.params.username)
                .then(listOfChallengesTaken => {
                    res.status(200).send(listOfChallengesTaken);
                })
                .catch(error => {
                    res.status(404).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.post('/', (req, res) => {
            var id: string = req["id"];
            console.log(id);
            this.userModel.createAUser_auth(req["id"], req.body)
                .then(userObject => {
                    res.status(200).send(userObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.patch('/:username', (req, res) => {
            this.userModel.editUserInfo_auth(req["id"], req.params.username, req.body)
                .then(userObject => {
                    res.status(200).send(userObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.delete('/:username', (req, res) => {
            const username = req.params.username;
            this.userModel.deleteUserWithUsername(req["id"], username)
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