var { Telegram } = require("telegraf");
var { HLTV } = require("hltv");
var fs = require("node:fs");
var path = require("path");
require('dotenv').config();

var chatID = process.env.CHAT_ID;
var token = process.env.BOT_TOKEN;
var interval = process.env.INTERVAL;
var logInFile = process.env.LOG_IN_FILE;
var message = process.env.MESSAGE;

var tmpFile = "./db/data.json"
var hltvLink = "https://www.hltv.org";
var bot = new Telegram(token);
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

    console.log('Initialize log into file');
}


if (fs.existsSync(tmpFile)) {
    const data = require(tmpFile);
    linkSet = new Set(data);
    console.log('Load data from .json file');
}

var mainFunc = (
    async () => {
        const news = await HLTV.getNews()
        .catch(err => console.error(`HLTV ${err.message}`));;
        const linksToNews = news.map(value => value.link);


        if (linkSet === undefined) {
            linkSet = new Set(linksToNews);
        } else {
            const newLinkSet = new Set(linksToNews);
            const newNews = newLinkSet.difference(linkSet);
            linkSet = newLinkSet;

            await Promise.all([...newNews].map(async element => {
                const newNewLink = hltvLink + element;
                await bot.sendMessage(chatID, `${message} ${newNewLink}`)
                .catch(err => console.error(`TG ${err.message}`));
            }));

        }

        var dataToFile = Array.from(linkSet);
        await fs.writeFile(tmpFile, JSON.stringify(dataToFile), {flag: "w+"}, (err) => {
            if (err) throw err;
        });
        setTimeout(mainFunc, interval);
    }
);

console.log('Start application');
mainFunc();