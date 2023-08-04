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

client.on('messageCreate', message => {
  if (message.content.toLowerCase() === safeword.toLowerCase() && !message.author.bot) {
    message.channel.send('Please, calm down and move the discussion to the appropriate channel.');
    const auditChannel = message.guild.channels.cache.get(auditChannelID);
    if (auditChannel) {
      auditChannel.send(`User ${message.author.tag} used the safeword in <#${message.channel.id}>.`);
    }
  }
});

const pingCommand = {
  data: new Discord.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong"),
  async execute(interaction) {
    await interaction.reply("Pong");
  }
};

const commands = [ pingCommand ].map(c => { return { data: c.data.toJSON(), execute: c.execute }});

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

console.log("yo");