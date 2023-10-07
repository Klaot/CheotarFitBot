import TelegramBot from "node-telegram-bot-api";
import { questions } from "./questions/questions";
import express from "express";
import { saveAnswersToGoogleDrive } from "./api/googleApi";

require("dotenv").config();

const app = express();

const token = process.env.TELEGRAM_API ?? "";
const bot = new TelegramBot(token);

const webhookUrl = `${process.env.API_ADRESS}webhook/${token}`;

bot.setWebHook(webhookUrl);

let currentQuestion = 0;
let answers: string[] = [];
let isFillingSurvey = false;
let chatName: string = "";

function startSurvey(chatId: any) {
  currentQuestion = 0;
  answers = [];
  chatName = "";

  isFillingSurvey = true;

  bot.sendMessage(
    chatId,
    `Давайте начнем анкетирование. Ответьте на следующий вопрос: ${questions[currentQuestion]}`
  );
}

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

app.post(`/webhook/${token}`, (req: any, res: any) => {
  const { message } = req.body;

  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/start") {
      bot.sendPhoto(chatId, "./assets/egor.jpg", {
        caption: welcomeMessage,
      });
    } else if (text === "Заполнить анкету") {
      startSurvey(chatId);
    } else if (text === "Анкета заполнена. Спасибо!") {
      // Обработка завершения анкеты
    } else if (isFillingSurvey) {
      if (currentQuestion < questions.length) {
        if (questions[currentQuestion] === "Ф.И.О.") {
          chatName = text; // Сохраняем значение в переменной chatName
        }
        if (questions[currentQuestion] === "Укажите ваш пол:") {
          const genderResponse = text.trim().toLowerCase();
          if (genderResponse === "мужской" || genderResponse === "женский") {
            const answer = text; // Правильный ответ
            answers.push(
              `Вопрос ${currentQuestion + 1}: ${
                questions[currentQuestion]
              }\nОтвет: ${answer}`
            );
            currentQuestion++;
            if (currentQuestion < questions.length) {
              bot.sendMessage(chatId, `${questions[currentQuestion]}`);
            } else {
              bot.sendMessage(chatId, "Анкета заполнена. Спасибо!");

              // Создание файла на Google Диске
              saveAnswersToGoogleDrive(chatName, answers)
                .then(() => {
                  isFillingSurvey = false;
                })
                .catch((error) => {
                  console.error(
                    "Ошибка при сохранении на Google Диске:",
                    error
                  );
                });
            }
          } else {
            // Если пользователь ввел некорректный ответ на вопрос о поле, напоминаем ему выбрать из вариантов кнопок
            bot.sendMessage(
              chatId,
              "Пожалуйста, выберите один из вариантов кнопок (Мужской или Женский).",
              genderButton
            );
          }
        } else {
          // Остальная логика обработки ответов на вопросы
          const answer = text.trim() || "-";
          answers.push(
            `Вопрос ${currentQuestion + 1}: ${
              questions[currentQuestion]
            }\nОтвет: ${answer}`
          );
          currentQuestion++;
          if (currentQuestion < questions.length) {
            bot.sendMessage(chatId, `${questions[currentQuestion]}`);
          } else {
            bot.sendMessage(chatId, "Анкета заполнена. Спасибо!");

            // Создание файла на Google Диске
            saveAnswersToGoogleDrive(chatName, answers)
              .then(() => {
                isFillingSurvey = false;
              })
              .catch((error) => {
                console.error("Ошибка при сохранении на Google Диске:", error);
              });
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express.js server is listening on port ${port}`);
});
