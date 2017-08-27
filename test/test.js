const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();

const redis = require('redis-mock');
const client = redis.createClient();
const crypto = require('crypto');

chai.use(chaiHttp);

let recipientId = crypto.createHash('md5').update('johnsmith@gmail.com').digest('hex');

describe('/recipients', ()=>{
 	it('should return 404 on GET', (done)=>{
 		chai.request(server)
 			.get('/')
 			.end((err, res)=>{
 				res.should.have.status(404);
 				done();
 			});
 	});

 	it('should return with URL on valid POST', (done)=>{
 		chai.request(server)
 			.post('/recipients')
 			.send({"email": "johnsmith@gmail.com"})
 			.end((err, res)=>{
 				res.should.be.json;
 				res.should.have.status(200);
 				res.body.url.should.equal('localhost:3000/images/' + recipientId);
 				done();
 			});
 	});

 	it('should return 400 on bad POST body', (done)=>{
 		chai.request(server)
 			.post('/recipients')
 			.send({"hello": "world"})
 			.end((err, res)=>{
 				res.should.have.status(400);
 				done();
 			});
 	});

 	it('should add a single recipient on valid POST', (done)=>{
 		chai.request(server)
 			.post('/recipients')
 			.send({"email": "johnsmith@gmail.com"})
 			.end((err, res)=>{
 				client.hgetall(recipientId, (err, reply)=>{
 					reply.should.be.a('object');
 					reply.should.have.property('email');
 					reply.email.should.equal('johnsmith@gmail.com');
 					done();
 				});
 			});
 	});
});

describe('/images', function() {
	it('should assign a fingerprint to recipient on initial GET', (done)=>{
		chai.request(server)
			.get('/images/' + recipientId)
			.end((err, res)=>{
				client.hgetall(recipientId, (err, reply)=>{
					reply.should.be.a('object');
					reply.should.have.property('clientFingerprint');
					done();
				});
			});
	});

	it('should set ipAddress and timestamp for recipient on GET', (done)=>{
		chai.request(server)
			.get('/images/' + recipientId)
			.end((err, res)=>{
				client.hgetall(recipientId, (err, reply)=>{
					reply.should.be.a('object');
					reply.should.have.property('ipAddress');
					reply.timestamp.should.not.equal(null);
					reply.should.have.property('timestamp');
					reply.timestamp.should.not.equal(null);
					done();
				});
			});
	});

 	it('should send /images/logo.png on GET', (done)=>{
 		chai.request(server)
 			.get('/images/' + recipientId)
 			.end((err, res)=>{
 				res.should.have.status(200);
 				res.headers['content-type'].should.equal('image/png');
 				done();
 			});
 	});
});

describe('/', function(){
	it('should should respond with 404 on GET /', (done)=>{
		chai.request(server)
			.get('/')
			.end((err, res)=>{
				res.should.have.status(404);
				done();
			});
	});
});