/*
=========================================================
BLUESKY → SALESFORCE BACKEND
server.js
=========================================================
*/

require('dotenv').config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const { BskyAgent, RichText } =
  require('@atproto/api');

/*
=========================================================
APP SETUP
=========================================================
*/
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/*
=========================================================
HEALTH CHECK
=========================================================
*/
app.get("/", (req, res) => {

  res.send("🚀 Backend Live");

});

/*
=========================================================
GET SALESFORCE ACCESS TOKEN
=========================================================
*/
async function getSalesforceToken() {

  try {

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

    console.log("==================================");
    console.log("🔐 OAUTH RESPONSE");
    console.log("==================================");

    console.log("Status:", authResponse.status);
    console.log(authData);

    /*
    =====================================================
    TOKEN VALIDATION
    =====================================================
    */
    if (!authData.access_token) {

      throw new Error(
        "Salesforce authentication failed"
      );
    }

    return authData;

  } catch (error) {

    console.error(
      "❌ OAuth Error:",
      error.message
    );

    throw error;
  }
}

/*
=========================================================
FORWARD DATA TO SALESFORCE
=========================================================
*/
async function forwardToSalesforce(
  accessToken,
  instanceUrl,
  payload
) {

  try {

    const sfResponse = await fetch(

      `${instanceUrl}/services/apexrest/bluesky/webhook`,

      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${accessToken}`
        },

        body: JSON.stringify(payload)
      }
    );

    const responseText =
      await sfResponse.text();

    console.log("==================================");
    console.log("📩 SALESFORCE RESPONSE");
    console.log("==================================");

    console.log("Status:", sfResponse.status);
    console.log("Body:", responseText);

    return {

      status: sfResponse.status,

      body: responseText
    };

  } catch (error) {

    console.error(
      "❌ Salesforce Forward Error:",
      error.message
    );

    throw error;
  }
}

/*
=========================================================
CREATE LEAD ENDPOINT
POST /lead
=========================================================
*/
app.post("/lead", async (req, res) => {

  try {

    console.log("==================================");
    console.log("📨 INCOMING LEAD");
    console.log("==================================");

    console.log(req.body);

    /*
    =====================================================
    STEP 1: AUTHENTICATE
    =====================================================
    */
    const authData =
      await getSalesforceToken();

    /*
    =====================================================
    STEP 2: FORWARD TO SALESFORCE
    =====================================================
    */
    const result =
      await forwardToSalesforce(

        authData.access_token,

        authData.instance_url,

        req.body
      );

    /*
    =====================================================
    RETURN RESPONSE
    =====================================================
    */
    return res
      .status(result.status)
      .send(result.body);

  } catch (error) {

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
app.listen(PORT, () => {

  console.log("==================================");
  console.log(
    `🚀 Server running on port ${PORT}`
  );
  console.log("==================================");

});