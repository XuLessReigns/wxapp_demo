
var app = getApp();
var PageBase = require('../pagebase');

var p = PageBase.extend({

    pageid: 933,

    data: {

    },

    onLoad: function (options) {
        this.setData({
            show: options.from
        })
    },

    onShow: function () {

    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

Page(p);