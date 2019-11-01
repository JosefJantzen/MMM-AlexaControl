/**
 * Magic Mirror
 * Node Helper: MMM-AlexaControl
 * 
 * By JoChef2
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var FauxMo = require('node-fauxmo');
var pm2 = require('pm2');
const exec = require("child_process").exec;

module.exports = NodeHelper.create({
	
	start: function () {
        console.log('MMM-AlexaControl helper, started...');
        this.config = null;
        this.setDevicesCounter = 0;  //  Counter for only one node_helper start look line 225 
    },
	
	setDevices: function(){
        _this = this;

        cD = this.customDevices(this.config.devices);
        nD = this.notificationDevices(cD, this.config.notifications);
        pD = this.pageDevices(nD);
        mD = this.menuDevices(pD);
        //console.log(pD);
        //console.log(mD);

        fauxMoPages = new FauxMo(mD);       // creates fauxmo devices
    },

    customDevices : function(customD){      //  creates your custom devices from config
        _this = this
        for(i = 0; i < Object.keys(customD.devices).length; i++){
            if(customD.devices[i].port === undefined){
                customD.devices[i].port = _this.config.startPort + 30 + i;
            }
            customD.devices[i].handler = new Function('action', customD.devices[i].handler)
        }
        return customD;
    },

    notificationDevices: function(notificationD, notifications){    //  creates your notification devices
        _this = this

        counter = 0 + Object.keys(notificationD.devices).length        
        _this.n = []

        for(i = 0; i < Object.keys(notifications).length; i++){
            device = {}
            device.name = notifications[i].name
            if(notifications[i].port === undefined){
                device.port = _this.config.startPort + 50 + i
            }else{
                device.port = notifications[i].port
            }
            if(notifications[i].OnOff){
                _this.n[i] = notifications[i].notification
                device.handler = new Function('action', 'if(action === 1){_this.sendSocketNotification("CUSTOM",' + JSON.stringify(_this.n[i][0]) + ')}else{_this.sendSocketNotification("CUSTOM",' + JSON.stringify(_this.n[i][1]) + ')}')
            }else{
                _this.n[i] = notifications[i].notification
                device.handler = new Function('action', '_this.sendSocketNotification("CUSTOM",' + JSON.stringify(_this.n[i]) + ')')
            }
            notificationD.devices[i + counter] = device
        }
        return notificationD;
    }, 

    pageDevices: function(pageD){      //  creates your page devices
        _this = this;
        pageHandler = [function(action) {_this.sendSocketNotification("PAGE_CHANGED", 0)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 1)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 2)},function(action) {_this.sendSocketNotification("PAGE_CHANGED",3 )},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 4)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 5)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 6)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 7)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 8)},function(action) {_this.sendSocketNotification("PAGE_CHANGED", 9)},]
        
        counter = 0 + Object.keys(pageD.devices).length

        if(_this.config.pages > 0){
            for(i = 0; i < _this.config.pages; i++){
                device = {}
                device.name = _this.translations["page"] + (i + 1)
                device.port = _this.config.startPort
                device.handler = pageHandler[i]

                pageD.devices[i + counter] = device
                _this.config.startPort++
            }
            _this.config.startPort = _this.config.startPort + (10 - _this.config.pages)
            return pageD
        }
    },

    menuDevices: function(menuD){       //  create your devices to control the Mirror and pi
        _this = this;
        var opts = { timeout: 8000 };

        counter = 0 + Object.keys(menuD.devices).length

        if(this.config.refresh){
            device = {}
            device.name = _this.translations["refresh"]
            device.port = _this.config.startPort
            device.handler = function(action) {_this.sendSocketNotification("ACTION", "refresh")}

            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++

        if(this.config.restart){        // only with PM2
            device = {}
            device.name = _this.translations["restart"]
            device.port = _this.config.startPort
            device.handler = function(action) {
                pm2.connect((err) => {
                    if (err) {
                        console.error(err);
                    }
        
                    console.log("Restarting PM2 process: " + _this.config.pm2ProcessName);
                    pm2.restart(_this.config.pm2ProcessName, function(err, apps) {
                        pm2.disconnect();
                        if (err) { console.log(err); }
                    });
                });
            }
            
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++
        
        if(this.config.stop){        // only with PM2
            device = {}
            device.name = _this.translations["stop"]
            device.port = _this.config.startPort
            device.handler = function(action) {
                pm2.connect((err) => {
                    if (err) {
                        console.error(err);
                    }
        
                    console.log("Stopping PM2 process: " + _this.config.pm2ProcessName);
                    pm2.stop(_this.config.pm2ProcessName, function(err, apps) {
                        pm2.disconnect();
                        if (err) { console.log(err); }
                    });
                });
            }

            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++
        
        if(this.config.reboot){        //reboot the pi
            device = {}
            device.name = _this.translations["reboot"]
            device.port = _this.config.startPort
            device.handler = function(action) {
                exec("sudo shutdown -r now", opts, (error, stdout, stderr) => {
                     _this.checkForExecError(error, stdout, stderr); 
                    });
                }
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++
        
        if(this.config.shutdown){        // shutdwon the pi
            device = {}
            device.name = _this.translations["shutdown"]
            device.port = _this.config.startPort
            device.handler = function(action) {
                exec("sudo shutdown -h now", opts, (error, stdout, stderr) => {
                    _this.checkForExecError(error, stdout, stderr); 
                });
            }           
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++

        /**
         * for me worked only vcgencmd display_power 0 and vcgencmd display_power 1
         * probably for you work tvservice --off and tvservice --preferred
         * test it in terminal if you aren't sure
         */
        
        if(this.config.monitorToggle){ 
            device = {}
            device.name = _this.translations["monitor"]
            device.port = _this.config.startPort
            if(this.config.vcgencmd){
                device.handler = function(action) {     
                    if(action === 1){
                        exec("vcgencmd display_power 1", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr); 
                        });
                    }if(action === 0){
                        exec("vcgencmd display_power 0", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr); 
                        });
                    }
                }
            }else{
                device.handler = function(action) {     
                    if(action === 1){
                        exec("tvservice --preferred", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr);
                        });
                    }if(action === 0){
                        exec("tvservice --off", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr);
                        });
                    }
                }
            }
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++
        return menuD; 
    },

    checkForExecError: function(error, stdout, stderr) {
        if (stderr) {
            console.log('stderr: "' + stderr + '"');
            return 1;
        }
        if (error !== null) {
            console.log('exec error: ' + error);
            return 1;
        }
        return 0;
    },
    
	socketNotificationReceived: function(notification, payload) {
		if(notification === "SET_DEVICE"){      //  set all your devices
            this.config = payload;
            if(this.setDevicesCounter === 0){   //  set your devices only the first time a 
                this.setDevices();              //  notification is received
                this.setDevicesCounter++;
            }
        }
        if(notification === "TRANSLATIONS"){    //  get translations and put them in an array
            this.translations = [];            
            this.translations = payload;
		}
	}	
});