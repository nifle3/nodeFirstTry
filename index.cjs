const { Telegram } = require("telegraf");
const { HLTV } = require("hltv");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const chatID = process.env.CHAT_ID;
const token = process.env.BOT_TOKEN;
const interval = process.env.INTERVAL;
const logInFile = process.env.LOG_IN_FILE;
const message = process.env.MESSAGE;

const tmpFile = "./db/data.json"
const hltvLink = "https://www.hltv.org";
const bot = new Telegram(token);
var linkSet = undefined;


if (logInFile) {
    const logFilePath = path.join(__dirname, "logs", "app.log");
    console.log = function(message) {
        fs.appendFile(logFilePath, message + "\n", (err) => {
            if (err) {
                console.error("Error appending into file");
            }
        });
    }
}


if (fs.existsSync(tmpFile)) {
    const data = require(tmpFile);
    linkSet = new Set(data);
}


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
            await bot.sendMessage(chatID, `${message} ${newNewLink}`);
            console.log("send");
        }

        linkSet = newLinkSet;
    }

    await fs.writeFile(tmpFile, JSON.stringify(linkSet), 'utf-8');
}, interval);
