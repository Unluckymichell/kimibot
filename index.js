// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require("discord.js");
const { readFileSync, writeFileSync } = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let config;
try {
  config = JSON.parse(readFileSync("./config.json", { encoding: "utf-8" }));
} catch (_err) {
  config = JSON.parse(
    readFileSync("./config.default.json", { encoding: "utf-8" })
  );
  writeFileSync("./config.json", JSON.stringify(config, null, 4), {
    encoding: "utf-8",
  });
}

const kimiRegex = /ki+m+i+|i+m+i+|ki+m+/gi;
const vocalRegex = /[aeiou]/;
const kimiNames = readFileSync("./kiminames.txt", { encoding: "utf-8" })
  .replace(/\r/g, "")
  .split("\n");

client.on("ready", async () => {
  (await client.guilds.resolve("445980619483119616").members.fetch()).forEach(
    (m) => kimify(m)
  );
});
client.on("guildMemberUpdate", (_, m) => kimify(m));
client.on("guildMemberAdd", (_, m) => kimify(m));
client.on("messageCreate", async (m) => {
  if (
    m.guild.id == "445980619483119616" &&
    m.channel.id == "1023605425280659457" &&
    m.content == "update"
  ) {
    console.log("Updating kimiNames");
    (await m.channel.messages.fetch()).forEach(async (m) => {
      if (m.member.id == client.user.id) await m.delete();
      else if (!m.content.startsWith("!noname")) {
        if (m.content == "update") await m.delete();
        else if (m.content.match(kimiRegex)) {
          kimiNames.push(m.content);
          await m.delete();
        } else {
          // React or something
        }
      }
    });

    m.channel.send(kimiNames.join("\n"));
    writeFileSync("./kiminames.txt", kimiNames.join("\n"), {encoding: "utf-8"} );
    console.log("Done updating kimiNames");
  }
});
client.login(config.token);

/**
 * @param {GuildMember} m
 */
function kimify(m) {
  if (m.guild != "445980619483119616") return;
  if (!m.displayName.replace(/\s/g, "").replace(/1/g, "i").match(kimiRegex)) {
    var nick = "";
    if (randomInt(0, 1) == 0 && m.displayName.match(vocalRegex)) {
      let vocalFound = false;
      for (let i = m.displayName.length - 1; i >= 0; i--) {
        if (!vocalFound && `${m.displayName[i]}`.match(vocalRegex)) {
          nick = "imi" + nick;
          vocalFound = true;
        } else nick = m.displayName[i] + nick;
      }
    } else {
      nick = kimiNames[randomInt(0, kimiNames.length - 1)];
    }
    console.error(`[${m.displayName}] EDIT: "${nick}"`);
    m.edit({ nick });
  } else console.log(`[${m.displayName}] OK`);
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  let out = Math.floor(Math.random() * (max - min + 1)) + min;
  return out <= max ? out : max;
}
