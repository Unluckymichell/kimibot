// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require("discord.js");
const { readFileSync, writeFileSync } = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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
const kimiNames = readFileSync("./kiminames.txt", { encoding: "utf-8" })
  .replace(/\r/g, "")
  .split("\n");

client.on("ready", async () => {
  (await client.guilds.resolve("445980619483119616").members.fetch()).forEach(
    (m) => kimify(m)
  );
});

client.on("guildMemberUpdate", async (_, m) => {
  kimify(m);
});

client.login(config.token);

/**
 * @param {GuildMember} m
 */
function kimify(m) {
  if (m.guild != "445980619483119616") return;
  if (!m.displayName.replace(/\s/g, "").replace(/1/g, "i").match(kimiRegex)) {
    let nick = kimiNames[randomInt(0, kimiNames.length - 1)];
    console.error(`[${m.displayName}] EDIT: "${nick}"`);
    //m.edit({ nick });
  } else console.log(`[${m.displayName}] OK`);
}

function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  let out = Math.floor(Math.random() * (max - min + 1)) + min;
  return out <= max ? out : max;
}
