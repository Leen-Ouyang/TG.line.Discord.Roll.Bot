"use strict";
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const channelSecret = process.env.DISCORD_CHANNEL_SECRET;
const fs = require('node:fs');
const clientId = process.env.DISCORD_CHANNEL_CLIENTID || "544561773488111636";
const guildId = process.env.DISCORD_CHANNEL_GUILDID || "628181436129607680";
const commands = [
    /**
    new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Sends a random gif!')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The gif category')
                .setRequired(true)
                .addChoice('Funny', 'gif_funny')
                .addChoice('Meme', 'gif_meme')
                .addChoice('Movie', 'gif_movie')),
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user or a server!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Info about a user')
                .addUserOption(option => option.setName('target').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Info about the server')),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
        .addStringOption(option => option.setName('input').setDescription('Enter a string'))
        .addIntegerOption(option => option.setName('int').setDescription('Enter an integer'))
        .addNumberOption(option => option.setName('num').setDescription('Enter a number'))
        .addBooleanOption(option => option.setName('choice').setDescription('Select a boolean'))
        .addUserOption(option => option.setName('target').setDescription('Select a user'))
        .addChannelOption(option => option.setName('destination').setDescription('Select a channel'))
        .addRoleOption(option => option.setName('muted').setDescription('Select a role'))
        .addMentionableOption(option => option.setName('mentionable').setDescription('Mention something'))
 */
]
    .map(command => command.toJSON());




const rest = new REST({ version: '9' }).setToken(channelSecret);


//remove all old command, devlopment only
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            //    promises.push(rest.delete(deleteUrl));
        }
        //  return Promise.all(promises);

    });


loadingSlashCommands();

//testRegisteredSlashCommands();
registeredGlobalSlashCommands();


function registeredGlobalSlashCommands() {
    rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => {
            console.log('Successfully Global registered application commands.')
        })
        .catch(err => {
            console.error(err)
        });
}

function testRegisteredSlashCommands() {
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => {
            console.log('Successfully registered application commands.')
        })
        .catch(err => {
            console.error(err)
        });
}





function loadingSlashCommands() {
    const commandFiles = fs.readdirSync('./roll/').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`../roll/${file}`);
        if (command && command.discordCommand) {
            pushArraySlashCommands(command.discordCommand)
        }
    }

}
function pushArraySlashCommands(arrayCommands) {
    for (const file of arrayCommands) {
        commands.push(file.data.toJSON());
    }
}

//https://github.com/discordjs/guide/tree/main/code-samples/creating-your-bot/command-handling

    //https://discordjs.guide/creating-your-bot/creating-commands.html#command-deployment-script
//    https://discordjs.guide/popular-topics/builders.html#links