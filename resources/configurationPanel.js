{
  "configurationSettings": [
    {
      "category": "General Settings",
      "fields": [
        {
          "type": "paragraph",
          "value": "<font size='3'><b>Solution Configurations</b></font><br /><font size='3'>------------------------------------</font><br /><font size='2'>To see this application configured for an industry, visit the following configurations on <a target='_blank' href='http://solutions.arcgis.com'>solutions.ArcGIS.com</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/electric/help/SystemImprovement'>Electric System Improvement</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/water/help/SewerServiceLookup'>Sewer Service Lookup</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/water/help/WaterRestrictions'>Water Restrictions</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/gas/help/GasServiceLookup/'>Gas Service Lookup</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/localgovernment/help/10.2/FloodInquiry/'>Floodplain Inquiry</a></font>"
        },
        {
          "type": "webmap",
          "label": "Select a map"
        }
      ]
    },
    {
      "category": "Lookup Layers Settings",
      "fields": [
        {
          "label": "Lookup Layers",
          "fieldName": "serviceAreaLayerNamesSelector",
          "type": "multilayerandfieldselector",
          "tooltip": "Polygon Layers used for combined popup",
          "layerOptions": {
            "supportedTypes": [
              "FeatureLayer",
              "FeatureCollection",
              "MapServiceLayer"
            ],
            "geometryTypes": [
              "esriGeometryPolygon"
            ]
          }
        },
        {
          "label": "Zoom level for location",
          "fieldName": "zoomLevel",
          "type": "number",
          "constraints": {
            "min": 0,
            "places": 0
          },
          "tooltip": "Sets the map zoom level to this level after location is entered"
        }
      ]
    },
    {
      "category": "Search By Layer Settings",
      "fields": [
        {
          "type": "paragraph",
          "value": "By Default, when the mouse click location is used to lookup information at that location.  If you would like to use a feature from a layer at that location, set up the following parameters."
        },
        {
          "type": "layerAndFieldSelector",
          "fieldName": "searchByLayer",
          "label": "Layer to search for features to lookup intersecting layers",
          "tooltip": "Select the layer whos features will be used to find the lookup features",
          "layerOptions": {
            "supportedTypes": [
              "FeatureLayer"
            ]
          }
        },
        {
          "type": "string",
          "fieldName": "noSearchFeatureTitle",
          "label": "No Search Feature Popup Title:",
          "tooltip": "Popup title when a feature in the search layer is not found"
        },
        {
          "type": "string",
          "fieldName": "noSearchFeatureMessage",
          "label": "No Search Feature Popup Message:",
          "tooltip": "Popup message when a feature in the search layer is not found",
          "stringFieldOption": "richtext"
        }
      ]
    },
    {
      "category": "Save Settings",
      "fields": [
        {
          "type": "boolean",
          "fieldName": "storeLocation",
          "label": "Store location",
          "tooltip": "Check this to store the location in a layer in the webmap"
        },
        {
          "type": "layerAndFieldSelector",
          "fields": [
            {
              "supportedTypes": [
                "esriFieldTypeString"
              ],
              "multipleSelection": false,
              "fieldName": "serviceRequestLayerAvailibiltyField",
              "label": "Field used to store the Yes or No value",
              "tooltip": "Field used to store the Yes or No value"
            }
          ],
          "layerOptions": {
            "supportedTypes": [
              "FeatureLayer"
            ],
            "geometryTypes": [
              "esriGeometryPoint"
            ]
          },
          "fieldName": "serviceRequestLayerName",
          "label": "Storage Layer Name",
          "tooltip": "Point layer used for to store request locations"
        },
        {
          "type": "string",
          "fieldName": "serviceRequestLayerAvailibiltyFieldValueAvail",
          "label": "Yes value",
          "tooltip": "Value to set when the request location intersects a lookup feature",
          "stringFieldOption": "text"
        },
        {
          "type": "string",
          "fieldName": "serviceRequestLayerAvailibiltyFieldValueNotAvail",
          "label": "No value",
          "tooltip": "Value to set when the request location does not intersects a lookup feature",
          "stringFieldOption": "text"
        },
        {
          "type": "string",
          "fieldName": "serviceRequestLayerAvailibiltyFieldValueNoSearch",
          "label": "No Search Layer feature value, only used when a search layer is specified",
          "tooltip": "Value to set when the location does not find a search feature.",
          "stringFieldOption": "text"
        }
      ]
    },
    {
      "category": "Popup Settings",
      "fields": [
        {
          "type": "string",
          "fieldName": "popupTitle",
          "label": "Popup Title",
          "tooltip": "Popup title when service information is available"
        },
        {
          "type": "number",
          "fieldName": "popupWidth",
          "label": "Popup Width",
          "tooltip": "Popup dialog width",
          "constraints": {
            "min": 0,
            "places": 0
          }
        },
        {
          "type": "number",
          "fieldName": "popupHeight",
          "label": "Popup Max Height",
          "tooltip": "Popup dialog max height",
          "constraints": {
            "min": 0,
            "places": 0
          }
        },
        {
          "type": "string",
          "fieldName": "serviceUnavailableTitle",
          "label": "Unavailable Popup Title:",
          "tooltip": "Popup title when outside an area"
        },
        {
          "type": "string",
          "fieldName": "serviceUnavailableMessage",
          "label": "Unavailable Popup Message:",
          "tooltip": "Popup message when outside an area",
          "stringFieldOption": "richtext"
        }
      ]
    },
    {
      "category": "App Settings",
      "fields": [
        {
          "type": "boolean",
          "fieldName": "showSplash",
          "label": "Display Splash Screen on Startup",
          "tooltip": "Check on if you want to display a splash screen at startup"
        },
        {
          "type": "string",
          "fieldName": "splashText",
          "label": "Splash Screen message",
          "tooltip": "Message to display when application is loaded",
          "stringFieldOption": "richtext"
        },
        {
          "type": "string",
          "fieldName": "theme",
          "tooltip": "Color schema for the splash screen",
          "label": "Splash Screen Theme:",
          "options": [
            {
              "label": "Black",
              "value": "black"
            },
            {
              "label": "Blue",
              "value": "blue"
            }
          ]
        },
        {
          "type": "boolean",
          "fieldName": "basemapWidgetVisible",
          "label": "Show the basemap selector button",
          "tooltip": "Check on if you want to display the basemap selector"
        }
      ]
    },
    {
      "category": "Search Settings",
      "fields": [
        {
          "type": "paragraph",
          "value": "Enable search to allow users to find a location or data in the map. Configure the search settings to refine the experience in your app by setting the default search resource, placeholder text, etc."
        },
        {
          "type": "boolean",
          "fieldName": "search",
          "label": "Enable search tool"
        },
        {
          "type": "search",
          "fieldName": "searchConfig",
          "label": "Configure search tool"
        }
      ]
    },
    {
      "category": "Custom URL Parameter",
      "fields": [
        {
          "type": "paragraph",
          "value": "Setup the app to support a custom url parameter. Only point layers are supported.  For example if your map contains a feature layer with parcel point information and you'd like to be able to find parcels using a url parameter you can use this section to do so. Select a layer and search field then define the name of a custom param. Once you've defined these values you can append the custom search to your application url using the custom parameter name you define. For example, if I set the custom param value to parcels a custom url would look like this index.html?parcel=3045"
        },
        {
          "placeHolder": "i.e. parcels",
          "label": "URL param name:",
          "fieldName": "customUrlParam",
          "type": "string",
          "tooltip": "Custom URL param name"
        },
        {
          "type": "layerAndFieldSelector",
          "fieldName": "customUrlLayer",
          "label": "Layer to search for custom url param value",
          "tooltip": "Url param search layer",
          "fields": [
            {
              "multipleSelection": false,
              "fieldName": "urlField",
              "label": "URL param search field",
              "tooltip": "URL param search field"
            }
          ],
          "layerOptions": {
            "supportedTypes": [
              "FeatureLayer"
            ]
                  }
        }
      ]
    }
  ],
  "values": {
    "serviceAreaLayerNames": "Service Area",
    "serviceAreaLayerNamesSelector": null,
    "popupTitle": "Service Information",
    "popupWidth": null,
    "popupHeight": null,
    "serviceUnavailableTitle": "Outside Utility Service Area",
    "serviceUnavailableMessage": "The utility does not provide service to the selected location",
    "zoomLevel": 16,
    "storeLocation": false,
    "serviceRequestLayerAvailibiltyFieldValueAvail": "Intersected",
    "serviceRequestLayerAvailibiltyFieldValueNotAvail": "Not Intersected",
    "showSplash": false,
    "splashText": "<center>Information Lookup is a configurable web application template that can be used to provide the general public, internal staff and other interested parties the with information about a location. If no features are found at that location, a general message is displayed. Optionally, the location entered can be stored in a point layer. The template can be configured using the ArcGIS Online Configuration dialog.</center>",
    "theme": "black",
    "basemapWidgetVisible": true,
    "search": true
  }
}