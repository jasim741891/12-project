const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId
const admin = require("firebase-admin");
require('dotenv').config()
const port = process.env.PORT || 5000
// medalwayer

app.use(cors())
app.use(express.json())
// finale-project-firebase-adminsdk.json

// require('./finale-project-firebase-adminsdk.json')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const { ObjectID } = require('bson');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.peaym.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)

async function veryfidToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1]
        try {
            const decodedUser = await admin.auth().verifyIdToken(token)
            req.decodedEmail = decodedUser.email
        }
        catch {

        }
    }
    next()
}

async function run() {
    try {
        await client.connect();
        const database = client.db("doctor_finale");
        const appointmentCollectioin = database.collection("appointments");
        // new api name
        const usersCollection = database.collection("users")
        const servicesCollection = database.collection("services")
        const ordersCollection = database.collection("orders")
        const reviewsCollection = database.collection("review")


        // get api all services
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find({})
            const services = await cursor.toArray()
            res.send(services)
        })

        // services post api
        app.post('/services', async (req, res) => {
            const service = req.body
            // console.log('hite api', service)
            const result = await servicesCollection.insertOne(service)
            res.json(result)
            console.log(result)
        })

        // single id api get 
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log('cheaking single api ', id)
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.findOne(query)
            res.json(service)
        })

        // orders
        app.post('/orders', async (req, res) => {
            const order = req.body
            const result = await ordersCollection.insertOne(order)
            console.log(result)
            res.json(result)
        })

        //  my order

        app.get("/orders/:email", async (req, res) => {
            console.log(req.params.email);
            const result = await ordersCollection
                .find({ email: req.params.email })
                .toArray();
            res.send(result);
        });

        // review
        app.post('/review', async (req, res) => {
            const service = req.body
            // console.log('hite api', service)
            const result = await reviewsCollection.insertOne(service)
            res.json(result)
            console.log(result)
        })

        // review
        app.get('/review', async (req, res) => {
            const cursor = reviewsCollection.find({})
            const services = await cursor.toArray()
            res.send(services)
        })

        // delete api

        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id
            console.log('cheaking single api ', id)
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.deleteOne(query)
            res.json(service)
        })






        // get mania shobe data ohotha jakono data joyno use kora jayeai
        app.get('/appointments', veryfidToken, async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString()
            const query = { email: email, date: date }
            const cursor = appointmentCollectioin.find(query)
            const appointments = await cursor.toArray()
            res.json(appointments)
        })




        app.post('/appointments', async (req, res) => {
            const appointment = req.body
            const result = await appointmentCollectioin.insertOne(appointment)
            console.log(result)
            res.json(result)
        })
        // add  api with admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })
        // data rakhaor joyne  post 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            console.log(result)
            res.json(result)
        })
        app.put('/users', async (req, res) => {
            const user = req.body
            const filter = { email: user.email }
            const options = { upsert: true }
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })
        // admin plean
        app.put('/users/admin', veryfidToken, async (req, res) => {
            const user = req.body;
            const resquester = req.decodedEmail;
            if (resquester) {
                const resquesterAccount = await usersCollection.findOne({ email: resquester })
                if (resquesterAccount.role === 'admin') {
                    const filter = { email: user.email }
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc)
                    res.json(result)

                }
            }
            else {
                res.status(403).json({ meassage: 'donot permession this action' })
            }

        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}


run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('server jasim running')
})
app.listen(port, () => {
    console.log(`listening at ${port}`)
})