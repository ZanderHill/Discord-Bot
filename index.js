
const Discord = require('discord.js');
const client = new Discord.Client({ 
  intents: [ Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.MessageContent ],
  partials: [ 'MESSAGE', 'CHANNEL' ],
});

const dotenv = require('dotenv');
dotenv.config();
const rest = new Discord.REST().setToken(process.env.DISCORD_SECRET_TOKEN);

const safeword = 'quail'; // case-insensitive safeword
const auditChannelID = '1136808329625206814'; // ID of the channel where the audit logs should be sent
const seriousChannelID = '1136807305569120267'; // ID of the channel to redirect conversation to
const modRoleID = '1137525833121144915'; // ID of the mod role

client.on('messageCreate', message => {
  if (message.content.toLowerCase() === safeword.toLowerCase() && !message.author.bot) {
    const seriousChannel = message.guild.channels.cache.get(seriousChannelID);
    message.channel.send('The conversation is getting a bit too heavy right now. Could you please continue it in ' +  seriousChannel.toString() + '?');
    const auditChannel = message.guild.channels.cache.get(auditChannelID);
    if (auditChannel) {
      auditChannel.send('User ' + message.author.globalName + ' used the safeword in ' + message.channel.toString() + '.');
    }
  }
});

const safewordCommand = {
  data: new Discord.SlashCommandBuilder()
    .setName("quail")
    .setDescription("Says to move to another channel."),
  async execute(interaction) {
    const guildId = interaction.guildId
    const channelId = interaction.channelId
    const seriousChannel = interaction.guild.channels.cache.get(seriousChannelID);
    await client.guilds.fetch(guildId).then(guild => {
      guild.channels.fetch(channelId).then(channel => {
        channel.send('The conversation is getting a bit too heavy right now. Could you please continue it in ' + seriousChannel.toString() + '?');
      })
    });
    await interaction.reply({ content: "Hope this helps calm things down a bit. Feel free to ping or DM the mods if you still feel uncomfortable.", ephemeral: true});
    const auditChannel = interaction.guild.channels.cache.get(auditChannelID);
    if (auditChannel) {
      auditChannel.send('User ' + interaction.user.globalName + ' used the safeword command in ' + interaction.channel.toString() + '.');
    }
  },
};

const alertModsCommand = {
  data: new Discord.SlashCommandBuilder()
    .setName("pingmods")
    .setDescription("Pings the mods in current channel."),
  async execute(interaction) {
    const guildId = interaction.guildId
    const channelId = interaction.channelId
    await client.guilds.fetch(guildId).then(guild => {
      guild.channels.fetch(channelId).then(channel => {
        const modRole = interaction.guild.roles.cache.get(modRoleID)
        channel.send(modRole.toString());
      })
    });
    const auditChannel = interaction.guild.channels.cache.get(auditChannelID);
    auditChannel.send('User ' + interaction.user.globalName + ' used the ping mods command in ' + interaction.channel.toString() + '.');
    await interaction.reply({ content: "The mods will be here soon.", ephemeral: true});
  },
};

const softAlertModsCommand = {
  data: new Discord.SlashCommandBuilder()
    .setName("pingmodssilent")
    .setDescription("Discreetly inform the mods about the current conversation."),
  async execute(interaction) {
    const guildId = interaction.guildId
    const auditChannel = interaction.guild.channels.cache.get(auditChannelID);
    const modRole = interaction.guild.roles.cache.get(modRoleID)
    auditChannel.send(modRole.toString() + ', user ' + interaction.user.globalName + ' is extremely uncomfortable with the conversation in ' + interaction.channel.toString() + '. Please check on the situation.');
    await interaction.reply({ content: "The mods will be here soon.", ephemeral: true});
  },
};

const commands = [ safewordCommand, alertModsCommand, softAlertModsCommand ].map(c => { return { data: c.data.toJSON(), execute: c.execute }});

async function registerCommands() {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands...`);

    const data = await rest.put(
      Discord.Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: commands.map(c => c.data) }
    );

    console.log("Successfully reloaded commands.");
  } catch (error) {
    console.error("Error reloading commands: " + error);
  }
}

registerCommands();

client.on('interactionCreate', async (interaction) => {
  const command = commands.find(c => c.data.name === interaction.commandName);
  if(!command) {
    console.error(`No matching command: ${interaction.commandName}`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_SECRET_TOKEN);