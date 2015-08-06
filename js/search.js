define([
  "dojo/Evented",
  "dojo",
  "dojo/ready",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "esri",
  "esri/dijit/Search",
  "esri/tasks/locator",
  "esri/lang",
  "esri/layers/FeatureLayer",
  "dojo/dom",
  "dojo/topic",
  "dojo/i18n!application/nls/resources",
  "application/SearchSources",
  "esri/urlUtils"
],
function (
  Evented,
  dojo,
  ready,
  declare,
  lang,
  array,
  on,
  esri,
  Search,
  Locator,
  esriLang,
  FeatureLayer,
  dom,
  topic,
  i18n,
  SearchSources,
  urlUtils
    ) {
  return declare([Evented], {

    options : {
      domNode : null,
      config : null,
      map : null,
    },

    constructor : function (options) {
      // mix in settings and defaults
      var defaults = lang.mixin({}, this.options, options);
      // properties
      // widget node

      this._i18n = i18n;
      this.map = defaults.map;
      this.config = defaults.config;
      this.domNode = defaults.domNode;
      this.href = defaults.href;
    },
    // start widget. called by user
    startup : function () {
      this._init();
    },

    /* ---------------- */
    /* Private Functions */
    /* ---------------- */
    _init : function () {
      this._removeEvents();

      this._addSearch();

    },
    _removeEvents : function () {
      if (this._events && this._events.length) {
        for (var i = 0; i < this._events.length; i++) {
          this._events[i].remove();
        }
      }
      this._events = [];
    },
    _addSearch : function () {
      if (this.config.search === true) {
        var searchOptions = {
          map : this.map,
          autoNavigate : false,
          useMapExtent : true,
          itemData : this.config.response.itemInfo.itemData
        };

        if (this.config.searchConfig) {
          searchOptions.applicationConfiguredSources = this.config.searchConfig.sources || [];
        } else {
          var configuredSearchLayers = (this.config.searchLayers instanceof Array) ?
            this.config.searchLayers : JSON.parse(this.config.searchLayers);
          searchOptions.configuredSearchLayers = configuredSearchLayers;
          searchOptions.geocoders = this.config.helperServices.geocode;
        }
        var searchSources = new SearchSources(searchOptions);
        var createdOptions = searchSources.createOptions();

        if (this.config.searchConfig && this.config.searchConfig.activeSourceIndex) {
          createdOptions.activeSourceIndex = this.config.searchConfig.activeSourceIndex;
        }


        this.search = new Search(createdOptions, this.domNode);

        this.search.on("select-result", lang.hitch(this, this._showLocation));
        this.search.on("clear", lang.hitch(this, this._clear));

        this.search.startup();

        dojo.addClass(this.domNode, "searchControl");
      }

      //Feature Search
      if (this.config.searchByLayer.id !== null && this.config.searchByLayer.fields.length > 0 &&
        this.config.customUrlParam !== null) {
        require(["esri/dijit/Search"], lang.hitch(this, function (Search) {
          var source = null,
              value = null,
              searchLayer = null;

          var urlObject = urlUtils.urlToObject(this.href);
          urlObject.query = urlObject.query || {};
          urlObject.query = esriLang.stripTags(urlObject.query);
          //Support find or custom url param
          if (urlObject.query[this.config.customUrlParam.toLowerCase()]) {
            value = urlObject.query[this.config.customUrlParam.toLowerCase()];

            searchLayer = this.map.getLayer(this.config.searchByLayer.id);
            if (searchLayer) {

              var searchFields = this.config.searchByLayer.fields[0].fields;
              source = {
                exactMatch : true,
                outFields : ["*"],
                featureLayer : searchLayer,
                displayField : searchFields[0],
                searchFields : searchFields
              };
            }
            var urlSearch = new Search({
              map : this.map
            });
            //urlSearch.on("search-results", lang.hitch(this, this._showLocation));

            if (source) {
              urlSearch.set("sources", [source]);
            }
            urlSearch.on("load", lang.hitch(this, function () {
              urlSearch.search(value).then(lang.hitch(this, function (response) {
                if (response) {
                  try {
                    if (response[0][0].hasOwnProperty("feature")) {
                      if (response[0][0].feature.hasOwnProperty("geometry")) {
                        topic.publish("app.mapLocate", {
                          "geometry" : response[0][0].feature.geometry,
                          "geometryInfo" : this.config.searchByLayer.id
                        });
                      }
                    }
                  }
                  catch (e) {
                    console.log(e);
                  }
                }


              }));
            }));
            urlSearch.startup();
          }


        }));
      }

    },

    _clear : function (evt) {
      this.emit("clear", evt);

    },
    _showLocation : function (evt) {
      if (evt) {
        var msg;
        if (evt.feature) {
          msg = {
            "geometry" : evt.feature.geometry,
            "geometryInfo" : "Search"
          };
          topic.publish("app.mapLocate", msg);
        }
        else if (evt.result) {
          if (evt.result.feature) {

            if (evt.source) {
              if (evt.source.flayerId) {
                msg = {
                  "geometry" : evt.result.feature.geometry,
                  "geometryInfo" : evt.source.flayerId
                };

              } else {
                msg = {
                  "geometry" : evt.result.feature.geometry,
                  "geometryInfo" : "Geocode"
                };

              }

            } else {
              msg = {
                "geometry" : evt.result.feature.geometry,
                "geometryInfo" : "Geocode"
              };

            }
            topic.publish("app.mapLocate", msg);
          }
        }
      }


    },


  });
});