// Require the necessary discord.js classes
import {
  ActionRowBuilder,
  APIInteractionDataResolvedGuildMember,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  EmbedType,
  GatewayIntentBits,
  GuildMember,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import fs from "node:fs";
import { machine } from "os";
import path from "path";
import { KimiNames } from "./KimiNames";
import { delay, randomInt } from "./util";

export default class Main {
  public client: Client;
  public rest: REST;

  public CLIENT_ID = "775790075061338152";
  public GUILD_ID = "445980619483119616";
  public CHANNEL_ID = "1023605425280659457";

  public commands = new Collection<string, Command>();
  public registerCommandsData =
    new Array<RESTPostAPIApplicationCommandsJSONBody>();
  public commandsPath = path.join(__dirname, "./commands");
  public commandFiles = fs
    .readdirSync("./build/commands")
    .filter((file) => file.endsWith(".js"));

  public config;
  public kimiRegex = /ki+m+i+|i+m+i+|ki+m+/gi;
  public vocalRegex = /[aeiou]/;
  public kimiNames = new KimiNames("./kiminames.txt");

  constructor() {
    try {
      this.config = JSON.parse(
        readFileSync("./config.json", { encoding: "utf-8" })
      );
    } catch (_err) {
      this.config = JSON.parse(
        readFileSync("./config.default.json", { encoding: "utf-8" })
      );
      writeFileSync("./config.json", JSON.stringify(this.config, null, 4), {
        encoding: "utf-8",
      });
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.client.login(this.config.token);
    this.rest = new REST({ version: "10" }).setToken(this.config.token);

    // commands
    for (const file of this.commandFiles) {
      const filePath = path.join(this.commandsPath, file);
      const command = require(filePath).command as Command;

      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      this.commands.set(command.data.name, command);
      this.registerCommandsData.push(command.data.toJSON());
    }

    this.rest
      .put(Routes.applicationGuildCommands(this.CLIENT_ID, this.GUILD_ID), {
        body: this.registerCommandsData,
      })
      .then(() => console.log("Successfully registered application commands."))
      .catch(console.error);

    // events thingy
    this.init();
  }

  init() {
    this.client.on("ready", async () => {
      (
        await this.client.guilds.resolve("445980619483119616")!!.members.fetch()
      ).forEach((m) => this.kimify(m));
    });

    this.client.on("guildMemberUpdate", (_, m: GuildMember) => this.kimify(m));
    this.client.on("guildMemberAdd", (m: GuildMember) => this.kimify(m));

    this.client.on("messageCreate", async (m) => {
      if (!m.guild) return;
      if (m.guild.id != this.GUILD_ID) return;
      if (m.channel.id != this.CHANNEL_ID) return;
      if (!m.member) return;
      if (!this.client.user) return;
      if (m.member.id == this.client.user.id) return;
      if (m.content.startsWith("!noname")) return;
      if (m.system) return;

      if (!this.kimiNames.hasName(m.content)) {
        if (m.content.match(this.kimiRegex)) {
          this.kimiNames.addName(m.content);
          this.kimiNames.save();
          const row = this.nameActionRoleBuilder();
          m.channel.send({ content: `${m.content}`, components: [row] });
          m.delete();
        } else {
          const reply = await m.reply({
            content: `Kein **Vali**der Kimi!`,
          });
          await delay(5000);
          m.delete();
          reply.delete();
        }
      } else {
        const reply = await m.reply({
          content: `Diesen Kimi gibt es schon!`,
        });
        await delay(5000);
        m.delete();
        reply.delete();
        return;
      }
    });

    // on ChatInputCommand
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandGuildId != this.GUILD_ID) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    });

    // on button clicks
    this.client.on("interactionCreate", async (i) => {
      if (!i.isButton()) return;

      switch (i.customId) {
        case "cmd_update_remove":
          await i.reply({ content: "Removed!", ephemeral: true });
          i.message.delete();
          this.kimiNames.deleteName(i.message.content);
          this.kimiNames.save();
          break;
        case "cmd_update_list":
          const guild = await this.client.guilds.fetch("445980619483119616")
          await guild.members.fetch();
          const kimis: GuildMember[] = [];
          guild.members.cache.filter(m => m.displayName == i.message.content).forEach(m => kimis.push(m));
          
          i.message.edit({
            content: i.message.content,
            components: [this.nameActionRoleBuilder(true)],
            embeds: [
              {
                title: `Alle Kimis mit diesem Kimi!`,
                description: kimis.map(m => `<@${m.id}>`).join("\n"),
                color: 0xff0000,
              },
            ],
          });
          i.deferUpdate();
          break;
        case "cmd_remove_embed":
          i.message.edit({
            content: i.message.content,
            components: [this.nameActionRoleBuilder()],
            embeds: [],
          });
          i.deferUpdate();
          break;
        default:
          await i.reply({ content: "Unknown button!", ephemeral: true });
          break;
      }
    });
  }

  nameActionRoleBuilder(embed: boolean = false) {
    if(!embed) return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Entfernen!")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("cmd_update_remove"),
      new ButtonBuilder()
        .setLabel("Wer hat den?")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("cmd_update_list")
    );
    else return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Entfernen!")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("cmd_update_remove"),
      new ButtonBuilder()
        .setLabel("Weg mit dem Fenster!")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("cmd_remove_embed")
    );
  }

  kimify(m: GuildMember, force: boolean = false) {
    if (m.guild.id != "445980619483119616") return;

    if (
      !m.displayName.replace(/\s/g, "").replace(/1/g, "i").match(this.kimiRegex) || force
    ) {
      var nick = "";
      if (randomInt(0, 1) == 0 && m.displayName.match(this.vocalRegex)) {
        let vocalFound = false;
        for (let i = m.displayName.length - 1; i >= 0; i--) {
          if (!vocalFound && `${m.displayName[i]}`.match(this.vocalRegex)) {
            nick = "imi" + nick;
            vocalFound = true;
          } else nick = m.displayName[i] + nick;
        }
      } else {
        nick = this.kimiNames.getRandom();
      }
      console.error(`[${m.displayName}] EDIT: "${nick}"`);
      m.edit({ nick });
    } else console.log(`[${m.displayName}] OK`);
  }
}

export var instance = new Main();

export interface Command {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(interaction: ChatInputCommandInteraction<CacheType>): any;
}
