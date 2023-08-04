const Discord = require('discord.js');
const client = new Discord.Client({ 
  intents: [ Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.MessageContent ],
  partials: [ 'MESSAGE', 'CHANNEL' ],
});

const dotenv = require('dotenv');
dotenv.config();

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

client.login(process.env.DISCORD_SECRET_TOKEN);

console.log("yo");