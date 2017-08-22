
const appconfig = require('./app.config');
const Util = require('/utils/util');
const Log = new (require('/utils/log'))('【' + appconfig.appDesc + appconfig.env.toUpperCase() + '】');
const EventEmiter = require('/utils/eventemiter');

const SESSION_KEY = 'session_key';
const User = {
    userInfo: {},
    sessionKey: '',
    encryptedData: '',
    iv: '',
    extraInfo: {
        openUserId: 0,
        containsUnionId: false
    }
};

const OS = (function () {
    try { return wx.getSystemInfoSync() || {} } catch (e) { return {} }
})();

if (appconfig.env == 'prd') {
    console.log = console.info = function () { }
}

console.info('AppVersion: ' + appconfig.version);

App({
    _is_Logging_in: false,
    _request_stack: [],
    not_need_ilog: appconfig.env !== 'prd' || OS.platform === 'devtools',
    config: appconfig,
    launchInfo: {},
    globalData: {
        flightInfo: null,
        segments: null,
        orderData: null,
        formData: null,
        userInfo: null
    },
    cache: {
        history: null
    },
    User, Util, Log, OS,
    EventEmiter,
    onLaunch,
    onShow(options) {
        // options: the same to onLaunch
    },
    onHide() {},
    onError(msg) {

        this.Log.error(msg, 'script');
        if (this.config.env != 'prd') {
            this.showError(msg.substr(0, 200), 3);
            console.log(msg)
        }
    },

    request, doRequest,
    login, doLogin,
    showError, showToast,
    showPageLoading, hidePageLoading,

    store: {
        session: SESSION_KEY,
        location: 'location_info'
    },
    states: new EventEmiter(),
    
    openFile
})

function onLaunch(options){

    // {"path":"pages/index/index","scene":1001,"query":{}}
    this.launchInfo = options;

    // 老版本query可能为空
    if (!options.query) {
        options.query = {}
    }

    if(options.query._need_ilog==='1'){
        this.not_need_ilog = false
    }

    // 自定义场景
    this.launchInfo.subscene = options.query.scene || '';
    this.launchInfo.channel = options.query.channel || '';
    
    // 分享相关数据
    this.launchInfo.shareInfo = {
        openGId: '' // 群组id
    };

    console.log(this.launchInfo);

    getLocalSession();
    getShareInfo(this, options.shareTicket);
}

function getShareInfo(app, shareTicket) {

    var onDecrypted = function (decryptedRes){
        if (decryptedRes.success) {
            try {
                var data = JSON.parse(decryptedRes.value);
                Util.merge(app.launchInfo.shareInfo, data);
            } catch (e) { }
        }
    }

    shareTicket && app.login(function(){
        wx.getShareInfo({
            shareTicket,
            success: function (shareRes) {
                app.request({
                    serviceName: 'SalesWeChatAppAuthDecryptedInfo',
                    data: {
                        encryptedData: shareRes.encryptedData,
                        iv: shareRes.iv
                    },
                    method: 'POST',
                    success: onDecrypted
                })
            }
        })
    })
}

function getLocalSession() {

    try {
        var value = wx.getStorageSync(SESSION_KEY)
        if (value) {
            Util.merge(User, value)
        }
    } catch (e) { }
}

function login(cb) {

    let that = this;
    let onFail = function () {
        console.info('获取本地sessionkey失败，重新发起登录流程');
        that.doLogin(cb)
    };

    wx.checkSession({
        success: function (res) {
            console.info('wx session 未过期');
            if (User.sessionKey) {
                cb(User);
            }
            else {
                onFail()
            }
        },
        fail: onFail
    });
}

function doLogin(cb, userData) {

    this._request_stack.push(cb);
    if (this._is_Logging_in === true) {
        return;
    }

    this._is_Logging_in = true;

    let that = this, onGetSessionFail = function (res) {

        that.Log.error('doLogin request failed - ', JSON.stringify(res))
    }, doSessionRequest = function (code) {

        // 这里不要使用 app.request, 避免session过期问题造成回调死循环
        wx.request({
            url: that.config.apiBase + '?serviceName=SalesWeChatAppAuthLogin&serviceVersion=1.0.0',
            data: {
                loginCode: code,
                activityChannel: appconfig.activityChannel,
                userInfo: User.userInfo,
                encryptedData: User.encryptedData,
                iv: User.iv,
                activityScene: {
                    scene: that.launchInfo.scene,
                    subscene: that.launchInfo.subscene,
                    channel: that.launchInfo.channel
                }
            },
            method: 'POST',
            success: function (res) {

                var resdata = res.data;
                if (resdata.success && resdata.value) {

                    User.sessionKey = res.data.value;
                    if (res.data.extraInfo) {
                        User.extraInfo = res.data.extraInfo;
                    }

                    wx.setStorage({
                        key: SESSION_KEY,
                        data: User
                    });

                    do {
                        that._request_stack.shift()(User)
                    } while (that._request_stack.length)
                }
                else {
                    onGetSessionFail(res);
                }
            },
            fail: onGetSessionFail,
            complete: function () {
                that._is_Logging_in = false
            }
        })
    }

    wx.login({
        withCredentials: true,
        success: function (res) {
            if (res.code) {

                var onGetUserInfoSuccess = function (res2) {

                    User.userInfo = res2.userInfo;
                    User.encryptedData = res2.encryptedData;
                    User.iv = res2.iv;

                    doSessionRequest(res.code);
                }

                if (userData) {

                    onGetUserInfoSuccess(userData)
                    return;
                }

                wx.getUserInfo({
                    success: onGetUserInfoSuccess,
                    lang: 'zh_CN',
                    fail: function (error) {
                        console.log('用户未授权获取信息');
                        doSessionRequest(res.code)
                    }
                })
            } else {
                that._is_Logging_in = false;
                console.log('获取用户登录态失败 - ', res.errMsg)
            }
        },
        fail: function (res) {
            that._is_Logging_in = false;
            console.log('wx.login failed - ', res.errMsg);
        }
    });
}

function showTip(tip_type, msg, interval, callback) {

    let currPage = Util.getCurrentPage();

    if (currPage){

        let option = {};
        let timerKey = '_timer_' + tip_type;

        option[tip_type] = {
            hidden: false,
            msg: msg
        }

        currPage.setData(option);

        if (this[timerKey]) {
            clearTimeout(this[timerKey])
        }

        this[timerKey] = setTimeout(function () {
            option[tip_type].hidden = true;
            currPage.setData(option);
            callback && callback();
        }, (interval || 1.5) * 1000);
    }
}

function showError(msg, interval, callback) {
    showTip.call(this, 'ui_toptip', msg, interval, callback)
}

function showToast(msg, interval, callback) {
    showTip.call(this, 'ui_toast', msg, interval, callback)
}

function showPageLoading() {
    var page = Util.getCurrentPage();
    page && page.setData({
        ui_pageloading: {
            hidden: false
        }
    })
}

function hidePageLoading() {
    var page = Util.getCurrentPage();
    page && page.setData({
        ui_pageloading: {
            hidden: true
        }
    })
}

function _buildUrl(option) {

    return appconfig.apiBase + '?serviceName=' + option.serviceName
        + '&serviceVersion=' + (option.serviceVersion || '1.0.0');
}

function _handleRequestError(option, res, suppressTip) {

    // 出错了
    if (suppressTip !== true) {
        this.showError('出错了，请稍后再试！');
    }

    option.error && option.error(res);

    console.info("接口请求失败 - statusCode:", res.statusCode,
        ' data:', option, ' response:', res);

    this.Log.error({
        summary: '接口请求失败 - statusCode：' + res.statusCode,
        option: option,
        response: res
    })
}

// 强制授权接口请求。 suppressTip 传 true 来取消接口请求失败的默认错误提示
// 每个接口请求都把session-key放到请求头部
function request(option, suppressTip) {

    let self = this;

    if (!option.url) {
        option.url = _buildUrl(option)
    }

    if (!option.header) {
        option.header = {};
    }

    var success = option.success;
    option.success = function (res) {

        if (res.statusCode == 200) {
            // 正常返回
            success && success(res.data)
        }
        else if (res.statusCode == 403) {
            // 如果session过期
            option.success = success;
            self.doLogin(function (user) {
                option.header['Session-Key'] = user.sessionKey;
                self.doRequest(option);
            });
        }
        else {
            // 出错了
            _handleRequestError.call(self, option, res, suppressTip)
        }
    }

    this.login(function (user) {
        option.header['Session-Key'] = user.sessionKey;
        wx.request(option);
    })
}

// 非强制授权接口请求。 suppressTip 传 true 来取消接口请求失败的默认错误提示
function doRequest(option, suppressTip) {

    var self = this;

    if (!option.url) {
        option.url = _buildUrl(option)
    }

    var success = option.success;
    option.success = function (res) {

        if (res.statusCode == 200) {
            // 正常返回
            success && success(res.data)
        }
        else {
            // 出错了
            _handleRequestError.call(self, option, res, suppressTip)
        }
    }

    wx.request(option);
}

function openFile(url, beforeOpen){

    wx.showLoading({
        title: '加载中...',
    })

    url = url.replace(/http:/, 'https:');
    var self = this;

    wx.downloadFile({
        url: url,
        success: function (res) {
            if (beforeOpen && beforeOpen(res) === false){
                wx.hideLoading();
                return
            }
           
            wx.openDocument({
                filePath: res.tempFilePath,
                complete: function () {
                    wx.hideLoading();
                },
                fail:function(res){
                    self.showError('文件打开失败');
                    console.log(res);
                }
            })
        },
        fail: function (e) {
            self.showError('文件下载失败');
            wx.hideLoading();
        }
    })
}