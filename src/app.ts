import * as express from "express";
import * as cors from 'cors';
import * as bodyParser from "body-parser";
import * as path from "path";
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import { ChallengeController } from "./controllers/challengeContoller";
import { GeneralController } from "./controllers/generalContoller";
import { UserController } from "./controllers/userController";
import { UserDatabaseHandler } from "./DatabaseHandlers/UserDatabaseHandler";
import { ChallengeDatabaseHandler } from "./DatabaseHandlers/ChallengeDatabaseHandler";
import { stat } from "fs";
import { runInNewContext } from "vm";

class App {
  constructor() {
    this.app = express();
    this.getServiceAccountCredentials();
    this.initializeAuthenticationWithFirebase();
    this.initializeFirebaseDataStore();
    this.initializeAuthMiddleware();
    this.setupCors();
    this.config();
    this.routes();
    // For testing the JWT token mechanism. 
    this.createUserAndGetId();
  }

  private serviceAccount: object;
  public app: express.Application;
  public firebaseAdmin: admin.app.App;
  private firebaseDatabase: admin.firestore.Firestore;

  private getServiceAccountCredentials() {
    this.serviceAccount = require(path.join(__dirname, './secrets/serviceAccountKey.json'));
  }

  private initializeAuthenticationWithFirebase(): void {
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
      databaseURL: 'https://geoquiz-1e874.firebaseio.com'
    });
  }

  private initializeFirebaseDataStore(): void {
    this.firebaseDatabase = admin.firestore();
  }

  private initializeAuthMiddleware(): void {
    const authMiddleware = (req, res, next) => {
      console.log("Here");
      if ((req.originalUrl === '/api' && req.method === "GET") ||
        (req.originalUrl === '/api/challenges' && req.method === "GET") ||
        (req.originalUrl === '/api/challenge/:id' && req.method === "GET")) {
        return next();
      }

      var accessToken: any;
      if (req.headers.authorization && req.headers.authorization.split(' '[0] === 'Bearer')) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        accessToken = ' ';
      }

      this.firebaseAdmin.auth().verifyIdToken(accessToken)
        .then(function (decodedToken) {
          console.log(decodedToken.id);
          req.id = decodedToken.uid;
          next();
        })
        .catch(function (error) {
          console.log(error);
          res.sendStatus(404);
        });
    }
    this.app.use(authMiddleware);
  }

  private setupCors(): void {
    this.app.use(cors());
  }

  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.use('/api/users', new UserController(new UserDatabaseHandler(this.firebaseDatabase)).userController);
    this.app.use('/api/challenges', new ChallengeController(new ChallengeDatabaseHandler(this.firebaseDatabase)).challengeController);
    this.app.use('/', new GeneralController().generalController);
  }

  private setupResponseMiddleware(): void {
    const responseMiddleware = (req, res, next) => {
      console.log("Here I am");
      var status = "";
      if (String(res.status).substring(0, 1) === "4" || String(res.status).substring(0, 1) === "5") {
        status = "Error"
      } else {
        status = "OK"
      }
      console.log(status);
      res = {
        "status": status,
        "code": res.status,
        "messages": [],
        "result": res.body
      }
      next();
    }
    this.app.use(responseMiddleware);
  }


  // Testing purposes only. 
  private createUserAndGetId(): void {

    firebase.initializeApp({
      apiKey: "AIzaSyCjAcWtMLdUUn1qHnIgG7Z5i_LyQh9FXn0",
      authDomain: "geoquiz-1e874.firebaseapp.com",
      databaseURL: "https://geoquiz-1e874.firebaseio.com",
      projectId: "geoquiz-1e874",
      storageBucket: "geoquiz-1e874.appspot.com",
      messagingSenderId: "804254899672"
    });
    firebase.auth().signInWithEmailAndPassword("b@google.com", "Howard")
      .then((userCred) => {
        var user = userCred.user;
        user.getIdToken(true)
          .then((idToken) => {
            console.log("Id token", idToken);
          })
      }).
      catch((error) => {
        console.log("Error", error);
      });
  }
}

export default new App().app;