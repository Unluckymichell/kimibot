import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { readFileSync } from "fs";
import { Command, instance } from "../Main";
import { delay } from "../util";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Updates Kimi!"),

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.channel) return;
    const channel = interaction.channel;

    if (channel.id != instance.CHANNEL_ID) return;
    instance.kimiNames.load();

    // TODO: Make bot great
    if (interaction.isRepliable())
      await interaction.reply({ content: "Update executed", ephemeral: true });

    (await channel.messages.fetch()).forEach((m) => {
      if (!m.content.startsWith("!noname")) m.delete();
    });

    // send everything
    for (const kname of instance.kimiNames.kimiNames) {
      const row = instance.nameActionRoleBuilder();
      await channel.send({ content: `${kname}`, components: [row] });
    }
  },
};
