// simple js file for easy access to some constants
const devId        = '203281664699269121';
const file         = './stats.json';
const logFile      = './app.log';
const feedbackFile = './feedback.txt';
const prefixes     = ['!swear', 's.'];

const help = `Help: \`\`\`!swear [...]
  h | help: Shows this help message.
  l | ls | list: Shows the list of words that are counted.
  t | top [users | servers | swears] [n = 5]: shows the top n number global statistics of the bot.
  here | stats: shows the statistics for the current server.
  fb | feedback <message...>: gives feedback to the developer of the bot. Thanks!
  link | invite: gives a link for adding the bot to your own server.
  @mention(s): gives user statistics based on who you mention in the message.\`\`\``;

// fun bits and bobs
const activities = [
	'with fire', 'with naughty words', 'in the sand', 'Dark Souls', // playing
	'everyone', 'more bad words', 'Mozart', 'some screaming', // listening to
	'the chat', 'someone yell', 'interesting videos', 'DEFCON 1' // watching
];

// this is probably the most i've used any swear word in a single hour
const swears = [
	'fuck', 'cunt', 'ass', 'damn', 'damnit',
	'shit', 'goddamn', 'asshole', 'dyke', 'fuckwad',
	'turk', 'asshat', 'jackass', 'fucker', 'furry',
	'motherfucker', 'frigger', 'godsdamn', 'hell',
	'arse', 'bastard', 'bitch', 'bollocks', 'holy shit',
	'horseshit', 'jesus fuck', 'prick', 'shitass', 'shit ass',
	'slut', 'son of a bitch', 'twat', 'nigger', 'fag',
	// nice words
	'frick', 'dang', 'darn', 'hecc', 'hekk', 'heck', 'poo', 'pee',
	'dingus'
];

module.exports = {
	devId,
	file,
	logFile,
	feedbackFile,
	prefixes,
	help,
	activities,
	swears
};