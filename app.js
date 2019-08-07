const NOTICE = '\n**Notice: This bot, and programmer, does not condone using many of these words.**';

const stuff = require('./secret');
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

var stats = require(stuff.file); // ez

// var stats = {
	// swears: {}, // 'swear key': # of times used
	// users: {}, // 'user id': {'names': [], 'swears': {}, 'total': 0}
	// guilds: {} // 'guild id': {'names': [], 'swears': {}, 'total': 0}
// };

function getSwearStats(swears) {
	// FIXME? might need to only have top 5 swears, have n number of swears shown
	let rtn = '```';
	for(let swear in swears) {
		rtn += `${swear}: ${swears[swear]}\n`;
	}
	return rtn + '```';
}

function getStats(thing) {
	return `${thing.names.join(', ')}:\n${getSwearStats(thing.swears)}`;
}

function getGuildStats(guildId) {
	return getStats(stats.guilds[guildId]);
}

function getWorstGuilds() {
	let rtn = '**Worst** Guilds: \n';
	// TODO: get top n guilds
	for(let guild in stats.guilds) {
		rtn += getGuildStats(guild);
	}

	return rtn;
}

function getUserStats(userId) {
	return getStats(stats.users[userId]);
}

function getWorstUsers() {
	let rtn = '**Worst** Users: \n';
	// TODO: get top n useers
	for(let user in stats.users) {
		rtn += getUserStats(user);
	}

	return rtn;
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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if(msg.author.id == stuff.clientId)
		return; // ignore bot messages

	let lower = msg.content.toLowerCase();
	let args = lower.split(' ');
	if(args[0] == '!swear') {
		switch(args[1]) {
			case 'help':
				msg.channel.send('!swear [...] ```\nhelp: shows this help message \nlist: shows the list of words that are counted \nglobal: shows the global statistics of the bot \nstats: shows the server stats```');
				break;
			case 'list':
				msg.channel.send(`Swears that are counted: ${NOTICE}\n${stuff.swears.join(', ')}.`);
				break;
			case 'global':
				msg.channel.send(`Total Swears Used: ${NOTICE}\n${getSwearStats(stats.swears)}`);
				msg.channel.send(`Worst Servers: ${NOTICE}\n${getWorstGuilds()}`);
				msg.channel.send(`Worst Users: ${NOTICE}\n${getWorstUsers()}`);
				break;
			case 'stat':
			default:
				msg.channel.send(`Total Swears Used: ${NOTICE}\n${getSwearStats(stats.guilds[msg.guild.id].swears)}\nTotal: ${stats.guilds[msg.guild.id].total}`);
				break;
		}
		return;
	}

	let author = msg.author;
	let mGuild = msg.guild;
	
	for(let swear of stuff.swears) {
		if(lower.includes(swear)) {
			if(stats.swears[swear] == null)
				stats.swears[swear] = 0; // define as initial value if not
			stats.swears[swear]++;

			// TODO: these are the same, see if works
			let guild = stats.guilds[mGuild.id];
			stats.guilds[mGuild.id] = doStat(guild, mGuild.name, swear);
			// if(guild === 'undefined') {
			// 	guild = stats.guilds[mGuild.id] = {
			// 		'names': [mGuild.name],
			// 		'swears': {},
			// 		'total': 0
			// 	};
			// }
			// if(!guild.names.includes(mGuild.name)) {
			// 	guild.names.push(mGuild.name);
			// }

			// if(guild.swears[swear] === 'undefined')
			// 	guild.swears[swear] = 0; // define as initial value if not

			// guild.swears[swear]++;
			// guild.total++;
			
			// TODO: these are the same, see if works
			let user = stats.users[author.id];
			stats.users[author.id] = doStat(user, author.username, swear);
			// if(user === 'undefined') {
			// 	user = stats.users[author.id] = {
			// 		'names': [author.username],
			// 		'swears': {},
			// 		'total': 0
			// 	};
			// }
			// if(!user.names.includes(author.username)) {
			// 	user.names.push(author.username);
			// }

			// if(user.swears[swear] === 'undefined')
			// 	user.swears[swear] = 0; // define as initial value if not
			
			// user.swears[swear]++;
			// user.total++;
		}
	}
});

client.login(stuff.token);

setInterval( () => {
	// save stats to file
	let data = JSON.stringify(stats, null, 2); // make human readable
	fs.writeFile(stuff.file, data, err => {
		if(err) console.log(err);
		console.log('Data written to file, unless printed otherwise.');
	});
}, 60000); // every minute