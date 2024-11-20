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
    console.log = (message) => {
        fs.appendFile(logFilePath, message + "\n", (err) => {
            if (err) {
                console.info("Error appending into file");
            }
        });
    }
    console.error = (message) => {
        fs.appendFile(logFilePath, "ERROR: " + message + "\n", err => {
            if (err) {
                console.info("Error appending into file");
            }
        })
    } 
}


if (fs.existsSync(tmpFile)) {
    const data = require(tmpFile);
    linkSet = new Set(data);
}


var intervalId = setInterval(async () => {
    const news = await HLTV.getNews()
    .catch(err => console.error(err.message));;
    const linksToNews = news.map(value => value.link);


    if (linkSet === undefined) {
        linkSet = new Set(linksToNews);
    } else {
        const newLinkSet = new Set(linksToNews);
        const newNews = newLinkSet.difference(linkSet);
        linkSet = newLinkSet;

        await Promise.all(newNews.map(async element => {
            const newNewLink = hltvLink + element;
            await bot.sendMessage(chatID, `${message} ${newNewLink}`)
            .catch(err => console.error(err.message));
            console.log("send");
        }));

    }

    var dataToFile = Array.from(linkSet);
    await fs.writeFile(tmpFile, JSON.stringify(dataToFile), 'utf-8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      }); 
}, interval);

process.on("SIGTERM", clearInterval(intervalId));
process.on("SIGINT", clearInterval(intervalId));