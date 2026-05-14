require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/lead", async (req, res) => {

  console.log("🔥 Incoming payload:");
  console.log(req.body);

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

    console.log("📩 Salesforce Status:", response.status);
    console.log("📩 Salesforce Response:", text);

    // RETURN REAL SALESFORCE RESPONSE
    return res.status(response.status).send(text);

  } catch(error){

    console.error("❌ Backend Error:", error);

    return res.status(500).send(
      "Backend Error: " + error.message
    );
  }
});

app.get("/", (req, res) => {
  res.send("Backend Live 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});