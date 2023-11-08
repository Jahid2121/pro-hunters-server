const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pu45iww.mongodb.net/?retryWrites=true&w=majority`;

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

    const jobCollection = client.db('proHunters').collection('jobs')
    const appliedJobsCollection = client.db('proHunters').collection('appliedJobs')

    // auth related api 
    app.post("/jwt", async(req, res) => {
        const user = req.body;
        console.log(user);
        res.send(user)
    })

    
    
    // jobs
    app.post("/jobs", async(req, res) => {
        const jobs = req.body;
        const result = await jobCollection.insertOne(jobs)
        res.send(result)
    })

    app.get("/jobs", async(req, res) => {
        let query = {};
        if(req.query?.jobCategory) {
            query = {jobCategory: req.query.jobCategory}
        }
        else if(req.query?.loggedInUserName){
            query = {loggedInUserName: req.query.loggedInUserName}
        }
        const cursor = jobCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get("/jobs/:id", async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobCollection.findOne(query)
        res.send(result)
    })

    // appliedJobs 
    app.post("/appliedJobs", async(req, res) => {
        const appliedJobs = req.body;
        const result = await appliedJobsCollection.insertOne(appliedJobs)
        res.send(result)
    })

    app.get("/appliedJobs", async(req, res) => {
        console.log(req.query)
        let query = {}
        if(req.query?.email){
            query = {email: req.query.email}
        }

        const result = await appliedJobsCollection.find(query).toArray()
        res.send(result)
    })


    app.patch("/jobs/:jobId", async(req, res) => {
        const jobId = req.params.jobId;
         const query = { _id: new ObjectId(jobId) };
         const updateResult = await jobCollection.updateOne(query, { $inc: { jobApplicantsNumber: 1, "metrics.orders": 1 } });
         res.send(updateResult)
    })



    // app.patch("/jobs/:id", async (req, res) => {
    //     const jobId = req.params.id;
  
    //     try {
    //       const query = { _id: new ObjectId(jobId) };
    //       const updateResult = await jobCollection.updateOne(query, { $inc: { jobApplicantsNumber: -1, "metrics.orders": 1 } });
  
    //       if (updateResult.matchedCount === 1) {
    //         res.status(200).send('Job applicants number decremented and orders incremented successfully');
    //       } else {
    //         res.status(404).send('Job not found');
    //       }
    //     } catch (error) {
    //       console.error('Error updating job applicants number and orders:', error);
    //       res.status(500).send('Internal Server Error');
    //     }
    //   });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get("/", async(req, res) => {
    res.send("Hunter is Hunting")
})

app.listen(port, () => {
    console.log(`Pro Hunters server is running on port ${port}`);
})