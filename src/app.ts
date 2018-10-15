import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import { ChallengeController } from "./controllers/challengeContoller";
import { GeneralController } from "./controllers/generalContoller";
import { UserController } from "./controllers/userController";
import { User } from "./Models/User";
import { Challenge } from "./Models/Challenge";

class App {
  constructor() {
    this.app = express();
    this.getServiceAccountCredentials();
    this.initializeAuthenticationWithFirebase();
    this.initializeFirebaseDataStore();
    this.initializeAuthMiddleware();
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
      var accessToken = req.headers['authorization'] || '';
      this.firebaseAdmin.auth().verifyIdToken(accessToken)
        .then(function (decodedToken) {
          console.log(decodedToken.id);
          req.id = decodedToken.uid;
          next();
        })
        .catch(function (error) {
          res.sendStatus(404);
        });
    }
    this.app.use(authMiddleware);
  }

  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.use('/api/users', new UserController(new User(this.firebaseDatabase)).userController);
    this.app.use('/api/challenges', new ChallengeController(new Challenge(this.firebaseDatabase)).challengeController);
    this.app.use('/', new GeneralController().generalController);
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
    firebase.auth().signInWithEmailAndPassword("aayush.gupta@bison.howard.edu", "aayush")
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