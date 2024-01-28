
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');
const Message = require('./message');
const uri = "mongodb+srv://georgemathew9203:2pP6d3wAimAo1kgy@podiumpalcluster.ufcozb6.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    await mongoose.connect(
      uri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
console.log('mongoose connected');

    const newMessage = new Message({
      author: "George",
      content: "Text",
      emotion: "Happy",
      eye_movement: "Moving",
      tone: "Straight",
    });

    console.log('trying to save');
    await newMessage.save();
    console.log('saved');
  } 
  catch {
    console.log('fuck');
  }
  finally {
    await client.close();
  }
}
run().catch(console.dir);
