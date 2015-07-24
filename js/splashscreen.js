
define([
    "dojo/Evented",
    "dojo",
    "dijit",
    "esri",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom-construct"
  
], function (
    Evented,
    dojo,
    dijit,
    esri,
    ready,
    declare,
    lang,
    array,
    on,
    domConstruct

) {
    return declare([Evented], {
        config: {},
        map: null,
        isMobileDevice: false,
        isAndroidDevice: false,
        isBrowser: false,
        isTablet: false,
        lessthanios6: false,
        isiOS: false,
        constructor: function (map, config) {
            this.map = map;
            this.config = config;
            if (this.config.theme == null)
            {
                this.config.theme = "black";
            }
            var ss = document.createElement("link");
            ss.type = "text/css";
            ss.rel = "stylesheet";
            ss.href = "css/splash-" + this.config.theme + ".css";
            document.getElementsByTagName("head")[0].appendChild(ss);
        },
        startup: function () {
            var node = domConstruct.toDom("<div id='divSplashScreenContainer' class='divSplashScreenContainer' style='display: block;'><table style='width: 100%; height: 100%;'><tr align='center' valign='middle'><td><div id='divSplashScreenContent' class='divSplashScreenContent'><table style='width: 100%;'><tr><td><div id='divSplashContainer' class='divSplashContainer' style='margin-top: 10px;'><div id='divSplashContent' class='divSplashContent'>                                        </div></div></td></tr><tr><td align='center'><button id='splashButton' style='width: 125px; margin-top: 7px;' class='customButton'><div class='customButtonInner'><table style='width: 100%; height: 100%;'><tr><td align='center' valign='middle'><center id='buttonText'>OK</center></td></tr></table></div></button></td></tr></table></div></td></tr></table></div>");
            domConstruct.place(node, "splash");
            if (this.config.i18n != null) {
                if (this.config.i18n.splashscreen != null) {
                    if (this.config.i18n.splashscreen.buttonText != null) {
                        dojo.byId("buttonText").innerHTML = this.config.i18n.splashscreen.buttonText;
                    }
                }
            }
          
            this._checkDevice();

            on(dojo.byId("splashButton"), "click", lang.hitch(this, this._hideSplashScreenMessage));

            if (this.config.splashText === "")
            {
                this.config.splashText = "Please configure the splash screen";
            }
            dojo.byId("divSplashContent").innerHTML = this.config.splashText;

            dojo.byId("divSplashScreenContainer").style.display = "block";

            dojo.addClass(dojo.byId("divSplashScreenContent"), "divSplashScreenDialogContent");
            this._setSplashScreenHeight();

            this.emit("ready", { "Name": "Splash" });
        },

        _checkDevice: function () {

            var userAgent = window.navigator.userAgent;

            if (userAgent.indexOf("iPhone") >= 0 || userAgent.indexOf("iPad") >= 0) {
                this.isiOS = true;
                userAgent.replace(/OS ((\d+_?){2,3})\s/, function (match, key) {
                    var version = key.split("_");
                    if (version[0] < 6) {
                        this.lessthanios6 = true;

                    }
                });
            }
            if ((userAgent.indexOf("Android") >= 0 && userAgent.indexOf("Mobile") >= 0) || userAgent.indexOf("iPhone") >= 0) {
                this.isMobileDevice = true;
                if ((userAgent.indexOf("Android") >= 0)) {
                    this.isAndroidDevice = true;
                }
                //dojo.byId("divSplashContent").style.fontSize = "15px";

            } else if ((userAgent.indexOf("iPad") >= 0) || (userAgent.indexOf("Android") >= 0)) {
                this.isTablet = true;
                //dojo.byId("divSplashContent").style.fontSize = "14px";
            } else {
                this.isBrowser = true;
                //dojo.byId("divSplashContent").style.fontSize = "11px";

            }
          
            if (this.isMobileDevice) {
                dojo.byId("divSplashScreenContent").style.width = "95%";
                dojo.byId("divSplashScreenContent").style.height = "95%";
            } else {
                dojo.byId("divSplashScreenContent").style.width = "350px";
                dojo.byId("divSplashScreenContent").style.height = "290px";

            }
        },
        _hideSplashScreenMessage: function () {
            if (dojo.isIE < 9 || this.isAndroidDevice) {
                dojo.byId("divSplashScreenContent").style.display = "none";
                dojo.addClass("divSplashScreenContainer", "opacityHideAnimation");
            } else {
                dojo.addClass("divSplashScreenContainer", "opacityHideAnimation");
                dojo.replaceClass("divSplashScreenContent", "hideContainer", "showContainer");

            }

        },
        _setSplashScreenHeight: function () {
            var height = (this.isMobileDevice) ? (dojo.window.getBox().h - 110) : (dojo.coords(dojo.byId("divSplashScreenContent")).h - 80);
            dojo.byId("divSplashContent").style.height = (height + 14) + "px";
    
        },
    });
});
