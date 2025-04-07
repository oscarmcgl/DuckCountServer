const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");

const app = express(); // Initialize the Express app

// CORS configuration
const allowedOrigins = [
  "https://oscarmcglone.com", // Your custom domain
  "https://duck.oscarmcglone.com", // Duck domain
  "http://localhost:3000",   // Local development
  "http://127.0.0.1:3000",    // Localhost with IP
  "http://127.0.0.1:5500",    // Localhost with IP and port 5500
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Reject the request
    }
  },
};

app.use(cors(corsOptions)); // Use the CORS middleware
app.use(bodyParser.json()); // Middleware to parse JSON requests

const SPREADSHEET_ID = "1nHVC5ahA0qOj4uE05YKWb3Fn3BjGSu_Uq8_ZXJ4cm_0";
const SHEET_NAME = "DuckGuesses";

// Authenticate with the service account
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY), // Load the key from an environment variable
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Add a new duck count to the Google Sheet
app.post("/add", async (req, res) => {
  const { object, duck_count } = req.body;

  if (!object || !duck_count) {
    return res.status(400).send("Missing object or duck_count");
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:B`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[object, duck_count]],
      },
    });
    res.status(200).send("Duck count added successfully");
  } catch (error) {
    console.error("Error adding duck count:", error);
    res.status(500).send("Failed to add duck count");
  }
});

// Get all guesses for a specific object from the Google Sheet
app.get("/guesses", async (req, res) => {
  const { object } = req.query;

  if (!object) {
    return res.status(400).send("Missing object");
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    const guesses = rows
      .filter(row => row[0] === object)
      .map(row => parseInt(row[1], 10))
      .filter(Number.isFinite);

    res.status(200).json(guesses);
  } catch (error) {
    console.error("Error fetching guesses:", error);
    res.status(500).send("Failed to fetch guesses");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});