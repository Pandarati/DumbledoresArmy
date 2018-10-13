import * as admin from "firebase-admin";
import * as express from "express";
import { FirebaseDatabaseHandler } from "./../src/DatabaseWrapper/firebaseDatabaseHandler";

export class UserController{

    constructor(database: admin.firestore.Firestore){
        this.userController = express.Router();
        this.initializeFireStoreForUser();
        this.setupChallengeController();
        this.firebaseDatabaseHandler = new FirebaseDatabaseHandler(database);
    }

    public userController: express.Router;
    private firebaseDatabaseHandler: FirebaseDatabaseHandler;
    private static COLLECTION_NAME: string = "/Users";

    private initializeFireStoreForUser(){

    }

    private setupChallengeController(){
        /**
         * 1. Get User details. 
         * 2. Create a new user. 
         * 3. Edit user info. 
         * 4. Get list of all users.
         */

        this.userController.get('/', (req, res) => {
            this.firebaseDatabaseHandler.getListOfRecordsForCollectionAtRef(UserController.COLLECTION_NAME)
            .then(value => {
                res.status(200).send(value);
            })
            .catch(error => {
                res.status(404).send(error);
            })
        })

         this.userController.get('/:username', (req, res) =>{
            const username: string = req.params.username;
            // Get the userId from the username. 
            this.firebaseDatabaseHandler.getRecordForCollectionAtRefAndId(UserController.COLLECTION_NAME, username);
         });

         this.userController.post('/', (req, res) => {

         });

         this.userController.patch('/:username', (req, res) => {

         });
    }
}