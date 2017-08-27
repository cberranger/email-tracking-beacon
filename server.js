const crypto = require('crypto');
const express = require('express');
const fingerprint = require('express-fingerprint');
const bodyParser = require('body-parser');
const redis = require('redis-mock');
const Promise = require('bluebird');

Promise.promisifyAll(redis);

const client = redis.createClient();
const app = express();

app.use(bodyParser.json());
app.use(fingerprint({parameters: [fingerprint.useragent, fingerprint.geoip]}));

app.post('/recipients', (req, res)=>{
	if(req.body && req.body.hasOwnProperty('email')){
		const email = req.body.email;
		const recipientId = crypto.createHash('md5').update(email).digest('hex');

		client.hmset(recipientId, {
			'email' : email
		});

		res.send({
			url: 'localhost:3000/images/' + recipientId
		});	
	} else {
		res.status(400);
		res.send({error: '400 Bad Request'});
	}
	
});

app.get('/images/:recipientId', (req, res)=>{

	const recipientId = req.params.recipientId;
	let deliveryStatus = '';

	client.hgetAsync(recipientId, 'clientFingerprint')
	.then((clientFingerprint)=>{
		if(clientFingerprint === null || clientFingerprint === undefined){
			client.hmset(recipientId, {
				'clientFingerprint' : req.fingerprint.hash
			});
			deliveryStatus = 'This email was opened for the first time';
		} else if(clientFingerprint === req.fingerprint.hash){
			deliveryStatus = 'This email was likely reopened from same device'; 
		} else{
			deliveryStatus = 'This email was likely reopened from a device different than original';
		}

		client.hmset(recipientId, {
			'ipAddress': getIpAddress(req), //returns ::1 if on local host
			'timestamp': Date.now(),
		});

		return client.hgetallAsync(recipientId);
	})
	.then((reply)=>{
		let trackingInfo = reply;
		trackingInfo.status = deliveryStatus;

		sendMockEmail(trackingInfo);
		
		res.sendFile(__dirname + '/images/logo.png');
	}, (err)=>{
		console.log(err);
	});

	// client.hget(recipientId, 'clientFingerprint', (err, clientFingerprint)=>{
	// 	if(clientFingerprint === null || clientFingerprint === undefined){
	// 		client.hmset(recipientId, {
	// 			'clientFingerprint' : req.fingerprint.hash
	// 		});
	// 		deliveryStatus = 'This email was opend for the first time';
	// 	} else if(clientFingerprint === req.fingerprint.hash){
	// 		deliveryStatus = 'This email was likely reopened from same device'; 
	// 	} else{
	// 		deliveryStatus = 'This email was likely reopened from a device different than original'
	// 	}

	// 	client.hmset(recipientId, {
	// 		'ipAddress': ipAddress,
	// 		'timestamp': Date.now(),
	// 	});

	// 	client.hgetall(recipientId, (err, reply)=>{
	// 		let trackingInfo = reply;
	// 		trackingInfo.status = deliveryStatus;

	// 		sendMockEmail(trackingInfo);
			
	// 		res.sendFile(__dirname + '/images/logo.png');
	// 	});
	// });	
});

//Catch bad API routes
app.all('*', (req, res)=>{
	res.status(404);
	res.send({error: 'That api endpoint does not exist'});
});

app.listen(3000, ()=>{
	console.log('listening on port 3000');
});

module.exports = app;

function getIpAddress(req){
	return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}

function sendMockEmail(trackingInfo){
	console.log('\n');
	console.log('FROM: noreply@tracking.io');
	console.log('SUBJECT: Recipient has been tracked');
	console.log('BODY: ');
	console.log(trackingInfo);
}