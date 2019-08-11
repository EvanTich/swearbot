const NOTICE = '_**Notice: This bot, and programmer, does not condone using any of these words.**_\n\n';
const DEBUG = false;

const stuff = require('./stuff');
const token = require('./token');

const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

var stats = require(stuff.file); // ez

// var stats = {
	// swears: {}, // 'swear key': # of times used
	// users: {}, // 'user id': {'names': [], 'swears': {}, 'total': 0}
	// guilds: {} // 'guild id': {'names': [], 'swears': {}, 'total': 0}
// };

function getSwearStats(swears, n = 5) {
	let arr = Object.keys(swears)
		.sort((a, b) => swears[b] - swears[a]);
	let rtn = '```';
	for(let i = 0; i < n && i < arr.length; i++) {
		rtn += `${arr[i]}: ${swears[arr[i]]}\n`;
	}
	return rtn + '```';
}

function getStats(thing) {
	return `**${thing.names.join(', ')}**: Total: ${thing.total}\n${getSwearStats(thing.swears)}`;
}

function getWorstStat(stat, statString, func = getStats, n = 5) {
	let arr = Object.values(stat)
		.sort((a, b) => b.total - a.total);
	let rtn = `Top ${n} **Worst** ${statString}: \n`;
	// add top n worst things 
	for(let i = 0; i < n && i < arr.length; i++) {
		rtn += func(arr[i]);
	}

	return rtn;
}

function getGuildStats(guild) {
	if(guild.id in stats.guilds)
		return getStats(stats.guilds[guild.id]);
	return `Nobody in ${guild.name} has said any bad words.`;
}

function getWorstGuilds(n = 5) {
	return getWorstStat(stats.guilds, 'Guilds');
}

function getUserStats(user) {
	if(user.id in stats.users)
		return getStats(stats.users[user.id]);
	return `${user.username} has not uttered *any* profanities while under the watch of the swear bot.`;
}

function getWorstUsers(n = 5) {
	return getWorstStat(stats.users, 'Users');
}

function doStat(thing, name, swear) {
	if(thing == null) {
		thing = {
			'names': [name],
			'swears': {},
			'total': 0
		};
	}
	if(!thing.names.includes(name)) {
		thing.names.push(name);
	}

	if(thing.swears[swear] == null)
		thing.swears[swear] = 0; // define as initial value if not

	thing.swears[swear]++;
	thing.total++;

	return thing;
}

function commands(msg, args) {
	switch(args[1]) {
		// case 'about': // now that I think about it I don't like random people contacting me through discord
		// 	return `Created by <@${stuff.devId}> because I thought it was an ok concept.`;
		case 'invite':
		case 'link':
			return new Discord.RichEmbed()
				.setAuthor(client.user.username)
				.setTitle('Here\'s a link! (Click here)')
				.setURL('https://discordapp.com/api/oauth2/authorize?client_id=608505931495374861&permissions=379968&scope=bot')
				.setDescription('This bot is not safe for work nor the light-hearted.')
				.setColor('GREEN')
				.setThumbnail(client.user.avatarURL);
		case 'feedback':
			let feedback = msg.content.substring(16).trim();
			if(!feedback) return false; // silent fail

			let data = `${msg.author.tag}: ${feedback}\n`; // '!swear feedback '.length == 16
			log(stuff.feedbackFile, data);

			return 'Thanks for the feedback!';
		case 'help':
			// this spacing is for my own sanity
			return 'Help: ```!swear [...]\n' + 
			'  help: shows this help message.\n' + 
			'  list: shows the list of words that are counted.\n' + 
			'  top [users, servers, swears]: shows the global statistics of the bot.\n' + 
			'  here | stats: shows the statistics for the current server.\n' + 
			'  feedback [message...]: gives feedback to the developer of the bot. Thanks!\n' + 
			'  invite | link: gives a link for adding the bot to your own server.\n' + 
			'  @mention(s): gives user statistics based on who you mention in the message.```';
		case 'list':
			return `${NOTICE}*Swears that are counted:*\n${stuff.swears.join(', ')}.`;
		case 'top':
			if(args.length >= 3 && args[2] != 'swears') {
				if(args[2] == 'users') {
					return `${NOTICE}${getWorstUsers()}`;
				} else if(args[2] == 'servers' || args[2] == 'guilds') {
					return `${NOTICE}${getWorstGuilds()}`;
				} 
				// TODO? maybe send a helpful message here
			}
			return `${NOTICE}Top 5 Swears:\n${getSwearStats(stats.swears)}\nGrand Total: ${stats.total}`;
		case 'shutdown': // dev only
		case 'restart':
			if(msg.author.id == stuff.devId) {
				// special one
				msg.author.send('Shutting Down...').then(() => client.destroy()).then(() => process.exit(0));
			}
			return false; // just in case
		case 'here':
		case 'stats':
			return `${NOTICE}**Current Server Statistics:**\n${getGuildStats(msg.guild.id)}`;
		default:
			if(msg.mentions.users.size == 0)
				return 'No users mentioned. Please @mention the user(s) you want to see statistics for.';

			// user mentions, if none, show help
			let send = NOTICE;
			for(let user of msg.mentions.users.values()) {
				if(DEBUG) console.log(user.id);
				send += getUserStats(user) + '\n';
			}
			return send;
	}
}

function log(file, data, debugStr = data) {
	fs.appendFile(file, data, err => {
		if(err) console.error(err);
		if(DEBUG) console.log(debugStr);
	});
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if(msg.author.id == client.user.id)
		return; // ignore swearbot messages

	let lower = msg.content.toLowerCase();
	if(lower.startsWith('!swear')) {
		let args = lower.split(' ');
		let send = commands(msg, args);
		if(send) {
			msg.channel.send(send).catch(console.error);
		}
		return; // skip the rest because we just got a command
	}

	let author = msg.author;
	let mGuild = msg.guild;
	
	for(let swear of stuff.swears) {
		if(lower.includes(swear)) { // if the message includes the swear
			if(stats.swears[swear] == null)
				stats.swears[swear] = 0; // define as initial value if not
			stats.swears[swear]++;
			stats.total++;

			if(mGuild.available) {
				stats.guilds[mGuild.id] = doStat(stats.guilds[mGuild.id], mGuild.name, swear);
			} else {
				log(stuff.logFile, `Server outage detected: ${new Date().toISOString()}`);
			}
			
			stats.users[author.id] = doStat(stats.users[author.id], author.username, swear);
		}
	}
});

client.login(token.token).then(() => client.user.setActivity('!swear help'));

setInterval( () => {
	// periodically save stats to file
	let data = JSON.stringify(stats, null, 2); // make human readable
	fs.writeFile(stuff.file, data, err => {
		if(err) console.error(err);
		if(DEBUG) console.log('Data written to file, unless printed otherwise.');
	});

	// change activity randomly
	if(Math.random() > .5) {
		// 50% chance for showing help command
		client.user.setActivity('!swear help');
	} else {
		// 50% chance for other fun things
		let i = Math.floor(Math.random() * stuff.activities.length);
		let type = ['PLAYING', 'LISTENING', 'WATCHING'][Math.floor(i / 4)];
		client.user.setActivity(stuff.activities[i], { type });
	}
}, 300000); // every 5 minutes
