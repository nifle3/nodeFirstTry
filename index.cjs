const { Telegram } = require("telegraf");
const { HLTV } = require("hltv");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const chatID = process.env.CHAT_ID;
const token = process.env.BOT_TOKEN;
const interval = process.env.INTERVAL;
const logInFile = process.env.LOG_IN_FILE;

if (logInFile) {
    const logFilePath = path.join(__dirname, 'app.log');
    console.log = function(message) {
        fs.appendFile(logFilePath, message + "\n", (err) => {
            if (err) {
                console.error("Error appedning into file");
            }
        });
    }
}

const bot = new Telegram(token);
const hltvLink = "https://www.hltv.org";
var linkSet = undefined;

setInterval(async () => {
    const news = await HLTV.getNews();
    const linksToNews = news.map(value => value.link);

    if (linkSet === undefined) {
        linkSet = new Set(linksToNews);
    } else {
        const newLinkSet = new Set(linksToNews);
        const newNews = newLinkSet.difference(linkSet);
        
        for (const newNew of newNews) {
            const newNewLink = hltvLink + newNew;
            await bot.sendMessage(chatID, `Вышла новая новость ${newNewLink}`);
            console.log("send");
        }

        linkSet = newLinkSet;
    }
}, interval);
