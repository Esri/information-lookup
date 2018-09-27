
define([
  "dojo/Evented",
  "dojo",
  "dijit",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/json",
  "dojo/topic",
  "dojo/io-query",
  "dojo/query",
  "dojo/promise/all",
  "dojo/dom-construct",
  "dijit/layout/ContentPane",
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
  "esri/geometry/ScreenPoint",
  "esri/layers/FeatureLayer",
  "esri/request",
  "dojo/string",
  "dojo/i18n!application/nls/resources"
], function (
  Evented,
  dojo,
  dijit,
  declare,
  lang,
  array,
  dojoJson,
  topic,
  ioQuery,
  djquery,
  all,
  domConstruct,
  ContentPane,
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
  ScreenPoint,
  FeatureLayer,
  esriRequest,
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
    popContentCP: null,
    searchTol: 4,
    pointOverlap: 30,
    pointOverlapUnit: 'feet',
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
      String.prototype.replaceAll = function (strReplace, strWith) {
        var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var reg = new RegExp(esc, 'ig');
        return this.replace(reg, strWith);
      };
      this._createSymbols();
      this.disableWebMapPopup();
      this.popContentCP = new ContentPane({}, domConstruct.create("div"));
      this.popContentCP.startup();
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
      this._createToolbar();
      this.map.infoWindow.on("hide", lang.hitch(this, this._infoHide));
      this._initShareLink();

      this._initPopup();
      if (this.loading_promises.length > 0) {
        all(this.loading_promises).then(lang.hitch(this, function () {
          this.finish_loading();
        }));
      }
      else {
        this.finish_loading();
      }

      if (this.config.searchTol !== null && this.config.searchTol !== undefined) {
        this.searchTol = this.config.searchTol;
      }
      if (this.config.pointOverlap !== null && this.config.pointOverlap !== undefined) {
        this.pointOverlap = this.config.pointOverlap;
      }
      if (this.config.pointOverlapUnit !== null && this.config.pointOverlapUnit !== undefined) {
        this.pointOverlapUnit = this.config.pointOverlapUnit;
      }
      this.disable_clusering();
    },
    finish_loading: function () {

      topic.publish("app.combined_popup_loaded", false);

    },
    check_params: function () {
      if (this.config.location) {
        var e = this.config.location.split(",");
        if (e.length === 2) {
          var point = new Point(parseFloat(e[0]), parseFloat(e[1]), this.map.spatialReference);
          this.showPopup(point, "LocationParam");
        }

      }
    },
    getMapServerLayersContents: function (url, layerDetails) {


      var requestHandle = esriRequest({
        "url": url,
        "content": {
          "f": "json"
        },
        "callbackParamName": "callback"
      });
      this.loading_promises.push(requestHandle);
      requestHandle.then(this.requestSucceeded(layerDetails), this.requestFailed);
    },
    requestSucceeded: function (layerDetails) {
      return function (response, io) {
        var fieldInfo;
        //show field names and aliases
        if (response.hasOwnProperty("fields")) {
          layerDetails.layerObject.fields = response["fields"];

        }

      };
    },
    requestFailed: function (error, io) {

      domClass.add(dom.byId("content"), "failure");

      dojoJson.toJsonIndentStr = " ";
      dom.byId("content").value = dojoJson.toJson(error, true);

    },
    disableWebMapPopup: function () {
      if (this.map) {
        this.map.setInfoWindowOnClick(false);
        //this.map.infoWindow.set("popupWindow", false);
      }
    },
    _mapLocate: function () {
      if ('feature' in arguments[0]) {
        this.searchLoc = arguments[0].feature.geometry;
        this.event = arguments[0].feature.geometry;
        if (this.searchByLayer === null) {
          var tmpLay = this._findLayer(arguments[0].layerId);
          this.tempPopUp = null;
          if (tmpLay !== null) {
            this.tempPopUp = tmpLay;

          }
          this.showPopupGeo(arguments[0].feature.geometry, arguments[0].feature);

        }
        else {
          if (this.searchByLayer.id !== arguments[0].layerId) {
            this.showPopup(arguments[0].feature.geometry, "SEARCH");


          }
          else {
            this.tempPopUp = this.searchByLayer;
            this.showPopupGeo(arguments[0].feature.geometry, arguments[0].feature);

          }

        }



      }
      else if ('geometry' in arguments[0]) {

        if ("wkid" in arguments[0].geometry.spatialReference && "wkid" in this.map.spatialReference) {
          if (arguments[0].geometry.spatialReference.wkid !== this.map.spatialReference.wkid) {
            if (webMercatorUtils.canProject(arguments[0].geometry, this.map.spatialReference)) {
              arguments[0].geometry = webMercatorUtils.project(arguments[0].geometry, this.map.spatialReference);
            }

          }
        }
        this.showPopup(arguments[0].geometry, arguments[0].layerId);
      }
    },
    showPopup: function (evt, info) {
      topic.publish("app.toggleIndicator", true);
      this.event = evt;//this._getCenter(evt);
      this.searchLoc = evt;
      this.map.infoWindow.hide();
      //this.map.infoWindow.highlight = false;
      if (this.showGraphic === true) {
        this.map.graphics.clear();
      }

      if (this.searchByLayer !== null &&
        this.searchByLayer !== undefined &&
        info !== this.searchByLayer.id) {

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
        var centroid = geo.getCentroid();
        var center = geo.getExtent().getCenter();

        if (geometryEngine.contains(geo, centroid)) {
          return centroid;
        }
        else if (geometryEngine.contains(geo, center)) {
          return center;
        }
        return centroid;
      }
      else if (geo.type === "polyline") {
        return geometryEngine.nearestCoordinate(geo, geo.getExtent().getCenter()).coordinate;
        //return new Point(coord.x, coord.y, this.map.spatialReference);

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
    disable_clusering: function () {
      if (this.lookupLayers !== undefined && this.lookupLayers !== null) {
        array.forEach(this.lookupLayers, function (layer) {
          if (layer) {
            if (layer.layerObject) {
              if (layer.layerObject.isFeatureReductionEnabled && layer.layerObject.disableFeatureReduction) {
                if (layer.layerObject.isFeatureReductionEnabled()){
                  layer.layerObject.disableFeatureReduction();
                }
              }
            }
          }
        });
      }
    },
    showPopupGeo: function (evt, searchByFeature) {
      var onlySearchFeature = false;
      if (this.config.hasOwnProperty("onlySearchFeature")) {
        onlySearchFeature = this.config.onlySearchFeature;
      }
      this.resultCount = 0;
      this.searchByFeature = searchByFeature;

      if (this.lookupLayers === undefined) {
        topic.publish("app.toggleIndicator", false);
        return;
      }
      if (this.lookupLayers === null) {
        topic.publish("app.toggleIndicator", false);
        return;
      }
      if (this.lookupLayers.length === 0) {
        topic.publish("app.toggleIndicator", false);
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
      if (this.lookupLayers === null) {
        return null;
      }

      this.defCnt = this.lookupLayers.length;
      var queryDeferred;
      var geoExt;
      if (evt.type === "point") {
        geoExt = this.pointToExtent(evt, this.searchTol);
      }
      else {
        geoExt = this._getExtent(evt);

      }
      var layerObject = null;
      var objectIdField = null;
      if (this.tempPopUp) {
        if (this.tempPopUp.hasOwnProperty("layer")) {
          if (this.tempPopUp.layer.hasOwnProperty("layerObject")) {
            if (this.tempPopUp.layer.layerObject.hasOwnProperty("objectIdField")) {
              objectIdField = this.tempPopUp.layer.layerObject.objectIdField;
            }
          }
        }
        else if (this.tempPopUp.hasOwnProperty("layerObject")) {
          if (this.tempPopUp.layerObject.hasOwnProperty("objectIdField")) {
            objectIdField = this.tempPopUp.layerObject.objectIdField;
          }
        }
      }
      for (var f = 0, fl = this.lookupLayers.length; f < fl; f++) {
        layerObject = null;

        if (this.lookupLayers[f].hasOwnProperty("layer")) {
          if (this.lookupLayers[f].layer.hasOwnProperty("layerObject")) {
            layerObject = this.lookupLayers[f].layer.layerObject;
          }
        }
        else if (this.lookupLayers[f].hasOwnProperty("layerObject")) {
          layerObject = this.lookupLayers[f].layerObject;
        }

        if (onlySearchFeature === true &&
                  searchByFeature !== null && searchByFeature !== undefined &&
                  this.tempPopUp !== null && this.tempPopUp !== undefined &&
                  layerObject !== null && objectIdField !== null &&
                  this.tempPopUp.id === layerObject.id &&
                  searchByFeature.hasOwnProperty("attributes") &&
                  objectIdField in searchByFeature.attributes) {

          //  query = new Query();

          //  query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          //  //
          //  //.relationParam = "dim (g1.interior, g2) > null";
          //  if (evt.type === "point") {
          //    query.geometry = geoExt;
          //    query.geometryType = "esriGeometryExtent";
          //  }
          //  else {
          //    query.geometry = evt;
          //  }

          //  query.returnGeometry = true;
          //  query.outSpatialReference = this.map.spatialReference;
          //  query.outFields = ["*"];
          //  if (this.lookupLayers[f].definitionExpression) {
          //    query.where = this.lookupLayers[f].definitionExpression;
          //  }
          //  queryTask = new QueryTask(this.lookupLayers[f].url);
          //  queryDeferred = queryTask.execute(query);
          //  queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          //  queryDeferred.addErrback(lang.hitch(this, this._queryError));
          //  //query.returnGeometry = true;
          //  //query.outSpatialReference = this.map.spatialReference;
          query = new Query();
          query.outFields = ["*"];
          query.objectIds = [searchByFeature.attributes[objectIdField]];

          queryDeferred = layerObject.queryFeatures(query);
          queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          queryDeferred.addErrback(lang.hitch(this, this._queryError));

        }
        else if (this.lookupLayers[f].url === null) {

          query = new Query();

          if (evt.type === "point") {
            query.geometry = geoExt;
            query.geometryType = "esriGeometryExtent";
          }
          else {
            query.geometry = geoExt;
            query.geometryType = "esriGeometryExtent";
          }

          query.outFields = ["*"];
          if (this.lookupLayers[f].definitionExpression) {
            query.where = this.lookupLayers[f].definitionExpression;
          }

          queryDeferred = this.lookupLayers[f].layer.layerObject.queryFeatures(query);
          queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          queryDeferred.addErrback(lang.hitch(this, this._queryError));
        }

        else {
          query = new Query();

          query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          if (evt.type === "point") {
            query.geometry = geoExt;
            query.geometryType = "esriGeometryExtent";
          }
          else {
            query.geometry = evt;
          }

          query.returnGeometry = true;
          query.outSpatialReference = this.map.spatialReference;
          query.outFields = ["*"];
          if (this.lookupLayers[f].definitionExpression) {
            query.where = this.lookupLayers[f].definitionExpression;
          }
         // queryDeferred = this.lookupLayers[f].layerObject.queryFeatures(query);
          queryTask = new QueryTask(this.lookupLayers[f].url);
          queryDeferred = queryTask.execute(query);

          queryDeferred.addCallback(lang.hitch(this, this._queryComplete(this.lookupLayers[f])));

          queryDeferred.addErrback(lang.hitch(this, this._queryError));
        }
      }
    },
    _queryError: function (error) {


      console.log(error);
      this.defCnt = this.defCnt - 1;
      if (this.defCnt === 0) {
        this._allQueriesComplate();
      }


    },
    enableMapClick: function () {
      this.toolbar.activate(Draw.POINT);

    },
    disableMapClick: function () {
      this.toolbar.deactivate();

    },
    _infoHide: function () {
      if (this.map.graphics !== null) {
        this.map.graphics.clear();
      }
    },
    pointToExtent: function (point, toleranceInPixel) {
      //calculate map coords represented per pixel
      var pixelWidth = this.map.extent.getWidth() / this.map.width;
      //calculate map coords for tolerance in pixel
      var toleraceInMapCoords = toleranceInPixel * pixelWidth;
      //calculate & return computed extent
      return new Extent(point.x - toleraceInMapCoords,
                   point.y - toleraceInMapCoords,
                   point.x + toleraceInMapCoords,
                   point.y + toleraceInMapCoords,
                   point.spatialReference);
    },
    searchLayerForPopup: function (geo) {
      var query = new Query();
      if (this.searchByLayer.url === null || this.searchByLayer.url === undefined) {
        if (geo.type === "point") {
          query.geometry = this.pointToExtent(geo, this.searchTol);
          query.geometryType = "esriGeometryExtent";
        }
        else {
          query.geometry = geo.getExtent();
          query.geometryType = "esriGeometryExtent";
        }
        this.searchLoc = query.geometry;
        query.outFields = ["*"];

        if (this.searchByLayer.layerDefinition) {
          if (this.searchByLayer.layerDefinition.definitionExpression) {
            query.where = this.searchByLayer.layerDefinition.definitionExpression;
          }
        }
        var queryDeferred = this.searchByLayer.layerObject.queryFeatures(query);
        queryDeferred.addCallback(lang.hitch(this, this._layerSearchComplete(geo)));

        queryDeferred.addErrback(lang.hitch(this, function (error) {
          console.log(error);
        }));
      }
      else {
        if (geo.type === "point") {
          query.geometry = this.pointToExtent(geo, this.searchTol);
          query.geometryType = "esriGeometryExtent";
        }
        else {
          query.geometry = geo;
        }
        this.searchLoc = query.geometry;
        query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

        query.outSpatialReference = this.map.spatialReference;
        query.returnGeometry = true;
        query.outFields = ["*"];
        if (this.searchByLayer.layerDefinition) {
          if (this.searchByLayer.layerDefinition.definitionExpression) {
            query.where = this.searchByLayer.layerDefinition.definitionExpression;
          }
        }
        var layerQueryTask = new QueryTask(this.searchByLayer.url);
        layerQueryTask.on("complete", lang.hitch(this, this._layerSearchComplete(geo)));
        layerQueryTask.on("error", lang.hitch(this, function (error) {
          console.log(error);
          topic.publish("app.toggleIndicator", false);
        }));

        layerQueryTask.execute(query);
      }
    },
    _findLayer: function (layid) {
      var reLay = null;
      array.some(this.layers, function (layer) {

        if (layer.featureCollection !== undefined && layer.featureCollection !== null) {
          if (layer.featureCollection.layers !== undefined && layer.featureCollection.layers !== null) {
            array.forEach(layer.featureCollection.layers, function (subLyrs) {
              if (subLyrs.layerObject !== undefined && subLyrs.layerObject !== null) {
                if (subLyrs.layerObject.id === layid) {
                  reLay = subLyrs;
                  return true;
                }


              }
            }, this);
          }
        } else if (layer.layerObject !== undefined && layer.layerObject !== null) {
          if (layer.layerObject.layerInfos !== undefined && layer.layerObject.layerInfos !== null) {
            array.forEach(layer.layerObject.layerInfos, function (subLyrs) {

              if (subLyrs.id === layid) {
                reLay = subLyrs;
                return true;
              }

            }, this);

          } else {

            if (layer.id === layid) {
              reLay = layer;
              return true;
            }
          }
        }
      }, this);
      return reLay;
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
      var f = 0, fl = 0;
      for (f = 0, fl = serviceAreaLayerNames.length; f < fl; f++) {
        serviceAreaLayerNames[f] = djString.trim(serviceAreaLayerNames[f]);
        serviceAreaLayerNames[f] = this._loadLayers(this.layers, serviceAreaLayerNames[f], f);
      }

      var useLegacyConfig = false;
      var layDetails = {};
      if (this.lookupLayers.length === 0 &&
        this.config.serviceAreaLayerName !== null &&
         this.config.serviceAreaLayerName !== undefined) {
        layDetails = {};

        array.forEach(this.layers, function (layer) {

          this.config.serviceAreaLayerName = djString.trim(this.config.serviceAreaLayerName);
          if (layer.layerObject.layerInfos !== null) {
            array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
              if (subLyrs.name === this.config.serviceAreaLayerName) {
                layDetails.name = subLyrs.name;
                layDetails.layerOrder = 0;

                layDetails.url = layer.layerObject.url + "/" + subLyrs.id;

                //console.log(this.config.serviceAreaLayerName + " " + "set");

                if (layer.layers !== null) {
                  array.forEach(layer.layers, function (layer) {
                    if (subLyrs.id === layer.id) {
                      layDetails.popupInfo = layer.popupInfo;
                      if (layer.hasOwnProperty("layerObject") && layer.layerObject.hasOwnProperty("infoTemplate")) {
                        layDetails.infoTemplate = layer.layerObject.infoTemplate;
                      }
                    }
                  }, this);
                }
                if (layDetails.popupInfo === null) {
                  alert(i18n.error.popupNotSet + ": " + subLyrs.name);
                }
                this.lookupLayers.push(layDetails);
                useLegacyConfig = true;
              }
            }, this);
          } else {

            if (layer.title === this.config.serviceAreaLayerName) {
              if (layer.hasOwnProperty("layerObject") && layer.layerObject.hasOwnProperty("infoTemplate")) {
                layDetails.infoTemplate = layer.layerObject.infoTemplate;
              }
              layDetails.popupInfo = layer.popupInfo;
              layDetails.name = layer.title;
              layDetails.url = layer.layerObject.url;
              layDetails.layerOrder = 0;
              this.lookupLayers.push(layDetails);
              //console.log(layer.title + " " + "set");
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
    _loadLayers: function (layers, serviceAreaLayerNames, f) {
      var layDetails = {};
      array.forEach(layers, function (layer) {

        if (layer.featureCollection !== null && layer.featureCollection !== undefined) {
          if (layer.featureCollection.layers !== null &&
            layer.featureCollection.layers !== undefined) {
            array.forEach(layer.featureCollection.layers, function (subLyrs) {
              if (subLyrs.layerObject !== null) {
                if (subLyrs.layerObject.id === this.config.searchByLayer.id) {
                  this.searchByLayer = subLyrs;
                }
                if (subLyrs.layerObject.name === serviceAreaLayerNames ||
                  subLyrs.id === serviceAreaLayerNames) {
                  serviceAreaLayerNames = subLyrs.layerObject.name;
                  layDetails.name = subLyrs.layerObject.name;
                  layDetails.layerOrder = f;
                  layDetails.url = subLyrs.layerObject.url;
                  layDetails.layerObject = layer.layerObject;
                  layDetails.layer = subLyrs;
                  if (subLyrs.layerDefinition) {
                    if (subLyrs.layerDefinition.definitionExpression) {
                      layDetails.definitionExpression =
                        subLyrs.layerDefinition.definitionExpression;
                    }
                  }
                  //console.log(serviceAreaLayerNames + " " + "set");

                  layDetails.popupInfo = subLyrs.popupInfo;
                  if (layDetails.popupInfo === null ||
                    layDetails.popupInfo === undefined) {
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
        } else if (layer.layerObject !== null && layer.layerObject !== undefined) {
          if (layer.layerObject.layerInfos !== null && layer.layerObject.layerInfos !== undefined) {
            array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
              var matches = false;
              var serName;
              //Add code for SearchBy Layer one layer selector supports map service layers
              if (subLyrs.name === serviceAreaLayerNames) {
                matches = true;
              }
              else if (subLyrs.id === serviceAreaLayerNames) {
                matches = true;
              }
              else if (serviceAreaLayerNames.indexOf(".") > 0) {
                serName = serviceAreaLayerNames.split(".");
                if (layer.id === serName[0]) {
                  if (subLyrs.id.toString() === serName[1].toString()) {
                    matches = true;
                  }
                }
              }
              if (matches === true) {
                serviceAreaLayerNames = subLyrs.name;
                layDetails.name = subLyrs.name;
                layDetails.layerOrder = f;
                layDetails.url = layer.layerObject.url + "/" + subLyrs.id;
                layDetails.layerObject = layer.layerObject;
                this.getMapServerLayersContents(layDetails.url, layDetails);

                if (layer.layers !== null &&
                  layer.layers !== undefined) {
                  array.forEach(layer.layers, function (popUp) {
                    if (subLyrs.id === popUp.id) {
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
                if (layDetails.popupInfo === null ||
                  layDetails.popupInfo === undefined) {
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
            if (layer.title === serviceAreaLayerNames || layer.id === serviceAreaLayerNames) {
              serviceAreaLayerNames = layer.title;
              if (layer.popupInfo === null ||
                layer.popupInfo === undefined) {
                if (i18n) {
                  if (i18n.error) {
                    if (i18n.error.popupNotSet) {
                      alert(i18n.error.popupNotSet + ": " + layer.title);
                    }
                  }
                }

              }
              layDetails.popupInfo = layer.popupInfo;
              if (layer.hasOwnProperty("layerObject") && layer.layerObject.hasOwnProperty("infoTemplate")) {
                layDetails.infoTemplate = layer.layerObject.infoTemplate;
              }
              layDetails.name = layer.title;
              layDetails.url = layer.layerObject.url;
              layDetails.layerObject = layer.layerObject;
              layDetails.layerOrder = f;
              if (layer.layerDefinition) {
                if (layer.layerDefinition.definitionExpression) {
                  layDetails.definitionExpression = layer.layerDefinition.definitionExpression;
                }
              }
              this.lookupLayers.push(layDetails);
              //console.log(layer.title + " " + "set");

            }
          }
        }
        if (this.config.storeLocation === true && this.config.editingAllowed) {
          var fnd = false;

          if (this.config.serviceRequestLayerName.id !== undefined &&
            this.config.serviceRequestLayerName.id !== null) {
            if (layer.id === djString.trim(this.config.serviceRequestLayerName.id)) {

              this.serviceRequestLayerName = layer.layerObject;
              //console.log("Service Request Layer set");

              array.forEach(this.config.serviceRequestLayerName.fields, function (field) {
                if (field.id === "serviceRequestLayerAvailibiltyField") {
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
            if (layer.title === djString.trim(this.config.serviceRequestLayerName)) {

              this.serviceRequestLayerName = layer.layerObject;
              //console.log("Service Request Layer set");

              array.forEach(this.serviceRequestLayerName.fields, function (field) {
                if (field.name === this.config.serviceRequestLayerAvailibiltyField) {
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
      return serviceAreaLayerNames;

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
      var geo = this._getCenter(this.searchLoc);

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
      var geo = this._getCenter(this.searchLoc);

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
      if (this.config.linksInPopupSide === null ||
        this.config.linksInPopupSide === undefined ||
        this.config.linksInPopupSide === false
        ) {
        var obj = dojo.byId('sidebar_button_pane');
        if (obj !== undefined && obj !== null) {
          dojo.style(obj, "display", "none");
        }
      }
      if (this.config.linksInPopup === null ||
          this.config.linksInPopup === undefined) {
        //do nothing
      }
      else if (this.config.linksInPopup === true) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.esriPopup .actionsPane .zoomTo { display: none; }';
        document.getElementsByTagName('head')[0].appendChild(style);




        //.esriPopup .actionsPane .zoomTo {
        //  display: none;
        //}
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
      }

    },

    _drawEnd: function (evt) {
      this.showPopup(evt.geometry, "MapClick");
    },
    _processExpression: function (expression, fieldName, newfieldName) {
      try {

        search_vals = ["$feature.", "$feature,\"", "$feature, \"", '$feature["', "$feature['"]
        var count = search_vals.length;

        for (var i = 0; i < count; i++) {
          var item = search_vals[i];
          expression = expression.replaceAll(item + fieldName, item + newfieldName);
        }
        return expression;

      } catch (err) {
        console.log("_processExpression error:" + err);
        return null;
      }
    },

    _processObject: function (obj, fieldName, newfieldName, matchName) {
      try {
        var matchForRec = matchName;
        var re = null;
        for (var key in obj) {
          if (key !== null) {
            if (key === "type") {
              if (obj[key].indexOf("chart") > -1) {
                matchForRec = true;
              }
            }

            if (obj[key] !== null) {
              if (obj[key] instanceof Object) {
                if (key === "fields") {
                  obj[key] = this._processObject(obj[key], fieldName, newfieldName, true);
                } else {
                  obj[key] = this._processObject(obj[key], fieldName, newfieldName, matchName);
                }

              } else {
                if (obj[key] === fieldName && (matchName || key === "normalizeField")) {
                  obj[key] = newfieldName;
                } else {
                  re = new RegExp("{" + fieldName + "}", "gi");
                  if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(re, "{" +
                      newfieldName + "}")
                      .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
                      .replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
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
    _layerSearchComplete: function (geo) {
      return function (result) {
        var finalFeatures = null;
        var finalFeature = null;
        if (result) {
          if (result.featureSet) {
            if (result.featureSet.features) {
              if (result.featureSet.features.length > 0) {
                finalFeatures = result.featureSet.features;
              }
            }
          } else if (result.features) {
            if (result.features.length > 0) {
              finalFeatures = result.features;
            }
          }
        }
        if (finalFeatures) {
          finalFeatures = array.filter(finalFeatures,
            lang.hitch(this, function (feature) {
              if (geo.type === 'point' && feature.geometry.type === 'polyline') {
                return true;
              }
              else {
                return geometryEngine.intersect(geo, feature.geometry);
              }
            }));
          if (finalFeatures && finalFeatures.length > 0) {
            finalFeature = finalFeatures[0];
          }
          //if (finalFeatures && finalFeatures.length > 0) {
          //  var dis = 9999;

          //  var interFeatures = array.forEach(finalFeatures, lang.hitch(this, function (feature) {
          //    var disFeat = geometryEngine.distance(geo, feature.geometry);
          //    if (disFeat < dis) {
          //      finalFeature = feature;
          //    }
          //  }));
          //}


          if (finalFeature) {
            if (this.searchLoc.type !== 'point') {
              this.searchLoc = finalFeature.geometry;
            }
            this.event = finalFeature.geometry;
            this.tempPopUp = this.searchByLayer;
            this.showPopupGeo(finalFeature.geometry, finalFeature);
            return;
          }
        }
        this._showNoSearchFeatureFound();
      };
    },
    _queryComplete: function (lookupLayer) {

      return function (result) {

        var size = null;
        var minLineSize = 1;
        var minPolygonSize = 5;
        var checkSize = false;
        var intersection;
        if (this.config.hasOwnProperty('minLineSize')) {
          minLineSize = this.config.minLineSize;
        }
        if (this.config.hasOwnProperty('minPolygonSize')) {
          minPolygonSize = this.config.minPolygonSize;
        }
        if (this.config.hasOwnProperty('checkSize')) {
          checkSize = this.config.checkSize;
        }
        if (result.features.length > 0) {
          result.features = array.filter(result.features, lang.hitch(this, function (feature) {

            //This handles point click looking for a point
            if (this.event.type === 'point' && feature.geometry.type === 'point') {
              if (geometryEngine.distance(this.event, feature.geometry, this.config.pointOverlapUnit) < this.config.pointOverlap) {
                return true;
              }
              else {
                return false;
              }
            }
            else if (geometryEngine.intersects(this.event, feature.geometry)) {
              size = null;
              if (this.event.type === 'polygon') {
                if (feature.geometry.type === 'polygon') {
                  intersection = geometryEngine.intersect(this.event, feature.geometry);
                  if (intersection === null) {
                    return false;
                  }
                  try {
                    size = geometryEngine.geodesicArea(intersection, 109405);

                  }
                  catch (err) {
                    try {
                      size = geometryEngine.planarArea(intersection, 109405);
                    }
                    catch (err) {

                    }

                  }
                  return size === null ? false : size >= minPolygonSize || checkSize === false ? true : false;
                }
                else if (feature.geometry.type === 'polyline') {
                  intersection = geometryEngine.intersect(feature.geometry, this.event);
                  if (intersection === null) {
                    return false;
                  }
                  try {
                    size = geometryEngine.geodesicLength(intersection, 9002);

                  }
                  catch (err) {
                    try {
                      size = geometryEngine.planarLength(intersection, 9002);
                    }
                    catch (err) {

                    }

                  }
                  return size === null ? false : size >= minLineSize || checkSize === false ? true : false;
                }
                else {
                  return true;
                }
              }
              else if (this.event.type === 'polyline') {
                if (feature.geometry.type === 'polygon') {
                  intersection = geometryEngine.intersect(feature.geometry, this.event);
                  if (intersection === null) {
                    return false;
                  }
                  try {
                    size = geometryEngine.geodesicLength(intersection, 9002);

                  }
                  catch (err) {
                    try {
                      size = geometryEngine.planarLength(intersection, 9002);
                    }
                    catch (err) {

                    }

                  }
                  return size === null ? false : size >= minLineSize || checkSize === false ? true : false;
                }
                else {
                  return true;
                }
              }
              else {
                return true;
              }

            }
            else {
              return false;
            }
            return false;
          }));

          this.resultCount = this.resultCount + result.features.length;

          this.results.push({ "results": result.features, "Layer": lookupLayer });
        }

        this.defCnt = this.defCnt - 1;
        if (this.defCnt === 0) {
          this._allQueriesComplate();

        }

      };
    },
    _randomstring: function (L) {
      var s = '';
      var randomchar = function () {
        var n = Math.floor(Math.random() * 62);
        if (n < 10) {
          return n;
        } //1-10
        if (n < 36) {
          return String.fromCharCode(n + 55);
        }//A-Z
        return String.fromCharCode(n + 61); //a-z
      };
      while (s.length < L) {
        s += randomchar();
      }
      return s;
    },
    promises: [],
    loading_promises: [],
    attLinks: "",
    _getAttachments: function (feature, layer) {
      var oid = this._getOID(feature, layer);
      if (!layer || !layer.layerObject) {
        return;
      }
      if (!layer.layerObject.queryAttachmentInfos) {
        return;
      }
      if (layer.layerObject.hasAttachments && layer.layerObject.hasAttachments === true) {
        this.promises.push(layer.layerObject.queryAttachmentInfos(
          oid,
          lang.hitch(this, this._onQueryAttachmentInfosComplete),
          lang.hitch(this, this._onQueryAttachmentsError))
          );
      }
    },
    _onQueryAttachmentsError: function (response) {
      console.log(response);
    },
    _onQueryAttachmentInfosComplete: function (response) {
      try {
        var listHtml = "<span><a class='attachLinks' href='${href}' target='_blank'>${name}</a>";
        var endHtml = "<br/></span>";
        var htmlMarkup = listHtml + endHtml;
        links = array.map(response, lang.hitch(this, function (info) {
          return djString.substitute(htmlMarkup, {
            href: info.url,
            name: info.name
          });
        }));
        this.attLinks = this.attLinks + links.join("");
      } catch (err) {
        console.log("_onQueryAttachmentInfosComplete error:" + err);
      }

      //this._uploadForm.style.display = "block";
      //if ((!this._featureCanUpdate && this._layerEditingCap[this._currentLayerId].canUpdate) ||
      //   (!this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate)) {
      //  htmlMarkup = this._listHtml + this._endHtml;
      //  this._uploadForm.style.display = "none";
      //}
      //else if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
      //  htmlMarkup = this._listHtml + this._endHtml;
      //}
      //var list = this._attachmentList,
      //    links = array.map(response, lang.hitch(this, function (info) {
      //      return esriLang.substitute({
      //        href: info.url,
      //        name: info.name,
      //        oid: info.objectId,
      //        attid: info.id
      //      }, htmlMarkup);
      //    }));

      //list.innerHTML = links.join("") || this.NLS_none;
      //this._updateConnects();
    },
    _getOID: function (feature, layer) {
      var oid = null;
      if (layer.layerObject === undefined || layer.layerObject === null) {
        if (feature._layer !== undefined && feature._layer !== null) {
          if (feature._layer.hasOwnProperty("objectIdField")) {
            oid = feature.attributes[feature._layer.objectIdField];
          }

        }
      }
      else if (layer.layerObject.hasOwnProperty("objectIdField")) {
        oid = feature.attributes[layer.layerObject.objectIdField];
      }

      if (oid === null) {
        if (feature.attributes.hasOwnProperty("FID")) {
          oid = feature.attributes["FID"];
        }
        else if (feature.attributes.hasOwnProperty("OBJECTID")) {
          oid = feature.attributes["OBJECTID"];
        }
        else {
          oid = Math.random().toString(10).substr(2, 5);
        }
      }
      return oid;
    },
    _cloneAndRemoveRelationshipFields: function (fieldInfos, fields) {
      var newFieldArr = [];
      array.forEach(fieldInfos, function (fieldInfo) {
        if (fieldInfo.fieldName.indexOf('relationships/') === -1) {
          var newFld = lang.clone(fieldInfo);
          if (fields !== undefined && fields !== null) {
            array.some(fields, function (field) {
              if (field.name === fieldInfo.fieldName) {
                if (field.hasOwnProperty("domain")) {
                  newFld.domain = lang.clone(field.domain);
                  return true;
                }

              }
            });
          }
          newFieldArr.push(newFld);

        }
      });
      return newFieldArr;
    },
    _getPopupForResult: function (feature, layer) {
      try {

        var popupInfo = layer.popupInfo;
        var rUrl = new RegExp("^(?:[a-z]+:)?//", "i");
        //var rFile = new RegExp("^([a-zA-Z]:|\\\\[a-z]+)?(\\|\/|\\\\|//)", "i");

        var replaceVal = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
        var oid = null;
        oid = this._getOID(feature, layer);
        var replaceOID = replaceVal + "_" + oid + "_";
        var resultFeature = {};
        var layerFields = null;
        var fcFields = null;
        if (layer.hasOwnProperty("layerObject") &&
          layer.layerObject !== undefined &&
          layer.layerObject !== null) {
          if (layer.layerObject.hasOwnProperty("fields")) {
            layerFields = layer.layerObject.fields;
            fcFields = lang.clone(layer.layerObject.fields);
          }
        } else if (layer.hasOwnProperty("layer") &&
          layer.layer !== undefined &&
          layer.layer !== null) {
          if (layer.layer.hasOwnProperty("layerObject") &&
             layer.layer.layerObject !== undefined &&
             layer.layer.layerObject !== null) {
            if (layer.layer.layerObject.hasOwnProperty("fields")) {
              layerFields = layer.layer.layerObject.fields;
              fcFields = lang.clone(layer.layer.layerObject.fields);
            }
          }
        }
        if (layerFields === undefined) {
          layerFields = null;
          fcFields = null;
        }
        if (popupInfo !== null && popupInfo !== undefined) {
          if (popupInfo.showAttachments == true) {
            this._getAttachments(feature, layer);
          }

          var layerFields = this._cloneAndRemoveRelationshipFields(popupInfo.fieldInfos, layerFields);//lang.clone(popupInfo.fieldInfos);

          var layerDescription = lang.clone(popupInfo.description);
          var popupTitle = lang.clone(popupInfo.title);
          var mediaInfos = lang.clone(popupInfo.mediaInfos);
          var expressionInfos = lang.clone(popupInfo.expressionInfos);
          var layFldTable = "";
          var re = null;

          //var popupTemplate = new PopupTemplate(popupInfo);
          //var featureArray = [];
          //var content;
          //var editGraphic = new Graphic(feature.geometry, null,
          //  feature.attributes, popupTemplate);


          //featureArray.push(editGraphic);
          //this.map.infoWindow.setFeatures(featureArray);
          //this.map.infoWindow.resize();
          //content = this.map.infoWindow.getSelectedFeature().getContent();
          var exp_lookup = {};

          if (expressionInfos !== null && expressionInfos !== undefined) {
            array.forEach(expressionInfos, function (expressionInfo) {
              expressionInfo.name = replaceOID + expressionInfo.name;
              exp_lookup[expressionInfo.name] = expressionInfo.title;
            }, this);
          }
          var new_to_old_field = {};
          for (var g = 0, gl = layerFields.length; g < gl; g++) {
            var new_field_name;
            if (layerFields[g].fieldName.indexOf('expression/') !== -1) {
              new_field_name = layerFields[g].fieldName.split('/')[0] + "/" +
                replaceOID + layerFields[g].fieldName.split('/')[1];
            }
            else {
              new_field_name = replaceOID + layerFields[g].fieldName;
              new_to_old_field[layerFields[g].fieldName] = new_field_name;
            }

            if (mediaInfos !== null && mediaInfos !== undefined) {
              array.forEach(mediaInfos, function (mediaInfo) {
                mediaInfo = this._processObject(mediaInfo,
                  layerFields[g].fieldName, new_field_name,
                  false);

              }, this);
            }
            if (expressionInfos !== null && expressionInfos !== undefined) {
              array.forEach(expressionInfos, function (expressionInfo) {
                expressionInfo.expression = this._processExpression(expressionInfo.expression,
                  layerFields[g].fieldName, new_field_name);

              }, this);
            }

            if (popupInfo.description === null ||
              popupInfo.description === undefined) {

              re = new RegExp("{" + layerFields[g].fieldName + "}", "ig");

              popupTitle = popupTitle.replace(re, "{" +
                new_field_name + "}");

              if (layerFields[g].visible === true) {

                layFldTable = layFldTable + "<tr valign='top'>";
                var field_label = null;
                if (new_field_name.indexOf('expression/') !== -1) {
                  field_label = exp_lookup[new_field_name.split('/')[1]];
                }
                else if (layerFields[g].label !== null && layerFields[g].label !== "") {
                  field_label = layerFields[g].label;
                }
                else {
                  field_label = layerFields[g].fieldName;
                }

                layFldTable = layFldTable + "<td class='popName'>" +
                    field_label + "</td>";

                layFldTable = layFldTable + "<td class='popValue'>" +
                  "{" + new_field_name + "}</td>";
                layFldTable = layFldTable + "</tr>";

              }

            } else {
              re = new RegExp("{" + layerFields[g].fieldName + "}", "gi");

              layerDescription = layerDescription.replace(re, "{" + new_field_name + "}");

            }

            if (feature.attributes.hasOwnProperty(layerFields[g].fieldName)) {
              var fldVal = feature.attributes[layerFields[g].fieldName];
              if (fldVal !== null && fldVal !== undefined) {

                if (layerFields[g].hasOwnProperty("domain") &&
                layerFields[g].domain !== undefined &&
                layerFields[g].domain !== null) {
                  var domain = layerFields[g].domain;
                  if (domain.hasOwnProperty("codedValues") &&
                    domain.codedValues !== undefined &&
                    domain.codedValues !== null) {
                    array.some(domain.codedValues, function (codedValue) {
                      if (codedValue.code.toString() === fldVal.toString()) {
                        fldVal = codedValue.name;
                      }
                    });
                  }
                }
                fldVal = fldVal.toString();

                if (rUrl.test(fldVal)) {

                  if (popupInfo.description === null ||
                    popupInfo.description === undefined) {
                    resultFeature[new_field_name + "_" + "Hyper"] =
                      "<a target='_blank' href='" + fldVal + "'>" +
                      i18n.popup.urlMoreInfo + "</a>";

                    if (layFldTable.indexOf("{" + new_field_name + "}") >= 0) {
                      layFldTable = layFldTable.replace("{" + new_field_name + "}", "{" + new_field_name + "_" +
                        "Hyper" + "}");
                    }
                    resultFeature[new_field_name] = fldVal;
                  }
                  else {
                    resultFeature[new_field_name] = fldVal;
                  }
                }
                else {
                  resultFeature[new_field_name] = fldVal;
                }
              }
              else {
                resultFeature[new_field_name] = fldVal;
              }
            }

            layerFields[g].fieldName = new_field_name;

          }
          if (popupInfo.description === null ||
            popupInfo.description === undefined) {
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
          if (fcFields) {
            array.forEach(fcFields, function (field) {
              if (new_to_old_field.hasOwnProperty(field.name)) {
                field.name = new_to_old_field[field.name];
                if (field.type === "esriFieldTypeOID") {
                  field.type = "esriFieldTypeInteger";
                }
              }
            });
          }

          return {
            fields: layerFields,
            media: mediaInfos,
            desc: layerDescription,
            feature: resultFeature,
            newid: replaceOID,
            expression: expressionInfos,
            fcFields: fcFields
          };

        }
        return null;
      } catch (err) {
        console.error("_getPopupForResult error:" + err);
        return null;
      }
    },
    _allQueriesComplate: function () {
      try {
        this.promises = [];
        this.attLinks = "";
        var allFields = [];
        var allFCFields = [];
        var allDescriptions = "";
        var popUpArray = {};
        var mediaArray = {};
        var expressionArray = {};
        var resultFeature = {};
        var valToStore = null;
        var resultSum = {};
        for (var f = 0, fl = this.lookupLayers.length; f < fl; f++) {
          resultSum[this.lookupLayers[f].name] = 0;
        }

        var centr = this._getCenter(this.searchLoc);
        var all_geos = [];
        var show_at_center = false;
        if (this.resultCount > 0) {

          //popUpArray.length = this.results.length;
          //mediaArray.length = this.results.length;
          //console.log(this.results.length + " layers");

          array.forEach(this.results, function (result) {

            var layer = result.Layer;
            mediaArray[layer.layerOrder] = {};
            popUpArray[layer.layerOrder] = {};
            expressionArray[layer.layerOrder] = {};
            var layerName = layer.name === null ? layer.title : layer.name;
            //console.log(result.results.length + " features found in " + layerName);
            array.forEach(result.results, function (feature) {
              all_geos.push(feature.geometry);
              //console.log("Feature with OBJECTID: " + feature.attributes.OBJECTID +
              //  " in " + layerName);
              if (layerName in resultSum) {
                resultSum[layerName] = resultSum[layerName] + 1;
              }
              else {
                resultSum[layerName] = 1;
              }
              var desc = null;
              var popDet = this._getPopupForResult(feature, layer);
              //try {
              //  //if (layer.infoTemplate) {
              //  //  //layer.layerObject.infoTemplate

              //  //  //this.popContentCP.set("content", this.map.infoWindow.setFeatures([feature]).features[0].getContent());
              //  //  //this.popContentCP.set("content", new Graphic(feature, null, feature.attributes, layer.infoTemplate).getContent());
              //  //  //desc = this.popContentCP.domNode.innerHTML.split('<div class="break">')[0];
              //  //  this.map.infoWindow.setFeatures([feature]);
              //  //  var content = this.map.infoWindow.features[0].getContent();
              //  //  this.popContentCP.set("content", content);
              //  //  desc = this.popContentCP.domNode.innerHTML;
              //  //  //desc = this.popContentCP.domNode.innerHTML.split('<div class="break">')[0];
              //  //  //desc = desc.split('<div class="mainSection">')[1];

              //  //  //if (layer.infoTemplate.info !== null && layer.infoTemplate.info !== undefined) {
              //  //  //  if (layer.infoTemplate.info.popupTitle !== "") {
              //  //  //    desc = desc.split('<div class="hzLine"></div>')[1];
              //  //  //  }
              //  //  //}
              //  //}
              //  //else {

              //  //}
              //}
              //catch (err) {

              //  desc = popDet.desc;
              //}
              desc = popDet.desc;
              if (popDet) {
                allFields = allFields.concat(popDet.fields);
                resultFeature = lang.mixin(resultFeature, popDet.feature);
                //oid = feature.attributes[result.Layer.layerObject.objectIdField];
                mediaArray[result.Layer.layerOrder][popDet.newid] = popDet.media;
                expressionArray[result.Layer.layerOrder][popDet.newid] = popDet.expression;
                popUpArray[result.Layer.layerOrder][popDet.newid] = desc;//popDet.desc;
                allFCFields = allFCFields.concat(popDet.fcFields);
              }

            }, this);
          }, this);

          var finalMedArr = [];
          var finalExpArr = [];
          var subkey, key, tmpMsg;
          for (key in popUpArray) {
            if (key !== null && key !== undefined) {
              if (popUpArray[key] !== null && popUpArray[key] !== undefined) {
                for (subkey in popUpArray[key]) {
                  if (subkey !== null && subkey !== undefined) {
                    if (popUpArray[key][subkey] !== null && popUpArray[key][subkey] !== undefined) {
                      allDescriptions = allDescriptions === "" ? popUpArray[key][subkey] :
                        allDescriptions + popUpArray[key][subkey];
                    }
                  }
                }
              }

            }
          }
          for (key in mediaArray) {
            if (key !== null && key !== undefined) {
              if (mediaArray[key] !== null && mediaArray[key] !== undefined) {
                for (subkey in mediaArray[key]) {
                  if (subkey !== null && subkey !== undefined) {
                    if (mediaArray[key][subkey] !== null &&
                      mediaArray[key][subkey] !== undefined) {
                      finalMedArr.push.apply(finalMedArr, mediaArray[key][subkey]);

                    }
                  }
                }
              }

            }
          }
          for (key in expressionArray) {
            if (key !== null && key !== undefined) {
              if (expressionArray[key] !== null && expressionArray[key] !== undefined) {
                for (subkey in expressionArray[key]) {
                  if (subkey !== null && subkey !== undefined) {
                    if (expressionArray[key][subkey] !== null &&
                      expressionArray[key][subkey] !== undefined) {
                      finalExpArr.push.apply(finalExpArr, expressionArray[key][subkey]);

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
              regex = new RegExp('{<', "gi");
              console.warn("Invalid text in the beginning pop up description." +
                " Removing bad value.  This might be caused by string formatting between {}." +
                " Character " + this.config.popPreMessage.indexOf('{<').toString());
              this.config.popPreMessage = this.config.popPreMessage.replace(regex, "<");
            }
            tmpMsg = this.config.popPreMessage.replace(/{IL_XCOORD}/gi, centr.x).replace(/{IL_YCOORD}/gi, centr.y);
            tmpMsg = tmpMsg.replace(/{IL_LAT}/gi, mp.y).replace(/{IL_LONG}/gi, mp.x);
            for (key in resultSum) {
              if (key !== null && key !== undefined) {

                find = "{" + key + "}";
                regex = new RegExp(find, "gi");
                tmpMsg = tmpMsg.replace(regex, resultSum[key]);

              }
            }
            allDescriptions = "<div>" + tmpMsg + "</div>" + allDescriptions;
          }
          if (this.config.popPostMessage !== null &&
            this.config.popPostMessage !== undefined) {
            if (this.config.popPostMessage.indexOf('{<') > 0) {
              regex = new RegExp('{<', "gi");
              console.warn("Invalid text in the beginning pop up description." +
                " Removing bad value.  This might be caused by string formatting between {}." +
                " Character " + this.config.popPostMessage.indexOf('{<').toString());
              this.config.popPostMessage = this.config.popPostMessage.replace(regex, "<");
            }
            tmpMsg = this.config.popPostMessage.replace(/{IL_XCOORD}/gi, centr.x)
              .replace(/{IL_YCOORD}/gi, centr.y);
            tmpMsg = tmpMsg.replace(/{IL_LAT}/gi, mp.y).replace(/{IL_LONG}/gi, mp.x);

            for (key in resultSum) {
              if (key !== null && key !== undefined) {

                find = "{" + key + "}";
                regex = new RegExp(find, "gi");
                tmpMsg = tmpMsg.replace(regex, resultSum[key]);

              }
            }
            allDescriptions = allDescriptions + "<div>" + tmpMsg + "</div>";
          }
          if (this.searchByFeature !== null && this.searchByFeature !== undefined) {
            if (this.tempPopUp !== null && this.tempPopUp !== undefined) {

              if (allDescriptions.indexOf("{IL_SEARCHBY}") >= 0) {
                var searchByPopup = this._getPopupForResult(this.searchByFeature, this.tempPopUp);
                if (searchByPopup) {
                  allDescriptions = allDescriptions.replace(/{IL_SEARCHBY}/gi, searchByPopup.desc);
                  allFields = allFields.concat(searchByPopup.fields);
                  resultFeature = lang.mixin(resultFeature, searchByPopup.feature);

                  //TODO: Do we need to handle expressions in the search by layer
                  //expressionArray[result.Layer.layerOrder][searchByPopup.newid] = searchByPopup.expression;
                  allFCFields = allFCFields.concat(searchByPopup.fcFields);
                }
              }
            }
            if (this.searchByFeature.attributes !== null &&
              this.searchByFeature.attributes !== undefined) {
              for (key in this.searchByFeature.attributes) {
                if (key !== null && key !== undefined) {
                  var fldname = "{" + key + "}";
                  if (allDescriptions.indexOf(fldname) >= 0) {
                    regex = new RegExp(fldname, "gi");
                    allDescriptions = allDescriptions.replace(regex,
                      this.searchByFeature.attributes[key]);
                  }
                }
              }
            }
          }

          var finalDes = allDescriptions.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
          if (this.promises.length > 0) {
            all(this.promises).then(lang.hitch(this, function (results) {
              var attachmentText = "<br/><span><b>" + i18n.popup.attachments + ":" + "</b><br/></span>" + this.attLinks.replace(/&amp;/gi, "&")
                .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'");
              finalDes = finalDes + attachmentText;
              this._showFinalResults(
                this.config.popupTitle,
                allFields,
                finalDes,
                finalMedArr,
                finalExpArr,
                this.config.serviceRequestLayerAvailibiltyFieldValueAvail,
                resultFeature,
                centr,
                allFCFields
                );
            }));
          }
          else {
            if (all_geos.length === 1) {
              if (all_geos[0].type === 'point') {
                centr = all_geos[0];
                show_at_center = true;
              }
            }
            this._showFinalResults(
              this.config.popupTitle,
              allFields,
              finalDes,
              finalMedArr,
              finalExpArr,
              this.config.serviceRequestLayerAvailibiltyFieldValueAvail,
              resultFeature,
              centr,
              show_at_center,
              allFCFields
              );
          }
        }
        else {
          if (all_geos.length === 1) {
            if (all_geos[0].type === 'point') {
              centr = all_geos[0];
              show_at_center = true;
            }
          }
          this._showFinalResults(
          this.config.serviceUnavailableTitle,
          allFields,
          this.config.serviceUnavailableMessage.replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "'"),
          mediaArray,
          expressionArray,
          this.config.serviceRequestLayerAvailibiltyFieldValueNotAvail,
          resultFeature,
          centr,
          show_at_center,
          allFCFields
          );
        }

      } catch (err) {
        console.error(err);

      }
    },
    _showFinalResults: function (title, fieldInfos, description, mediaInfos, expressionInfos, valToStore, resultFeature, centr, showAtCenter,fcfields) {
      var atts = {};
      showAtCenter = showAtCenter || false;
      this.popupTemplate = new PopupTemplate({
        title: title,
        fieldInfos: fieldInfos,
        description: description,
        mediaInfos: mediaInfos,
        expressionInfos: expressionInfos
      });
      valToStore = valToStore;

      var featureArray = [];
      var content;
      var loc = this.event;
      if (showAtCenter) {
        loc = centr;
      }

      var editGraphic = new Graphic(loc, this._getSymbol(),
        resultFeature, this.popupTemplate);

      if (this.showGraphic === true) {
        this.map.graphics.add(editGraphic);
        //This may be need to added arcade expressions
        this.map.graphics.fields = fcfields;
      } else {

        var layerDefinition = {
          "geometryType": "esriGeometryPoint",
          "fields": fcfields
        };
        var featureCollection = {
          layerDefinition: layerDefinition,
          featureSet: null
        };
        var featureLayer = new FeatureLayer(featureCollection, {
          showLabels: false
        });
        editGraphic._layer = featureLayer;
      }
      featureArray.push(editGraphic);

      this.map.infoWindow.markerSymbol.outline.setColor(new Color([0,0,0,0]));

      this.map.infoWindow.setFeatures(featureArray);
      if (this.config.popupWidth !== null && this.config.popupHeight !== null) {
        this.map.infoWindow.resize(this.config.popupWidth, this.config.popupHeight);
      } else if (this.config.popupWidth !== null) {
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
        if(this.config.orientForMobile) {
          var offset = this._offsetLocation({"ext":ext});
          // offset where point to zoom the map so that the infowindow will always be centered
          var newX = centr.x + offset.x;
          var newY = centr.y + offset.y;
          var centerPopup = new Point(newX, newY, this.map.spatialReference);
          def = this.map.centerAndZoom(centerPopup, this.config.zoomLevel);
        } else {
          def = this.map.centerAndZoom(centr, this.config.zoomLevel);
        }
      } else {
        if (this.map._fixExtent(ext, true).lod.level > this.config.zoomLevel) {
          if(this.config.orientForMobile) {
            var offset = this._offsetLocation({"ext":ext});
            // offset where point to zoom the map so that the infowindow will always be centered
            /*
            var extCenter = ext.getCenter();
            var newX = extCenter.x + offset.x;
            var newY = extCenter.y - offset.y;
            var newLocation = new Point(newX, newY, this.map.spatialReference);
            def = this.map.centerAndZoom(newLocation, this.config.zoomLevel);
            */
            var newMinX = ext.xmin + offset.x;
            var newMaxX = ext.xmax + offset.x;
            var newMinY = ext.ymin + offset.y;
            var newMaxY = ext.ymax + offset.y;
            ext.update(newMinX, newMinY, newMaxX, newMaxY, this.map.spatialReference);
            def = this.map.setExtent(ext, true);
          }
          else {
            def = this.map.centerAndZoom(centr, this.config.zoomLevel);
          }
        }
        else {
          if(this.config.orientForMobile) {
            var offset = this._offsetLocation({"ext":ext});
            var newMinX = ext.xmin + offset.x;
            var newMaxX = ext.xmax + offset.x;
            var newMinY = ext.ymin + offset.y;
            var newMaxY = ext.ymax + offset.y;
            ext.update(newMinX, newMinY, newMaxX, newMaxY, this.map.spatialReference);
            def = this.map.setExtent(ext, true);
          } else {
            def = this.map.setExtent(ext, true);
          }
        }

      }
      def.addCallback(lang.hitch(this, function () {
        topic.publish("app.toggleIndicator", false);

        this.tempPopUp = null;
        if (this.contentWindow) {
          content = this.map.infoWindow.getSelectedFeature().getContent();

          this.contentWindow.set("content", content);
          if (this.config.color !== null && this.config.color !== undefined) {
            djquery(".hzLinePopUp").style("border-color",
              this.config.color.toString() + " !important");

            djquery(".esriViewPopup .hzLine").style("border-color",
              this.config.color.toString() + " !important");
          }

          topic.publish("app.contentSet", false);
        } else {

          this.map.infoWindow.show(centr);
        }
      }));

    },
    _offsetLocation: function(args) {
      if(args.ext !== null) {
        //gets the level of the feature selected to use the level's rez to offset
        var fixed = this.map._fixExtent(args.ext, true);
        var level = fixed.lod.level;
        var lods = this.map.__tileInfo.lods;
        var rez = 0;
        // loop through the levels and match the one that the selected feature entails
        array.forEach(lods, lang.hitch(this, function(lod) {
          if(lod.level === level) {
            rez = lod.resolution;
          }
        }));
      } else {
        //get the LODs in map and match the level set in config to get the resolution
        var lods = this.map.__tileInfo.lods;
        var rez = 0;
        array.forEach(lods, lang.hitch(this, function(lod) {
          if(lod.level === this.config.zoomLevel) {
            rez = lod.resolution;
          }
        }));
      }
      //multiply the resolution and info window size to know how much to offset the point clicked
      var popW = this.map.infoWindow._positioner.clientWidth;
      var popH = this.map.infoWindow._positioner.clientHeight;
      var multiplierH = 1;
      var multiplierW = 2 * (this.map.width / popW);
      if(this.map.infoWindow.features[0].infoTemplate.info.title === this.config.serviceUnavailableTitle ||
        this.map.infoWindow.features[0].infoTemplate.info.title === this.config.noSearchFeatureTitle) {
        multiplierH =  1 + (popH / this.map.height);
      } else {
        multiplierH = 2.2 + (popH / this.map.height);
      }
      var offsetX = (rez * this.map.infoWindow._positioner.clientWidth) / multiplierW;
      var offsetY = (rez * this.map.infoWindow._positioner.clientHeight) * multiplierH;
      return {"x": offsetX, "y": offsetY};
    },
    _showNoSearchFeatureFound: function () {
      var centr = this._getCenter(this.searchLoc);

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
      if (this.config.popupWidth !== null && this.config.popupHeight !== null) {
        this.map.infoWindow.resize(this.config.popupWidth, this.config.popupHeight);
      } else if (this.config.popupWidth !== null) {
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
      var def = null;
      if (ext === null) {
        if(this.config.orientForMobile) {
          var offset = this._offsetLocation({"ext":ext});
          // offset where point to zoom the map so that the infowindow will always be centered
          var newX = centr.x + offset.x;
          var newY = centr.y + offset.y;
          var centerPopup = new Point(newX, newY, this.map.spatialReference);
          def = this.map.centerAndZoom(centerPopup, this.config.zoomLevel);
        } else {
          def = this.map.centerAndZoom(centr, this.config.zoomLevel);
        }

      } else {
        if (this.map._fixExtent(ext, true).lod.level > this.config.zoomLevel) {
          if(this.config.orientForMobile) {
            var offset = this._offsetLocation({"ext":ext});
            // offset where point to zoom the map so that the infowindow will always be centered
            /*
            var extCenter = ext.getCenter();
            var newX = extCenter.x + offset.x;
            var newY = extCenter.y - offset.y + ext.getHeight();
            var newLocation = new Point(newX, newY, this.map.spatialReference);
            def = this.map.centerAndZoom(newLocation, this.config.zoomLevel);
            */
            var newMinX = ext.xmin + offset.x;
            var newMaxX = ext.xmax + offset.x;
            var newMinY = ext.ymin + offset.y;
            var newMaxY = ext.ymax + offset.y;
            ext.update(newMinX, newMinY, newMaxX, newMaxY, this.map.spatialReference);
            def = this.map.setExtent(ext, true);
          } else {
            def = this.map.centerAndZoom(centr, this.config.zoomLevel);
          }
        }
        else {
          if(this.config.orientForMobile) {
            var offset = this._offsetLocation({"ext":ext});
            var newMinX = ext.xmin + offset.x;
            var newMaxX = ext.xmax + offset.x;
            var newMinY = ext.ymin + offset.y;
            var newMaxY = ext.ymax + offset.y;
            ext.update(newMinX, newMinY, newMaxX, newMaxY, this.map.spatialReference);
            def = this.map.setExtent(ext, true);
          } else {
            def = this.map.setExtent(ext, true);
          }
        }


      }
      def.addCallback(lang.hitch(this, function () {
        topic.publish("app.toggleIndicator", false);

        if (this.contentWindow) {
          this.contentWindow.set("content",
            this.map.infoWindow.getSelectedFeature().getContent());
          if (this.config.color !== null && this.config.color !== undefined) {
            djquery(".hzLinePopUp").style("border-color",
              this.config.color.toString() + " !important");

            djquery(".esriViewPopup .hzLine").style("border-color",
              this.config.color.toString() + " !important");
          }

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
      if (typeof this.serviceRequestLayerName !== "undefined") {
        if (this.serviceRequestLayerName !== null) {
          if (this.serviceRequestLayerName.isEditable() === true) {
            if (this.serviceRequestLayerName.geometryType === "esriGeometryPoint") {
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
      if (this.event.type === "point") {
        return this.markerSymbol;
      } else if (this.event.type === "polygon") {
        return this.fillSymbol;
      } else if (this.event.type === "polyline") {
        return this.lineSymbol;
      }
    }

  });
});