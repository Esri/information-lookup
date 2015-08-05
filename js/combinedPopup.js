
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
  "dojo/topic",
  "dojo/json",
  "dojo/io-query",
  "dojo/query",
  "esri/geometry",
  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/graphic",
  "esri/toolbars/draw",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/dijit/PopupTemplate",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/geometryEngine",
  "dojo/string",
  "dojo/i18n!application/nls/resources"
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
  topic,
  JSON,
  ioQuery,
  djquery,
  Geometry,
  Extent,
  Point,
  Graphic,
  Draw,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color,
  QueryTask,
  Query,
  PopupTemplate,
  webMercatorUtils,
  geometryEngine,
  djString,
  i18n
) {
  return declare([Evented], {
    config: {},
    map: null,
    layers: null,
    contentWindow: null,
    options: {
      contentID: null
    },
    constructor: function (map, config, options) {
      this.map = map;
      this.config = config;
      this.layers = this.config.response.itemInfo.itemData.operationalLayers;

      this.options = lang.mixin({}, this.options, options);
      // properties
      //this.showGraphic = defaults.showGraphic;

    },
    startup: function () {
      //disconnect the popup handler
      this._createSymbols();
      this.disableWebMapPopup();
      topic.subscribe("app.mapLocate", lang.hitch(this, this._mapLocate));
      topic.subscribe("app.linkImage", lang.hitch(this, this._linkclick));
      topic.subscribe("app.emailImage", lang.hitch(this, this._emailclick));
      if (this.options.contentID) {
        this.contentWindow = dijit.byId(this.options.contentID);
        this.showGraphic = true;
      }
      else {
        this.showGraphic = false;
      }

      this._initPopup();
      this._createToolbar();
      this.map.infoWindow.on("hide", lang.hitch(this, this._infoHide));
      this._initShareLink();
      this.emit("ready", { "Name": "CombinedPopup" });

      if (this.config.location) {
        var e = this.config.location.split(",");
        if (e.length === 2) {
          var point = new Point(parseFloat(e[0]), parseFloat(e[1]), this.map.spatialReference);
          this.showPopup(point, "LocationParam");
        }

      }

    },
    disableWebMapPopup: function () {
      if (this.map) {
        this.map.setInfoWindowOnClick(false);
        //this.map.infoWindow.set("popupWindow", false);
      }
    },
    _mapLocate: function () {

      this.showPopup(arguments[0].geometry, arguments[0].geometryInfo);

    },
    showPopup: function (evt, info) {
      this.event = evt;//this._getCenter(evt);

      this.map.infoWindow.hide();
      //this.map.infoWindow.highlight = false;
      if (this.showGraphic === true) {
        this.map.graphics.clear();
      }

      if (this.searchByLayer !== null && this.searchByLayer !== undefined && info !== this.searchByLayer.id) {

        this.searchLayerForPopup(evt);

      } else {
        this.showPopupGeo(evt, null);
      }

    },
    _getCenter: function (geo) {
      if (geo.type === "extent") {
        return geo.getCenter();
      }
      else if (geo.type === "polygon") {
        return geo.getCentroid();
      }
      else if (geo.type === "polyline") {
        return geo.getExtent().getCenter();
      }
      else {
        return geo;
      }
    },
    _getExtent: function (geo) {
      if (geo.type === "extent") {
        return geo;
      }
      else if (geo.type === "polygon") {
        return geo.getExtent();
      }
      else if (geo.type === "polyline") {
        return geo.getExtent();
      }
      else {
        return null;
      }
    },
    showPopupGeo: function (evt, searchByFeature) {
      this.resultCount = 0;
      this.searchByFeature = searchByFeature;

      if (this.lookupLayers === undefined) {
        return;
      }
      if (this.lookupLayers == null) {
        return;
      }
      if (this.lookupLayers.length === 0) {
        return;
      }
      topic.publish("app.toggleIndicator", true);
      this.map.infoWindow.hide();
      //this.map.infoWindow.highlight = false;
      if (this.showGraphic === true) {
        this.map.graphics.clear();
      }

      //query to determine popup
      var query = new Query();
      var queryTask;


      this.results = [];
      if (this.lookupLayers == null) {
        return null;
      }

      this.defCnt = this.lookupLayers.length;
      var queryDeferred;

      for (var f = 0, fl = this.lookupLayers.length; f < fl; f++) {
        if (this.lookupLayers[f].url == null) {

          query = new Query();

          if (evt.type === "point") {
            query.geometry = new Extent({
              "xmin": evt.x,
              "ymin": evt.y,
              "xmax": evt.x,
              "ymax": evt.y,
              "spatialReference": evt.spatialReference
            });
            query.geometryType = "esriGeometryExtent";
          }
          else {
            query.geometry = this._getExtent(evt);
            query.geometryType = "esriGeometryExtent";
          }

          query.outFields = ["*"];
          if (this.lookupLayers[f].definitionExpression) {
            query.where = this.lookupLayers[f].definitionExpression;
          }

          queryDeferred = this.lookupLayers[f].layer.layerObject.queryFeatures(query);
          queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          queryDeferred.addErrback(lang.hitch(this, function (error) {
            console.log(error);
            this.defCnt = this.defCnt - 1;
            if (this.defCnt === 0) {
              this._allQueriesComplate();
              topic.publish("app.toggleIndicator", false);
            }

          }));
        } else {
          query = new Query();

          query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          query.geometry = evt;
          query.outSpatialReference = this.map.spatialReference;
          query.outFields = ["*"];
          if (this.lookupLayers[f].definitionExpression) {
            query.where = this.lookupLayers[f].definitionExpression;
          }
          queryTask = new QueryTask(this.lookupLayers[f].url);
          queryDeferred = queryTask.execute(query);
          queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          queryDeferred.addErrback(lang.hitch(this, function (error) {
            console.log(error);
            this.defCnt = this.defCnt - 1;
            if (this.defCnt === 0) {
              this._allQueriesComplate();
              topic.publish("app.toggleIndicator", false);
            }

          }));
        }
      }
    },
    enableMapClick: function () {
      this.toolbar.activate(Draw.POINT);

    },
    disableMapClick: function () {
      this.toolbar.deactivate();

    },
    _infoHide: function () {
      if (this.map.graphics != null) {
        this.map.graphics.clear();
      }
    },

    searchLayerForPopup: function (geo) {
      var query = new Query();
      if (this.searchByLayer.url == null) {
        if (geo.type === "point") {
          query.geometry = new Extent({
            "xmin": geo.x,
            "ymin": geo.y,
            "xmax": geo.x,
            "ymax": geo.y,
            "spatialReference": geo.spatialReference
          });
          query.geometryType = "esriGeometryExtent";
        }
        else {
          query.geometry = geo;
          //query.geometryType = "esriGeometryExtent";
        }

        query.outFields = ["*"];

        if (this.searchByLayer.layerDefinition) {
          if (this.searchByLayer.layerDefinition.definitionExpression) {
            query.where = this.searchByLayer.layerDefinition.definitionExpression;
          }
        }
        queryDeferred = this.searchByLayer.layerObject.queryFeatures(query);
        queryDeferred.addCallback(lang.hitch(this, this._layerSearchComplete));

        queryDeferred.addErrback(lang.hitch(this, function (error) {
          console.log(error);
        }));
      }
      else {

        query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
        query.geometry = geo;
        query.outSpatialReference = this.map.spatialReference;
        query.returnGeometry = true;
        query.outFields = ["*"];
        if (this.searchByLayer.layerDefinition) {
          if (this.searchByLayer.layerDefinition.definitionExpression) {
            query.where = this.searchByLayer.layerDefinition.definitionExpression;
          }
        }
        var layerQueryTask = new QueryTask(this.searchByLayer.url);
        layerQueryTask.on("complete", lang.hitch(this, this._layerSearchComplete));
        layerQueryTask.on("error", lang.hitch(this, function (error) {
          console.log(error);

        }));

        layerQueryTask.execute(query);
      }
    },
    _initPopup: function () {
      this.searchByLayer = null;
      if (this.config.searchByLayer) {
        if (this.config.searchByLayer === undefined) {
          this.config.searchByLayer = null;
        }
      } else {
        this.config.searchByLayer = null;
      }


      var serviceAreaLayerNames = [];
      this.popupMedia = [];
      if (this.config.serviceAreaLayerNamesSelector === null) {
        this.config.serviceAreaLayerNamesSelector = "";
      }
      if (this.config.serviceAreaLayerNamesSelector === undefined) {
        this.config.serviceAreaLayerNamesSelector = "";
      }

      if (djString.trim(this.config.serviceAreaLayerNamesSelector) === "") {
        if (djString.trim(this.config.serviceAreaLayerNames) === "") {
          if (i18n) {
            if (i18n.error) {
              if (i18n.error.noLayersSet) {
                alert(i18n.error.noLayersSet);
              }
            }
          }
          alert();
        }
        else {
          serviceAreaLayerNames = this.config.serviceAreaLayerNames.split("|");
        }



      }
      else {
        serviceAreaLayerNames = [];
        var layers = dojo.fromJson(this.config.serviceAreaLayerNamesSelector);
        array.forEach(layers, function (layer) {
          serviceAreaLayerNames.push(layer.id);
        });
      }
      this.lookupLayers = [];
      var layDetails = {};
      var f = 0, fl = 0;

      for (f = 0, fl = serviceAreaLayerNames.length; f < fl; f++) {
        layDetails = {};
        serviceAreaLayerNames[f] = djString.trim(serviceAreaLayerNames[f]);

        array.forEach(this.layers, function (layer) {

          if (layer.featureCollection != null) {
            if (layer.featureCollection.layers != null) {
              array.forEach(layer.featureCollection.layers, function (subLyrs) {
                if (subLyrs.layerObject != null) {
                  if (subLyrs.layerObject.id === this.config.searchByLayer.id) {
                    this.searchByLayer = subLyrs;
                  }
                  if (subLyrs.layerObject.name == serviceAreaLayerNames[f] ||
                    subLyrs.id == serviceAreaLayerNames[f]) {
                    serviceAreaLayerNames[f] = subLyrs.layerObject.name;
                    layDetails.name = subLyrs.layerObject.name;
                    layDetails.layerOrder = f;
                    layDetails.url = subLyrs.layerObject.url;
                    layDetails.layer = subLyrs;
                    if (subLyrs.layerDefinition) {
                      if (subLyrs.layerDefinition.definitionExpression) {
                        layDetails.definitionExpression =
                          subLyrs.layerDefinition.definitionExpression;
                      }
                    }
                    console.log(serviceAreaLayerNames[f] + " " + "set");

                    layDetails.popupInfo = subLyrs.popupInfo;
                    if (layDetails.popupInfo == null) {
                      if (i18n) {
                        if (i18n.error) {
                          if (i18n.error.popupNotSet) {
                            alert(i18n.error.popupNotSet + ": " + subLyrs.name);
                          }
                        }
                      }

                    }
                    this.lookupLayers.push(layDetails);

                  }
                }
              }, this);
            }
          } else if (layer.layerObject != null) {
            if (layer.layerObject.layerInfos != null) {
              array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
                var matches = false;
                var serName;
                //Add code for SearchBy Layer one layer selector supports map service layers
                if (subLyrs.name == serviceAreaLayerNames[f]) {
                  matches = true;
                }
                else if (subLyrs.id == serviceAreaLayerNames[f]) {
                  matches = true;
                }
                else if (serviceAreaLayerNames[f].indexOf(".") > 0) {
                  serName = serviceAreaLayerNames[f].split(".");
                  if (layer.id == serName[0]) {
                    if (subLyrs.id == serName[1]) {
                      matches = true;
                    }
                  }
                }
                if (matches === true) {
                  serviceAreaLayerNames[f] = subLyrs.name;
                  layDetails.name = subLyrs.name;
                  layDetails.layerOrder = f;
                  layDetails.url = layer.layerObject.url + "/" + subLyrs.id;

                  console.log(serviceAreaLayerNames[f] + " " + "set");

                  if (layer.layers != null) {
                    array.forEach(layer.layers, function (popUp) {
                      if (subLyrs.id == popUp.id) {
                        if (popUp.layerDefinition) {
                          if (popUp.layerDefinition.definitionExpression) {
                            layDetails.definitionExpression =
                              popUp.layerDefinition.definitionExpression;
                          }
                        }
                        layDetails.popupInfo = popUp.popupInfo;
                      }
                    }, this);
                  }
                  if (layDetails.popupInfo == null) {
                    if (i18n) {
                      if (i18n.error) {
                        if (i18n.error.popupNotSet) {
                          alert(i18n.error.popupNotSet + ": " + subLyrs.name);
                        }
                      }
                    }

                  }
                  this.lookupLayers.push(layDetails);

                }
              }, this);

            } else {

              if (layer.id === this.config.searchByLayer.id) {
                this.searchByLayer = layer;
              }
              if (layer.title == serviceAreaLayerNames[f] || layer.id == serviceAreaLayerNames[f]) {
                serviceAreaLayerNames[f] = layer.title;
                if (layer.popupInfo == null) {
                  if (i18n) {
                    if (i18n.error) {
                      if (i18n.error.popupNotSet) {
                        alert(i18n.error.popupNotSet + ": " + layer.title);
                      }
                    }
                  }

                }
                layDetails.popupInfo = layer.popupInfo;
                layDetails.name = layer.title;
                layDetails.url = layer.layerObject.url;
                layDetails.layerOrder = f;
                if (layer.layerDefinition) {
                  if (layer.layerDefinition.definitionExpression) {
                    layDetails.definitionExpression = layer.layerDefinition.definitionExpression;
                  }
                }
                this.lookupLayers.push(layDetails);
                console.log(layer.title + " " + "set");

              }
            }
          }
          if (this.config.storeLocation === true && this.config.editingAllowed) {
            var fnd = false;

            if (this.config.serviceRequestLayerName.id !== undefined) {

              if (layer.id == djString.trim(this.config.serviceRequestLayerName.id)) {

                this.serviceRequestLayerName = layer.layerObject;
                console.log("Service Request Layer set");

                array.forEach(this.config.serviceRequestLayerName.fields, function (field) {
                  if (field.id == "serviceRequestLayerAvailibiltyField") {
                    fnd = true;

                    this.config.serviceRequestLayerAvailibiltyField = field.fields[0];

                  }
                }, this);

                if (fnd === false) {
                  alert(i18n.error.fieldNotFound + ": " +
                    this.config.serviceRequestLayerAvailibiltyField);

                  console.log("Field not found.");

                }
              }
            } else {
              if (layer.title == djString.trim(this.config.serviceRequestLayerName)) {

                this.serviceRequestLayerName = layer.layerObject;
                console.log("Service Request Layer set");

                array.forEach(this.serviceRequestLayerName.fields, function (field) {
                  if (field.name == this.config.serviceRequestLayerAvailibiltyField) {
                    fnd = true;
                  }
                }, this);

                if (fnd === false) {
                  alert(i18n.error.fieldNotFound + ": " +
                    this.config.serviceRequestLayerAvailibiltyField);

                  console.log("Field not found.");

                }
              }
            }
          }
        }, this);
      }

      var useLegacyConfig = false;

      if (this.lookupLayers.length === 0 &&
        this.config.serviceAreaLayerName != null) {
        layDetails = {};

        array.forEach(this.layers, function (layer) {

          this.config.serviceAreaLayerName = djString.trim(this.config.serviceAreaLayerName);
          if (layer.layerObject.layerInfos != null) {
            array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
              if (subLyrs.name == this.config.serviceAreaLayerName) {
                layDetails.name = subLyrs.name;
                layDetails.layerOrder = 0;

                layDetails.url = layer.layerObject.url + "/" + subLyrs.id;

                console.log(this.config.serviceAreaLayerName + " " + "set");

                if (layer.layers != null) {
                  array.forEach(layer.layers, function (popUp) {
                    if (subLyrs.id == popUp.id) {
                      layDetails.popupInfo = popUp.popupInfo;
                    }
                  }, this);
                }
                if (layDetails.popupInfo == null) {
                  alert(i18n.error.popupNotSet + ": " + subLyrs.name);
                }
                this.lookupLayers.push(layDetails);
                useLegacyConfig = true;
              }
            }, this);
          } else {

            if (layer.title == this.config.serviceAreaLayerName) {
              layDetails.popupInfo = layer.popupInfo;
              layDetails.name = layer.title;
              layDetails.url = layer.layerObject.url;
              layDetails.layerOrder = 0;
              this.lookupLayers.push(layDetails);
              console.log(layer.title + " " + "set");
              useLegacyConfig = true;

            }
          }

        }, this);

      }

      var allLayerNames = "";
      var layerNamesFound = [];
      for (f = 0, fl = this.lookupLayers.length; f < fl; f++) {

        allLayerNames += this.lookupLayers[f].name + ",";
        layerNamesFound.push(this.lookupLayers[f].name);
      }

      if (!useLegacyConfig) {

        for (var n = 0, nl = serviceAreaLayerNames.length; n < nl; n++) {

          if (dojo.indexOf(layerNamesFound, serviceAreaLayerNames[n]) < 0) {
            if (i18n) {
              if (i18n.error) {
                if (i18n.error.layerNotFound) {
                  alert(i18n.error.layerNotFound + ":" + serviceAreaLayerNames[n]);
                } else {
                  alert("Layer not found: " + serviceAreaLayerNames[n]);
                }
              } else {
                alert("Layer not found: " + serviceAreaLayerNames[n]);
              }
            } else {
              alert("Layer not found: " + serviceAreaLayerNames[n]);
            }

          }

        }
      }
      if (this.serviceRequestLayerName === undefined &&
        this.config.storeLocation === true &&
        this.config.editingAllowed) {
        if (this.config.serviceRequestLayerName.id !== undefined) {
          alert(i18n.error.layerNotFound + ": " + this.config.serviceRequestLayerName.id);
        } else {
          alert(i18n.error.layerNotFound + ": " + this.config.serviceRequestLayerName);
        }
        console.log("Layer name not found.");

      }

    },
    _createToolbar: function () {
      this.toolbar = new Draw(this.map, { showTooltips: false });
      this.toolbar.on("draw-end", lang.hitch(this, this._drawEnd));

    },
    _emailclick: function () {
      if (this.map === null ||
        this.map.infoWindow === null ||
        this.map.infoWindow === undefined ||
        this.map.infoWindow.features === null ||
        this.map.infoWindow.features === undefined) {
        return;
      }

      if (this.map.infoWindow.features.length === 0) {
        return;
      }
      var uri = window.location.href;
      var params = {};
      var geo = this._getCenter(this.map.infoWindow.features[0].geometry);

      var geostring = geo.x + "," + geo.y;

      if (uri.indexOf("?") >= 0) {
        var urlParam = uri.split("?");
        uri = urlParam[0];
        params = dojo.queryToObject(urlParam[1]);

      }
      for (var key in params) {
        if (key !== null) {
          if (key !== "appid") {
            delete params[key];

          }
        }
      }
      params.location = geostring;

      //if (this.config.customUrlParam && this.config.customUrlParam !== null) {
      //  if (this.config.customUrlParam in params) {

      //    delete params[this.config.customUrlParam];
      //  }

      //}

      // Assemble the new uri with its query string attached.
      var queryStr = ioQuery.objectToQuery(params);
      uri = uri + "?" + queryStr;
      var mailURL = "mailto:%20?subject={title}&body={url}";

      var fullLink = lang.replace(mailURL, {
        url: encodeURIComponent(uri),
        title: encodeURIComponent(document.title)
      });
      window.location.href = fullLink;


    },
    _linkclick: function () {
      if (this.map === null ||
        this.map.infoWindow === null ||
        this.map.infoWindow === undefined ||
        this.map.infoWindow.features === null ||
        this.map.infoWindow.features === undefined) {
        return;
      }

      if (this.map.infoWindow.features.length === 0) {
        return;
      }
      var uri = window.location.href;
      var params = {};
      var geo = this._getCenter(this.map.infoWindow.features[0].geometry);

      var geostring = geo.x + "," + geo.y;

      if (uri.indexOf("?") >= 0) {
        var urlParam = uri.split("?");
        uri = urlParam[0];
        params = dojo.queryToObject(urlParam[1]);

      }
      for (var key in params) {
        if (key !== null) {
          if (key !== "appid") {
            delete params[key];

          }
        }
      }
      params.location = geostring;
      //if (this.config.customUrlParam && this.config.customUrlParam !== null) {
      //  if (this.config.customUrlParam in params) {

      //    delete params[this.config.customUrlParam];
      //  }

      //}
      // Assemble the new uri with its query string attached.
      var queryStr = ioQuery.objectToQuery(params);
      uri = uri + "?" + queryStr;
      window.open(uri);


    },
    _initShareLink: function () {
      var linkText = "Link";
      var emailText = "Email";

      if (i18n) {
        if (i18n.share) {
          if (i18n.share.link) {
            linkText = i18n.share.link;
          }
          if (i18n.share.email) {
            emailText = i18n.share.email;
          }
        }
      }
      var link = dojo.create("a",
            { "class": "action link icon-link", "href": "javascript:void(0);" },
            dojo.query(".actionList", this.map.infoWindow.domNode)[0]);

      var email = dojo.create("a",
            { "class": "action email icon-mail-alt", "href": "javascript:void(0);" },
            dojo.query(".actionList", this.map.infoWindow.domNode)[0]);

      dojo.connect(link, "onclick", lang.hitch(this, this._linkclick));
      dojo.connect(email, "onclick", lang.hitch(this, this._emailclick));

    },
    _drawEnd: function (evt) {
      this.showPopup(evt.geometry, "MapClick");
    },
    _processObject: function (obj, fieldName, layerName, matchName, oid) {
      try {
        var matchForRec = matchName;
        var re = null;
        for (var key in obj) {
          if (key !== null) {
            if (key == "type") {
              if (obj[key].indexOf("chart") > -1) {
                matchForRec = true;
              }
            }

            if (obj[key] != null) {
              if (obj[key] instanceof Object) {
                if (key == "fields") {
                  obj[key] = this._processObject(obj[key], fieldName, layerName, true, oid);
                } else {
                  obj[key] = this._processObject(obj[key], fieldName, layerName, matchName, oid);
                }

              } else {
                if (obj[key] == fieldName && (matchName || key == "normalizeField")) {
                  obj[key] = layerName + "_" + oid + "_" + fieldName;
                } else {
                  re = new RegExp("{" + fieldName + "}", "g");
                  if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(re, "{" + layerName + "_" + oid + "_" + fieldName + "}")
                      .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
                  }
                }
              }
            }
          }
        }
        return obj;
      } catch (err) {
        console.log("_processObject error:" + err);
        return null;
      }
    },
    _layerSearchComplete: function (result) {
      if (result) {
        if (result.featureSet) {
          if (result.featureSet.features) {
            if (result.featureSet.features.length > 0) {
              this.event = result.featureSet.features[0].geometry;
              this.showPopupGeo(result.featureSet.features[0].geometry, result.featureSet.features[0]);
              return;
            }
          }
        }
        else if (result.features) {

          if (result.features.length > 0) {
            this.event = result.features[0].geometry;
            this.showPopupGeo(result.features[0].geometry, result.features[0]);
            return;
          }


        }
      }
      this._showNoSearchFeatureFound();


    },
    _queryComplete: function (lookupLayer) {

      return function (result) {

        if (result.features.length > 0) {
          result.features = array.filter(result.features, lang.hitch(this, function (feature) {
            return geometryEngine.intersect(this.event, feature.geometry);
          }));

          this.resultCount = this.resultCount + result.features.length;

          this.results.push({ "results": result.features, "Layer": lookupLayer });
        }

        this.defCnt = this.defCnt - 1;
        if (this.defCnt === 0) {
          this._allQueriesComplate();
          topic.publish("app.toggleIndicator", false);
        }

      };
    },
    _randomstring: function (L) {
      var s = '';
      var randomchar = function () {
        var n = Math.floor(Math.random() * 62);
        if (n < 10) return n; //1-10
        if (n < 36) return String.fromCharCode(n + 55); //A-Z
        return String.fromCharCode(n + 61); //a-z
      }
      while (s.length < L) s += randomchar();
      return s;
    },
    _getPopupForResult: function (feature, layer) {
      try {

        var layerName = layer.name == null ? layer.title : layer.name;
        var replaceVal = Math.random().toString(36).substr(2, 5);

        var resultFeature = {};
        if (layer.popupInfo != null) {
          var layerFields = lang.clone(layer.popupInfo.fieldInfos);

          var layerDescription = lang.clone(layer.popupInfo.description);
          var popupTitle = lang.clone(layer.popupInfo.title);
          var mediaInfos = lang.clone(layer.popupInfo.mediaInfos);

          var layFldTable = "";

          for (var g = 0, gl = layerFields.length; g < gl; g++) {
            if (mediaInfos != null) {
              array.forEach(mediaInfos, function (mediaInfo) {
                mediaInfo = this._processObject(mediaInfo,
                  layerFields[g].fieldName, replaceVal,
                  false, feature.attributes.OBJECTID);

              }, this);
            }

            if (layer.popupInfo.description == null) {
              re = new RegExp("{" + layerFields[g].fieldName + "}", "g");

              popupTitle = popupTitle.replace(re, "{" +
                replaceVal + "_" + feature.attributes.OBJECTID + "_" +
                layerFields[g].fieldName + "}");

              if (layerFields[g].visible === true) {

                layFldTable = layFldTable + "<tr valign='top'>";
                if (layerFields[g].label != null) {
                  layFldTable = layFldTable + "<td class='popName'>" +
                    layerFields[g].label + "</td>";
                } else {
                  layFldTable = layFldTable + "<td class='popName'>" +
                    layerFields[g].fieldName + "</td>";
                }
                layFldTable = layFldTable + "<td class='popValue'>" +
                  "{" + replaceVal + "_" +
                  feature.attributes.OBJECTID + "_" +
                  layerFields[g].fieldName + "}</td>";
                layFldTable = layFldTable + "</tr>";

              }

            } else {
              re = new RegExp("{" + layerFields[g].fieldName + "}", "g");

              layerDescription = layerDescription.replace(re, "{" + replaceVal + "_" +
                feature.attributes.OBJECTID + "_" + layerFields[g].fieldName + "}");

            }
            var fldVal = feature.attributes[layerFields[g].fieldName];
            if (fldVal != null) {


              fldVal = fldVal.toString();
              if (fldVal.indexOf("http://") >= 0 || fldVal.indexOf("https://") >= 0 ||
                fldVal.indexOf("www.") >= 0) {
                if (layer.popupInfo.description === null) {
                  resultFeature[replaceVal + "_" +
                    layerFields[g].fieldName + "_" + "Hyper"] =
                    "<a target='_blank' href='" + fldVal + "'>" +
                    i18n.popup.urlMoreInfo + "</a>";
                  if (layFldTable.indexOf("{" + replaceVal +
                    "_" + feature.attributes.OBJECTID +
                    "_" + layerFields[g].fieldName + "}") >= 0) {
                    layFldTable = layFldTable.replace("{" + replaceVal + "_" +
                      feature.attributes.OBJECTID +
                      "_" + layerFields[g].fieldName + "}", "{" + replaceVal + "_" +
                      feature.attributes.OBJECTID + "_" + layerFields[g].fieldName + "_" +
                      "Hyper" + "}");
                  }
                  resultFeature[replaceVal + "_" + feature.attributes.OBJECTID + "_" +
                    layerFields[g].fieldName] = fldVal;
                }
                else {
                  resultFeature[replaceVal + "_" + feature.attributes.OBJECTID + "_" +
                    layerFields[g].fieldName] = fldVal;
                }
              }
              else {
                resultFeature[replaceVal + "_" + feature.attributes.OBJECTID + "_" +
                  layerFields[g].fieldName] = fldVal;
              }
            }
            else {
              resultFeature[replaceVal + "_" + feature.attributes.OBJECTID + "_" +
                layerFields[g].fieldName] = fldVal;
            }
            layerFields[g].fieldName = replaceVal + "_" +
              feature.attributes.OBJECTID +
              "_" + layerFields[g].fieldName;

          }
          if (layer.popupInfo.description === null) {
            var popupTable = "<div>";
            popupTable = popupTable +
              "<table class='popTable' cellpadding='0' cellspacing='0'>";
            popupTable = popupTable + "<tbody>";

            if (popupTitle !== "") {

              popupTable = popupTable + "<tr valign='top'>";
              popupTable = popupTable + "<td colspan='2' class='headerPopUp'>" +
                popupTitle + "</td>";

              popupTable = popupTable + "</tr>";
              popupTable = popupTable + "<tr>";

              popupTable = popupTable + "<td colspan='2' class='hzLinePopUp theme'></td>";
              popupTable = popupTable + "</tr>";
            }

            popupTable = popupTable + layFldTable;
            popupTable = popupTable + "</tbody></table>";

            popupTable = popupTable + "</div>";
            layerDescription = popupTable;
          }
          return {
            fields: layerFields,
            media: mediaInfos,
            desc: layerDescription,
            feature: resultFeature
          }

        }

      } catch (err) {
        console.log("_getPopupForResult error:" + err);
      }
    },
    _allQueriesComplate: function () {
      try {
        //if (this.resultCount == 0 && this.searchByFeature !== null)
        //{
        //  this._showNoSearchFeatureFound();
        //  return;
        //}
        var atts = {};
        var re = null;
        var allFields = [];

        var allDescriptions = "";
        var popUpArray = {};
        var mediaArray = {};
        var resultFeature = {};
        var valToStore = null;
        var resultSum = {};
        for (var f = 0, fl = this.lookupLayers.length; f < fl; f++) {
          resultSum[this.lookupLayers[f].name] = 0;
        }

        var centr = this._getCenter(this.event);
        if (this.resultCount > 0) {

          //popUpArray.length = this.results.length;
          //mediaArray.length = this.results.length;
          console.log(this.results.length + " layers");

          array.forEach(this.results, function (result) {
            var layer = result.Layer;
            mediaArray[layer.layerOrder] = {};
            popUpArray[layer.layerOrder] = {};
            var layerName = layer.name == null ? layer.title : layer.name;
            console.log(result.results.length + " features found in " + layerName);
            array.forEach(result.results, function (feature) {
              console.log("Feature with OBJECTID: " + feature.attributes.OBJECTID +
                " in " + layerName);
              if (layerName in resultSum) {
                resultSum[layerName] = resultSum[layerName] + 1;
              }
              else {
                resultSum[layerName] = 1;
              }
              var popDet = this._getPopupForResult(feature, layer);
              allFields = allFields.concat(popDet.fields);
              resultFeature = lang.mixin(resultFeature, popDet.feature);
              mediaArray[result.Layer.layerOrder][feature.attributes.OBJECTID] = popDet.media;
              popUpArray[result.Layer.layerOrder][feature.attributes.OBJECTID] = popDet.desc;
            }, this);
          }, this);

          var finalMedArr = [];
          var subkey, key, tmpMsg;
          for (key in popUpArray) {
            if (key !== null) {
              if (popUpArray[key] != null) {
                for (subkey in popUpArray[key]) {
                  if (subkey !== null) {
                    if (popUpArray[key][subkey] != null) {
                      allDescriptions = allDescriptions === "" ? popUpArray[key][subkey] :
                        allDescriptions + popUpArray[key][subkey];
                    }
                  }
                }
              }

            }
          }
          for (key in mediaArray) {
            if (key !== null) {
              if (mediaArray[key] != null) {
                for (subkey in mediaArray[key]) {
                  if (subkey !== null) {
                    if (mediaArray[key][subkey] != null) {
                      finalMedArr.push.apply(finalMedArr, mediaArray[key][subkey]);

                    }
                  }
                }
              }

            }
          }
          allDescriptions = "<div>" + allDescriptions + "</div>";
          //allDescriptions = "" + allDescriptions + "";
          var mp = webMercatorUtils.webMercatorToGeographic(centr);
          var find;
          var regex;
          if (this.config.popPreMessage !== null) {
            if (this.config.popPreMessage.indexOf('{<') > 0) {
              regex = new RegExp('{<', "g");
              console.warn("Invalid text in the beginning pop up description.  Removing bad value.  This might be caused by string formatting between {}.  Character " + this.config.popPreMessage.indexOf('{<').toString());
              this.config.popPreMessage = this.config.popPreMessage.replace(regex, "<");
            }
            tmpMsg = this.config.popPreMessage.replace(/{IL_XCOORD}/gi, centr.x).replace(/{IL_YCOORD}/gi, centr.y);
            tmpMsg = tmpMsg.replace(/{IL_LAT}/gi, mp.y).replace(/{IL_LONG}/gi, mp.x);
            for (key in resultSum) {
              if (key !== null) {

                find = "{" + key + "}";
                regex = new RegExp(find, "g");
                tmpMsg = tmpMsg.replace(regex, resultSum[key]);

              }
            }
            allDescriptions = "<div>" + tmpMsg + "</div>" + allDescriptions;
          }
          if (this.config.popPostMessage !== null) {
            if (this.config.popPostMessage.indexOf('{<') > 0) {
              regex = new RegExp('{<', "g");
              console.warn("Invalid text in the beginning pop up description.  Removing bad value. This might be caused by string formatting between {}.  Character " + this.config.popPostMessage.indexOf('{<').toString());
              this.config.popPostMessage = this.config.popPostMessage.replace(regex, "<");
            }
            tmpMsg = this.config.popPostMessage.replace(/{IL_XCOORD}/gi, centr.x)
              .replace(/{IL_YCOORD}/gi, centr.y);
            tmpMsg = tmpMsg.replace(/{IL_LAT}/gi, mp.y).replace(/{IL_LONG}/gi, mp.x);

            for (key in resultSum) {
              if (key !== null) {

                find = "{" + key + "}";
                regex = new RegExp(find, "g");
                tmpMsg = tmpMsg.replace(regex, resultSum[key]);

              }
            }
            allDescriptions = allDescriptions + "<div>" + tmpMsg + "</div>";
          }
          if (this.searchByFeature !== null && this.searchByFeature !== undefined) {
            if (this.searchByLayer.popupInfo !== null && this.searchByLayer.popupInfo !== undefined) {

              if (allDescriptions.indexOf("{IL_SEARCHBY}") >= 0) {
                var searchByPopup = this._getPopupForResult(this.searchByFeature, this.searchByLayer);
                allDescriptions = allDescriptions.replace(/{IL_SEARCHBY}/gi, searchByPopup.desc);
                allFields = allFields.concat(searchByPopup.fields);
                resultFeature = lang.mixin(resultFeature, searchByPopup.feature);
              }
            }
            if (this.searchByFeature.attributes !== null && this.searchByFeature.attributes !== undefined) {
              for (key in this.searchByFeature.attributes) {
                if (key !== null) {
                  var fldname = "{" + key + "}";
                  if (allDescriptions.indexOf(fldname) >= 0) {
                    regex = new RegExp(fldname, "g");
                    allDescriptions = allDescriptions.replace(regex, this.searchByFeature.attributes[key]);
                  }
                }
              }
            }
          }

          var finalDes = allDescriptions.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");

          ////Make single Array of fields
          this.popupTemplate = new PopupTemplate({
            title: this.config.popupTitle,
            fieldInfos: allFields,
            description: finalDes,
            mediaInfos: finalMedArr
          });
          valToStore = this.config.serviceRequestLayerAvailibiltyFieldValueAvail;

        }
        else {
          this.popupTemplate = new PopupTemplate({
            title: this.config.serviceUnavailableTitle,
            fieldInfos: allFields,
            description: this.config.serviceUnavailableMessage.replace(/&amp;/gi, "&")
              .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'"),
            mediaInfos: mediaArray
          });
          valToStore = this.config.serviceRequestLayerAvailibiltyFieldValueNotAvail;

        }
        var featureArray = [];
        var content;
        var editGraphic = new Graphic(this.event, this._getSymbol(),
          resultFeature, this.popupTemplate);

        if (this.showGraphic === true) {
          this.map.graphics.add(editGraphic);
        }
        featureArray.push(editGraphic);

        this.map.infoWindow.setFeatures(featureArray);
        if (this.config.popupWidth != null && this.config.popupHeight != null) {
          this.map.infoWindow.resize(this.config.popupWidth, this.config.popupHeight);
        } else if (this.config.popupWidth != null) {
          this.map.infoWindow.resize(this.config.popupWidth, this.map.infoWindow._maxHeight);
        } else {
          this.map.infoWindow.resize();
        }
        if (this.config.storeLocation === true && this.config.editingAllowed) {
          atts[this.config.serviceRequestLayerAvailibiltyField] = valToStore;
          this._logRequest(centr, atts);
        }
        var def;
        var ext = this._getExtent(this.event);
        if (ext === null) {
          def = this.map.centerAndZoom(centr, this.config.zoomLevel);

        } else {
          if (this.map._fixExtent(ext, true).lod.level > this.config.zoomLevel) {
            def = this.map.centerAndZoom(centr, this.config.zoomLevel);
          }
          else {
            def = this.map.setExtent(ext, true);
          }


        }
        //

        def.addCallback(lang.hitch(this, function (results) {

          if (this.contentWindow) {
            content = this.map.infoWindow.getSelectedFeature().getContent();

            this.contentWindow.set("content", content);
            djquery(".hzLinePopUp").style("border-color",
              this.config.color.toString() + " !important");

            djquery(".esriViewPopup .hzLine").style("border-color",
              this.config.color.toString() + " !important");
            topic.publish("app.contentSet", false);
          } else {

            this.map.infoWindow.show(centr);
          }
        }));

      } catch (err) {
        console.log(err);
      }
    },
    _showNoSearchFeatureFound: function () {
      var centr = this._getCenter(this.event);

      var title;
      if (this.config.noSearchFeatureTitle) {
        title = this.config.noSearchFeatureTitle;
      }
      else {
        title = this.config.serviceUnavailableTitle;
      }
      var desc;
      if (this.config.noSearchFeatureMessage) {
        desc = this.config.noSearchFeatureMessage.replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
      }
      else {
        desc = this.config.serviceUnavailableMessage.replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
      }

      this.popupTemplate = new PopupTemplate({
        title: title,
        fieldInfos: null,
        description: desc,
        mediaInfos: null
      });
      var editGraphic = new Graphic(this.event, this._getSymbol(), null, this.popupTemplate);
      // this.map.infoWindow.highlight = false;
      //this.map.infoWindow._highlighted = undefined;

      if (this.showGraphic === true) {
        this.map.graphics.add(editGraphic);
      }
      var featureArray = [];
      featureArray.push(editGraphic);

      this.map.infoWindow.setFeatures(featureArray);
      var atts = {};
      //this.map.infoWindow.show(editGraphic.geometry);
      if (this.config.popupWidth != null && this.config.popupHeight != null) {
        this.map.infoWindow.resize(this.config.popupWidth, this.config.popupHeight);
      } else if (this.config.popupWidth != null) {
        this.map.infoWindow.resize(this.config.popupWidth, this.map.infoWindow._maxHeight);
      } else {
        this.map.infoWindow.resize();
      }
      if (this.config.storeLocation === true && this.config.editingAllowed) {
        if (this.config.serviceRequestLayerAvailibiltyFieldValueNoSearch) {
          atts[this.config.serviceRequestLayerAvailibiltyField] =
            this.config.serviceRequestLayerAvailibiltyFieldValueNoSearch;

        }
        else {
          atts[this.config.serviceRequestLayerAvailibiltyField] =
            this.config.serviceRequestLayerAvailibiltyFieldValueNotAvail;
        }

        this._logRequest(centr, atts);
      }
      var ext = this._getExtent(this.event);
      if (ext === null) {
        def = this.map.centerAndZoom(centr, this.config.zoomLevel);

      } else {
        if (this.map._fixExtent(ext, true).lod.level > this.config.zoomLevel) {
          def = this.map.centerAndZoom(centr, this.config.zoomLevel);
        }
        else {
          def = this.map.setExtent(ext, true);
        }


      }
      def.addCallback(lang.hitch(this, function () {
        if (this.contentWindow) {
          this.contentWindow.set("content",
            this.map.infoWindow.getSelectedFeature().getContent());
          djquery(".hzLinePopUp").style("border-color", this.config.color.toString() +
            " !important");
          djquery(".esriViewPopup .hzLine").style("border-color",
            this.config.color.toString() + " !important");

          topic.publish("app.contentSet", false);
        } else {
          this.map.infoWindow.show(centr);
        }

      }));
    },
    _processResults: function (features) {
      return dojo.map(features, function (feature) {

        return feature;
      });
    },
    _logRequest: function (geom, atts) {
      if (this.serviceRequestLayerName != null) {
        if (this.serviceRequestLayerName.isEditable() === true) {
          if (this.serviceRequestLayerName.geometryType == "esriGeometryPoint") {
            var serviceLocation = new Graphic(geom, null, atts);
            var editDeferred = this.serviceRequestLayerName.applyEdits([serviceLocation],
              null, null);

            editDeferred.addCallback(lang.hitch(this, function (result) {
              console.log(result);
            }));
            editDeferred.addErrback(function (error) {
              console.log(error);
            });
          }
        }
      }

    },
    _createSymbols: function () {
      this.markerSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 20,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2),
        new Color([0, 0, 0, 0]));

      // lineSymbol used for freehand polyline, polyline and line.
      this.lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
        new Color([0, 255, 255]), 1);

      this.fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([0, 255, 255]), 1), new Color([255, 255, 0, 0])
       );
    },
    _getSymbol: function () {
      if (this.event.type == "point") {
        return this.markerSymbol;
      } else if (this.event.type == "polygon") {
        return this.fillSymbol;
      } else if (this.event.type == "polyline") {
        return this.lineSymbol;
      }
    }

  });
});