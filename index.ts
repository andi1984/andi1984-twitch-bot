require("dotenv").config({ path: "./.dev.env" });

import tmi = require("tmi.js");

// Configuring the client
const client = new tmi.Client({
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: {
    username: process.env.USERNAME,
    password: process.env.TOKEN,
  },
  channels: !!process.env.CHANNEL ? [process.env.CHANNEL] : [],
});

type MESSAGE_ARGS = [string, tmi.ChatUserstate, string, boolean];
type COMMAND_ENTRY = keyof typeof CHAT_COMMANDS;

const isCommandKey = (message: string): message is COMMAND_ENTRY => {
  return message in CHAT_COMMANDS;
};

const CHAT_COMMANDS = {
  "!hello": () => {
    !!process.env.CHANNEL && client.say(process.env.CHANNEL, "Hello!");
  },
  "!random": (...args: MESSAGE_ARGS) => {
    // Spread the args array into a list of strings
    const [_, tags] = [...args];
    !!process.env.CHANNEL &&
      client.say(
        process.env.CHANNEL,
        `${
          tags?.username ? `@${tags.username}'s` : "Your"
        } random number: ${Math.floor(Math.random() * 100)}`
      );
  },
};

client.connect().catch(console.error);

client.on("message", (...args) => {
  const [, , message, self] = [...args];
  if (self) return;

  const command: string = message.toLowerCase();
  if (isCommandKey(command)) {
    CHAT_COMMANDS[command](...args);
  }
});

client.on("connected", (address, port) => {
  console.log(`Connected to ${address}:${port}`);

  // !!process.env.CHANNEL &&
  // client.say(process.env.CHANNEL, `@${process.env.USERNAME}, I'm online!`);
});

client.on("hosting", (channel, target, viewers) => {
  console.log(`${channel} is now hosting ${target} for ${viewers} viewers!`);
  client.say(
    channel,
    `@${process.env.USERNAME}, I'm hosting ${target} for ${viewers} viewers!`
  );
});

// TODO: Figure out whether this is about getting hosted, or actively hosting on our own...
client.on("hosted", (channel, target, viewers) => {
  console.log(`${channel} has hosted ${target} for ${viewers} viewers!`);
  client.say(
    channel,
    `@${process.env.USERNAME}, I've hosted ${target} for ${viewers} viewers!`
  );
});
