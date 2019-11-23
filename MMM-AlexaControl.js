/**
 * Magic Mirror
 * Module: MMM-AlexaControl
 * 
 * By JoChef2
 * MIT Licensed.
 */

Module.register("MMM-AlexaControl",{
     
    defaults:{
        image: true,    //  shows the image
        height: 120,    // heigth of the image
        width: 120,     // width of the image
        pages: 0,       //  number off pages in MMM-Pages module. 0 means you doesn't use it
        devices: {      //  empty object for your custom devices
            devices: []
        },
        notifications: [],  //  empty array for your notification devices
        startPort: 11000,   //  the lowest used port
        refresh: true,      //  refresh your Mirror
        restart: true,      //  restart your Mirror with pm2
        stop: true,         //  stops your Mirror with pm2
        reboot: false,      //  reboot your pi
        shutdown: false,    //  shutdown your pi
        pm2ProcessName: "mm",  //  name of your pm2 process
        monitorToggle: true,   //  sitch your monitor on and off
        vcgencmd: true      //  command you use for monitor toggle
    },

    /*getStyles: function() {
		return [this.file("MMM-AlexaControl.css")];
	},*/

    getTranslations: function(){            // add more translations
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        }
    },

    start: function(){
        Log.log('Starting module: ' + this.name);

        // send all translations to node_helper
        this.sendSocketNotification('TRANSLATIONS', {"monitor": this.translate("MONITOR"), "shutdown": this.translate("SHUTDOWN"), "reboot": this.translate("REBOOT"), "page": this.translate("PAGE"), "refresh": this.translate("REFRESH"), "restart": this.translate("RESTART"), "stop": this.translate("STOP")});
        this.sendSocketNotification('SET_DEVICE', this.config);  // send the config to node_helper
    },

    getDom: function(){             // returns only an image or an empty div (necessary for MMM-Pages)
        if(this.config.image){
            let img = document.createElement("img");
            img.classList = "img";
            img.src = "MMM-AlexaControl/AlexaLogoGrey.png";
            img.height = this.config.height;
            img.width = this.config.width;
            return img;
        }else{
            return document.createElement("div");
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === "PAGE_CHANGED"){              //  change pages of MMM-Pages
            this.sendNotification("PAGE_CHANGED", payload);
        }
        if(notification === "ACTION"){                    //  refresh the Mirror
            if(payload === "refresh"){
                window.location.reload(true);
            }
        }if(notification === "CUSTOM"){
            this.sendNotification(payload[0], payload[1]);  //  send any notification to any module
        }
    }
 });