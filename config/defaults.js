/*global define,location */
define([], function () {
  //Default configuration settings for the application. This is where you'll define things like a bing maps key, 
  //default web map, default app color theme and more. These values can be overwritten by template configuration settings
  //and url parameters.
  var defaults = {
    "appid": "9ab7bb7f3b394bf594636114927b73d6",
    "webmap": "25660c0facdb419191c8b2dec5da74d7",
    "oauthappid": null, //"AFTKRmv16wj14N3z",
    //Group templates must support a group url parameter. This will contain the id of the group.
    //group: "",
    //Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
    //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
    "proxyurl": "",
    //Example of a template specific property. If your template had several color schemes
    //you could define the default here and setup configuration settings to allow users to choose a different
   
    "bingKey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
    //Defaults to arcgis.com. Set this value to your portal or organization host name.
    "sharinghost": location.protocol + "//" + "www.arcgis.com",

    "helperServices": {
      "geometry": {
        "url": null
      },
      "printTask": {
        "url": null
      },
      "elevationSync": {
        "url": null
      },
      "geocode": [{
        "url": "",
        "singleLineFieldName": "SingleLine",
        "placefinding": true

      }]
    },
    "searchByLayer": [{
      "id": "",
      "fields": []
    }],
    "serviceAreaLayerNames": "Service Area",
    "popupTitle": "Service Information",
    "serviceUnavailableTitle": "Outside Service Area",
    "serviceUnavailableMessage": "No information is available at the selected location",
    "noSearchFeatureTitle": "No search feature",
    "noSearchFeatureMessage": "A search feature to use to lookup information was not found, please select a new location.",
    "popupWidth": null,
    "popupHeight": null,
    "zoomLevel": 16,
    "storeLocation": false,
    "serviceRequestLayerName": "Request Tracking",
    "serviceRequestLayerAvailibiltyField": "REQSTATUS",
    "serviceRequestLayerAvailibiltyFieldValueAvail": "Intersected",
    "serviceRequestLayerAvailibiltyFieldValueNotAvail": "Not Intersected",
    "serviceRequestLayerAvailibiltyFieldValueNoSearch": "No Search Feature",
    "showSplash": false,
    "splashText": "<center>Information Lookup is a configurable web application template that can be used to provide the general public, internal staff and other interested parties the with information about a location. If no features are found at that location, a general message is displayed. Optionally, the location entered can be stored in a point layer. The template can be configured using the ArcGIS Online Configuration dialog.</center>",
    "color": null,
    "backcolor":null,
    "uidirection": "left",
    "showUI": false,
    "popupSide": false,
    "title": "Information Lookup",
    "popPreMessage": null,
    "popPostMessage": null,
    "basemapWidgetVisible": true,
   
    //When true the geocoder search box is displayed in the title area
    //When searchextent is true the geocoder will prioritize results within
    //the current map extent
    //"searchExtent": true,
    "search":true,
    //Setup the app to support a custom url parameter. Use this if you want users
    //to be able to search for a string field in a layer. For example if the web map
    //has parcel data and you'd like to be able to zoom to a feature using its parcel id
    //you could add a custom url param named parcel then users could enter 
    //a value for that param in the url. index.html?parcel=3203
    "customUrlLayer": {
      "id": "",//id of the search layer as defined in the web map
      "fields": []//Name of the string field to search 
    },
    "customUrlParam": "",//Name of url param. For example parcels
    "searchLayers": [{
      "id": "",
      "fields": []
    }]
    
  };
  return defaults;
});