/*
=========================================================
BLUESKY → SALESFORCE BACKEND
server.js
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Uncomment if using Node below v18
// const fetch = require("node-fetch");

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

  try {

    console.log("==================================");
    console.log("📨 Incoming Lead");
    console.log("==================================");

    console.log(req.body);

    /*
    =====================================================
    STEP 1: GET SALESFORCE ACCESS TOKEN
    =====================================================
    */
    const authResponse = await fetch(

      "https://test.salesforce.com/services/oauth2/token",

      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body: new URLSearchParams({

          grant_type: "password",

          client_id:
            process.env.SF_CLIENT_ID,

          client_secret:
            process.env.SF_CLIENT_SECRET,

          username:
            process.env.SF_USERNAME,

          password:
            process.env.SF_PASSWORD
        })
      }
    );

    const authData =
      await authResponse.json();
console.log("OAuth Status:", authResponse.status);
console.log("OAuth Data:", authData);
    console.log("==================================");
    console.log("🔐 OAuth Response");
    console.log("==================================");

    console.log(authData);

    /*
    =====================================================
    CHECK TOKEN
    =====================================================
    */
    if (!authData.access_token) {

      return res.status(401).json({

        success: false,

        error: "Salesforce Authentication Failed",

        details: authData
      });
    }

    /*
    =====================================================
    STEP 2: SEND DATA TO SALESFORCE
    =====================================================
    */
    const sfResponse = await fetch(

      `${authData.instance_url}/services/apexrest/bluesky/webhook`,

      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${authData.access_token}`
        },

        body: JSON.stringify(req.body)
      }
    );

    /*
    =====================================================
    READ SALESFORCE RESPONSE
    =====================================================
    */
    const responseText =
      await sfResponse.text();

    console.log("==================================");
    console.log("📩 Salesforce Response");
    console.log("==================================");

    console.log("Status:", sfResponse.status);
    console.log("Body:", responseText);

    /*
    =====================================================
    RETURN RESPONSE
    =====================================================
    */
    return res
      .status(sfResponse.status)
      .send(responseText);

  } catch (error) {

    /*
    =====================================================
    ERROR HANDLING
    =====================================================
    */
    console.log("==================================");
    console.log("❌ BACKEND ERROR");
    console.log("==================================");

    console.error(error);

    return res.status(500).json({

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