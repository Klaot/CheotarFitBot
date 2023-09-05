const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { saveAnswersToGoogleDrive } = require("./api/googleApi");
const questions = require("./questions/questions");

// Ваш токен Telegram бота
const token = process.env.TELEGRAM_API;

// Создаем экземпляр Express
const app = express();

// Создаем экземпляр Telegram бота
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

Я - Егор Чеботарь, фитнес тренер, с большим опытом в спорте, помогаю людям,  стать сильными, стройными, жизнерадостными и красивыми! 💪

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
    if (currentQuestion < questions.length) {
      if (questions[currentQuestion] === "Ф.И.О.") {
        chatName = msg.text; // Сохраняем значение в переменной chatName
      }
      if (questions[currentQuestion] === "Укажите ваш пол:") {
        const genderResponse = msg.text.trim().toLowerCase();
        if (genderResponse === "мужской" || genderResponse === "женский") {
          const answer = msg.text; // Правильный ответ
          answers.push(
            `Вопрос ${currentQuestion + 1}: ${
              questions[currentQuestion]
            }\nОтвет: ${answer}`
          );
          currentQuestion++;
          if (currentQuestion < questions.length) {
            bot.sendMessage(
              chatId,
              `${questions[currentQuestion]}`,
              defaultButtons
            );
          } else {
            bot.sendMessage(chatId, "Анкета заполнена. Спасибо!");

            // Создание файла на Google Диске
            await saveAnswersToGoogleDrive(chatName, answers);

            isFillingSurvey = false;
            return;
          }
        } else {
          // Если пользователь ввел некорректный ответ на вопрос о поле, напоминаем ему выбрать из вариантов кнопок
          bot.sendMessage(
            chatId,
            "Пожалуйста, выберите один из вариантов кнопок (Мужской или Женский).",
            genderButton
          );
        }
        return;
      }
      // Остальная логика обработки ответов на вопросы
      const answer = msg.text.trim() || "-";
      answers.push(
        `Вопрос ${currentQuestion + 1}: ${
          questions[currentQuestion]
        }\nОтвет: ${answer}`
      );
      currentQuestion++;
      if (currentQuestion < questions.length) {
        bot.sendMessage(
          chatId,
          `${questions[currentQuestion]}`,
          defaultButtons
        );
      } else {
        bot.sendMessage(chatId, "Анкета заполнена. Спасибо!");

        // Создание файла на Google Диске
        await saveAnswersToGoogleDrive(chatName, answers);

        isFillingSurvey = false;
        return;
      }
    }
  }
});

// Добавьте обработчик для Express.js
app.post(`/webhook/${token}`, (req, res) => {
  // В этом обработчике можно обрабатывать входящие запросы от Telegram, если это необходимо
  // req.body содержит данные, отправленные Telegram
  res.sendStatus(200); // Отправляем статус 200, чтобы подтвердить, что запрос получен
});

// Запускаем Express.js сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
