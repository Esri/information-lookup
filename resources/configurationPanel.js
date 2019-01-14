{
  "configurationSettings": [{
    "category": "General",
    "fields": [{
      "type": "paragraph",
      "value": "<font size='3'><b>Solution Configurations</b></font><br /><font size='3'>------------------------------------</font><br /><font size='2'>To see this application configured for an industry, visit the following configurations on <a target='_blank' href='http://solutions.arcgis.com'>solutions.ArcGIS.com</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/electric/help/SystemImprovement'>Electric System Improvement</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/water/help/SewerServiceLookup'>Sewer Service Lookup</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/water/help/WaterRestrictions'>Water Restrictions</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/utilities/gas/help/GasServiceLookup/'>Gas Service Lookup</a><br />&nbsp;-&nbsp;&nbsp;<a target='_blank' href='http://links.esri.com/localgovernment/help/10.2/FloodInquiry/'>Floodplain Inquiry</a></font>"
    }, {
      "type": "webmap",
      "label": "Select a map"
    }, {
      "type": "conditional",
      "condition": false,
      "fieldName": "showUI",
      "label": "Include a title and a title bar",
      "tooltip": "Adds a title bar to the app and enables a side panel.",
      "items": [{
        "type": "string",
        "fieldName": "title",
        "label": "Title Name:",
        "tooltip": "Title to show in the UI"
      }, {
        "type": "boolean",
        "fieldName": "popupSide",
        "label": "Show feature pop ups in the side panel",
        "tooltip": "The title bar must be enabled for this. Check on if you want to display the pop up details in a side panel."
      }, {
        "type": "string",
        "fieldName": "uidirection",
        "tooltip": "The side of the app for the side panel to be docked.",
        "label": "Pop up side:",
        "options": [{
          "label": "Left",
          "value": "left"
        }, {
          "label": "Right",
          "value": "right"
        }]
      }]
    }, {
      "type": "conditional",
      "condition": false,
      "fieldName": "showSplash",
      "label": "Display Splash Screen on Startup",
      "tooltip": "Check on if you want to display a splash screen at startup",
      "items": [{
        "type": "string",
        "fieldName": "splashText",
        "label": "Splash Screen message",
        "tooltip": "Message to display when application is loaded",
        "stringFieldOption": "richtext"
      }, {
        "type": "number",
        "fieldName": "splashWidth",
        "label": "Splash Screen Width",
        "tooltip": "Splash Screen width",
        "constraints": {
          "min": 0,
          "places": 0
        }
      }, {
        "type": "number",
        "fieldName": "splashHeight",
        "label": "Splash Screen Height",
        "tooltip": "Splash Screen height",
        "constraints": {
          "min": 0,
          "places": 0
        }
      }]
    }]
  }, {
    "category": "Theme",
    "fields": [{
      "type": "subcategory",
      "label": "App Theme"
    }, {
      "type": "color",
      "fieldName": "color",
      "tooltip": "Font color",
      "label": "Font color:",
      "sharedThemeProperty": "header.text"
    }, {
      "type": "color",
      "fieldName": "backcolor",
      "tooltip": "UI color",
      "label": "Theme Color:",
      "sharedThemeProperty": "header.background"
    }, {
      "type": "color",
      "fieldName": "hypercolor",
      "tooltip": "Hyperlink color",
      "label": "Hyperlink Color:",
      "sharedThemeProperty": "body.link"
    }, {
      "type": "string",
      "fieldName": "pageIcon",
      "label": "Logo Url:",
      "tooltip": "URL to the image to be used in the title bar, max size is 64x64",
      "sharedThemeProperty": "logo.small"
    }]
  }, {
    "category": "Options",
    "fields": [{
      "type": "boolean",
      "fieldName": "basemapWidgetVisible",
      "label": "Show the basemap selector",
      "tooltip": "Check this option if you would like to show the basemap selector"
    }, {
      "type": "subcategory",
      "label": "Data Collection Option"
    }, {
      "type": "conditional",
      "condition": false,
      "fieldName": "storeLocation",
      "label": "Store location",
      "tooltip": "Check this to store the location in a layer in the webmap",
      "items": [{
        "type": "layerAndFieldSelector",
        "fields": [{
          "editOnly": true,
          "supportedTypes": ["esriFieldTypeString"],
          "multipleSelection": false,
          "fieldName": "serviceRequestLayerAvailibiltyField",
          "label": "Field used to store the Yes or No value",
          "tooltip": "Field used to store the Yes or No value"
        }],
        "layerOptions": {
          "supportedTypes": ["FeatureLayer"],
          "geometryTypes": ["esriGeometryPoint"]
        },
        "fieldName": "serviceRequestLayerName",
        "label": "Storage Layer Name (Editable Feature Layer Only)",
        "tooltip": "Point layer used to store lookup locations"
      }, {
        "type": "string",
        "fieldName": "serviceRequestLayerAvailibiltyFieldValueAvail",
        "label": "Yes value",
        "tooltip": "Value to set when the request location intersects a lookup feature",
        "stringFieldOption": "text"
      }, {
        "type": "string",
        "fieldName": "serviceRequestLayerAvailibiltyFieldValueNotAvail",
        "label": "No value",
        "tooltip": "Value to set when the request location does not intersects a lookup feature",
        "stringFieldOption": "text"
      }]
    }]
  }, {
    "category": "Lookup Layer",
    "fields": [{
      "type": "paragraph",
      "value": "The following options allow you to add text to the beginning and end of the pop up when results are found.  These parameters are supported:<br />&nbsp; - {IL_SEARCHBY} pop up from the search by layer.<br />&nbsp; - {&lt;FieldName&gt;} for a field from the search by layer<br />&nbsp; - {&lt;LayerName&gt;} for a count of the features from each look up layer.<br />&nbsp; - {IL_LAT}, {IL_LONG}, {IL_XCOORD}, {IL_YCOORD} for coordinates from the lookup location, the centroid is used a line or polygon"
    }, {
      "type": "string",
      "fieldName": "popPreMessage",
      "label": "Beginning Text",
      "tooltip": "Text to add to the beginning of the results",
      "stringFieldOption": "richtext"
    }, {
      "type": "string",
      "fieldName": "popPostMessage",
      "label": "Ending Text",
      "tooltip": "Text to add to the end of the results",
      "stringFieldOption": "richtext"
    }, {
      "label": "Max Zoom level for lookup",
      "fieldName": "zoomLevel",
      "type": "number",
      "constraints": {
        "min": 0,
        "places": 0
      },
      "tooltip": "Sets the max auto zoom level for the map after a lookup"
    }, {
      "label": "Lookup Layers",
      "fieldName": "serviceAreaLayerNamesSelector",
      "type": "multilayerandfieldselector",
      "tooltip": "Polygon Layers used for combined popup",
      "layerOptions": {
        "supportedTypes": ["FeatureLayer", "FeatureCollection", "MapServiceLayer"],
        "geometryTypes": ["esriGeometryPolygon", "esriGeometryPolyline", "esriGeometryPoint"]
      }
    }, {
      "label": "Search Tolerance",
      "fieldName": "searchTol",
      "type": "number",
      "constraints": {
        "min": 0,
        "places": 0
      },
      "tooltip": "Set the search area around the map click"
    }, {
      "label": "Point on Point Distance",
      "fieldName": "pointOverlap",
      "type": "number",
      "constraints": {
        "min": 0,
        "places": 0
      },
      "tooltip": "Set the maximum planar distance a map click or search by location will match a point in the search by layer.  The search tolerence is first used to find matching locations, this will further refine the results."
    }, {
      "type": "options",
      "fieldName": "pointOverlapUnit",
      "tooltip": "The Point on Point Distance unit.",
      "label": "Point on Point Distance Unit:",
      "options": [{
        "label": "Meters",
        "value": "meters"
      }, {
        "label": "Feet",
        "value": "feet"
      }, {
        "label": "Kilometers",
        "value": "kilometers"
      }, {
        "label": "Miles",
        "value": "miles"
      }]
    }]
  }, {
    "category": "Search By Layer",
    "fields": [{
      "type": "paragraph",
      "value": "By default, a mouse click or location found from the search box is used to lookup information in the lookup layer.  If you would like to search for a feature using the search box, configure it in the Search Settings tab.  If you would like to use a feature from another layer to look up information in the lookup layer, fill out the following parameters to declare a search layer.  Optionally, specify a url parameter that can be used to find a feature from the search layer when the app loads.  Note: this only supports feature layers."
    }, {
      "placeHolder": "i.e. parcels",
      "label": "URL param name:",
      "fieldName": "searchByLayerUrlParam",
      "type": "string",
      "tooltip": "Custom URL param name for Search By Layer"
    }, {
      "type": "layerAndFieldSelector",
      "fields": [{
        "supportedTypes": ["esriFieldTypeInteger", "esriFieldTypeSmallInteger", "esriFieldTypeDouble", "esriFieldTypeSingle", "esriFieldTypeString", "esriFieldTypeDate", "esriFieldTypeGeometry", "esriFieldTypeOID", "esriFieldTypeGlobalID", "esriFieldTypeGUID"],
        "geometryTypes": ["esriGeometryPolygon", "esriGeometryPolyline", "esriGeometryPoint"],
        "multipleSelection": false,
        "fieldName": "urlField",
        "label": "URL param search field",
        "tooltip": "URL param search field"
      }],
      "layerOptions": {
        "supportedTypes": ["FeatureLayer", "FeatureCollection"]
      },
      "fieldName": "searchByLayer",
      "label": "Search by layer",
      "tooltip": "Layer to search for features to lookup intersecting layers"
    }, {
      "type": "boolean",
      "fieldName": "onlySearchFeature",
      "label": "Limit lookup results to search feature.",
      "tooltip": "Only include the search feature in the results if the search layer is included in the lookup layers.  This option is useful when you have overlapping features in the same layer and you only want to show the feature clicked or searched on."
    }, {
      "type": "boolean",
      "fieldName": "checkSize",
      "label": "Check size of overlap",
      "tooltip": "Check the amount of overlap of the searched results from the lookup layer with the search features geometry. This option is useful when you have polygons that share boundaries."
    }, {
      "label": "Minimum polygon overlap area",
      "fieldName": "minPolygonSize",
      "type": "number",
      "constraints": {
        "min": -1,
        "places": 2
      },
      "tooltip": "The minimum size of the overlap of polygons in the results.  Only valid when Check size of overlap is enabled"
    }, {
      "label": "Minimum line length",
      "fieldName": "minLineSize",
      "type": "number",
      "constraints": {
        "min": -1,
        "places": 2
      },
      "tooltip": "The minimum size of the overlap of lines in the results.  Only valid when Check size of overlap is enabled"
    }, {
      "type": "string",
      "fieldName": "noSearchFeatureTitle",
      "label": "No Search Feature Found Popup Title:",
      "tooltip": "Popup title when a feature in the search layer is not found"
    }, {
      "type": "string",
      "fieldName": "noSearchFeatureMessage",
      "label": "No Search Feature Found Popup Message:",
      "tooltip": "Popup message when a feature in the search layer is not found",
      "stringFieldOption": "richtext"
    }, {
      "type": "string",
      "fieldName": "serviceRequestLayerAvailibiltyFieldValueNoSearch",
      "label": "No Search Layer feature value, only used when a search layer is specified",
      "tooltip": "Value to set when the location does not find a search feature.",
      "stringFieldOption": "text"
    }]
  }, {
    "category": "Popup",
    "fields": [{
      "type": "string",
      "fieldName": "popupTitle",
      "label": "Popup Title",
      "tooltip": "Popup title when service information is available"
    }, {
      "type": "number",
      "fieldName": "popupWidth",
      "label": "Popup Width",
      "tooltip": "Popup dialog width",
      "constraints": {
        "min": 0,
        "places": 0
      }
    }, {
      "type": "number",
      "fieldName": "popupHeight",
      "label": "Popup Max Height",
      "tooltip": "Popup dialog max height",
      "constraints": {
        "min": 0,
        "places": 0
      }
    }, {
      "type": "boolean",
      "fieldName": "linksInPopup",
      "label": "Email and Link option in the pop up",
      "tooltip": "Replace the zoom to with email and link buttons."
    }, {
      "type": "boolean",
      "fieldName": "linksInPopupSide",
      "label": "Email and Link option on the side panel pop up",
      "tooltip": "Add email and link buttons on the side panel."
    }, {
      "type": "string",
      "fieldName": "serviceUnavailableTitle",
      "label": "Outside Lookup Layer Popup Title:",
      "tooltip": "Popup title when a found search location does not fall within a lookup layer area"
    }, {
      "type": "string",
      "fieldName": "serviceUnavailableMessage",
      "label": "Outside Lookup Layer Popup Message:",
      "tooltip": "Popup message when a found search location does not fall within a lookup layer area",
      "stringFieldOption": "richtext"
    }, {
      "type": "boolean",
      "fieldName": "orientForMobile",
      "label": "Center popup for mobile screens",
      "tooltip": "Offset the map on mobile devices so that the popup is centerd on the screen."
    }]
  }, {
    "category": "Search",
    "fields": [{
      "type": "subcategory",
      "label": "Search Settings"
    }, {
      "type": "paragraph",
      "value": "Enable search to allow users to find a location or data in the map. Configure the search settings to refine the experience in your app by setting the default search resource, placeholder text, etc."
    }, {
      "type": "boolean",
      "fieldName": "search",
      "label": "Enable search tool"
    }, {
      "type": "search",
      "fieldName": "searchConfig",
      "label": "Configure search tool"
    }, {
      "type": "subcategory",
      "label": "Custom URL Parameter"
    }, {
      "type": "paragraph",
      "value": "Setup the app to support a custom url parameter.  For example if your map contains a feature layer with parcel information and you'd like to be able to find parcels using a url parameter you can use this section to do so. Select a layer and search field then define the name of a custom param. Once you've defined these values you can append the custom search to your application url using the custom parameter name you define. For example, if I set the custom param value to parcels a custom url would look like this index.html?parcel=3045"
    }, {
      "placeHolder": "i.e. parcels",
      "label": "URL param name:",
      "fieldName": "customUrlParam",
      "type": "string",
      "tooltip": "Custom URL param name"
    }, {
      "type": "layerAndFieldSelector",
      "fieldName": "customUrlLayer",
      "label": "Layer to search for custom url param value",
      "tooltip": "Url param search layer",
      "fields": [{
        "multipleSelection": false,
        "fieldName": "urlField",
        "label": "URL param search field",
        "tooltip": "URL param search field"
      }],
      "layerOptions": {
        "supportedTypes": ["FeatureLayer"]
      }
    }]
  }],
  "values": {
    "serviceAreaLayerNames": "Service Area",
    "serviceAreaLayerNamesSelector": null,
    "popupTitle": "Service Information",
    "popupWidth": null,
    "popupHeight": null,
    "serviceUnavailableTitle": "Outside Service Area",
    "serviceUnavailableMessage": "No information is available at the selected location.",
    "noSearchFeatureTitle": "No Search Feature Found",
    "noSearchFeatureMessage": "A search feature used to lookup information was not found.  Please select a new location.",
    "zoomLevel": 18,
    "storeLocation": false,
    "serviceRequestLayerAvailibiltyFieldValueAvail": "Intersected",
    "serviceRequestLayerAvailibiltyFieldValueNotAvail": "Not Intersected",
    "serviceRequestLayerAvailibiltyFieldValueNoSearch": "No Search Feature",
    "showSplash": false,
    "splashText": "<center>Information Lookup is a configurable web application template that can be used to provide the general public, internal staff and other interested parties the with information about a location. If no features are found at that location, a general message is displayed. Optionally, the location entered can be stored in a point layer. The template can be configured using the ArcGIS Online Configuration dialog.</center>",
    "basemapWidgetVisible": true,
    "search": true,
    "title": "Information Lookup",
    "color": "#FFFFFF",
    "backcolor": "#000000",
    "hypercolor": "#0000EE",
    "uidirection": "left",
    "splashHeight": 350,
    "splashWidth": 290,
    "showUI": false,
    "popupSide": false,
    "popPostMessage": "",
    "popPreMessage": "",
    "orientForMobile": false,
    "linksInPopup": false,
    "linksInPopupSide": true,
    "minLineSize": 1,
    "minPolygonSize": 5,
    "checkSize": false,
    "onlySearchFeature": false,
    "searchTol": 4,
    "pointOverlap": 40,
    "pointOverlapUnit": "feet"
  }
}