
// 各环境接口地址
var ENV_API = {
    test: "https://tac-gw-api-itest.zhongan.com/gateway/api",
    uat: "https://tac-gw-api-uat.zhongan.com/gateway/api",
    prd: "https://tac-gw-api.zhongan.com/gateway/api"
};

// 这里添加的属性，可以通过app.config 来访问
var config = {
    version: '3.1.4',
    appName: 'wxapp_delay',
    appDesc: '机场延误险小程序',
    env: 'test', // 在这里切换当前环境
    cdnBase: 'https://cdn-qcloud.zhongan.com/a00001/Project/product/wxapp_delay/20170810_1',
    // ilog 统计url域
    domain: 'http://wxappdelay.zhongan.com/',
    activityChannel: 201
};

config.apiBase = ENV_API[config.env];

module.exports = config;