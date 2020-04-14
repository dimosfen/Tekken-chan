
const Discord = require('discord.js');
const Util = require('discord.js');
const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');
const queue = new Map();
const {
    prefix,
    token,
    youtubeAPI
} = require('./config.json');
const {
    skill,
picture,
level_abil,
level_char,
need_od,
memory,
re}= require('./Aerotheurge.json');

var volumeTec = 2;
const client = new Discord.Client();
const youtube = new YouTube(youtubeAPI);
client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity(`with your feelings.`);
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', async message => {
    if (message.author.bot) return;
    if (message.content.includes("529572731537326080") && message.member.voiceChannel) { connect(message, false) } else { if (message.content.includes("529572731537326080")) { message.reply("Гавно") } else { if (!message.content.startsWith('!' + prefix)) { return } } }
    var args = message.content.substring(1).split(' ');
    var cmd = args[1];
    args = args.splice(1);
    const serverQueue = queue.get(message.guild.id);
    switch (cmd) {
        case 'join':
            connect(message, true);
            break;
        case 'disconnect':
            disconnect(message);
            break;
        case 'play':
            const argss = message.content.split(' ');
            const searchString = argss.slice(2).join(' ');
            const url = argss[2] ? argss[2].replace(/<(.+)>/g, '$1') : '';
            execute(message, serverQueue, url, searchString);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'DOS':
                DOS(message);
                break;  
    }
});
function skip(message, serverQueue) {
    if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
    if (!serverQueue) return message.channel.send('There is nothing playing that I could skip for you.');
    serverQueue.connection.dispatcher.end('Skip command has been used!');
}

function stop(message, serverQueue) {
    if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
    if (!serverQueue) return message.channel.send('There is nothing playing that I could stop for you.');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end('Stop command has been used!');
    return undefined;
}
/*
function reportIn(message){
    const dataCPU = si.cpu();
    const dataTemp = si.cpuTemperature();
    const dataRAM = si.mem();
    message.reply(dataCPU.speed+"\n"+dataTemp.main);
}
*/
function connect(message, a) {
    if (message.member.voiceChannel) {
        message.member.voiceChannel.join()
            .then(connection => {
                if (a) { message.reply("I have successfully connected to the channel!") } else { message.reply("OWO!") }
            })
            .catch(console.log);
    } else {
        message.reply('You need to join a voice channel first!');
    }
}
function disconnect(message) {
    if (message.member.voiceChannel !== undefined) {
        message.member.voiceChannel.leave();
        // message.reply("I have successfully left the voice channel!");
    } else {
        message.reply("I'm not connected to a voice channel!");
    }
}


async function execute(msg, serverQueue, url, searchString) {
    const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has('CONNECT')) {
        return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
    }
    if (!permissions.has('SPEAK')) {
        return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
    }

    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
        const playlist = await youtube.getPlaylist(url);
        const videos = await playlist.getVideos();
        for (const video of Object.values(videos)) {
            const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
            await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
        }
        return msg.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`);
    } else {
        try {
            var video = await youtube.getVideo(url);
        } catch (error) {
            try {
                var videos = await youtube.searchVideos(searchString, 10);
                let index = 0;
                const videoIndex = parseInt(1);
                var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
            } catch (err) {
                console.error(err);
                return msg.channel.send('🆘 I could not obtain any search results.');
            }
        }
        return handleVideo(video, msg, voiceChannel);
    }
}

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`I could not join the voice channel: ${error}`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return undefined;
        else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`);
    }
    return undefined;
}


function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        //serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    //console.log(serverQueue.songs);
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
            if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
}
    function DOS(message){
        message.reply(skill+"\n");
    }
client.login(token);