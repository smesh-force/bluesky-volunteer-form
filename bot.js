require('dotenv').config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { BskyAgent, RichText } = require('@atproto/api');

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// EXPRESS CONFIG
// =====================================================
const PORT = process.env.PORT || 3000;

const SALESFORCE_URL =
  process.env.SALESFORCE_URL;

const SF_TOKEN =
  process.env.SF_TOKEN;

// =====================================================
// BLUESKY CONFIG
// =====================================================
const agent = new BskyAgent({
  service: 'https://bsky.social',
});

const FORM_LINK =
  'https://smesh-force.github.io/bluesky-volunteer-form/';

const KEYWORDS = [
  'volunteer',
  'help',
  'support',
  'donate',
  'join',
  'love',
  'nice'
];

const CHECK_INTERVAL =
  2 * 60 * 1000;

// =====================================================
// BOT REPLIES
// =====================================================
const REPLIES = [
  `Interested? Fill this form: ${FORM_LINK}`,

  `We’d love your support. Apply here: ${FORM_LINK}`,

  `Join us today. Sign up: ${FORM_LINK}`
];

// =====================================================
// MEMORY
// =====================================================
const replied = new Set();

// =====================================================
// CHECK MENTIONS
// =====================================================
async function checkMentions() {

  console.log("🔍 Checking mentions...");

  const notifications =
    await agent.listNotifications();

  console.log(
    `📩 Found ${notifications.data.notifications.length} notifications`
  );

  for (const note of notifications.data.notifications) {

    // Skip non-mentions
    if (note.reason !== 'mention') {
      continue;
    }

    // Skip already replied
    if (replied.has(note.uri)) {
      continue;
    }

    const text =
      note.record?.text?.toLowerCase() || '';

    console.log("📝 Text:", text);

    // Keyword Match
    const matched = KEYWORDS.some(word =>
      text.includes(word)
    );

    if (!matched) {
      continue;
    }

    // Random Reply
    const replyText =
      REPLIES[
        Math.floor(Math.random() * REPLIES.length)
      ];

    try {

      const rt = new RichText({
        text: replyText
      });

      await rt.detectFacets(agent);

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

      replied.add(note.uri);

      console.log(
        `✅ Replied to: ${note.uri}`
      );

    } catch (err) {

      console.error(
        "❌ Reply failed:",
        err.message
      );
    }
  }
}

// =====================================================
// RUN BOT
// =====================================================
async function runBot() {

  try {

    // Validate Credentials
    if (
      !process.env.BSKY_IDENTIFIER ||
      !process.env.BSKY_PASSWORD
    ) {
      throw new Error(
        "Missing Bluesky credentials"
      );
    }

    // Login
    await agent.login({

      identifier:
        process.env.BSKY_IDENTIFIER,

      password:
        process.env.BSKY_PASSWORD
    });

    console.log("🚀 Bot running...");

    // Infinite Loop
    while (true) {

      try {

        await checkMentions();

      } catch (err) {

        console.error(
          "⚠️ Mention check error:",
          err.message
        );
      }

      await new Promise(resolve =>
        setTimeout(resolve, CHECK_INTERVAL)
      );
    }

  } catch (err) {

    console.error(
      "🔥 Bot crashed:",
      err.message
    );
  }
}

// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {

  res.send("🚀 Bluesky Bot Running");
});

// =====================================================
// LEAD ENDPOINT
// =====================================================
app.post("/lead", async (req, res) => {

  try {

    console.log("📨 Lead received:");
    console.log(req.body);

    // =============================================
    // SEND TO SALESFORCE
    // =============================================
    const response = await fetch(
      SALESFORCE_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${SF_TOKEN}`
        },

        body: JSON.stringify(req.body)
      }
    );

    // =============================================
    // SALESFORCE RESPONSE
    // =============================================
    const text =
      await response.text();

    console.log(
      "📩 Salesforce Status:",
      response.status
    );

    console.log(
      "📩 Salesforce Response:",
      text
    );

    // Return REAL Salesforce response
    return res
      .status(response.status)
      .send(text);

  } catch (error) {

    console.error(
      "❌ Backend Error:",
      error
    );

    return res.status(500).json({

      success: false,

      error: error.message
    });
  }
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {

  console.log(
    `🌐 Server running on port ${PORT}`
  );
});

// =====================================================
// START BOT
// =====================================================
runBot();