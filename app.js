const NOTICE = '**Notice: This bot, and programmer, does not condone using many of these words.**\n\n';
const DEBUG = true;

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
	return `${thing.names.join(', ')}: Total: ${thing.total}\n${getSwearStats(thing.swears)}`;
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

function getGuildStats(guildId) {
	return getStats(stats.guilds[guildId]);
}

function getWorstGuilds(n = 5) {
	return getWorstStat(stats.guilds, 'Guilds');
}

function getUserStats(userId) {
	return getStats(stats.users[userId]);
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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if(msg.author.id == stuff.clientId)
		return; // ignore swearbot messages

	let lower = msg.content.toLowerCase();
	let args = lower.split(' ');
	// this is disgustingly long
	if(args[0] == '!swear') {
		switch(args[1]) {
			case 'help':
				msg.channel.send('!swear [...] ```\nhelp: shows this help message \nlist: shows the list of words that are counted \n' +
				'top [users, servers, swears]: shows the global statistics of the bot \nstats: shows the server stats```');
				break;
			case 'list':
				msg.channel.send(`${NOTICE}\nSwears that are counted:\n${stuff.swears.join(', ')}.`);
				break;
			case 'top':
				if(args.length >= 3) {
					if(args[2] == 'users') {
						msg.channel.send(`${NOTICE}${getWorstUsers()}`);
					} else if(args[2] == 'servers' || args[2] == 'guilds') {
						msg.channel.send(`${NOTICE}${getWorstGuilds()}`);
					} else if(args[2] == 'swears') {
						msg.channel.send(`${NOTICE}Top 5 Swears:\n${getSwearStats(stats.swears)}\nGrand Total: ${stats.total}`);
					} 
				} else {
					msg.channel.send(`${NOTICE}Top 5 Swears:\n${getSwearStats(stats.swears)}\nGrand Total: ${stats.total}`);
				}
				break;
			case 'shutdown':
			case 'restart':
				if(msg.author.id == stuff.devId) {
					msg.author.send('Shutting Down...').then(() => process.exit(0));
				}
				break;
			case 'stat':
				msg.channel.send(`${NOTICE}\nTop 5 Swears in this Server:\n${getSwearStats(stats.guilds[msg.guild.id].swears)}\nTotal: ${stats.guilds[msg.guild.id].total}`);
				break;
			default:
				// user mentions, if none, show help
				// TODO
		}
		return; // skip the rest because we just got a command
	}

	let author = msg.author;
	let mGuild = msg.guild;
	
	for(let swear of stuff.swears) {
		if(lower.includes(swear)) {
			if(stats.swears[swear] == null)
				stats.swears[swear] = 0; // define as initial value if not
			stats.swears[swear]++;
			stats.total++;

			if(mGuild.available) {
				let guild = stats.guilds[mGuild.id];
				stats.guilds[mGuild.id] = doStat(guild, mGuild.name, swear);
			} else {
				console.log(`Discord server outage detected on ${new Date().toISOString()}.`)
			}
			
			let user = stats.users[author.id];
			stats.users[author.id] = doStat(user, author.username, swear);
		}
	}
});

client.login(stuff.token);

setInterval( () => {
	// save stats to file
	let data = JSON.stringify(stats, null, 2); // make human readable
	fs.writeFile(stuff.file, data, err => {
		if(err) console.log(err);
		if(DEBUG) console.log('Data written to file, unless printed otherwise.');
	});
}, 300000); // every 5 minutes