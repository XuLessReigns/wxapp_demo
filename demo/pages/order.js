
var app = getApp();
var Util = app.Util;
var PageBase = require('pagebase');

var policy_check_times = 0;

var page = PageBase.extend({

    // 形成校验超时次数，超过两次直接跳转到客票号
    retryCount: 0,
    
    ag: function (e) {
        app.openFile(app.config.cdnBase + '/ag.pdf');
        this.push_asm(e);
        
    },

    ag_nk: function (e) {
        app.openFile(app.config.cdnBase + '/ag_nk.pdf');
        this.push_asm(e);
    },

    bindDateChange: function (e) {
        this.setData({
            flightDate: e.detail.value
        })
    },

    set_focus_state(e){
        this.setData({
            [e.currentTarget.dataset.field + '_focus']: e.type == 'focus' ? '1' : '0'
        })
    }
});

page.submitOrder = function (option, callback){

    // [{ "creator": "system", 
    // "dataSource": "testFlightProcessor", 
    // "flightArrBuilding": "北京首都机场", 
    // "flightArrCity": "北京", 
    // "flightArrCode": "PEK", 
    // "flightArrtime": "2017-06-10 13:40:00", 
    // "flightArrtimeplan": "2017-06-10 10:40:00", 
    // "flightCancelTime": "", 
    // "flightCompany": "东航", 
    // "flightDate": "2017-06-09", 
    // "flightDepBuilding": "上海虹桥站", 
    // "flightDepCity": "上海", 
    // "flightDepCode": "SHA", 
    // "flightDeptime": "2017-06-09 23:50:00", 
    // "flightDeptimeplan": "2017-06-09 23:40:00", 
    // "flightNo": "MF0001", 
    // "flightState": "flightPlan", 
    // "gmtCreated": "2016-09-12 14:04:28",
    //  "gmtModified": "2016-09-12 11:37:17", 
    //  "id": 8, 
    //  "isDeleted": "N", 
    //  "modifier": "system" }]

    var that = this;
    var formData = option.formData;

    var birthday = Util.getBirthday(formData.idCard);
    birthday = birthday.replace(/\//g, '');

    var gender = Util.getGender(formData.idCard);

    var data = {
        "order": {
            "activityChannel": app.config.activityChannel,
            "tradeType": "JSAPI"
        },
        "orderDetail": {
            "productCategory": "1",
            "flightCompanyName": option.flightCompany,
            "flightNo": option.flightNo,
            "flightDate": option.flightDate,
            "flightDepCode": option.flightDepCode,
            "flightArrCode": option.flightArrCode,
            // "flightDep": option.flightDepBuilding,
            // "flightArr": option.flightArrBuilding,
            "flightDep": option.flightDepCity,
            "flightArr": option.flightArrCity,            
            "flightDepCity": option.flightDepCity,
            "flightArrCity": option.flightArrCity,
            "flightDepTimePlan": option.flightDeptimeplan,
            "flightArrTimePlan": option.flightArrtimeplan,
            "totalFee": 5,
            "couponFee": 0,
            "payFee": 5,
            "request": {
                "productCode": "ff633ad8736868f0bc0eaee14f48aa152adeb9ea16b9",
                "policyHolderType": "1",
                "policyHolderUserName": formData.name,
                "policyHolderCertiType": "I",
                "policyHolderCertiNo": formData.idCard,
                "policyHolderGender": gender,
                "policyHolderBirthDate": birthday,
                "policyHolderPhone": "",
                "insuredUserName": formData.name,
                "insuredCertiType": "I",
                "insuredCertiNo": formData.idCard,
                "insuredGender": gender,
                "insuredPhone": "",
                "insuredBirthDay": birthday,
                "flightNo": option.flightNo,
                "flightDate": option.flightDate.replace(/[-|\/]/g,''),
                "departureCode": option.flightDepCode,
                "destinationCode": option.flightArrCode,
                "premiumAmount": 5,
                "requireInvoice": "N",
                "contactMail": "",
                "extraInfo": {
                    "isTicketNoExist": formData.ticketNo ? 'Y' : 'N',
                    "ticketNo": formData.ticketNo || '',

                    "openGId": app.launchInfo.shareInfo.openGId,
                    "uid": app.User.extraInfo.openUserId,
                    "scene": app.launchInfo.scene,
                    "subscene": app.launchInfo.subscene,

                    // 助力红包新加字段
                    "isUsedCoupon": 'N',
                    "couponInfo": {
                        "couponNo": '',
                        "couponDefCode": '',
                    }, 

                    // 2017-07-24 增加以下字段
                    "flightDeptimePlan": option.flightDeptimeplan,
                    "flightArrtimePlan": option.flightArrtimeplan,
                    "flightDep": option.flightDepCity,
                    "flightArr": option.flightArrCity,
                    "flightCompany": option.flightCompany,
                    "flightState": option.flightState
                }
            }
        }
    }

    // console.log('submit order: ', data);

    app.request({
        serviceName: 'SalesWeChatAppUnifiedOrderCreateOrder',
        data: data,
        method: 'POST',
        success: function (res) {
            // console.log(res);
            if (res.success) {
                
                // 通知首页，已经拿到用户信息，展示第二次购买状态
                app.states.emit('userinfo', formData);

                var pay_option = Util.merge(res.value, {
                    success: function (payres) {
                        that.setData({
                            flightNo: '',
                            default_btn: true
                        });
                        wx.showLoading({
                            title: '订单处理中...',
                            mask: true
                        });
                        // 二次核保
                        policy_check_times = 0;
                        that._checkPolicy(res.value.orderNo, data.orderDetail);
                    },
                    fail: function (error) {
                        app.showError('支付失败');                        
                        that._notifyPayFail(res.value.orderNo, error)
                    }
                });

                wx.requestPayment(pay_option);
            } else if (res.errorCode == 'UWERR042'){
                app.globalData.orderData = option;
                wx.navigateTo({
                    url: '../ticketno/index'
                })
            } else if (res.errorCode == 'SYSERR002'){
                that.retryCount++;
                app.showError('暂时查询不到您的行程，请多次几次');
                if (that.retryCount>2){
                    that.retryCount = 0;
                    app.globalData.orderData = option;
                    wx.navigateTo({
                        url: '../ticketno/index'
                    })
                }
            }
            else{
                app.showError(res.errorMsg, 5);
            }

            callback({
                source: 'success'
            });
        },
        error: function(res){

            if (res.data && res.data.errorMsg){
                app.showError(res.data.errorMsg)
            }
            else{
                app.showError('购买失败')
            }
            
            callback({
                source: 'error'
            });
        }
    })
}

page.submitForm = function(e){

    // console.log('form发生了submit事件，携带数据为：', e.detail.value);

    if (this.data.btnLoading === true){
        return;
    }

    var self = this;
    var formData = e.detail.value;

    if (!this.validateForm(formData)){
        return;
    }

    this.setData({
        btnLoading: true
    })

    var noData = function () {
        removeLoading();
        app.showError('未查询到航班信息')
    }

    var removeLoading = function(){
        self.setData({
            btnLoading: false
        })
    }

    app.doRequest({
        url: app.config.apiBase + '/za.shepherd.flightinfo.queryflight/v1?message=' + encodeURIComponent(JSON.stringify({
            appKey: 'HL',
            requestSource: 'wxappdelay',
            flightNo: formData.flightNo,
            flightDate: formData.flightDate
        })),
        method: 'POST',
        success: function (res) {
            if (res.isSuccess && res.value) {

                var data = JSON.parse(res.value);
                // data.push(data[0]);// TODO delete

                if (data.flightState == 'flightCancel' || data.flightState == 'flightPlanCancel'){
                    self.showError('航班已取消了，不能购买哦！');
                    return;
                }

                if (data.length > 1) {

                    app.globalData.segments = data;
                    app.globalData.formData = formData;

                    removeLoading();
                    wx.navigateTo({
                        url: '../segment/segment'
                    })
                }
                else if (data.length == 1) {
                    var data = data[0];
                    data.formData = formData;
                    self.submitOrder(data, function(ret){
                        removeLoading()
                    });
                }
                else {
                    noData();
                }
            }
            else {
                noData();
            }
        },
        error: removeLoading,
        fail: removeLoading
    })

    //{"isSuccess":true,"returnCode":null,"returnMsg":"所给的查询条件没有查询到数据，请检查！","value":""}
        //   app.submitOrder(e);
}

page.validateForm = function ( formData ){
    
    formData.name = formData.name.replace(/\s/g, '');
    formData.flightNo = formData.flightNo.replace(/\s/g, '');
    formData.idCard = formData.idCard.replace(/\s/g, '').toUpperCase();

    var error = Util.validateIdCardNo(formData.idCard);
    if (error.msg) {
        app.showError(error.msg);
        return false;
    }

    error = Util.validateFlight(formData.flightNo);
    if (error.msg) {
        app.showError(error.msg);
        return false;
    }

    if ('ticketNo' in formData){

        if (!formData.ticketNo || formData.ticketNo.length != 13) {
            app.showError('客票号码是13位数哦，请检查重试');
            return false;
        }
    }

    if (formData.aggrement.length == 0) {
        app.showError('请阅读并同意【投保须知】和【保险使用条款】');
        return false;
    }

    return true;
}

page._checkPolicy = function (orderNo, orderDetail){

    if(!orderNo){
        app.showError('缺少orderNo');
        return;
    }

    policy_check_times++;

    var that = this, policyFail = function(){
        wx.hideLoading();
        wx.navigateTo({
            url: '../buyfail/buyfail'
        })
    }, nextTry = function(){
        setTimeout(function () {
            that._checkPolicy(orderNo, orderDetail)
        }, 5000)  
    };

    // 5秒/次 * 24次 = 120 秒
    if (policy_check_times >= 24){
        policyFail();
        return;
    }

    console.log('第' + policy_check_times + '核保:')

    app.doRequest({
        serviceName: 'SalesWeChatAppUnifiedOrderFindOrderStatus',
        data: {
            orderNo: orderNo,
            activityChannel: app.config.activityChannel
        },
        method: 'POST',
        success: function(res){

            if(res.success){
                var status = res.value.orderStatus;
                // console.log(status);
                // 出单失败
                if (status == 8) {
                    policyFail();
                    return;
                }
                else if (status == 9){
                    wx.hideLoading();
                    wx.showToast({ title: '购买成功', mask: true });

                    app.globalData.flightInfo = orderDetail;

                    var dateDiff = Util.dateDiff(new Date(), orderDetail.flightDate);
                    setTimeout(function () {

                        var url = '', param = {
                            orderNo,
                            policyNo: res.value.policyNo
                        };
                        
                        if(dateDiff > 1){
                            param.state = 'policyIssueNotStart'
                        }

                        url = '../delayaxis/index?' + Util.param(param)

                        if (that.needReplace === true){
                            wx.redirectTo({ url })
                        }
                        else{
                            wx.navigateTo({ url })
                        }
                    }, 1500);
                    return;
                }
            }

            nextTry()
        },
        error: nextTry
    }, true)
}

page._notifyPayFail = function(orderNo, error){

    //requestPayment:fail  弹出支付二维码，但是没扫码 取消
    //requestPayment:fail cancel  弹出输入支付密码 取消
    //requestPayment:fail (detail message)  输入完密码 失败

    var status = -1;
    if (error.errMsg == 'requestPayment:fail' || error.errMsg == 'requestPayment:fail cancel') {
        status = 5
    }
    else {
        status = 6
    }      

    app.doRequest({
        serviceName: 'SalesWeChatAppUnifiedOrderPayFailNotify',
        data: {
            orderNo: orderNo,
            orderStatus: status,
            activityChannel: app.config.activityChannel,
            errorMsg: error.errMsg
        },
        method: 'POST',
        success: function (res) { }
    }, true)
}

module.exports = page; 