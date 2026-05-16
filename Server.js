/*
=========================================================
BLUESKY → SALESFORCE BACKEND
server.js
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

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
SALESFORCE CONFIG
=========================================================
*/
const SF_LOGIN_URL =
  "https://test.salesforce.com/services/oauth2/token";

const SF_REST_ENDPOINT =
  "/services/apexrest/bluesky/webhook";

/*
=========================================================
HEALTH CHECK
=========================================================
*/
app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message: "🚀 Backend Live"
  });

});

/*
=========================================================
GET SALESFORCE ACCESS TOKEN
=========================================================
*/
async function getSalesforceToken() {

  console.log("==================================");
  console.log("🔐 AUTHENTICATING WITH SALESFORCE");
  console.log("==================================");

  try {

    const authResponse = await fetch(

      SF_LOGIN_URL,

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

    console.log(
      "OAuth Status:",
      authResponse.status
    );

    if (!authData.access_token) {

      console.error(
        "❌ SALESFORCE AUTH FAILED"
      );

      console.error(authData);

      throw new Error(
        "Unable to authenticate with Salesforce"
      );
    }

    console.log(
      "✅ Salesforce Auth Success"
    );

    return {

      accessToken:
        authData.access_token,

      instanceUrl:
        authData.instance_url
    };

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
SEND DATA TO SALESFORCE
=========================================================
*/
async function sendToSalesforce(
  accessToken,
  instanceUrl,
  payload
) {

  console.log("==================================");
  console.log("📤 SENDING DATA TO SALESFORCE");
  console.log("==================================");

  try {

    const sfResponse = await fetch(

      `${instanceUrl}${SF_REST_ENDPOINT}`,

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

    console.log(
      "Status:",
      sfResponse.status
    );

    console.log(
      "Body:",
      responseText
    );

    return {

      status:
        sfResponse.status,

      body:
        responseText
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
    const auth =
      await getSalesforceToken();

    /*
    =====================================================
    STEP 2: SEND TO SALESFORCE
    =====================================================
    */
    const result =
      await sendToSalesforce(

        auth.accessToken,

        auth.instanceUrl,

        req.body
      );

    /*
    =====================================================
    SUCCESS RESPONSE
    =====================================================
    */
    return res.status(result.status).json({

      success: true,

      message:
        "Lead forwarded successfully",

      salesforceResponse:
        result.body
    });

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