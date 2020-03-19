function passwordslen(p1, p2){
	let p1s = p1.split('');
	let p2s = p2.split('');
	if (p1s.length < 6 || p2s.length < 6) {
		return false;
	}
	else {
		return true;
	}
}
function passwordstrue(p1, p2){
	if(p1 == p2) {
		return true;
	}
	else {
		return false;
	}
}
module.exports.validateRegForm = function(obj){
	let validatelogpass = new RegExp("^[A-z0-9-_]+$");
	let validateNSP = new RegExp("^[A-zА-яЁёЇї ]+$");
	let validateEmail = new RegExp("^[-._a-z0-9]+@(?:[a-z0-9][-a-z0-9]+\.)+[a-z]{2,6}$");

	let resValidate = {
    	resLogin: validatelogpass.test(obj.login),
    	resEmail: validateEmail.test(obj.email),
    	resPass: validatelogpass.test(obj.password),
    	resrPass: validatelogpass.test(obj.repeatpassword),
    	resName: validateNSP.test(obj.name),
    	resSurename: validateNSP.test(obj.surename),
    	resPatronymic: validateNSP.test(obj.patronymic)
	}

	let info_validate = {
		login: '',
		name: '',
		surename: '',
		patronymic: '',
		email: '',
		password: ''
	}

	if(resValidate.resLogin == false){
		info_validate.login = 'Логин пользователя может состоять из букв английского алфавита, цифр и знаков - _.\n';
	}

	if (resValidate.resName == false) {
		info_validate.name = 'Имя пользователя может состоять из букв русского, украинского и английского алфавитов, допускаются пробелы.\n';
	}
	if (resValidate.resSurename == false) {
		info_validate.surename = 'Фамилия пользователя может состоять из букв русского, украинского и английского алфавитов, допускаются пробелы.\n';
	}
	if (resValidate.resPatronymic == false) {
		info_validate.patronymic = 'Отчество пользователя может состоять из букв русского, украинского и английского алфавитов, допускаются пробелы.\n';
	}

	if (resValidate.resEmail == false) {
		info_validate.email = 'Email указан неверно.';
	}

	if (resValidate.resPass == false || resValidate.resrPass == false) {
		info_validate.password = 'Пароль может состоять из букв английского алфавита, цифр и знаков - _, и быть не короче 6 символов.\n';
	}
	else if(passwordslen(obj.password, obj.repeatpassword) == false){
		info_validate.password = 'Пароль должен состоять минимум из 6 символов.\n';
	}
	else if(passwordstrue(obj.password, obj.repeatpassword) == false){
		info_validate.password = 'Пароли не совпадают.\n';
	}

    return info_validate;
}