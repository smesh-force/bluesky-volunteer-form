/*
=========================================================
BLUESKY BOT + SALESFORCE INTEGRATION
bot.js
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const fetch = (...args) =>
  import("node-fetch").then(
    ({ default: fetch }) => fetch(...args)
  );

const {
  BskyAgent,
  RichText
} = require("@atproto/api");

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
BLUESKY CONFIG
=========================================================
*/
const agent = new BskyAgent({
  service: "https://bsky.social"
});

const FORM_LINK =
  "https://smesh-force.github.io/bluesky-volunteer-form/";

const CHECK_INTERVAL =
  2 * 60 * 1000;

/*
=========================================================
KEYWORDS
=========================================================
*/
const KEYWORDS = [

  "volunteer",
  "help",
  "support",
  "donate",
  "join",
  "community",
  "interested",
  "apply",
  "love",
  "nice"
];

/*
=========================================================
AUTO REPLIES
=========================================================
*/
const REPLIES = [

  `Interested in volunteering? Fill this form: ${FORM_LINK}`,

  `We’d love your support 💙 Apply here: ${FORM_LINK}`,

  `Join our mission today 🚀 Sign up here: ${FORM_LINK}`,

  `Thanks for your interest 🙌 Register here: ${FORM_LINK}`
];

/*
=========================================================
MEMORY
Prevents duplicate replies
=========================================================
*/
const repliedPosts = new Set();

/*
=========================================================
GENERATE RANDOM REPLY
=========================================================
*/
function getRandomReply() {

  return REPLIES[
    Math.floor(Math.random() * REPLIES.length)
  ];
}

/*
=========================================================
SEND DATA TO SALESFORCE
=========================================================
*/
async function sendToSalesforce(data) {

  try {

    /*
    =====================================================
    GET SALESFORCE TOKEN
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

    /*
    =====================================================
    TOKEN CHECK
    =====================================================
    */
    if (!authData.access_token) {

      console.error(
        "❌ Salesforce Auth Failed"
      );

      console.error(authData);

      return;
    }

    /*
    =====================================================
    SEND TO APEX REST
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

        body: JSON.stringify(data)
      }
    );

    const text =
      await sfResponse.text();

    console.log("==================================");
    console.log("📩 Salesforce Response");
    console.log("==================================");

    console.log("Status:", sfResponse.status);
    console.log("Body:", text);

  } catch (err) {

    console.error(
      "❌ Salesforce Error:",
      err.message
    );
  }
}

/*
=========================================================
CHECK MENTIONS
=========================================================
*/
async function checkMentions() {

  console.log("🔍 Checking mentions...");

  try {

    const notifications =
      await agent.listNotifications();

    const mentions =
      notifications.data.notifications;

    console.log(
      `📩 Found ${mentions.length} notifications`
    );

    for (const note of mentions) {

      /*
      ===================================================
      SKIP NON-MENTIONS
      ===================================================
      */
      if (note.reason !== "mention") {
        continue;
      }

      /*
      ===================================================
      SKIP ALREADY REPLIED
      ===================================================
      */
      if (repliedPosts.has(note.uri)) {
        continue;
      }

      /*
      ===================================================
      EXTRACT TEXT
      ===================================================
      */
      const text =
        note.record?.text?.toLowerCase() || "";

      console.log("📝 Mention:", text);

      /*
      ===================================================
      KEYWORD MATCH
      ===================================================
      */
      const matched =
        KEYWORDS.some(keyword =>
          text.includes(keyword)
        );

      if (!matched) {
        continue;
      }

      /*
      ===================================================
      GENERATE REPLY
      ===================================================
      */
      const replyText =
        getRandomReply();

      try {

        /*
        ===============================================
        FORMAT RICH TEXT
        ===============================================
        */
        const rt = new RichText({
          text: replyText
        });

        await rt.detectFacets(agent);

        /*
        ===============================================
        REPLY TO POST
        ===============================================
        */
        await agent.post({

          text: rt.text,

          facets: rt.facets,

          reply: {

            root: {
              uri: note.uri,
              cid: note.cid
            },

            parent: {
              uri: note.uri,
              cid: note.cid
            }
          }
        });

        /*
        ===============================================
        SAVE TO MEMORY
        ===============================================
        */
        repliedPosts.add(note.uri);

        console.log(
          `✅ Replied to mention`
        );

        /*
        ===============================================
        SEND TO SALESFORCE
        ===============================================
        */
        await sendToSalesforce({

          displayName:
            note.author?.displayName,

          username:
            note.author?.handle,

          comment:
            note.record?.text,

          action:
            "Mention Reply",

          socialplatform:
            "Bluesky",

          leadsource:
            "Bluesky Bot"
        });

      } catch (err) {

        console.error(
          "❌ Reply Failed:",
          err.message
        );
      }
    }

  } catch (err) {

    console.error(
      "❌ Mention Check Failed:",
      err.message
    );
  }
}

/*
=========================================================
RUN BOT LOOP
=========================================================
*/
async function runBot() {

  try {

    /*
    =====================================================
    VALIDATE ENV VARIABLES
    =====================================================
    */
    if (
      !process.env.BSKY_IDENTIFIER ||
      !process.env.BSKY_PASSWORD
    ) {

      throw new Error(
        "Missing Bluesky credentials"
      );
    }

    /*
    =====================================================
    LOGIN
    =====================================================
    */
    await agent.login({

      identifier:
        process.env.BSKY_IDENTIFIER,

      password:
        process.env.BSKY_PASSWORD
    });

    console.log("==================================");
    console.log("🚀 Bluesky Bot Running");
    console.log("==================================");

    /*
    =====================================================
    INFINITE LOOP
    =====================================================
    */
    while (true) {

      await checkMentions();

      await new Promise(resolve =>

        setTimeout(
          resolve,
          CHECK_INTERVAL
        )
      );
    }

  } catch (err) {

    console.error(
      "🔥 BOT CRASHED:",
      err.message
    );
  }
}

/*
=========================================================
HEALTH CHECK
=========================================================
*/
app.get("/", (req, res) => {

  res.send(
    "🚀 Bluesky Bot + Salesforce Running"
  );
});

/*
=========================================================
START SERVER
=========================================================
*/
app.listen(PORT, () => {

  console.log("==================================");
  console.log(
    `🌐 Server running on port ${PORT}`
  );
  console.log("==================================");

});

/*
=========================================================
START BOT
=========================================================
*/
runBot();