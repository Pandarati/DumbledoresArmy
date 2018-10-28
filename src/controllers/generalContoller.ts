import * as express from "express";

/**
 * Controller for status endpoint. 
 */
export class GeneralController {

  constructor() {
    this.generalController = express.Router();
    this.setupGeneralController();
  }

  public generalController: express.Router;

  private setupGeneralController() {
    this.generalController.get('/', (req, res) => {
      res.redirect('/api/status');
    });

    this.generalController.get('/api', (req, res) => {
      res.status(200).send(this.getApiEndpoints());
    })

    this.generalController.get('/api/status', (req, res) => {
      res.status(200).send(this.wrapResponse(200, {
        "status": "OK",
        "code": 200,
      }));
    })
  }

  private getApiEndpoints(): object {
    return {
      "Possible routes": {
        "Publicly Accessible": {
          "GET": {
            "/api/status": "Get the status of the API service",
            "/api/challenges/:challenge_id": "Get a challenge with the challenge_id",
            "/api/challenges?limit=X&?sortBy=Y": "Get all the challenges posted so far ",
          },
          "POST": {}
        },
        "JWT Token Required": {
          "GET": {
            "/api/users?limit=X&?sortBy=Y": "Get List of users",
            "/api/:username": "Get detail for a user",
            "/api/:username/challengesPosted?limit=X&?sortBy=Y": "Get list of challenges posted by a user",
            "/api/:username/challengesTaken?limit=X&?sortBy=Y": "Get list of challenges taken by a user",
            "/api/challenges/:challengeId/response": "Get reposne for a challenge"
          },
          "POST": {
            "/api/users": "Create a new user",
            "/api/challenges": "Create a new challenge",
            "/api/challenges/:challengeID/response": "Submit respone for a challenge"
          },
          "PATCH": {
            "/api/challenges/:challenge_id": "Edit a challenge",
            "/api/users/:username": "Edit a user detail"
          },
          "DELETE": {
            "/api/challenges/:challenge_id": "Delete a challenge",
            "/api/users/:username": "Delete a challenge."
          }
        }
      }
    }
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

