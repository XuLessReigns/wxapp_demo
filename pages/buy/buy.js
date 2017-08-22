
var app = getApp();
var Util = app.Util;
var OrderPage = require('../order');

var p = OrderPage.extend({
    
    pageid: 931,

    // 订单成功之后，采用replace方式跳转下一个页面
    needReplace: true,

    data: {
        default_btn: true,
        agree: true,

        dateStart: Util.formatDate(new Date()),
        dataEnd: Util.threeDayLater(new Date()),
        flightDate: Util.formatDate(new Date()),

        name: '',
        data_name: '', // 掩码
        idCard: '',
        data_idcard: '', // 掩码
        flightNo: '',
        canUpdate: '1',

        btnLoading: false
    },

    onLoad: function () {

        if(app.globalData.userInfo){

            var uinfo = app.globalData.userInfo;
            this.setData({
                name: uinfo.name,
                idCard: uinfo.idNo,
                data_name: Util.maskName(uinfo.name),
                data_idcard: Util.maskCardNo(uinfo.idNo),
                canUpdate: '0'
            })
        }
    },

    onShow: function () {

    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

p.bindidCard = function (e) {
    this.data.idCard = e.detail.value;
    Util.setDefault(this.data);
}

p.checkboxChange = function (e) {
    this.data.agree = e.detail.value.length > 0;
    Util.setDefault(this.data);
}

p.bindname = function (e) {
    this.data.name = e.detail.value;
    Util.setDefault(this.data);
}

p.bindflight = function (e) {
    this.setData({
        flightNo: e.detail.value.toUpperCase()
    })
    Util.setDefault(this.data);
}

Page(p);