const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();


// ---> middleware
app.use(cors());
app.use(express.json());

// ---> mongoDB connection
const uri = `mongodb+srv://${process.env.GENIUS_USER}:${process.env.GENIUS_USER_PASS}@cluster0.76zc9vk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// ---> mongo async
const run = async () => {
    try {
        // ---> collections
        const servicesCollection = client.db("jeniousCar").collection("services");
        const orderCollection = client.db("jeniousCar").collection("orders");

        // ---> JWT verify 
        const verifyJWT = (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = authHeader.split(' ')[1];
            // ---.(token verify)
            jwt.verify(token, process.env.ASSESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next()
            })

        }

        // ---> get all services data
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        // ---> get a single service data

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const service = await servicesCollection.findOne(query);
            res.send(service)
        })

        // ---> jwt
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ASSESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })

        // ---> order || post
        app.post('/order', verifyJWT, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)

        })

        // ---get order
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })

        // ---> updated
        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // ---> delete order
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })




    } finally { }

}

run().catch(err => console.log(err))





app.use('/', (req, res) => {
    res.send('jenius car server is running...')
})





app.listen(port, () => {
    console.log(`jenius car server is running from port ${port}`)
})