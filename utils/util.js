
module.exports = {

    normalizeDate,
    formatTime,
    formatDate,
    formatNumber,
    addDay,
    addMonth,
    dateDiff,
    threeDayLater,

    validateIdCardNo,
    validateEmail,
    validateFlight,

    setDefault,
    merge,
    isObject,
    getCurrentPage: function () {
        let pages = getCurrentPages();
        return pages[pages.length - 1];
    },

    getBirthday,
    getGender,

    maskCardNo,
    maskPhone,
    maskName,

    param
}

function addDay(date, days){

    date = this.normalizeDate(date);
    if (date){
        return new Date(date.setDate(date.getDate() + days))
    }
}

function addMonth( date, count ){
    
    date = this.normalizeDate(date);
    if (date) {
        return new Date(date.setMonth(date.getMonth() + count))
    }
}

function dateDiff( date1, date2 ){

    date1 = this.normalizeDate(date1);
    date2 = this.normalizeDate(date2);

    if(date1 && date2){
        return Math.round((date2 - date1)/1000/60/60/24*100)/100
    }
}

function threeDayLater(date){

    return this.formatDate(this.addDay(date, 3))
}

function normalizeDate( date ){

    if (typeof date === 'string') {
        date = date.replace(/-/g, '/');
        date = new Date(date);
    }

    if (!(date instanceof Date)) {
        date = new Date(date)
    }

    if (date.toString() == 'Invalid Date') {
        return ''
    }

    return date;
}

function param( obj, encode ){
    
    if (!isObject(obj)){
        return '';
    }
    
    return Object.keys(obj).map(key => {
        if (obj[key] === null || obj[key] === undefined){
            return key + '=';
        }
        if(encode !== false){
            return key + '=' + encodeURIComponent(obj[key])
        }
        return key + '=' + obj[key]
    }).join('&')
}

function formatTime(date) {

    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatDate(date, fmt){

    date = this.normalizeDate(date);
    if ( !date ) {
        return ''
    }

    if (!fmt) {
        fmt = 'yyyy-MM-dd'
    }

    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };

    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        
    return fmt;
}

function formatNumber(n) {
    
    n = n.toString()
    return n[1] ? n : '0' + n
}

function setDefault(data) {

    let currPage = this.getCurrentPage();
    var target = !(data.name && data.idCard && data.flightNo && data.agree);
    
    if (currPage.data.default_btn !== target){
        currPage.setData({
            default_btn: target
        })
    }
}

function validateIdCardNo(num) {

    var error = {
        code: 1,
        msg: '请输入身份证号'
    }

    if (!num) {
        return error;
    }

    error.code = 2;
    error.msg = '身份证号格式不正确';

    //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X。   
    if (!(/^\d{17}([0-9]|X)$/.test(num))) {
        return error;
    }

    //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。 
    //下面分别分析出生日期和校验位 
    var re = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
    var arrSplit = num.match(re);

    //检查生日日期是否正确 
    var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
    if ('Invalid Date' != dtmBirth) {

        //检验18位身份证的校验码是否正确。 
        //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。 
        var valnum;
        var arrInt = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        var arrCh = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        var nTemp = 0,
            i;
        for (i = 0; i < 17; i++) {
            nTemp += num.substr(i, 1) * arrInt[i];
        }
        valnum = arrCh[nTemp % 11];
        if (valnum == num.substr(17, 1)) {
            error.code = 0;
            error.msg = '';
        }
    }
   
    return error;
}

function validateEmail(email){

    var error = {
        code: 0,
        msg: ''
    };

    if (!email){
        error.code = 1;
        error.msg = '请输入邮箱'
    }
    else if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
        error.code = 2;
        error.msg = '输入的邮箱格式不正确';
    }

    return error;
}

function validateFlight(value){

    var error = {
        code: 0,
        msg: ''
    };

    if (!value){
        error.code = 1;
        error.msg = '请输入航班号'
    }
    else if (/^(9C|AQ)/i.test(value)){
        error.code = 2;
        error.msg = '暂不支持春秋航空/九元航空/国际或港澳台航班投保';
    }
    else if (!/^[a-z0-9]+$/i.test(value) || !/[a-z]+/i.test(value) || !/[0-9]+/.test(value)){
        error.code = 3;
        error.msg = '该航班号不存在';
    }

    return error;
}

function isObject(target){
    return Object.prototype.toString.call(target) === '[object Object]'
}

// 合并两个对象
function merge(target, src, deep) {

    if (!target || !src) return target;

    for (var key in src) {

        if (deep !== false && isObject(target[key]) && isObject(src[key])) {
            merge(target[key], src[key]);
        }
        else {
            target[key] = src[key];
        }
    }

    return target;
}

function getBirthday(code) {

    var birthday = "", code = code || '';

    if (code.length == 15) {
        birthday = "19" + code.substr(6, 6);
    } else if (code.length == 18) {
        birthday = code.substr(6, 8);
    }

    if (birthday) {
        birthday = birthday.replace(/(.{4})(.{2})/, "$1/$2/");
    }

    return birthday
}

function getGender(code){

    var gender = '', code = code || '';
    if(code.length == 15){
        gender = code.substr(14,1)
    }
    else if(code.length == 18){
        gender = code.substr(16,1)
    }

    if(gender){
        if(+gender%2 == 1){
            gender = 'M'
        }
        else{
            gender = 'F'
        }
    }

    return gender;
}

function maskCardNo(cardno, cardtype) {

    if (!cardno) return '';

    var cardtype = cardtype || 'I';
    if (cardtype == 'P') {
        cardno = cardno.substr(0, 4) + '*****';
    }
    else if (cardtype == 'I') {
        if (cardno.length == 15) {
            cardno = cardno.substr(0, 3) + '***********' + cardno.substr(14, 1);
        }
        else {
            cardno = cardno.substr(0, 3) + '**************' + cardno.substr(17, 1);
        }
    }

    return cardno;
}

function maskPhone(phone) {

    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskName(name) {

    if (!name) return '';
    if (name.length > 2) {

        var starStr = '';
        for (var i = 0; i < name.length - 2; i++) {
            starStr += '*'
        }
        return name.substr(0, 1) + starStr + name.substring(name.length - 1);
    } else if (name.length == 2) {

        return name.substr(0, 1) + '*';
    }

    return name;
}