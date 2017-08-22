
var app = getApp();
var PageBase = require('pagebase');

var page = PageBase.extend({

    // 领取红包
    receiveRedpacket: function(e, data, callback){

        this.push_asm(e);

        if (!wx.sendBizRedPacket) {
            app.showToast('请先升级微信版本，再领取红包哦！', 2);
            return;
        }

        wx.showLoading({
            title: '领取中...',
            mask: true
        })

        var self = this, onfail = function (error) {

            console.log(error);
            app.showError('领取失败');
        }, onsuccess = function(){
            callback && callback();
            self._notifyReceived(data);
            // 通知购买记录页面，数据有更新
            // app.states.emit('historyChanged', null);
        }

        app.request({
            serviceName: 'zhongan.sales.wechat.minprogram.hongbao.create',
            serviceVersion: 'V1.3',
            data: data,
            method: 'POST',
            success: function (res) {

                if (res.code == 0) {

                    if (/test|uat/.test(app.config.env)){
                        // 测试环境红包接口调不通，默认成功
                        onsuccess()
                        return;
                    }

                    var option = res.data;

                    option.fail = onfail;                  
                    option.success = onsuccess;

                    wx.sendBizRedPacket(option);
                }
                else {

                    // 失败也要通知
                    if (/test|uat/.test(app.config.env)) {
                        self._notifyReceived(data);
                    }

                    app.showError(res.msg)
                }
            },
            complete: function () {
                wx.hideLoading();
            }
        })
    },

    // 红包领取成功通知
    _notifyReceived: function( data ){

        app.request({
            serviceName: 'zhongan.sales.wechat.minprogram.hongbao.receive',
            serviceVersion: 'V1',
            data: data,
            method: 'POST'
        })
    }
})

module.exports = page; 