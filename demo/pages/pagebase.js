
var app = getApp();
var Util = app.Util;
var os = app.OS;

// pv 统计url地址
var ilog_pv_url = "https://static.zhongan.com/ilog_1.gif?" + Util.param({
    browser: 'wxapp',
    lang: os.language,
    os: os.system + '|' + os.SDKVersion,
    agent: app.config.appName,
    // url: 'page/index/index,pageid=4444',
    cookie: '',
    referer: app.launchInfo.scene
    // uid: app.User.sessionKey
});

// 埋点统计url地址
var ilog_asm_url = "https://static.zhongan.com/asm.gif?"

// 使用原型链的方式实现的继承，小程序的page读取不到（坑爹小程序）
// 只能使用面这种拙劣的方式
var PageBase = {

    onShareAppMessage: function () {
        return {
            path: '/pages/index/index'
        }
    },

    onReachBottom: function () { },
    noop: function () { },

    // pv 统计
    push_pv,
    // 埋点统计
    push_asm,
    // 点击复制
    tap_copy,
    // 设置数据
    set_data,
    // 拨打电话
    call_phone,
    // 跳转到其他小程序
    navigateToMiniProgram,

    // 生命周期接管
    onLoad,
    onShow,
    onReady,

    // 去首页
    go_home: function (e) {
        e && e.currentTarget && this.push_asm(e);
        this.nav_to('pages/index/index')
    },

    nav_to, // 1. nav_to(url)  2. nav_to(e)

    ilog_error: function (e) {
        app.Log.error(e.detail)
    },

    extend
};

function extend(childMembers){

    // 避免深度copy，否则会出现跨页面对象共享现象
    var p = Util.merge({}, this, false);

    // 接管子页面的部分生命周期函数
    p.__onLoad = childMembers.onLoad;
    p.__onShow = childMembers.onShow;
    p.__onReady = childMembers.onReady;

    delete childMembers.onLoad;
    delete childMembers.onShow;
    delete childMembers.onReady;

    return Util.merge(p, childMembers, false);
}

function onLoad(options) {

    if (!this.options) {
        this.options = options;
    }

    if (typeof this.__onLoad === 'function') {
        this.__onLoad.apply(this, arguments)
    }
}

function onShow() {

    if (typeof this.__onShow === 'function') {
        this.__onShow.apply(this, arguments)
    }

    if (this.auto_push !== false) {
        this.push_pv();
    }
}

function onReady() {

    if (typeof this.__onReady === 'function') {
        this.__onReady.apply(this, arguments)
    }

    wx.showShareMenu({
        withShareTicket: true
    })

    this.setData({
        mod_contactus_show: isOffwork()
    })
}

function isOffwork() {

    var date = new Date();

    var d = date.getDay();

    var start = new Date(Util.formatDate(date, 'yyyy/MM/dd 09:00:00'));
    var end = new Date(Util.formatDate(date, 'yyyy/MM/dd 18:00:00'));

    return date > start && date < end && d >= 1 && d <= 5
}

function set_data(e) {

    var ds = e.currentTarget.dataset;
    if (ds.prop) {

        if (ds.prop.indexOf(',') == -1) {

            if (ds.prop.indexOf('.') == -1) {
                // 单属性设值
                this.setData({
                    [ds.prop]: ds.val
                })
            }
            else {
                // 如果属性链不存在，则加上
                var propChain = ds.prop.split('.');
                var vals = ds.val.split(',');
                if (propChain[0]) {
                    var data = this.data[propChain[0]] || {};
                    for (var i = 0; i < vals.length; i++) {
                        data[propChain[i + 1]] = vals[i];
                    }
                    this.setData({
                        [propChain[0]]: data
                    })
                }
            }
        }
        else {

            // 多属性设值
            var props = ds.prop.split(',');
            var vals = ds.val.split(',');
            var obj = {};
            for (var i = 0; i < props.length; i++) {
                obj[props[i]] = vals[i]
            }

            this.setData(obj)
        }
    }

    ds.ilog && this.push_asm(e)
}

function call_phone(e) {

    var ds = e.currentTarget.dataset;
    wx.makePhoneCall({
        phoneNumber: ds.phone || '1010-9955'
    })

    ds.ilog && this.push_asm(e)
}

// 前进或者回到某个页面（有下面两种传参方式）
// nav_to: function (url) {
function nav_to(e) {

    var url = e; // 来自手动调用
    if (e.currentTarget) {
        // 来自点击事件
        url = e.currentTarget.dataset.url;
        this.push_asm(e);
    }

    var pages = getCurrentPages().reverse();
    var index = pages.findIndex(item => item.route === url);

    if (index == -1) {
        wx.navigateTo({
            url: url.replace('pages', '..')
        })
    }
    else {
        wx.navigateBack({
            delta: index
        })
    }
}

function push_asm(e) {

    var dataset = e.currentTarget.dataset;
    if (app.not_need_ilog || !dataset.ilog) {
        return;
    }

    var subQuery = {
        scene: app.launchInfo.scene,
        subscene: app.launchInfo.subscene,
        uid: app.User.extraInfo.openUserId,
    }

    var query = this.options ? Util.param(this.options) : '';
    if (query) {
        query = '?' + query
    }

    var urlParams = {
        asm: dataset.ilog,
        asm_href: app.config.domain + this.route + query + ',' + Util.param(subQuery, false),
        asm_txt: dataset.ilogtxt || '',
        uid: app.User.extraInfo.openUserId,
        openGId: app.launchInfo.shareInfo.openGId,
        _: Date.now()
    };

    this.setData({
        ui_ilog_asm: ilog_asm_url + Util.param(urlParams)
    })
}

function push_pv(e) {

    if (!this.pageid || app.not_need_ilog) {
        return;
    }

    var subQuery = {
        pageid: this.pageid,
        scene: app.launchInfo.scene,
        subscene: app.launchInfo.subscene,
        uid: app.User.extraInfo.openUserId,
        openGId: app.launchInfo.shareInfo.openGId,
        _: Date.now()
    }

    var query = this.options ? Util.param(this.options) : '';
    if (query) {
        query = '?' + query
    }

    if (Util.isObject(e)) {
        if (!e.currentTarget) {
            Util.merge(subQuery, e)
        }
    }

    this.setData({
        ui_ilog_pv: ilog_pv_url + '&url=' + encodeURIComponent(app.config.domain + this.route + query + ',' + Util.param(subQuery, false))
    })
}

function tap_copy(e) {
    var data = e.target.dataset.copy;
    wx.setClipboardData({
        data: data,
        success: function (res) {
            wx.showToast({
                title: '复制成功',
                icon: 'success',
                duration: 1000
            })
        }
    })
}
function navigateToMiniProgram(e) {

    var ds = e.currentTarget.dataset;
    if (ds.appid) {

        if (!wx.navigateToMiniProgram) {
            app.showError('先升级下微信版本，再来点我哦！', 3);
            return;
        }
        var envVersions = {
            'prd': 'release',
            'uat': 'trial',
            'test': 'develop'
        };

        wx.navigateToMiniProgram({
            appId: ds.appid,
            path: ds.path,
            envVersion: envVersions[app.config.env]
        })
    }
}

module.exports = PageBase;