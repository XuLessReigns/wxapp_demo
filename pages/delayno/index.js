// msflogin.js
var app = getApp();
var PageBase = require('../pagebase');

var p = PageBase.extend({

    pageIDs: {
        'flightUnDelay': 936,
        'flightIsCancel': 937
    },

    data: {

    },

    onLoad: function (option) {
        this.queryParams = option
    },

    onShow: function () {

        var flightInfo = app.globalData.flightInfo;
        // flightInfo._flightDate = app.Util.formatDate(flightInfo.flightDate, 'yyyy/MM/dd');

        this.pageid = this.pageIDs[this.queryParams.state];
        this.setData({
            query: this.queryParams,
            orderDetail: flightInfo
        })
    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

Page(p);
