import { google, drive_v3 } from "googleapis";
import { JWT } from "google-auth-library";

require("dotenv").config();

const SCOPE = "https://www.googleapis.com/auth/drive";

// Функция для аутентификации и получения клиента Google Drive
async function getDriveClient() {
  const auth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY,
    scopes: SCOPE,
  });

  await auth.authorize();

  return google.drive({ version: "v3", auth });
}

// Функция для сохранения ответов на Google Drive
export async function saveAnswersToGoogleDrive(
  chatName: string,
  answers: string[]
) {
  try {
    const drive = await getDriveClient();

    const fileName = `${chatName}_${new Date()
      .toLocaleDateString()
      .replace(/\./g, "-")}.doc`;

    const fileMetadata: drive_v3.Schema$File = {
      name: fileName,
      parents: [process.env.GOOGLE_MAN_PARENT ?? ""],
    };

    const media: any = {
      mimeType: "text/plain",
      body: answers.join("\n\n"),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });

    console.log("File uploaded to Google Drive with ID:", response.data.id);
  } catch (error: any) {
    console.error("Error uploading file to Google Drive:", error.message);
    if (error.response && error.response.data) {
      console.error("Google Drive API error response:", error.response.data);
    }
  }
}
