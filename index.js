// Include required modules.
var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server.
var port = process.env.port || 3978;
var server = restify.createServer();
server.listen(port);

// Data enpoint.
var base_url = 'https://health.data.ny.gov'; 
// Base query path.
var query_path = '/resource/cnih-y5dw.json'; 
// Query parameters.
var query_params = '?county=Onondaga&$select=operation_name,%20nys_health_operation_id&$where=starts_with(operation_name,%20%27[name]%27)';
// URL for Eat Safe site.
var url = 'http://eatsafecny.org/'; 

// Create bot.
var bot = new builder.BotConnectorBot({ appId: 'YourAppId', appSecret: 'YourAppSecret' });

// Set up default server route.
server.post('/inspections', bot.verifyBotFramework(), bot.listen());

// Root dialog.
bot.add('/', new builder.CommandDialog()
	.matches('^help', builder.DialogAction.beginDialog('/help'))
	.onDefault(function (session, args) {
        session.beginDialog('/lookup');
    } 
));

// Dialog to lookup inspection results for location.
bot.add('/lookup', function (session) {
    	var client = restify.createJsonClient(base_url);
    	var path = query_path + query_params.replace('[name]', encodeURIComponent(session.message.text));
    	client.get(path, function(err, req, res, obj) {
			if(!err) {
				if (obj.length == 0) {
					session.send('No results found for: "' + session.message.text + '"');
				}
				else if (obj.length == 1) {
					session.send('1 result found. ' + obj[0].operation_name + ': ' + url + '?id=' + obj[0].nys_health_operation_id);
				}
				else {
					session.send(obj.length + ' results found: ' + url + '?search=' + session.message.text);
				}
				session.endDialog();
			}
			else {
				console.log(err.msg);
				session.send('Sorry, an error occured. Please try later, or look up results here: ' + url);
			}
		});
    }
);

// Help dialog.
bot.add('/help', function(session) {
	session.send('Enter the name (or partial name) of the establishment you would like to look up.');
	session.endDialog();
});
