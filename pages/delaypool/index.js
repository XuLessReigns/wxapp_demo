
var app = getApp();
var Util = app.Util;
var HBBase = require('../hbpage');

var p = HBBase.extend({

    pageid: 935,

    data: {
        poolInfo: {
            redPacketStatus: -1
        },
        events: [],
        query: {}
    },

    onLoad: function (query) {
        
        this.queryParams = query;

        this.setData({
            query: query,
        });

        this.loadData();
    },

    onShow: function () {

    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

p.loadData = function () {

    var self = this, onError = function(){

        app.Log.error(' 嗝屁了，又出错了 orderNo：' + self.queryParams.orderNo)
        self.setData({
            poolInfo: {
                redPacketStatus: 4
            }
        })
    }

    if (!this.queryParams.orderNo){

        onError()
        return;
    }

    app.showPageLoading();
    app.request({
        serviceName: 'SalesWeChatAppDelayRedPacketInfo',
        serviceVersion: '2.0.0',
        data: {
            orderNo: this.queryParams.orderNo,
            activityChannel: app.config.activityChannel
        },
        method: 'POST',
        success: function (res) {

            if (res.success && res.value){

                var info = res.value.redPacketGeneralInfo;
                info._openTime = Util.formatDate(info.activityOpenDate, 'MM/dd hh:mm');
                var orderDetail = res.value;
                if(orderDetail.topN){
                    for(var i = 0;i<orderDetail.topN.length;i++){
                        orderDetail.topN[i].userName = Util.maskName(orderDetail.topN[i].userName);
                    }
                }
                
                self.setData({
                    poolInfo: info,
                    orderDetail: res.value
                })
            }
            else{
                onError()
            }
        },
        error: onError,
        complete: function (res) {
            app.hidePageLoading()
        }
    })
};

p.open = function(e){

    var that = this;

    this.receiveRedpacket(e, {

        gzh: "airportDelay",
        policy_no: this.queryParams.policyNo,
        hongbao_type: 'Jackpot',
        notify_way: 'JSAPI',
        sequence: 1
    }, function(){

        that.data.poolInfo.redPacketStatus = 5;
        that.setData({
            poolInfo: that.data.poolInfo
        })

        // 通知时间轴页面
        app.states.emit('packet_received', { 
            index: that.queryParams.index 
        })
        // 通知历史列表页面
        // app.states.emit('historyChanged')
    })
}

Page(p);
