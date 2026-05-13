require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { BskyAgent, RichText } = require('@atproto/api');

const app = express();

app.use(cors());
app.use(express.json());

const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// ===== CONFIG =====
const FORM_LINK = 'https://smesh-force.github.io/bluesky-volunteer-form/';
const KEYWORDS = ['volunteer', 'help', 'support', 'donate', 'join', 'love', 'nice'];
const CHECK_INTERVAL = 2 * 60 * 1000;

// ===== RANDOMIZED REPLIES =====
const REPLIES = [
  `Interested? Fill this form: ${FORM_LINK}`,
  `We’d love your support. Apply here: ${FORM_LINK}`,
  `Join us today. Sign up: ${FORM_LINK}`
];

// ===== MEMORY =====
const replied = new Set();

// ===== FUNCTIONS =====
async function checkMentions() {
  console.log("🔍 Checking mentions...");

  const notifications = await agent.listNotifications();

  console.log(`📩 Found ${notifications.data.notifications.length} notifications`);

  for (const note of notifications.data.notifications) {

    if (note.reason !== 'mention') continue;
    if (replied.has(note.uri)) continue;

    const text = note.record?.text?.toLowerCase() || '';

    console.log("📝 Text:", text);

    const matched = KEYWORDS.some(word => text.includes(word));

    if (!matched) continue;

    const replyText =
      REPLIES[Math.floor(Math.random() * REPLIES.length)];

    try {

      const rt = new RichText({ text: replyText });

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
          },
        },
      });

      replied.add(note.uri);

      console.log(`✅ Replied to: ${note.uri}`);

    } catch (err) {

      console.error("❌ Reply failed:", err.message);
    }
  }
}

// ===== MAIN LOOP =====
async function runBot() {

  try {

    if (!process.env.BSKY_IDENTIFIER || !process.env.BSKY_PASSWORD) {
      throw new Error("Missing Bluesky credentials in Railway variables");
    }

    await agent.login({
      identifier: process.env.BSKY_IDENTIFIER,
      password: process.env.BSKY_PASSWORD,
    });

    console.log("🚀 Bot running...");

    while (true) {

      try {

        await checkMentions();

      } catch (error) {

        console.error("⚠️ Error:", error.message);
      }

      await new Promise(resolve =>
        setTimeout(resolve, CHECK_INTERVAL)
      );
    }

  } catch (err) {

    console.error("🔥 Bot crashed:", err);
  }
}

// ===== EXPRESS SERVER =====
app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.post("/lead", async (req, res) => {

  try {

    console.log("📨 Lead received:");
    console.log(req.body);

    res.json({
      success: true,
      message: "Lead submitted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});
app.post("/submit", async (req, res) => {

  try {

    console.log("📨 Form submission received:");
    console.log(req.body);

    res.json({
      success: true,
      message: "Submission received"
    });

  } catch (err) {

    console.error("❌ Submit error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
app.post("/lead", async (req, res) => {

  try {

    console.log("📨 Lead received:");
    console.log(req.body);

    res.json({
      success: true,
      message: "Lead submitted successfully"
    });

  } catch (error) {

    console.error("❌ Backend Error:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===== START BOT =====
runBot();