
var app = getApp();
var Util = app.Util;
var HBPage = require('../hbpage');

const AD_DATA = {

    // 高原
    travel_high: {
        _ad_type: 'travel-high',
        appid: 'wx472308d0001e8b8e',
        path: 'pages/productDetail-high/productDetail?productCode=ff633ad873686cf6b00da2e34f48aa1423ddbaeb10b9&scene=1401',
        imgPath: 'icon_accident4.png',
        dests: ['DCY', 'BPX', 'NGQ', 'KGT', 'YUS', 'RKZ', 'LXA', 'AHJ', 'JZH', 'NLH', 'DIG', 'LZY', 'GOQ', 'LJG', 'XNN', 'DLU', 'KMG', 'LPF', 'PZI', 'LHW', 'ZAT', 'LNJ', 'GYU', 'BSD', 'XIC', 'JGN']
    },

    // 放心吃
    travel_eat: {
        _ad_type: 'travel-eat',
        appid: 'wx472308d0001e8b8e',
        path: 'pages/productDetail-eat/productDetail?productCode=ff633ad873686cf6b00da2e34f48aa1423ddbaeb11b9&scene=1402',
        imgPath: 'icon_accident3.png',
        dests: ['CAN', 'CTU', 'KMG', 'SZX', 'XIY', 'CKG', 'SYX', 'WUH', 'CSX', 'URC', 'TAO', 'DLC', 'YNT', 'XMN', 'NGB']
    },

    // 航意
    accident: {
        _ad_type: 'accident',
        appid: 'wx40fcf84cdace07d0',
        path: 'pages/index/index?scene=1404',
        imgPath: 'icon_accident1.png'
    }
}

var p = HBPage.extend({

    auto_push: false,
    pv_pushed: false,

    pageIDs: {
        policyIssueNotStart: 997
    },

    pageid: 934,

    timingTimer: 0,   // 30分钟倒计时
    checkingTimer: 0, // 检查航班状态
    orderNo: 0,

    data: {
        orderDetail: {
            delayMinute: 0
        },
        events: null,
        timing: [0, 0, 0, 0, 0, 0],
        query: {},
        AD: null
    },

    onLoad: function (query) {

        this.queryParams = query;

        this.setData({
            query: query,
            random: 1
        })

        this.watchRedpacketReceived();

        app.showPageLoading();
        if (query.orderNo && query.delayed == '1') {

            // 购买记录页面进来的，直接走获取时间轴接口
            this.orderNo = query.orderNo;
            this.getTimingAxis(this.orderNo)
        }
        else{
            this.checkFlightState();
        }
    },

    onShow: function () { },
    onHide: function () { },
    onUnload: function () {
        clearInterval(this.timingTimer);
        clearInterval(this.checkingTimer);
    }
})

p.renderPage = function( data ){

    data.AD = this.determineAd(data.orderDetail);
    data.AD.path += '&destination=' + data.orderDetail.flightArrCode

    this.setData(data);

    if (!this.pv_pushed){

        this.push_pv({
            adtype: data.AD._ad_type,
            destination: data.orderDetail.flightArrCode || ''
        })

        this.pv_pushed = true;
    }
}

p.determineAd = function (flightInfo) {

    for (var key in AD_DATA) {
        var item = AD_DATA[key];
        if (item.dests && item.dests.indexOf(flightInfo.flightArrCode) != -1){
            return item
        }
    }

    return AD_DATA.accident
}

p.watchRedpacketReceived = function(){

    // 监听红包领取成功动作
    var self = this, evt_name = 'packet_received';
    app.states.off(evt_name).on(evt_name, function (e) {
        var event = self.data.events[e.index];
        if (event && event.businessStatus != 'RECEIVED') {
            event.businessStatus = 'RECEIVED';
            self.setData({
                events: self.data.events
            })
        }
    })
}

p.receive = function (e) {

    var that = this, dataset = e.currentTarget.dataset;

    this.receiveRedpacket(e, {
        gzh: "airportDelay",
        policy_no: this.queryParams.policyNo,
        claim_id: dataset.claimid,
        hongbao_type: 'claim',
        notify_way: 'JSAPI',
        sequence: dataset.sequence
    }, function(){

        var event = that.data.events[dataset.index];
        if (event) {
            
            event.businessStatus = 'RECEIVED';
            that.setData({
                events: that.data.events
            })
        }
        else{
            // 理论上这里不会出现为空的情况，但是日志里面有报错
            app.Log.error('index:' + dataset.index + ', events:' + JSON.stringify(that.data.events))
        }
    })
};

p.getTimingAxis = function (orderNo) {

    var query = this.queryParams;
    var self = this;

    //   { 
    //       "currentTime":"2017-06-10 18:45:05", 
    //       "delayMinute":-254, 
    //       "events":[{ 
    //           "amount": null, 
    //           "businessStatus": "flightPlan", 
    //           "claimNo": null, 
    //           "eventTime": "2017-06-10 23:00:00", 
    //           "eventType": "flight", 
    //           "nextWave": null }
    //           ], 
    //         "flightArr":"", 
    //         "flightCompanyName":null, 
    //         "flightDep":"",
    //          "flightNo":"HK008", 
    //          "totalAmount":0 
    // }

    clearTimeout(self.gettingTimer);

    var nextGet = function () {
        self.gettingTimer = setTimeout(function () {
            self.getTimingAxis(orderNo)
        }, 60000 * 30) // 30分钟一轮询
    }

    app.doRequest({
        serviceName: 'SalesWeChatAppFindFlightClaim',
        serviceVersion: '2.0.0',
        data: {
            orderNo: orderNo,
            activityChannel: app.config.activityChannel
        },
        method: 'POST',
        success: function (res) {

            if (res.success) {

                self.renderPage({
                    orderDetail: res.value,
                    events: self.handleEvents(res.value.events, res.value),
                    query
                })

                var firstEvent = res.value.events[0], deltTime;
                if (firstEvent.businessStatus == 'WAITING') {
                    deltTime = self.ifNeedTiming(res.value.currentTime, firstEvent.eventTime);
                    if (deltTime > 0) {
                        self.startTiming(deltTime)
                    }
                }

                // 如果飞机取消或者起飞，则停止轮询
                if (!/flightCancel|flyingOff/.test(firstEvent.businessStatus)) {
                    nextGet()
                }
            }
        },
        complete: function () {
            app.hidePageLoading();
        }
    })
};

p.checkFlightState = function () {

    clearTimeout(this.checkingTimer);

    // interval: 秒
    var that = this, nextCheck = function (interval) {
        that.checkingTimer = setTimeout(function () {
            that.checkFlightState()
        }, interval * 1000)
    }, query = this.queryParams;

    app.doRequest({
        serviceName: 'SalesWeChatAppOrderFindOrderRecordByPolicyNo',
        serviceVersion: '2.0.0',
        data: {
            policyNo: query.policyNo,
            activityChannel: app.config.activityChannel
        },
        method: 'POST',
        success: function (res) {

            if (res.success) {
                that.orderNo = res.value.orderNo;

                // flightUnDelay: 航班未延误；
                // flightIsCancel：航班取消；
                // policyIssueFailed：保单二次核保失败；
                // calculatingFlightDelay：正在计算航班延误状态；
                // hasFlightDelayClaim：有延误赔款；

                var state = res.value.nextPageState;
                query.state = state;

                if (/^(flightUnDelay|flightIsCancel)$/.test(state)) {
                    app.globalData.flightInfo = res.value;
                    // 航班未延误 || 航班取消 || 未开始
                    wx.redirectTo({
                        url: '../delayno/index?state=' + state + '&policyNo=' + query.policyNo + '&orderNo=' + res.value.orderNo
                    });
                    return;
                }
                else if (state == 'policyIssueNotStart'){
                    res.value._flightDate = app.Util.formatDate(res.value.flightDate, 'yyyy/MM/dd');
                    that.pageid = that.pageIDs.policyIssueNotStart;
                    that.renderPage({
                        orderDetail: res.value,
                        query
                    })
                    return;
                }
                else if (state == 'hasFlightDelayClaim') {
                    that.getTimingAxis(res.value.orderNo);
                    return;
                }

                var events = [];
                var deltTime = that.ifNeedTiming(res.value.currentTime, res.value.flightDepTimePlan); // 秒
                var firstWave = 60; // 秒

                if (deltTime > -firstWave) {

                    events.push({
                        businessStatus: 'WAITING',
                        eventTime: res.value.flightDepTimePlan + firstWave*1000,
                        eventType: 'randomRedPacket',
                        nextWave: 1
                    })

                    that.startTiming(deltTime + firstWave);

                    if (deltTime > 0) {
                        // 如果还没有过起飞时间，则等到起飞时间过了之后再轮询
                        nextCheck(deltTime)
                    }
                    else {
                        // 如果已经过了，则30分钟一轮询
                        nextCheck(30 * 60)
                    }
                }
                else{

                    that.getTimingAxis(that.orderNo)
                }

                events.push({
                    businessStatus: "flightPlan",
                    eventTime: res.value.flightDepTimePlan
                })
                
                that.renderPage({
                    orderDetail: res.value,
                    query,
                    events: that.handleEvents(events, res.value)
                })
            }
        },
        complete: function () {
            app.hidePageLoading();
        }
    })
};
p.handleEvents = function (events, res) {

    return events.map(item => {
        
        if (item.businessStatus != 'flightCancel'){
            item._time = Util.formatDate(item.eventTime, 'hh:mm');
        }

        item._isRandom = item.eventType == 'randomRedPacket';
        if (item._isRandom){
            item.amount = '随机';
            item._openDate = Util.formatDate(Util.addDay(res.flightDate, 1), 'MM/dd');
        }
        else{
            item.amount = (res.orderTotalFee == 5 ? 5 : 10) + '元'
        }

        return item;
    })
};
p.ifNeedTiming = function (time1, time2) {
    var deltTime = (time2 - time1) / 1000;
    return deltTime;
};
p.startTiming = function (deltTime) {

    clearTimeout(this.timingTimer);

    var self = this, doAction = function () {

        var h = Util.formatNumber(parseInt(deltTime / 3600)); // 小时
        var m = Util.formatNumber(parseInt((deltTime % 3600) / 60)); // 分钟
        var s = parseInt(deltTime % 3600 % 60); // 秒
        var timing;

        if (s == 0) {

            if(!self){
                app.Log.test('self 居然为空')
            }
            else if (!self.data){
                app.Log.test('self.data 居然为空')
            }
            else if (!self.data.orderDetail){
                app.Log.test('self.data.orderDetail 居然为空')
            }
            else{
                self.data.orderDetail.delayMinute++;
                self.setData({
                    orderDetail: self.data.orderDetail
                })
            }
        }

        s = Util.formatNumber(s);

        if (h > 0) {
            timing = [h[0], h[1], m[0], m[1], s[0], s[1]]
        }
        else {
            timing = [m[0], m[1], s[0], s[1], -1]
        }

        self.setData({
            timing: timing
        })

        if (deltTime > 0) {
            // 倒计时没有结束，继续倒计时
            deltTime--;
            self.timingTimer = setTimeout(doAction, 1000)
        }
        else {
            clearTimeout(self.checkingTimer);
            // 倒计时结束，立即拿最新数据
            self.getTimingAxis(self.orderNo);
        }
    }

    doAction();
};

p.goPool = function(e){

    this.push_asm(e);

    // 当用户是由推送进来的时候，是没有orderNo的
    wx.navigateTo({
        url: '../delaypool/index?' + Util.param({
            orderNo: this.orderNo || this.queryParams.orderNo,
            policyNo: this.queryParams.policyNo,
            index: e.currentTarget.dataset.index
        })
    })
}

Page(p);