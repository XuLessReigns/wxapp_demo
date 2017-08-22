
var app = getApp();
var Util = app.Util;
var OrderPage = require('../order');

var p = OrderPage.extend({

    pageid: '983',

    data: {
        btnLoading: false,
        btnDisabled: true,
        dateStart: Util.formatDate(new Date()),
        dataEnd: Util.threeDayLater(new Date()),
        flightDate: Util.formatDate(new Date()),
        agree: true,
        name: '',
        data_name: '', // 掩码
        idCard: '',
        data_idcard: '', // 掩码
        ticketno: ''
    },

    onLoad: function (query) {

        // var formData = {
        //     name: '朱永玉',
        //     idCard: '411528198802055511',
        //     data_name: Util.maskName('朱永玉'),
        //     data_idcard: Util.maskCardNo('411528198802055511'),
        //     canUpdate: '1'
        // }

        // var opt = {
        //     name: formData.name,
        //     idCard: formData.idCard
        // }

        // if (formData.canUpdate != '1') {
        //     Util.merge(opt, {
        //         data_name: Util.maskName(formData.name),
        //         data_idcard: Util.maskCardNo(formData.idCard)
        //     })
        // }

        // this.setData(opt)

        // return;
        
        if(app.globalData.orderData){

            var formData = app.globalData.orderData.formData;  
            var opt = {
                name: formData.name,
                idCard: formData.idCard,
                flightDate: formData.flightDate
            }

            if(formData.canUpdate != '1'){
                Util.merge(opt, {
                    data_name: Util.maskName(formData.name),
                    data_idcard: Util.maskCardNo(formData.idCard)
                })
            }

            this.setData(opt)

            app.showToast('无法匹配到您的航班号，您可以尝试输入客票号', 3)
        } else {
            app.showToast('参数错误', 1.5, () => wx.navigateBack());
        }
    },

    onShow: function () {

        this.readClipboard()
    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

p.ticketInput = function(e){
    this.setData({
        btnDisabled: e.detail.value.length < 13
    })    
}

p.ticketBlur = function(e){
    this.setData({
        ticketno: this.filterNo(e.detail.value)
    })
}

p.filterNo = function(no){

    return no.replace(/[^0-9]/g, '')
}

p.buy = function(e){

    if (this.data.btnLoading){
        return;
    }

    var formData = e.detail.value;
    formData.ticketNo = this.filterNo(formData.ticketNo);

    Util.merge(app.globalData.orderData.formData, formData);

    if (!this.validateForm(app.globalData.orderData.formData)){
        return;
    }

    this.setData({
        btnLoading: true
    })

    this.submitOrder(app.globalData.orderData, () => {
        this.setData({
            btnLoading: false
        })
    })
}

p.viewSample = function(e){

    wx.previewImage({
        current: app.config.cdnBase + e.currentTarget.dataset.sample,
        urls: [
            app.config.cdnBase + '/images/ticketno-sample-1.jpg',
            app.config.cdnBase + '/images/ticketno-sample-2.jpg',
            app.config.cdnBase + '/images/ticketno-sample-3.jpg'
        ]
    })
}

p.readClipboard = function(){

    var that = this;
    wx.getClipboardData && wx.getClipboardData({
        success: function (res) {
            if(res.data){

                var ticketno = res.data.replace(/[^0-9]+/, '');
                if(ticketno.length == 13){
                    that.setData({
                        ticketno: ticketno,
                        btnDisabled: false
                    })
                }
            }
        }
    })
}

Page(p);