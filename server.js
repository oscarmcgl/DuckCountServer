const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

const SPREADSHEET_ID = "1nHVC5ahA0qOj4uE05YKWb3Fn3BjGSu_Uq8_ZXJ4cm_0";
const SHEET_NAME = "DuckGuesses"; 

// Authenticate with the service account
const auth = new google.auth.GoogleAuth({
  keyFile: "path-to-service-account-key.json", // Replace with the path to your JSON key file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Add a new duck count to the Google Sheet
app.post("/add", async (req, res) => {
  const { object, duck_count } = req.body;

  try {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
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

  try {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
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