const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require("crypto");
const WebSocketServer = new require('ws');

let clients = {};
let clientslogins = {};

var counterClients = 0;
function countKeys(object) {
	count = 0;
	for(key in object) {
		count++;
	}
	return count;
}

let myWebSocketServer = new WebSocketServer.Server({
	port: 8081
});

function getUserName(login, id){
	users.find({login: login}, function(err, docs){
		if(err){
			throw err;
		}
		else {
			clientslogins[id] = docs[0].name;
		}
	});
	return clientslogins[id];
}

function setuserlogintochat(variants, id){
	let cookies_to_array = variants.split(';%20');
	return cookies_to_array;
}

myWebSocketServer.on('connection', function(ws, data) {
	let ck = data.url;
	counterClients++;
	let id = counterClients;
	clients[id] = ws;
	let logins = setuserlogintochat(ck.substr(1), id);
	if(setuserlogintochat(ck.substr(1), id)) {
		let arr = [];
		logins.forEach(function(el){
			let name = el.split('=')[0];
			let val = el.split('=')[1];
			arr.push({name: name, val: val});
		});
		console.log(arr);
		let myreturn = false;
		arr.forEach(function(el){
			if(el.name == 'userlogin'){
				users.find({login: el.val}, function(err, docs){
					if(err){
						throw err;
					}
					else {
						clientslogins[id] = docs[0].name + ' ' + docs[0].surename;
						console.log('Найден логин!');
						for (let key in clients) {
							clients[key].send('Пользователь [' + clientslogins[id] + '] присоединился к чату.');
						}
						clients[id].on('message', function (message) {
							console.log('получено сообщение ' + message);
							for (let key in clients) {
								clients[key].send('[' + clientslogins[id] + ']: ' + message);
							}
						});
						clients[id].on('close', function () {
							console.log('соединение закрыто ' + clientslogins[id]);
							for (let key in clients) {
								clients[key].send('Пользователь [' + clientslogins[id] + '] покинул чат.');
							}
							delete clients[id];
							delete clientslogins[id];
						});
					}
				});
			}
		});
	}
});

mongoose.connect('mongodb://localhost:27017/myDataBase', {useNewUrlParser: true});
let users = mongoose.model('users', {
	name: String,
	surename: String,
	patronymic: String,
	login: String,
	hashlogin: String,
	email: String,
	password: String
});
//установка соединения с базой данных

const conf = require('./config.js');
const systemFunctions = require('./validateform.js');
//импорт всех модулей

let ipAddress = conf.ipAddress;//IP-адресс сервера
let expressPort = conf.expressPort;//порт, который будет прослушивать HTTP-сервер
let port = process.env.PORT || expressPort;//

let nodeServer = express();//инициализация сервера
let urlEncoderParser = bodyParser.urlencoded({extended: false});//создание парсера форм

nodeServer.listen(port, ipAddress);//сервер начинает прослушивание порта

nodeServer.use(cors());
nodeServer.use('/css', express.static(__dirname + conf.cssDir));
nodeServer.use('/img', express.static(__dirname + conf.imgDir));
//открытие доступа к внешним папкам

nodeServer.get('/home', function(req, res){
	res.sendFile(__dirname + '/site/home.html');
});

let resvalidateFinal = {};

function setfinalresults(req, obj){
	let ServerAnswer = '';
	resvalidateFinal = obj;
	for (let resvalidateKey in resvalidateFinal) {
		ServerAnswer = ServerAnswer + resvalidateFinal[resvalidateKey];
	}
	if(ServerAnswer == ''){
		let makeLoginHashReg = crypto.createHash("sha256");
		let makePasswordHashReg = crypto.createHash("sha256");
		makeLoginHashReg.update(req.body.login);
		makePasswordHashReg.update(req.body.password);
		let resultHashLogin = makeLoginHashReg.digest("base64");
		let resultHashPassword = makePasswordHashReg.digest("base64");
		let newUser = new users({
            name: req.body.name ,
            surename: req.body.surename ,
            patronymic: req.body.patronymic,
            login:  req.body.login,
			hashlogin: resultHashLogin,
            email:  req.body.email,
            password: resultHashPassword
        });
        newUser.save();
        return 'Аккаунт создан!';
	}
	else {
		return ServerAnswer;
	}
}

nodeServer.post('/regaccount', urlEncoderParser, function(req, res){
	resvalidate = systemFunctions.validateRegForm(req.body);
	let data = users.find({login: req.body.login}, function(err, docs){
		if(err) {
			throw err;
		}
		else if(docs.length > 0) {
			resvalidate.login = 'Пользователь с таким логином уже зарегистрирован.';
		}
		let answerToClient = setfinalresults(req, resvalidate);
		res.end(answerToClient);
	});
});


nodeServer.post('/auth', urlEncoderParser, function(req, res){
	let validateAuth = {
		login: '',
		password: ''
	}
	let validatelogpass = new RegExp("^[A-z0-9-_]+$");
	if(!validatelogpass.test(req.body.login)){
		res.end('Логин пользователя может состоять из букв английского алфавита, цифр и знаков - _.');
	}
	if(!validatelogpass.test(req.body.password)){
		res.end('Пароль может состоять из букв английского алфавита, цифр и знаков - _.');
	}
	users.find({login: req.body.login}, function(err, docs){
		if(err) {
			throw err;
		}
		else if(docs.length == 0) {
			res.end('Указанный вами логин не существует.');
		}
	});
	let makePasswordHashAuth = crypto.createHash("sha256");
	makePasswordHashAuth.update(req.body.password);
	let resultHashPassword1 = makePasswordHashAuth.digest("base64");
	users.find({login: req.body.login, password: resultHashPassword1}, function(err, docs){
		if(err) {
			throw err;
		}
		else if(docs.length == 0){
			res.end('Неверный пароль.');
		}
		else {
			let cookieName = 'userlogin=' + req.body.login;
			res.setHeader('Set-Cookie', cookieName);
			res.send('complete');
		}
	});
});

function getNamesCookies(ck){
	let arr = [];
	ck.forEach(function(el){
		let name = el.split('=')[0];
		arr.push(name);
	});
	if(arr.indexOf('userlogin') != -1){
		return true;
	}
	else {
		return false;
	}
}

nodeServer.get('/page',function(req, res){
	if(req.headers['cookie']){
		let cookies = req.headers['cookie'];
		let cookies_to_array = cookies.split('; ');
		if(getNamesCookies(cookies_to_array)) {
			cookies_to_array.forEach(function (this_cookie) {
				let parseThisCookie = this_cookie.split('=');
				let cookieName = parseThisCookie[0];
				let cookieValue = parseThisCookie[1];
				if (cookieName == 'userlogin') {
					let isSetThisLogin = false;
					users.find({login: cookieValue}, function (err, logins) {
						if (logins.length > 0) {
							finalResValidateAuth = true;
							res.sendFile(__dirname + '/site/page.html');
						} else {
							res.sendFile(__dirname + '/site/home.html');
						}
					});
				}
			});
		}
		else {
			res.sendFile(__dirname + '/site/home.html');
		}
	}
	else {
		res.sendFile(__dirname + '/site/home.html');
	}
});

nodeServer.get('/shutdown', function(req, res){
	res.send('Сервер остановлен.');
	mongoose.disconnect();
	process.exit();
});

nodeServer.get('/logout', function(req, res){
	res.clearCookie("userlogin");
	res.sendFile(__dirname + '/site/home.html');
});
