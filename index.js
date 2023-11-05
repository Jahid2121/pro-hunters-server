const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors())
app.use(express.json())


app.get("/", async(req, res) => {
    res.send("Hunter is Hunting")
})

app.listen(port, () => {
    console.log(`Pro Hunters server is running on port ${port}`);
})