const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
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

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized-access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoriesCollection = client
      .db("ResaleZone")
      .collection("categories");
    const productsCollection = client.db("ResaleZone").collection("products");
    const usersCollection = client.db("ResaleZone").collection("users");
    const bookingsCollection = client.db("ResaleZone").collection("bookings");
    const articlesCollection = client.db("ResaleZone").collection("articles");
    const reportedItemsCollection = client
      .db("ResaleZone")
      .collection("reports");

    app.get("/verify", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      console.log(user);
      res.status(403).send({ accessToken: "" });
    });
    app.post("/users", async (req, res) => {
      const newUserData = req?.body;
      const newUser = await usersCollection.insertOne(newUserData);
      res.send(newUser);
    });
    // get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const allUsers = await cursor.toArray();
      res.send(allUsers);
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
      console.log(typeof id);
      res.send(products);
    });

    // add a booking
    app.post("/bookings", async (req, res) => {
      const newBooking = req?.body;
      const result = await bookingsCollection.insertOne(newBooking);
      res.send(result);
    });
    // add product
    app.post("/products", async (req, res) => {
      const newProductData = req?.body;
      const newProduct = await productsCollection.insertOne(newProductData);
      res.send(newProduct);
    });

    // display my bookings / orders
    app.get("/bookings", verifyJwt, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const myBookings = await bookingsCollection.find(query).toArray();
      console.log(myBookings);
      res.send(myBookings);
    });

    // display my products
    app.get("/products", verifyJwt, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const myProducts = await productsCollection.find(query).toArray();
      res.send(myProducts);
    });

    //
    // all articles data
    app.get("/articles", async (req, res) => {
      const query = {};
      const cursor = articlesCollection.find(query);
      const articles = await cursor.toArray();
      res.send(articles);
    });
    // get a single article by id
    app.get("/articles/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const article = await articlesCollection.findOne(query);
      res.send(article);
    });
    // check if the user is admin or not
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.userRole === "admin" });
    });
    // check if the user is seller or not
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.userRole === "seller" });
    });
    // check if the user is buyer or not
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.userRole === "buyer" });
    });
    // report a product
    app.post("/reports", async (req, res) => {
      const newReport = req?.body;
      const result = await reportedItemsCollection.insertOne(newReport);
      res.send(result);
      // get reported items
      app.get("/reports", async (req, res) => {
        const query = {};
        const cursor = reportedItemsCollection.find(query);
        const reportedItems = await cursor.toArray();
        res.send(reportedItems);
      });
    });
    // delete a reported item
    app.delete("/reports/:id", verifyJwt, async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: ObjectId(id) };
      const deletedReport = await reportedItemsCollection.deleteOne(query);

      res.send(deletedReport);
    });
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
