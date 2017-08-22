var app = getApp();
var Util = app.Util;
var OrderPage = require('../order');
var Weather = require('../weather');
var AD = require('../../data/ad');

const AD_data = AD.get({
    travel_high: {
        scene: 1403
    },
    travel_eat: {
        scene: 1404
    },
    accident: {
        scene: 1403
    }
})

var p = OrderPage.extend({

    auto_push: false,
    pageid: 930,

    data: {
        ui_tab: {
            current: 'index'
        },
        buyTimes: 0,
        agree: true,
        dateStart: Util.formatDate(new Date()),
        dataEnd: Util.threeDayLater(new Date()),
        flightDate: Util.formatDate(new Date()),
        name: '',
        data_name: '', // 掩码
        idCard: '',
        data_idcard: '', // 掩码
        flightNo: '',
        btnLoading: false,
        weather: null,

        ad_info:{
            data: AD_data
        }
    },

    onLoad: function (query) {
        this.ctx_weather = wx.createCanvasContext('firstCanvas');
    },

    onShow: function () {

        if (this.needReminder === true){
            this.showReminder();
        }

        Weather.begin();
    },

    onReady: function () {

        if (app.config.env != 'prd') {
            wx.setNavigationBarTitle({
                title: '机场延误险【' + app.config.env + '-数据无效】'
            })
        }
        
        this.getUserInfo();

        //雷雨

        // Weather.init(this.ctx_weather, {
        //     maxNum: 50,
        //     lightning: true,
        //     wtype: 'rain'
        // });

        //雨
        // Weather.init(this.ctx_weather, {
        //     maxNum: 100,
        //     wtype: 'rain'
        // });

        //雪花
        // Weather.init(this.ctx_weather, {
        //     maxNum: 20,
        //     wtype: 'snow'
        // });

        //多云
        // Weather.init(this.ctx_weather,{
        //     wtype: 'cloudy'
        // });

        //晴天
        // Weather.init(this.ctx_weather,{
        //     wtype: 'sunny'
        // });

        Weather.getWeather(this);
    },

    onHide: function () {
        Weather.stop();
    },

    onUnload: function () {
        Weather.destroy();
    }
})

p.flightinput = function (e) {

    this.setData({
        flightNo: e.detail.value.toUpperCase()
    })
};

p.checkboxChange = function (e) {
    this.data.agree = e.detail.value.length > 0;
};

p.getUserInfo = function (res) {

    var that = this;
    app.showPageLoading();

    var onFail = function () {
        // 用户首次投保成功后
        app.states.on('userinfo', function (data) {
            if (that.data.buyTimes != 2) {
                that.setData({
                    buyTimes: 2,
                    name: data.name,
                    idCard: data.idCard,
                    data_name: Util.maskName(data.name),
                    data_idcard: Util.maskCardNo(data.idCard)
                })
            }
        })

        that.setData({
            buyTimes: 1
        })
    }

    app.request({
        serviceName: 'SalesWeChatAppOrderFindUserSecondEnterPageRule',
        serviceVersion: '2.0.0',
        data: {
            activityChannel: app.config.activityChannel,
            filterIdType: [1],
            needUserInfo: [3]
        },
        method: 'POST',
        success: function (res) {

            if (res.success) {

                var formInfo = res.value.userList;
                var state = res.value.nextPageState;

                // hasFlightDelayClaim：有延误赔款；
                // hasFlightDelayRedPacket：有延误现金红包；
                // calculatingFlightDelay：正在计算航班延误状态；
                // orderRecord：购买记录列表页面；
                // index：首页

                var paramStr = Util.param({
                    orderNo: res.value.orderNo || '',
                    policyNo: res.value.policyNo || ''
                }), delayed = state == 'hasFlightDelayClaim';

                var jumped = true;

                // 延时跳转，让页面流转更圆滑
                // if (delayed || state == 'calculatingFlightDelay') {
                //     setTimeout(function () {
                //         wx.navigateTo({
                //             url: '../delayaxis/index?' + paramStr + '&delayed=' + (delayed ? 1 : 0)
                //         })
                //     }, 300)
                // }
                // else if (state == 'orderRecord') {
                //     setTimeout(function () {
                //         wx.navigateTo({
                //             url: '../buyhistory/index'
                //         })
                //     }, 300)
                // }
                // else{
                //     jumped = false
                // }

                if (formInfo && formInfo.length > 0) {
                    app.globalData.userInfo = formInfo[0];
                }

                if (res.value.orderCount === undefined) {
                    // 兼容老版本
                    res.value.orderCount = 1;
                }

                if (res.value.orderCount > 0) {

                    var reminderShow = 0;
                    try {
                        reminderShow = wx.getStorageSync('mod_reminder_show');
                    } catch (e) {}

                    if (reminderShow != 1) {
                        
                        if (jumped) {
                            that.needReminder = true;
                        } else {
                            that.showReminder()
                        }
                    }
                }
                else{

                    that.showReminder(false)
                }

                if (app.globalData.userInfo && res.value.orderCount > 0) {

                    that.setData({
                        buyTimes: 2,
                        name: formInfo[0].name,
                        idCard: formInfo[0].idNo,
                        data_name: Util.maskName(formInfo[0].name),
                        data_idcard: Util.maskCardNo(formInfo[0].idNo)
                    })

                    console.log('用户信息：', JSON.stringify(formInfo[0]));
                } else {
                    
                    onFail()
                }
            }
            else {
                onFail()
            }
        },
        error: onFail,
        complete: function (res) {
            app.hidePageLoading();
            that.push_pv({
                adtype: 'accident'
            })
        }
    })
}

p.showReminder = function ( showui ){

    if (showui !== false){

        this.setData({
            mod_reminder_show: 1
        })

        this.needReminder = false
    }

    wx.setStorage({
        key: 'mod_reminder_show',
        data: 1
    })
}

Page(p);