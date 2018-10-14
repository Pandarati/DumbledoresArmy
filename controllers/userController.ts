import * as express from "express";
import { User } from "./../Models/User";

export class UserController {

    constructor(userModel: User) {
        this.userController = express.Router();
        this.setupChallengeController();
        this.userModel = userModel;
    }

    public userController: express.Router;
    private userModel: User;
    private static COLLECTION_NAME: string = "/Users";

    private setupChallengeController() {
        /**
         * 1. Get User details. 
         * 2. Create a new user. 
         * 3. Edit user info. 
         * 4. Get list of all users.
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
            this.userModel.getUserDetailFromUsername_auth(username)
                .then(userDetail => {
                    res.status(200).send(userDetail);
                })
                .catch(error => {
                    res.status(401).send(this.createErrorJsonResponse(error));
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
            this.userModel.editUserInfo_auth(req.params.username, req.body)
                .then(userObject => {
                    res.status(200).send(userObject);
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
                })
        });

        this.userController.delete('/:username', (req, res) => {
            const username = req.params.username; 
            this.userModel.deleteUserWithUsername(username)
            .then(isDeleted => {
                res.status(200).send(isDeleted);
            })
            .catch(error => {
                res.status(400).send(this.createErrorJsonResponse(error));
            })
        });
    }

    private createErrorJsonResponse(error: any): object{
        return {
            "Error": error.message
        };
    }
}