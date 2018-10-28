import * as express from "express";
import { TagDatabaseHandler } from "../DatabaseHandlers/TagDatabaseHandler";

/**
 * Working on the Getting Challenges By Tags. 
 * Second Iteration. 
 */
export class TagController {
    constructor(tagDatabaseHandler: TagDatabaseHandler) {
        this.tagController = express.Router();
        this.setupTagController();
    }

    public tagController: express.Router;
    private tagDatabaseHandler: TagDatabaseHandler;
    private static TAG_COLLECTION_NAME = "/tags/";


    private setupTagController() {
        /**
         * 1. Get all challenges with tag <T>. 
         */
        this.tagController.get('/:tag', (req, res) => {
            res.type('json');
            let tag = req.params.tag;
            let limit = req.query.limit;
            let sortBy = req.query.sortBy;

            this.tagDatabaseHandler.getListOfChallengesWithTag(tag)
                .then(listOfChallenges => {
                    res.status(200).send(this.wrapResponse(200, listOfChallenges));
                })
                .catch(error => {
                    res.status(400).send(this.createErrorJsonResponse(error));
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