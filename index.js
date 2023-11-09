const express = require('express');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




// middlewares
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            // 'https://pro-hunters.web.app',
            // 'https://pro-hunters.firebaseapp.com',
        
        ],
        credentials: true
    }),
)
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pu45iww.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyToken = async(req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of the middleware', token);
    if(!token){
        return res.status(401).send({message: 'not authrized'})
    }
    jwt.verify(token, process.env.TOKEN, (err, decoded) => {
        if(err){
            console.log(err);
            return res.status(401).send({message: 'forbidden access'})
        }

        console.log('value in the token', decoded);
        req.user = decoded
        next()
    })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobCollection = client.db('proHunters').collection('jobs')
    const appliedJobsCollection = client.db('proHunters').collection('appliedJobs')

    // auth related api 
    app.post("/jwt", async(req, res) => {
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.TOKEN, {expiresIn : '20h'})
        res
        .cookie('token', token, {
            httpOnly: true,
            secure: false 
        })

        .send({success: true})
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

    app.get("/jobs/:id",  async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobCollection.findOne(query)
        res.send(result)
    })

    // delete operation 
    app.delete("/jobs/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        try {
          const result = await jobCollection.deleteOne(query);
          res.json(result);
        } catch (error) {
          console.error("Error deleting job:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      });

    // appliedJobs 
    app.post("/appliedJobs",  async(req, res) => {
        const appliedJobs = req.body;
        
        const result = await appliedJobsCollection.insertOne(appliedJobs)
        res.send(result)
    })

    app.get("/appliedJobs", verifyToken, async(req, res) => {
        console.log(req.query)
        console.log('token token', req.cookies.token);
        // if(req.query.email !== req.user.email){
        //     return res.send.status(403).send({message: 'forbidden access'})
        // }
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