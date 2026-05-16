/*
=========================================================
BLUESKY → SALESFORCE BACKEND
Clean Rearranged Version
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

/*
=========================================================
MIDDLEWARE
=========================================================
*/
app.use(cors());
app.use(express.json());

/*
=========================================================
HEALTH CHECK
=========================================================
*/
app.get("/", (req, res) => {
  res.send("Backend Live 🚀");
});

/*
=========================================================
CREATE LEAD ENDPOINT
=========================================================
*/
app.post("/lead", async (req, res) => {

  console.log("==================================");
  console.log("🔥 Incoming Payload");
  console.log("==================================");
  console.log(req.body);

  try {

    /*
    =====================================================
    SEND TO SALESFORCE
    =====================================================
    */
    const response = await fetch(
      process.env.SALESFORCE_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.SF_TOKEN}`
        },

        body: JSON.stringify(req.body)
      }
    );

    /*
    =====================================================
    READ SALESFORCE RESPONSE
    =====================================================
    */
    const text = await response.text();

    console.log("==================================");
    console.log("📩 Salesforce Response");
    console.log("==================================");

    console.log("Status:", response.status);
    console.log("Body:", text);

    /*
    =====================================================
    DEBUGGING
    =====================================================
    */
    console.log("==================================");
    console.log("🛠 ENVIRONMENT CHECK");
    console.log("==================================");

    console.log(
      "SF URL:",
      process.env.SALESFORCE_URL
    );

    console.log(
      "SF TOKEN EXISTS:",
      !!process.env.SF_TOKEN
    );

    /*
    =====================================================
    RETURN SALESFORCE RESPONSE
    =====================================================
    */
    return res
      .status(response.status)
      .send(text);

  } catch (error) {

    /*
    =====================================================
    ERROR HANDLING
    =====================================================
    */
    console.error("==================================");
    console.error("❌ BACKEND ERROR");
    console.error("==================================");

    console.error("Message:", error.message);
    console.error("Full Error:", error);

    return res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

/*
=========================================================
START SERVER
=========================================================
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("==================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("==================================");

});