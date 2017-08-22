
var app = getApp(), Weather = {

    stop(){
        this.stoped = true;
    },
    begin(){
        this.stoped = false;
    },
    destroy(){
        this.stop();
        clearInterval(this.timer_weather)
    }
}

Weather.init = function(ctx, option){

    var that = this;

    const width = app.OS.windowWidth;
    const height = 224 / 375 * width;   

    if (option) {
        option.maxNum = option.maxNum || 20;
    }
    
    if (option.wtype == 'rain') {

        let lightning = 0;
        let randomTop = Math.random();

        return setInterval(function () {

            if(that.stoped === true){
                return;
            }

            let x = 0;
            for (var i = 0; i < option.maxNum; i++) {
                
                x = 10 * Math.random();
                if (x < 5) x = 5;

                ctx.drawImage('/images/rainline.png', 
                    width * Math.random(),
                    height * Math.random() + 30, 
                    x, 
                    x/18*31);
            }

            if (option.lightning){
                ctx.drawImage('/images/lightning_storm1.png', 230, 20, 275 / 2, 275/750*170);
                if (lightning % 14 <= 1) {
                    ctx.drawImage(randomTop > 0.5 ? '/images/lightning.png' : '/images/lightning1.png', (width - 70) * randomTop, 10, 70, 130);
                } else {
                    randomTop = Math.random();
                }
                lightning++;

                if (lightning>=14){
                    lightning = 0;
                }
            }

            ctx.draw();
        }, 300)
    } else if (option.wtype == 'snow') {

        var arrSize = [], arrX = [], arrY = [], imgUrl = [],
            all_imgs = ['/images/snowflake1.png', '/images/snowflake2.png', '/images/snowflake3.png'];

        var setByRandom = function (i, height){
            //随机雪花大小15-30
            arrSize[i] = Math.floor(15 * Math.random() + 15);
            arrX[i] = width * Math.random();
            if (height > 0){
                // -30 到 height + 30
                arrY[i] = (height + 30) * Math.random() - 30;
            }
            else{
                arrY[i] = height * Math.random();
            }
            imgUrl[i] = all_imgs[Math.floor(Math.random() * 3)];
        }

        for(var i = 0; i< option.maxNum; i++){
            setByRandom(i, height)
        }

        return setInterval(function(){

            if (that.stoped === true) {
                return;
            }

            for (var i = 0; i < option.maxNum; i++) {
                arrY[i] += 0.3;
                ctx.drawImage(imgUrl[i], arrX[i], arrY[i], arrSize[i], arrSize[i]);
                if (arrY[i] > height) {
                    setByRandom(i, -height)                   
                }
            }

            ctx.draw();
        },40)

    } else if (option.wtype == 'cloudy') {
        let left = 25, left1 = 150,a,b;
        return setInterval(function () {

            if (that.stoped === true) {
                return;
            }
            
            if (left >= 35) {
                a = -0.2;
            } else if (left <= 25) {
                a = 0.2;
            }

            if (left1 >= 150) {
                b = -0.2;
            } else if (left1 <= 140) {
                b = 0.2;
            }
            left += a;
            left1 += b;
            ctx.drawImage('/images/cloudy1.png', left / 375 * width, 20 / 375 * width, 232 / 375 * width, 125 / 375 * width);
            ctx.drawImage('/images/cloudy2.png', left1 / 375 * width, 34 / 375 * width, 232 / 375 * width, 110 / 375 * width);

            ctx.draw();
        }, 120)
    } else if (option.wtype == 'sunny') {

        // let speed = [], a, alpha = 1, arrSize = [], arrX = [], arrY = [], alphaHexagon = [];

        let speedP = 0, a, alpha = 1;

        // for (var i = 0; i < 8; i++) {
        //     arrSize[i] = 50*Math.random()+5
        //     arrX[i] = width - 30 * i - arrSize[i]/2;
        //     arrY[i] = 30 * i - arrSize[i]/2;
        //     speed[i] = 0;
        //     alphaHexagon[i] = 0.4+Math.random()*0.5;
        // }

        return setInterval(function () {

            if (that.stoped === true) {
                return;
            }

            if (alpha >= 1) {
                a = -0.02;
            } else if (alpha <= 0.5){
                a = 0.02;
            }
            
            alpha += a;

            ctx.save()
            ctx.setGlobalAlpha(alpha)

            ctx.translate(width, 0);
            ctx.rotate((alpha*6) * Math.PI / 180)
            ctx.drawImage('/images/sunny.png', 30 - width, -50, width, 337 / 375 * width);

            ctx.restore()


            ctx.setGlobalAlpha(1)
            const grd = ctx.createCircularGradient(width - 10, 10, 120)
            grd.addColorStop(0, 'rgba(255,255,255,0.8)')
            grd.addColorStop(.6, 'rgba(255,255,255,0.1)')
            grd.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.setFillStyle(grd)
            ctx.arc(width, 0, 120, 0, 2 * Math.PI)
            ctx.fill()


            ctx.beginPath()
            // for(var i = 0;i<8;i++){
            //     speed[i] += 0.2;

            //     ctx.setGlobalAlpha(alphaHexagon[i])
            //     ctx.drawImage('/images/hexagon.png', arrX[i] - speed[i], arrY[i] + speed[i], arrSize[i], arrSize[i]);
                
            //     if (arrY[i] + speed[i] > 220) {
            //         arrSize[i] = 50 * Math.random() + 5
            //         arrX[i] = width - arrSize[i] / 2;
            //         arrY[i] = - arrSize[i] / 2;
            //         speed[i] = 0;
            //         alphaHexagon[i] = 0.4 + Math.random() * 0.5;
            //     }
            // }

            speedP += 0.08;

            ctx.drawImage('/images/paopao.png', width - (200 / 375 * width) - speedP, 45 / 375 * width + speedP, 170 / 375 * width, 170 / 375 * width);
            ctx.drawImage('/images/paopao.png', width - (200 / 375 * width) - speedP + height, 45 / 375 * width + speedP - height, 170 / 375 * width, 170 / 375 * width);

            if (speedP>height){
                speedP = 0;
            }

            ctx.fill()
            ctx.draw();
        }, 150)

    }
}

Weather.getWeatherType = function (weather) {

    switch (weather) {
        case '晴':
            return {
                name: weather, wtype: 'sunny'
            }

        case '多云':
        case '阴':
        case '浮尘':
        case '扬沙':
        case '强沙尘暴':
        case '浓雾':
        case '强浓雾':
        case '霾':
        case '中毒霾':
        case '重度霾':
        case '严重霾':
        case '大雾':
        case '特强浓雾':
        // case '无':
        case '雾':
        case '沙尘暴':
            return {
                name: weather, wtype: 'cloudy'
            }

        case '雨':
        case '阵雨':  
        case '雨夹雪':
        case '小雨':
        case '冻雨':
        case '小雨-中雨':
            return { name: weather, wtype: 'rain', maxNum: 50 }

        case '雷阵雨':
        case '雷阵雨伴有冰雹':
            return { name: weather, wtype: 'rain', maxNum: 200, lightning: true }

        case '中雨':
        case '中雨-大雨':
            return { name: weather, wtype: 'rain', maxNum: 100 }

        case '大雨':
        case '暴雨':
        case '大暴雨':
        case '特大暴雨':
        case '大雨-暴雨':
            return { name: weather, wtype: 'rain', maxNum: 200 };
        case '暴雨-大暴雨':
        case '大暴雨-特大暴雨':
            return { name: weather, wtype: 'rain', maxNum: 400 };

        case '雪':
        case '阵雪':
        case '小雪':
        case '小雪-中雪':
            return { name: weather, wtype: 'snow', maxNum: 20 }

        case '中雪':
        case '中雪-大雪':
            return { name: weather, wtype: 'snow', maxNum: 30 }

        case '大雪':
        case '暴雪':
        case '大雪-暴雪':
            return { name: weather, wtype: 'snow', maxNum: 40 }
    }
}

Weather.getCityPic = function( cityName ){

    switch( cityName ){

        case '北京':
            return 'city_beijing.jpg';
        case '上海':
            return 'city_shanghai.jpg';
        case '广州':
            return 'city_guangzhou.jpg';
        case '深圳':
            return 'city_shenzhen.jpg';
        case '杭州':
            return 'city_hangzhou.jpg';
    }
}

Weather.getWeather = function (page) {

    var that = this;

    var getWeather = function (cityName, latitude, longitude) {

        var postData = {
            appKey: 'HL',
            requestSource: 'wxappdelay'
        }

        if (cityName) {
            postData.cityName = cityName
        }
        else {
            postData.location = latitude + ',' + longitude
        }

        app.doRequest({
            url: app.config.apiBase + '/za.shepherd.jisuQueryWeatherInfoProcessor/v1?message='
            + encodeURIComponent(JSON.stringify(postData)),
            method: 'POST',
            success: function (res) {

                if (res.isSuccess) {

                    var data = JSON.parse(res.value);

                    !cityName && wx.setStorage({
                        key: app.store.location,
                        data: {
                            cityName: data.cityName,
                            latitude,
                            longitude
                        }
                    })

                    var weather = that.getWeatherType(data.weather);
                    if (weather){
                        that.timer_weather = that.init(page.ctx_weather, weather);
                        weather.cityName = data.cityName;
                        page.setData({ 
                            weather,
                            city_pic: that.getCityPic(data.cityName)
                        })
                    }
                }
            }
        }, true)
    }

    wx.getLocation({
        success: function (res) {

            var location;
            try {
                location = wx.getStorageSync(app.store.location);
            } catch (e) { }

            if (location && location.cityName) {

                // 按照经纬度每相差0.01度相差距离 1公里 粗略计算
                var distance = Math.sqrt(Math.pow(res.latitude - location.latitude, 2)
                    + Math.pow(res.longitude - location.longitude, 2)) / 0.01;

                if (distance < 5) {
                    // 用户移动小于5公里时，
                    // 继续使用上次位置查询
                    getWeather(location.cityName);
                    return;
                }
            }

            getWeather('', res.latitude, res.longitude);
        }
    })
}

module.exports = Weather; 