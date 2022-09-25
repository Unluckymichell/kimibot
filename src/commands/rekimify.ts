import {
  APIInteractionDataResolvedGuildMember,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { readFileSync } from "fs";
import { Command, instance } from "../Main";
import { delay } from "../util";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("rekimify")
    .setDescription("ReKimifies Kimi!")
    .addUserOption((option) =>
      option
        .setName("kimi")
        .setDescription("Welchem Kimi?")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.channel) return;
    const channel = interaction.channel;

    if (channel.id != instance.CHANNEL_ID) return;

    const user = interaction.options.getUser("kimi", true);
    const member = await interaction.guild?.members.fetch(user.id);
    if (!member) return;

    instance.kimify(member, true);

    // reply with response
    if (interaction.isRepliable())
      await interaction.reply({ content: "Kimified!", ephemeral: true });
    
  },
};
