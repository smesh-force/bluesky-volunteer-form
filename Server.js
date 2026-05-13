require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/lead", async (req, res) => {

  try {

    const sourceType =
      req.body.socialplatform ? "Social Media" : "Web";

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

    console.log("📨 Lead received:");
    console.log(payload);

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

app.get("/", (req, res) => {
  res.send("Backend Live 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});