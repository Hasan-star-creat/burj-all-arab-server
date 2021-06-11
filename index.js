const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const admin = require("firebase-admin");

const MongoClient = require("mongodb").MongoClient;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const serviceAccount = require("./config/burj-all-arab-app-firebase-adminsdk-zcq6k-0b0788d04f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
 
});

 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fvh8x.mongodb.net/${process.env.DB_HOST}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const bookingCollection = client
    .db(`${process.env.DB_HOST}`)
    .collection("booking");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log(idToken);
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          if (tokenEmail == req.query.email) {
            bookingCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          }
          else{
            res.status(401).send("un-authorize access");
          }
        })
        .catch((error) => {
          res.status(401).send("un-authorize access");
        });
    }
    else{
      res.status(401).send('un-authorize access')
    }

  });
});

app.listen(4200);
