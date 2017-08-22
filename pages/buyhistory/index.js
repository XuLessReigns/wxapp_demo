
var app = getApp();
var PageBase = require('../pagebase');

var p = PageBase.extend({

    pageid: 938,

    data: {
        ui_tab: {
            current: 'history'
        },
        flight_list: null
    },

    onLoad: function () {
       
        app.showPageLoading();
    },

    onShow: function () {

        this.getHistory()
    },

    onHide: function () {

    },

    onUnload: function () {

    },
    onPullDownRefresh: function () {
        this.getHistory()
    }
})

p.goDetail = function (e) {

    var data = e.currentTarget.dataset.value;

    app.globalData.flightInfo = data;

    var url = '', status = data.nextPageState,
        delayed = data.orderClaimUnreceivedRedPacketCount > 0 || status == 'hasFlightDelayClaim';

    var param = '&state=' + status + '&from=history&orderNo=' + data.orderNo + '&policyNo=' + data.policyNo;

    if (delayed || /^(calculatingFlightDelay|policyIssueNotStart)$/.test(status)) {
        url = '../delayaxis/index?delayed=' + (delayed ? 1 : 0) + param;
    } else if (/^(flightUnDelay|flightIsCancel)$/.test(status)) {
        url = '../delayno/index?state=' + status + param
    } else if (status == 'policyIssueFailed') {
        url = '../buyfail/buyfail?from=history';
    }

    if (url) {
        wx.navigateTo({
            url: url
        })
    }
};

p.callPhone = function (e) {

    this.push_asm(e);

    wx.makePhoneCall({
        phoneNumber: '1010-9955'
    })
};

p.getHistory = function () {

    var self = this;

    app.request({
        serviceName: 'SalesWeChatAppOrderFindUserOrderRecord',
        serviceVersion: '2.0.0',
        method: 'POST',
        data: {
            activityChannel: app.config.activityChannel
        },
        success: function (res) {

            var data = [];
            if(res.success){                
                data = res.value.map(item => { 
                    item.flightDate = item.flightDate.replace(/-/g, '/');
                    item._redpacketCount = item.orderClaimUnreceivedRedPacketCount + item.orderUnreceivedDelayRedPacketCount;
                    return item;
                })
            }

            self.setData({
                flight_list: data
            })
        },
        error: function (res) {
            app.showError('抱歉，出错了，可下拉刷新重试')
        },
        complete: function () {
            app.hidePageLoading();
            wx.stopPullDownRefresh();
        }
    })
};

Page(p);
