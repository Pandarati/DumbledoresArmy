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

/**
 * Entry point for the API Service. 
 */
class App {
  constructor() {
    this.app = express();
    this.getServiceAccountCredentials();
    this.initializeAuthenticationWithFirebase();
    this.initializeFirebaseDataStore();
    this.setupCors();
    this.initializeAuthMiddleware();
    this.config();
    this.routes();
    // For testing the JWT token mechanism. 
    // this.createUserAndGetId();
  }

  private serviceAccount: object;
  public app: express.Application;
  public firebaseAdmin: admin.app.App;
  private firebaseDatabase: admin.firestore.Firestore;
  private static AUTH_ENDPONTS: String[] = []

  /**
   * Method to get Firebase Service Credentials. 
   */
  private getServiceAccountCredentials() {
    this.serviceAccount = require(path.join(__dirname, './secrets/serviceAccountKey.json'));
  }

  /**
   * Method to Initialize Authentication with Firebase. 
   */
  private initializeAuthenticationWithFirebase(): void {
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
      databaseURL: 'https://geoquiz-1e874.firebaseio.com'
    });
  }

  /**
   * Method to intialize Firebase Firestore. 
   */
  private initializeFirebaseDataStore(): void {
    this.firebaseDatabase = admin.firestore();
  }

  /**
   * Method to initialize authentication middleware. 
   * Setup endpoints that don't require JWT authentication. 
   */
  private initializeAuthMiddleware(): void {
    const authMiddleware = (req, res, next) => {
      if ((req.originalUrl === '/api' && req.method === "GET") ||
        (req.originalUrl === '/api/challenges' && req.method === "GET") ||
        (req.originalUrl === '/api/challenges/:id' && req.method === "GET")) {
        return next();
      }
      var accessToken: string;
      if (req.headers.authorization && req.headers.authorization.split(' '[0] === 'Bearer')) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        accessToken = ' ';
      }
      this.firebaseAdmin.auth().verifyIdToken(accessToken)
        .then(function (decodedToken) {
          req.id = decodedToken.uid;
          next();
        })
        .catch(function (error) {
          res.status(401).send(error);
        });
    }
    this.app.use(authMiddleware);
  }

  /**
   * Method to Setup CORS https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
   */
  private setupCors(): void {
    var whitelist = [
      'http://localhost:4200',
    ];
    var corsOptions = {
      origin: function (origin, callback) {
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
      },
      credentials: true
    };
    this.app.use(cors());
  }

  /**
   * Method to setup JSON Body Parser. 
   */
  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  /**
   * Main method to setup controllers to API Endpoints. 
   */
  private routes(): void {
    this.app.use('/api/users', new UserController(new UserDatabaseHandler(this.firebaseDatabase)).userController);
    this.app.use('/api/challenges', new ChallengeController(new ChallengeDatabaseHandler(this.firebaseDatabase)).challengeController);
    this.app.use('/', new GeneralController().generalController);
  }

  // Testing purposes only. 
  // private createUserAndGetId(): void {
  //   firebase.initializeApp({
  //     apiKey: "AIzaSyCjAcWtMLdUUn1qHnIgG7Z5i_LyQh9FXn0",
  //     authDomain: "geoquiz-1e874.firebaseapp.com",
  //     databaseURL: "https://geoquiz-1e874.firebaseio.com",
  //     projectId: "geoquiz-1e874",
  //     storageBucket: "geoquiz-1e874.appspot.com",
  //     messagingSenderId: "804254899672"
  //   });
  //   firebase.auth().signInWithEmailAndPassword("b@google.com", "Howard")
  //     .then((userCred) => {
  //       var user = userCred.user;
  //       user.getIdToken(true)
  //         .then((idToken) => {
  //           console.log("Id token", idToken);
  //         })
  //     }).
  //     catch((error) => {
  //       console.log("Error", error);
  //     });
  // }
}

export default new App().app;