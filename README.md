# MMM-AlexaControl

The `MMM-AlexaControl` module allows you to control your [MagicMirror²](https://github.com/MichMich/MagicMirror) with Alexa.
You can turn it on and off, change the page and send notifications to other modules. For that it uses [`node-fauxmo`](https://github.com/lspiehler/node-fauxmo) nodejs module. As a result of this only an Amazon Alexa is necessary to use the module. Not even an Alexa Skill is required.
It emulates an Wemos device. So acutally every smart home automation device that supports Wemos devices should be able to control your Mirror. But I only test it with an Echo Dot Gen. 3 and a Raspberry Pi 3B+. <br>
***Note:*** If you have problems [look at the end](https://github.com/JoChef2/MMM-AlexaControl#problems) of the Readme

## Installation

1. Navigate to your modules folder in a terminal:
````bash
cd ~/MagicMirror/modules
````
2. Clone this repository:
````bash
git clone https://github.com/JoChef2/MMM-AlexaControl.git
````
3. Navigate into the module folder and install the node modules. This step could use a few minutes.
````bash
cd ~/MMM-AlexaControl
npm install
````
4. Configure the module in your config file. For that use the steps below.

5. Start your Mirror

6. Search in the Alexa App for new devices or say: "Alexa, discover my devices". <br>
**Note:** For some of the devices e.g. `restart` restarts your mirror wether or not you say on or off happen the same thing. For the `monitorToggle` device it isn't indifferent. <br>
**Note:** If you have problems to discover your devices or other problems [look at the end](https://github.com/JoChef2/MMM-AlexaControl#problems) of the Readme.

7. Say "Alexa turn [device name] on/off" <br>

## Using the module

To use this module, add it to the modules array in the config/config.js file:

````js
modules:[
    {
        module: 'MMM-AlexaControl',
        position: 'middle_center',
        config:{
            image: true,
            pm2ProcessName: "mm",
            vcgencmd: "vcgencmd"
        }
    }
]
````

## Configuration options

The following properties can be configured:

| Option            | Description
| ----------------- | -----------
| `image`           | ![Icon](https://i.imgur.com/wk0YF1V.png?1) <br>  Make this image visible. <br> **Default Value:** `true` <br>**Possilbe Values:** `true` or `false`
| `height`          | Here you can change the image height. <br> **Default Value:** `265` ***Note:*** The unit is px.
| `width`           | Here you can change the image width. <br> **Default Value:** `265` ***Note:*** The unit is px.
| `pm2ProcessName`  | If you want to restart your Mirror with PM2 change here your PM2 processname. [Here](https://github.com/MichMich/MagicMirror/wiki/Auto-Starting-MagicMirror) you can configure PM2 for your Mirror. <br> **Default value:** `mm`
| `vcgencmd`        | This option chose the command to toggle your monitor on and off. I found two commands. Test them before in the terminal. <br> **Default value:** `vcgencmd` <br> **Possible values:**<br> `vcgencmd` = `vcgencmd display_power 0` and `vcgencmd display_power 1` <br>`tvservice` = `tvservice --off` and `tvservice --preferred` <br> `hide` = uses the module [MMM-SleepWake](https://github.com/sdetweil/MMM-SleepWake) to hide all modules.
| `deviceName` | This option allows you to provide a name for this MM installation, useful if u have more than one Mirror installation. The alexa device names will include this name. <br> **Default value:** not used |
| `startPort`       | First Port for the devices. The port identify the device. So delete old devices in the Alexa App to prevent issues. You have to change it if you have two mirrors with this module. If you have set the port to 11000 the ports 10900 - 11200 are reserved. So the easiest way is to set this option on your second mirror to 12000. <br> **Default value:** `11000`|

### Control devices
These are configured devices you can use. If you want to change their name you must edit the translation file inside `/translations/en.json`. You can also add languages.

| Option            | Description
| ----------------- | -----------
| `refresh`         | This refreshs your Mirror. <br> ***Default value:*** `true` <br> ***Possible value:*** `true` and `false`
| `restart`         | This restarts your Mirror with PM2. So make sure the `pm2ProcessName` is right. <br> ***Default value:*** `true` <br> ***Possible values:*** `true` and `false`
| `stop`            | This stops your Mirror with PM2. So make sure the `pm2ProcessName` is right. <br> ***Default value:*** `true` <br> ***Possible values:*** `true` and `false`
| `reboot`          | This reboots your Pi. <br> ***Default value:*** `false` <br> ***Possible values:*** `true` and `false`
| `shutdown`        | This shutdowns your Pi. ***Note:*** When you shutdown the Pi your devices aren't available. So you must start your Pi manually. <br> ***Default value:*** `false` <br> ***Possible values:*** `true` and `false`
| `monitorToggle`   | This can switch your monitor on and off. Make sure the used command work for you. Look at the option `vcgencmd` <br> ***Default value:*** `true` <br> ***Possible values:*** `true` and `false`

### Page devices

If you are using the [MMM-Pages](https://github.com/edward-shen/MMM-pages) module you can change the page with this module. <br> You only have to type your number of pages in th config file. ***Note:*** There are  100 pages available. I think that's enougth.

| Option            | Description
| ----------------- | -----------
| `pages`           | The number of your pages you would like to control. ***Note:*** Chose `0` if you won't use this. <br> ***Default value:*** `0` <br>

### Notification devices

Notification devices allows you to send notifications to other modules.<br>
You can send the same notification when you turn the device on and off like this: <br>***Note:*** You have to put the notifications array you chose inside the config part.

````js
notifications: [
    {
        name: 'Notificaition 1',
        port: 11100,
        OnOff: false,
        notification: ["NOTIFICATION", "PAYLOAD"]
    }
]
````

You can send different notifications when you turn a device on or off like this:

````js
notifications: [
    {
        name: 'Notification 2',
        port: 11101,
        OnOff: true,
        notification: [["NOTIFICATION ON", "PAYLOAD ON"],["NOTIFICATION OFF", "PAYLOAD OFF"]]
    }
]
````
***Note:*** `NOTIFICATION ON` and `NOTIFICATION OFF` stay for the different notifications you can send when you turn on or off the device. The same thing applies to `PAYLOAD ON` and `PAYLOAD OFF`. <br> <br>
These are the configuration options for a notification device: <br> ***Note:*** They are all necessary.

| Option            | Description
| ----------------- | -----------
| `name`            | Here you can name your device. Make sure you didn't used the name before. Delete first the old device.
| `port`            | Here you can give the device a static Port. I suggest that to you because then there aren't overlaps. Preferably start with the port `11100`.
| `OnOff`           | If you want to send the same notification when you turn a device on and off chose `true`. Otherwise if you want to send different notifications chose `false`. <br> ***Possible values:*** `true` and `false`
| `notification`    | **If OnOff is true:** <br> `notification: [["NOTIFICATION ON","PAYLOAD"],["NOTIFICATION OFF", "PAYLOAD"]]` <br> Replace the notifications and the payloads. <br> **If OnOff is false:** <br> `notification: ["NOTIFICATION", "PAYLOAD"]` <br> Replace the notification and payload.

### Custom devices

You can also create custom devices. I'm not really sure if it's useful but probably somebody need it. For that you need the option `devices`. Here are two examples: <br>
If you want to do the same thing when you turn on and off your devices use this:
<br>***Note:*** You have to put the devices array you chose inside the config part.

````js
devices: {
    devices: [{
        name: 'Custom 1',  
        port: 11102,              
        handler: `_this.sendSocketNotification("PAGE_CHANGED", 1)`
    }  
]}
````

If you want to do different things when you turn on or off your device use this:

````js
devices: {
    devices: [{
            {
                name: 'Custom 2',
                port: 11103,
                handler: `if(action === 1){  // 1 means on
                            _this.sendSocketNotification("PAGE_CHANGED", 0)
                        }else{
                            _this.sendSocketNotification("PAGE_CHANGED", 1)      
                        }`
            }
        ]
    }
}
````

These are the configuration options for a custom device:

| Option            | Description
| ----------------- | -----------
| `name`            | Here you can name your device. Make sure you didn't used the name before. Delete first the old device.
| `port`            | Here you can give the device a static Port. I suggest that to you because then there aren't overlaps. Preferably start with the port `11100`.
| `handler`         | Use the handler for every thing you want to do. If you need `this` in your code use `_this`. Inside the examples above you can see how to differentiate between on and off.

## Problems

1. Devices not found: <br>
    * Make sure that your Alexa and Pi are in the same Wifi. I had also the problem that my Pi was in the 2.4GHz Wifi and my Alexa in the 5GHz Wifi. It's only a problem when you discover the devices. To solve the problem disable one of the Wifis for a moment or turn the Wifi on your Pi on and off till it works.

    * Have you used the port before? Try every devices from the mirror. Probably the name is wrong. If that happen delete the device and discover for new devices. Define yourself ports for notification and custom devices to prevent this problem.

2. Wrong action happen: <br>
    * You used the Port before. To solve the problem delete old devices and define a custom port for the device if it's a notification or custom device.

3. If you have still problems create an issue.
