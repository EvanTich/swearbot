const NOTICE = '_**Notice: This bot, and programmer, does not condone using any of these words.**_\n\n';
const DEBUG = false;

const config = require('./config');
const token = require('./token');

const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();


/**
 * Nice documentation for people who want it. I did it mostly for practice, but it is also useful.
 */
/**
 * 
 * @typedef {Object.<string, number>} NumDict Number dictionary with string keys.
 * 
 * @typedef {Object} Stat
 * @property {String[]} names  The names this user/guild has used or is using.
 * @property {NumDict}  swears An index of numbers keyed by a swear.
 * @property {Number}   total  The total number of swears used.
 * 
 * @typedef {Object.<string, Stat>} StatDict Stat dictionary with string keys.
 * 
 * @typedef {Object} Stats
 * @property {NumDict}  swears An index of numbers keyed by a swear. Used to keep count of individual swears.
 * @property {StatDict} users  An index of Stats keyed by a user id string.
 * @property {StatDict} guilds An index of Stats keyed by a guild id string.
 */
var stats = require(config.file); // ez (but bad)

/**
 * Formats the top n number of swears in the given swear dictionary into an easy to read message.
 * @param {NumDict} swears  A swear stat dictionary.
 * @param {Number}  [n = 5] The number of swears to list.
 * @return {String} A formatted code block for Discord with the top swears of the swears object.
 */
function getSwearStats(swears, n = 5) {
	let arr = Object.keys(swears)
		.sort((a, b) => swears[b] - swears[a]);
	let rtn = '```';
	for(let i = 0; i < n && i < arr.length; i++) {
		rtn += `${arr[i]}: ${swears[arr[i]]}\n`;
	}
	return rtn + '```';
}

/**
 * Formats the given stat object into an easy to read message.
 * 
 * 	`**${Name}**: Total: ${N}
 *  ${getSwearStats}`
 * 
 * @see getSwearStats
 * @param {Stat}   stat    A single user/guild stat object.
 * @param {Number} [n = 5] The number of swears to gather.
 * @return {String} A string containing a formatted message with user/guild swear stats.
 */
function getStats(stat, n = 5) {
	return `**${stat.names.join(', ')}**: Total: ${stat.total}\n${getSwearStats(stat.swears, n)}`;
}

/**
 * Formats the given stat object into a string containing a formatted message with the top n most vulgar users/guilds.
 * @see getStats
 * @param {StatDict} stat              A dictionary of Stat objects. Key is the id of a user/guild.
 * @param {String}   statString        The string showing 
 * @param {Number}   [n = 5]           The number of users/guilds to list.
 * @param {Function} [func = getStats] The format function for the stat objects.
 * @return {String} A string containing a formatted message with the top n most vulgar users/guilds.
 */
function getWorstStat(stat, statString, n = 5, func = getStats) {
	let arr = Object.values(stat)
		.sort((a, b) => b.total - a.total);
	let rtn = `Top ${n} **Worst** ${statString}: \n`;
	// add top n worst users/guilds
	for(let i = 0; i < n && i < arr.length; i++) {
		rtn += func(arr[i]);
	}

	return rtn;
}

/**
 * Formats the given guild object into a string with it's swear stats.
 * @see discord.js
 * @see getStats
 * @param {Guild}  guild   The guild to get stats for.
 * @param {Number} [n = 5] The number of swears to gather.
 * @return {String} A string with the given guild stats.
 */
function getGuildStats(guild, n = 5) {
	if(guild.id in stats.guilds)
		return getStats(stats.guilds[guild.id], n);
	return `Nobody in ${guild.name} has said any bad words.`;
}

/**
 * Formats the given guild object into a string with it's swear stats.
 * @see discord.js
 * @see getStats
 * @param {User}   user    The user to get stats for.
 * @param {Number} [n = 5] The number of swears to gather.
 * @return {String} A string with the given user stats.
 */
function getUserStats(user, n = 5) {
	if(user.id in stats.users)
		return getStats(stats.users[user.id], n);
	return `${user.username} has not uttered *any* profanities while under the watch of the swear bot.`;
}

/**
 * Returns a string containing a formatted message with the top n most vulgar guilds.
 * @see getWorstStat
 * @param {Number} [n = 5] The number of guilds to list.
 * @return {String} A string containing a formatted message with the top n most vulgar guilds.
 */
function getWorstGuilds(n = 5) {
	return getWorstStat(stats.guilds, 'Guilds', n);
}

/**
 * Returns a string containing a formatted message with the top n most vulgar users.
 * @see getWorstStat
 * @param {Number} [n = 5] The number of users to list.
 * @return {String} A string containing a formatted message with the top n most vulgar users.
 */
function getWorstUsers(n = 5) {
	return getWorstStat(stats.users, 'Users', n);
}

/**
 * Increments the given swear for the stat object.
 * @param {Stat}   stat  The swear stat object to change.
 * @param {String} name  The name of the user/guild.
 * @param {String} swear The swear to increment.
 * @return {Stat} The swear stat object.
 */
function doStat(stat, name, swear) {
	if(stat == null) {
		stat = {
			'names': [name],
			'swears': {},
			'total': 0
		};
	}
	if(!stat.names.includes(name)) {
		stat.names.push(name);
	}

	if(stat.swears[swear] == null)
		stat.swears[swear] = 0; // define as initial value if not

	stat.swears[swear]++;
	stat.total++;

	return stat;
}

/**
 * Controls all of the bot's commands. It does what it's expected to do. Hopefully.
 * @param {Message}  msg  The original discord.js message. Contains all necessary data for any bot.
 * @param {String[]} args The arguments of the command, excluding the bot prefix.
 * @return {(String | boolean | RichEmbed)} The message that is expected given the arguments. 
 * 		Returns false if there is no message. Can also return a RichEmbed for inviting.
 */
function commands(msg, args) {
	let n; // ok js
	switch(args[0].toLowerCase()) {
		// case 'about': // now that I think about it I don't like random people contacting me through discord
		// 	return `Created by <@${config.devId}> because I thought it was an ok concept.`;
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
			let feedback = args.slice(1).join(' ');
			if(!feedback) return false; // silent fail

			let data = `${msg.author.tag}: ${feedback}\n`;
			log(data, config.feedbackFile);

			return 'Thanks for the feedback!';
		case 'h':
		case 'help':
			return config.help;
		case 'l':
		case 'ls':
		case 'list':
			return `I am not at liberty to say the whole list, but I keep track of ${config.swears.length} swears.`;
		case 't':
		case 'top':
			n = 5;
			if(args.length >= 2) {
				// check if there is a number
				if(args.length >= 3 && !isNaN(args[2]))
					n = parseInt(args[2]); // loosely parsing argument to a number

				switch(args[1].toLowerCase()) {
					case 'users': return `${NOTICE}${getWorstUsers(n)}`;
					case 'servers':
					case 'guilds': return `${NOTICE}${getWorstGuilds(n)}`;
				}
				
				if(!isNaN(args[1]))
					n = parseInt(args[1]); // check again just in case
			}
			return `${NOTICE}Top ${n} Swears:\n${getSwearStats(stats.swears, n)}\nGrand Total: ${stats.total}`;
		case 'shutdown': // dev only
		case 'restart':
			if(msg.author.id == config.devId) {
				// special one
				msg.author.send('Shutting Down...').then(() => client.destroy()).then(() => process.exit(0));
			}
			return false; // just in case
		case 'here':
		case 'stats':
			// optional n number
			n = 5;
			if(args.length >= 2 && !isNaN(args[1]))
				n = parseInt(args[1]);

			return `${NOTICE}**Current Guild Statistics:**\n${getGuildStats(msg.guild)}`;
		default:
			if(msg.mentions.users.size == 0)
				return 'No users mentioned. Please @mention the user(s) you want to see statistics for.';

			// optional n number
			n = 5;
			if(!isNaN(args[args.length - 1]))
				n = parseInt(args[args.length - 1]);

			// user mentions, if none, show help
			let send = NOTICE;
			for(let user of msg.mentions.users.values()) {
				if(DEBUG) console.log(user.id);
				send += getUserStats(user, n) + '\n';
			}
			return send;
	}
}

/**
 * Appends log data to a file. Basically unused otherthan for feedback and server outages.
 * @param {String} data The data to be appended to the log.
 * @param {String} file Path to the log file.
 * @param {String} debugStr String to print if in debug mode.
 */
function log(data, file = config.logFile, debugStr = data) {
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
	for(let prefix of config.prefixes) {
		if(lower.startsWith(prefix)) {
			let args = msg.content.slice(prefix.length).trim().split(/ +/g);
			let send = commands(msg, args);
			if(send) {
				if(send.length > 2000) {
					msg.reply('The output is too big! Please use less arguments for the command.').catch(console.error);
					return; // cant send the actual message because it is more than 2000 characters (a discord message limit)
				}
				msg.reply(send).catch(console.error);
			}
			return; // skip the rest because we just got a command
		}
	}
	

	let author = msg.author;
	let mGuild = msg.guild;
	
	for(let swear of config.swears) {
		if(lower.includes(swear)) { // if the message includes the swear
			if(stats.swears[swear] == null)
				stats.swears[swear] = 0; // define as initial value if not
			stats.swears[swear]++;
			stats.total++;

			if(mGuild.available) {
				stats.guilds[mGuild.id] = doStat(stats.guilds[mGuild.id], mGuild.name, swear);
			} else {
				log(`Server outage detected: ${new Date().toISOString()}`);
			}
			
			stats.users[author.id] = doStat(stats.users[author.id], author.username, swear);
		}
	}
});

client.login(token.token).then(() => client.user.setActivity('!swear help'));

setInterval( () => {
	// periodically save stats to file
	let data = JSON.stringify(stats, null, 2); // make human readable
	fs.writeFile(config.file, data, err => {
		if(err) console.error(err);
		if(DEBUG) console.log('Data written to file, unless printed otherwise.');
	});

	// change activity randomly
	if(Math.random() > .5) {
		// 50% chance for showing help command
		client.user.setActivity('sw.help');
	} else {
		// 50% chance for other fun things
		let i = Math.floor(Math.random() * config.activities.length);
		let type = ['PLAYING', 'LISTENING', 'WATCHING'][Math.floor(i / 4)];
		client.user.setActivity(config.activities[i], { type });
	}
}, 300000); // every 5 minutes
