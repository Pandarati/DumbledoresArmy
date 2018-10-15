import * as express from "express";

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

    this.generalController.get('/api/', (req, res) => {
      res.status(200).send(this.getApiEndpoints());
    })

    this.generalController.get('/api/status', (req, res) => {
      res.status(200).send({
        "status": "OK",
        "code": 200,
      })
    })
  }

  private getApiEndpoints(): object {
    return {
      "Possible routes": {
        "Publicly Accessible": {
          "GET": {
            "/api/challenge/challenge_id": "Get a single challenge with the challenge_id",
            "/api/challengeList": "Get all the challenges posted so far",
            "/api/challenges/latitude_1/longitude_1/latitude_2/longitude_2": "Get all the challenges posted for the location specified"
          },
          "POST": {}
        },
        "User-Authentication-Required": {
          "GET": {
            "/api/challenge/challenge_id": "Get a particular challenge",
            "/api/challengeList/posted": "Get a list of all the challenges posted by a user",
            "/api/challengeList/taken": "Get a list of all the challenges taken by a user"
          },
          "POST": {
            "/api/challenge": "Post a challenge",
          },
          "PATCH": {
            "/api/challenge/challenge_id": "Edit a challenge"
          },
          "DELETE": {
            "/api/challenge/challenge_id": "Delete a challenge"
          }
        }
      }
    }
  }
}

