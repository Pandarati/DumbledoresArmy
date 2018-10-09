import * as express from "express";
import * as bodyParser from "body-parser";
import { Request, Response } from "express";
import * as path from "path";
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'

class App {
  constructor() {
    this.app = express();
    this.getServiceAccountCredentials();
    this.initializeAuthenticationWithFirebase();
    this.initializeAuthMiddleware();
    this.config();
    this.routes();
    
    // For testing the JWT token mechanism. 
    this.createUserAndGetId();
  }

  private serviceAccount: object;
  public app: express.Application;
  public firebaseAdmin: admin.app.App;

  private initializeAuthMiddleware():void{
    var self = this;
    const authMiddleware = function(req, res, next){
      if (req.originalUrl === '/' || req.originalUrl === '/api' || req.originalUrl === '/challenge/:id'){
        next();
      }else{
        var accessToken = req.headers['authorization'] || '';
        self.firebaseAdmin.auth().verifyIdToken(accessToken)
        .then(function(decodedToken){
          req.uid  = decodedToken.uid;
          next();
      })
      .catch(function(error){
          res.sendStatus(404);
      });
    };
    this.app.use(authMiddleware);
    } 
  }

  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private getServiceAccountCredentials(){
    this.serviceAccount = require(path.join(__dirname, './../secrets/serviceAccountKey.json'));
  }

  private initializeAuthenticationWithFirebase():void{
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
      databaseURL: 'https://geo-quiz-239d5.firebaseio.com'
    });
  }

  private routes(): void {
    this.app.use('/api/challenge', require(path.join(__dirname, './../controllers/challengeContoller.ts')));
    this.app.use('/api/challengeList', require(path.join(__dirname, './../controllers/challengeListController.ts')));
    
    const router = express.Router();
    router.get('/', (req, res) => {
      console.log(req);
      res.status(200).sendFile(path.join(__dirname, './../views/index.html'));
    });

    // Endpoint with all the API-endpoints.
    router.get('/api', function(req, res){
      res.type('json');
      res.send({
        "Possible routes": {
          "Publicly Accessible": {
            "GET": {
              "/api/challenge/challenge_id": "Get a single challenge with the challenge_id",
              "/api/challengeList": "Get all the challenges posted so far",
              "/api/challenges/latitude_1/longitude_1/latitude_2/longitude_2": "Get all the challenges posted for the location specified"
            },
            "POST": {}
          },
          "User-Authentication-Required":{
            "GET":{
              "/api/challenge/challenge_id": "Get a particular challenge",
              "/api/challengeList/posted": "Get a list of all the challenges posted by a user",
              "/api/challengeList/taken": "Get a list of all the challenges taken by a user"
            }, 
            "POST": {
              "/api/challenge": "Post a challenge",
            },
            "PATCH":{
              "/api/challenge/challenge_id": "Edit a challenge"
            },
            "DELETE":{
              "/api/challenge/challenge_id": "Delete a challenge"
            }
          }
        }
      });
    })
    console.log(path.join(__dirname, './../controllers/challengeContoller.ts'));
    this.app.use('/', router)
  }


  // Testing purposes only. 
  private createUserAndGetId():void{

    firebase.initializeApp({
      apiKey: "AIzaSyDbO2kBol-cwsFn9xnlWTLoieFdTFE_sG0",
      authDomain: "geo-quiz-239d5.firebaseapp.com",
      databaseURL: "https://geo-quiz-239d5.firebaseio.com",
      projectId: "geo-quiz-239d5",
      storageBucket: "geo-quiz-239d5.appspot.com",
      messagingSenderId: "318947333544"
    });
    firebase.auth().signInWithEmailAndPassword("aayush.gupta@example.com", "secretPassword")
      .then((userCred) => {
        var user = userCred.user;
        user.getIdToken(true)
        .then((idToken) => {
          console.log("Id token", idToken);
        })
        .catch((error) => {
          console.log("Error ", error);
        });
      }).
      catch((error) => {
        console.log("Error", error);
      });
    }

}

export default new App().app;