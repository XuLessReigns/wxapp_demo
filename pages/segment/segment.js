
var app = getApp();
var Util = app.Util;
var OrderPage = require('../order');

var p = OrderPage.extend({

    pageid: 932,

    data: {
        checkedIdx: -1,
        btnLoading: false,
        flightInfor: []
    },

    onLoad: function (option) {
        this.init(option);
    },

    onShow: function () {

    },

    onHide: function () {

    },

    onUnload: function(){
        
    }
})

p.selectFlight = function (e) {

    var idx = e.currentTarget.id;
    this.setData({
        checkedIdx: +idx
    })
}

p.buy = function (e) {

    if (this.data.checkedIdx == -1) {
        app.showError('请选择航段');
        return;
    }

    if (this.data.btnLoading) {
        return;
    }

    var data = app.globalData.segments[this.data.checkedIdx];
    data.formData = app.globalData.formData;

    // 有可能是客票号页面回退回来的，清空客票号数据
    data.formData.ticketNo = '';

    this.setData({
        btnLoading: true
    })

    this.submitOrder(data, () => {
        this.setData({
            btnLoading: false
        })
    })

    this.push_asm(e);
};

p.init = function (options) {

    var flights = app.globalData.segments;

    if (!flights || !flights.length || !app.globalData.formData) {
        app.showToast('参数错误', 1.5, () => wx.navigateBack());
        return;
    }

    flights.map(item => {
        item._flightDeptimeplan = Util.formatDate(item.flightDeptimeplan, 'hh:mm');
        item._flightArrtimeplan = Util.formatDate(item.flightArrtimeplan, 'hh:mm');
    })

    this.setData({
        flightInfor: flights
    })
}

Page(p);