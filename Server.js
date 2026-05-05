```javascript id="x1r6cv"
require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/lead", async (req, res) => {
  try {
    const response = await fetch(process.env.SALESFORCE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SF_TOKEN}`
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    console.log("Status:", response.status);
    console.log("Response:", text);

    res.status(response.status).send(text);

  } catch (error) {
    console.error(error);
    res.status(500).send("Backend error");
  }
});

app.get("/", (req,res)=>{
  res.send("Backend Live 🚀");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
```
