require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/lead", async (req, res) => {

  try {

    const sourceType = req.body.socialplatform ? "Social Media" : "Web";

    const payload = {
      displayName: req.body.displayName,
      email: req.body.email,
      phone: req.body.phone,

      stakeholder: req.body.stakeholder,
      interest: req.body.interest,
      comment: req.body.comment,

      leadsource: sourceType,
      socialplatform: req.body.socialplatform || "",

      priority: "Medium",
      lifecycle: "New Lead"
    };

    console.log("Sending to Salesforce:");
    console.log(payload);

    const response = await fetch(process.env.SALESFORCE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SF_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    console.log("Salesforce Response:", text);

    res.status(response.status).send(text);

  } catch (error) {

    console.error(error);
    res.status(500).send("Backend Error");

  }

});

app.get("/", (req,res)=>{
  res.send("Backend Live 🚀");
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server Running");
});