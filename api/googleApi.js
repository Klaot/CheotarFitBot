require("dotenv").config();
const { google } = require("googleapis");

const SCOPE = [process.env.SCOPE];

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.API_JSON,
  scopes: SCOPE,
});

async function saveAnswersToGoogleDrive(chatName, answers) {
  const authClient = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: authClient });

  const fileName = `${chatName}_${new Date()
    .toLocaleDateString()
    .replace(/\./g, "-")}.doc`;

  const fileMetadata = {
    name: fileName,
    parents: answers[3].includes("Мужской")
      ? [process.env.GOOGLE_MAN_PARENT]
      : [process.env.GOOGLE_WOMAN_PARENT],
  };

  const media = {
    mimeType: "text/plain",
    body: answers.join("\n\n"),
  };

  try {
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    console.log("File uploaded to Google Drive.");
  } catch (error) {
    console.error("Error uploading file to Google Drive");
    if (error.response && error.response.data) {
      console.error("Google Drive API error response:", error.response.data);
    }
  }
}

module.exports.saveAnswersToGoogleDrive = saveAnswersToGoogleDrive;
