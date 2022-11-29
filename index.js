const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.esmmy.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoriesCollection = client
      .db("ResaleZone")
      .collection("categories");
    const productsCollection = client.db("ResaleZone").collection("products");
    const usersCollection = client.db("ResaleZone").collection("users");
    const bookingsCollection = client.db("ResaleZone").collection("bookings");

    // generate jwt and save users email
    app.put("/user/:email", async (req, res) => {
      const email = req?.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      console.log(token);
      res.send({ result, token });
    });

    // get all categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoriesCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
    });
    // all products under a category
    app.get("/categories/:category_id", async (req, res) => {
      const id = req?.params?.category_id;
      const query = { category_id: id };
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // add a booking
    app.post("/booking", async (req, res) => {
      const newBooking = req?.body;
      const result = await bookingsCollection.insertOne(newBooking);
      res.send(result);
    });

    //
  } finally {
  }
}

run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("ResaleZone server is live");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
