
var EventEmiter = function (context) {

    this.events = {};
};

var pt = EventEmiter.prototype;

pt.on = function (evt_name, cb, name) {

    if(typeof cb === 'function'){

        if (name){
            cb.name = name
        }

        var cbs = this.events[evt_name];
        if (cbs) {
            cbs.push(cb)
        }
        else {
            this.events[evt_name] = [cb]
        }
    }

    return this;
}

pt.emit = function (evt_name, data) {

    var cbs = this.events[evt_name];
    if (cbs && cbs.length) {
        for (var i = 0, len = cbs.length; i < len; i++) {
            cbs[i] && cbs[i].call(this, data)
        }
    }

    return this;
}

pt.off = function(evt_name, name){

    var cbs = this.events[evt_name];
    if (cbs && cbs.length){
        if (name){
            for (var i = 0, len = cbs.length; i < len; i++) {
                if(cbs[i] && cbs[i].name == name){
                    cbs[i] = void 0;
                    break;
                }
            }
        }else{
            cbs.length = 0;
        }
    }

    return this;
}

module.exports = EventEmiter;