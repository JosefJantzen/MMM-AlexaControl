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
	
    formattedName: function(devname,actionString){
        var result=actionString
        if(devname != undefined){
            var s = actionString.split(' ')
            if(s.length>1)
                s.splice(1,0,devname)
            else
                s.unshift(devname)
            result = s.join(' ')
        }        
        return result;
    },
    
	setDevices: function(){
        _this = this;

        cD = this.customDevices(this.config.devices);
        nD = this.notificationDevices(cD, this.config.notifications);
        coD = this.commandDevices(nD, this.config.commands)
        pD = this.pageDevices(coD);
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
            device.name = _this.formattedName(_this.translations["deviceName"],notifications[i].name)
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

    commandDevices: function(commandD, commands){
        _this = this

        counter = 0 + Object.keys(commandD.devices).length        
        _this.n = []
        _this.opts = { timeout: 8000 };
        _this.exec = exec

        for(i = 0; i < Object.keys(commands).length; i++){
            device = {}
            device.name = _this.formattedName(_this.translations["deviceName"],commands[i].name)
            if(commands[i].port === undefined){
                device.port = _this.config.startPort + 75 + i
            }else{
                device.port = commands[i].port
            }
            _this.n[i] = commands[i].command
            if(commands[i].OnOff){
                device.handler = new Function('action', 'if(action === 1){_this.exec(' + JSON.stringify(_this.n[i][0]) + '), _this.opts, (error, stdout, stderr) => {_this.checkForExecError(error, stdout, stderr); }}else{_this.exec(' + JSON.stringify(_this.n[i][1]) + '), _this.opts, (error, stdout, stderr) => {_this.checkForExecError(error, stdout, stderr); }}')
            }
            else{
                device.handler = new Function('action', 'if(action === 1){_this.exec(' + JSON.stringify(_this.n[i]) + '), _this.opts, (error, stdout, stderr) => {_this.checkForExecError(error, stdout, stderr); }}')
            }
            commandD.devices[i + counter] = device
        }
        return commandD;
    },

    pageDevices: function(pageD){      //  creates your page devices
        _this = this;

        counter = 0 + Object.keys(pageD.devices).length
        this.pPort = _this.config.startPort

        if(_this.config.pages > 0){
            for(i = 0; i < _this.config.pages; i++){
                device = {}
                device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["page"] + (i + 1))
                device.port = _this.pPort - 100
                device.handler = new Function('action', `_this.sendSocketNotification("PAGE_CHANGED", ` + i +`)`)

                pageD.devices[i + counter] = device
                this.pPort++
            }
        }
        return pageD
    },

    menuDevices: function(menuD){       //  create your devices to control the Mirror and pi
        _this = this;
        var opts = { timeout: 8000 };
        //console.log("menu device ")
        counter = 0 + Object.keys(menuD.devices).length

        if(this.config.refresh){
            device = {}
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["refresh"])
            device.port = _this.config.startPort
            device.handler = function(action) {_this.sendSocketNotification("ACTION", "refresh")}

            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++

        if(this.config.restart){        // only with PM2
            device = {}
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["restart"])
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
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["stop"])
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
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["reboot"])
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
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["shutdown"])
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
        	console.log("monitorToggle requested")
            device = {}
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["monitor"])
            device.port = _this.config.startPort
            if(this.config.vcgencmd =='vcgencmd'){
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
            }
	    else if(this.config.vcgencmd =='xrandr'){
                device.handler = function(action) {     
                    if(action === 1){
                        exec("xrandr --output HDMI-1 --auto", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr); 
                        });
                    }if(action === 0){
                        exec("xrandr --output HDMI-1 --off", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr); 
                        });
                    }
                }
            }
            else if(this.config.vcgencmd =='tvservice'){
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
            else if(this.config.vcgencmd =='cec-client'){
                device.handler = function(action) {     
                    if(action === 1){
                        exec("echo \'on "+ _this.config.cecAddress +"\' | cec-client -s -d 1", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr);
                        });
                    }if(action === 0){
                        exec("echo \'standby "+ _this.config.cecAddress +"\' | cec-client -s -d 1", opts, (error, stdout, stderr) => {
                            _this.checkForExecError(error, stdout, stderr);
                        });
                    }
                }
            }
            else if(this.config.vcgencmd =='hide'){
            	console.log("configuring toggle with hide")
            	device.handler = function(action) {     
            		console.log("received monitor toggle with hide action="+action)
           	 		_this.sendSocketNotification('MONITOR_ACTION', action?"SLEEP_WAKE":"SLEEP_HIDE")
          		}	
            }
            else{
                device.handler = function(action){
                    console.log("Please configure the option vcgencmd")
                }
            }
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++

        if(this.config.usb){        // toggle usb power of your pi
            device = {}
            device.name = _this.formattedName(_this.translations["deviceName"],_this.translations["usb"])
            device.port = _this.config.startPort
            device.handler = function(action) {
                if(action === 0){
                    exec("echo '1-1' |sudo tee /sys/bus/usb/drivers/usb/unbind", opts, (error, stdout, stderr) => {
                        _this.checkForExecError(error, stdout, stderr); 
                    });
                }
                else{
                    exec("echo '1-1' |sudo tee /sys/bus/usb/drivers/usb/bind", opts, (error, stdout, stderr) => {
                        _this.checkForExecError(error, stdout, stderr); 
                    });
                }
            }           
            menuD.devices[counter] = device;
            counter++;
        }
        _this.config.startPort++
        return menuD; 
    },

  /*  monitorOff: function(){
        var opts = { timeout: 8000 };
        if(this.config.vcgencmd){
            exec("vcgencmd display_power 0", opts, (error, stdout, stderr) => {
                _this.checkForExecError(error, stdout, stderr); 
            });
        }else{
            exec("tvservice --off", opts, (error, stdout, stderr) => {
                _this.checkForExecError(error, stdout, stderr);
            });
        }
    }, */

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
