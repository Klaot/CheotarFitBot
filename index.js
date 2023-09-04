const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const questions = require("./questions/questions");
const { saveAnswersToGoogleDrive } = require("./api/googleApi");

const token = process.env.TELEGRAM_API;
const bot = new TelegramBot(token, { polling: true });

let currentQuestion = 0;
let answers = [];
let isFillingSurvey = false;
let chatName = "";

function startSurvey(chatId) {
  currentQuestion = 0;
  answers = [];
  chatName = "";

  isFillingSurvey = true;

  bot.sendMessage(
    chatId,
    `Давайте начнем анкетирование. Ответьте на следующий вопрос: ${questions[currentQuestion]}`
  );
}

// function restartSurvey(chatId) {
//   currentQuestion = 0;
//   answers = [];
//   chatName = "";

//   isFillingSurvey = true;

//   bot.sendMessage(
//     chatId,
//     `Начнем анкету заново. Ответьте на следующий вопрос: ${questions[currentQuestion]}`
//   );
// }

const defaultButtons = {
  reply_markup: {
    keyboard: [[{ text: "Заполнить анкету" }]],
    resize_keyboard: true,
  },
};

const genderButton = {
  reply_markup: {
    keyboard: [[{ text: "Мужской" }, { text: "Женский" }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const welcomeMessage = `Привет!👋 

Я - Егор Чеботарь, фитнес тренер, с большим опытом в спорте, помогаю людям,  стать сильными, стройными, жизнерадостными и красивыми! 💪🌟

Для того, чтобы вы смогли достичь своей цели, максимально честно ответьте на несколько вопросов в анкете, и я обязательно свяжусь с вами.👌`;

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendPhoto(chatId, "./assets/egor.jpg", {
    caption: welcomeMessage,

    reply_markup: {
      keyboard: [[{ text: "Заполнить анкету" }]],
      resize_keyboard: true,
    },
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "Заполнить анкету") {
    startSurvey(chatId);
  } else if (msg.text === "Анкета заполнена. Спасибо!") {
    return;
  } else if (isFillingSurvey) {
    const answer = msg.text.trim() || "-";

    if (currentQuestion === 0) {
      chatName = answer;
      answers.push(
        `Вопрос ${currentQuestion + 1}: ${
          questions[currentQuestion]
        }\nОтвет: ${answer}`
      );
    } else {
      answers.push(
        `Вопрос ${currentQuestion + 1}: ${
          questions[currentQuestion]
        }\nОтвет: ${answer}`
      );
    }

    // Блок отрабатывает когда анкета заканчивается.

    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      if (questions[currentQuestion] === "Укажите ваш пол:") {
        bot.sendMessage(chatId, `${questions[currentQuestion]}`, genderButton);
      } else {
        bot.sendMessage(
          chatId,
          `${questions[currentQuestion]}`,
          defaultButtons
        );
      }
    } else {
      bot.sendMessage(chatId, "Анкета заполнена. Спасибо!");

      // Создание файла на Google Диске
      await saveAnswersToGoogleDrive(chatName, answers);

      isFillingSurvey = false;
    }
  }
});
