const { Telegram } = require("telegraf");
const { HLTV } = require("hltv");
const fs = require("node:fs");
const path = require("path");
const { clear } = require("node:console");
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
    const logFileDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logFileDir))  {
        fs.mkdirSync(logFileDir)
    }

    const logFilePath = path.join(logFileDir, "logs");
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

    console.log('Initialize log into file');
}


if (fs.existsSync(tmpFile)) {
    const data = require(tmpFile);
    linkSet = new Set(data);
    console.log('Load data from .json file');
} else if(!fs.existsSync("./db")){
    fs.mkdirSync("./db");
}

var isRunning = false;

var mainFunc = (
    async () => {
        if (isRunning) {
            return;
        }
        
        const news = await HLTV.getNews()
        .catch(err => console.error(`HLTV ${err.message}`));;
        const linksToNews = news.map(value => value.link);


        if (linkSet === undefined) {
            linkSet = new Set(linksToNews);
            isRunning = false;
            return;
        } 

        const newLinkSet = new Set(linksToNews);
        const newsToSend = newLinkSet.difference(linkSet);
        linkSet = newLinkSet;

        for (const link of newsToSend) {
            const fullLink = `${hltvLink}${link}`;
            await bot.sendMessage(chatID, `${message} ${fullLink}`).catch(err => {
                console.log(err);
            });
        }
        var dataToFile = Array.from(linkSet);
        await fs.writeFile(tmpFile, JSON.stringify(dataToFile), {flag: "w+"}, (err) => {
            if (err) throw err;
        });

        isRunning = false;
    }
);

var setIntervalID = setInterval(mainFunc, interval);

process.on("SIGINT", () => clearInterval(setIntervalID));
process.on("SIGTERM", () => clearInterval(setIntervalID));