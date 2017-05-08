/*
Orignally based on
https://github.com/MatthewBarker/leaflet-wikipedia
with significant modifications by http://bjohas.de.
See https://github.com/bjohas/overpass-ide
*/
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['leaflet', 'browser-jsonp'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'), require('browser-jsonp'));
  } else {
    root.L = factory(root.L, root.JSONP);
  }
}(this, function(L, JSONP) {
/*global L, JSONP*/

'use strict';

/**
    Initialises a new instance of the L.Icon.WikipediaIcon class.
    The image is taken from here:
    {@link http://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Tango_style_Wikipedia_Icon.svg/40px-Tango_style_Wikipedia_Icon.svg.png }
    @class WikipediaIcon
*/
L.Icon.WikipediaIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/wikipedia-icon.png',
        iconRetinaUrl: 'images/wikipedia-icon-2x.png',
        iconSize: [20, 20],
        popupAnchor: [0, -20]
    }
});
//        iconSize: [40, 40],         iconSize: [25, 41],
/**
    Creates a new Wikipedia icon.
    @method wikipediaIcon
    @returns {module:wikipedia-layer~WikipediaIcon} A new Wikipedia icon.
*/
L.icon.wikipediaIcon = function () {
    return new L.Icon.WikipediaIcon();
};

/**
    A Wikipedia layer group for leaflet.
    @class WikipediaLayer
    @param {Object} [options] - These layer options are merged with the default options
    @param {string} [options.url='https://en.wikipedia.org/'] - The URL for Wikipedia
    @param {number} [options.limit=100] - The maximum number of search results to return
    @param {Boolean} [options.popupOnMouseover=false] - If true then the popup will open on mouse over; otherwise it won't
    @param {Boolean} [options.clearOutsideBounds=false] - If true then markers outside the current map bounds will be removed; otherwise they won't
    @param {string} [options.target='_self'] - specifies where to open the linked Wikipedia page
    @param {string} [options.images='images/'] - specifies the folder that contains the Wikipedia icon images
    @param {number} [options.minZoom='0'] - minimum zoom number
    @param {number} [options.maxZoom='18'] - maximum zoom number
*/
L.LayerGroup.WikipediaLayer = L.LayerGroup.extend(
    /** @lends module:wikipedia-layer~WikipediaLayer */
    {
        /**
            Query string fragment to use when linking to a Wikipedia page.
            @constant
            @default
            @private
        */
        PAGE: '?curid=',
        /**
            URL fragment to use when connecting to the API.
            @constant
            @default
            @private
        */
        API: 'w/api.php',
        /**
            Default layer options.
            @default
            @private
        */
        options: {
            url: 'https://en.wikipedia.org/',
	    lang: "en",
            limit: 100,
	    query : '',
            popupOnMouseover: false,
            clearOutsideBounds: false,
            target: '_self',
            images: 'images/',
            minZoom: 0,
            maxZoom: 18
        },
        /**
            Create the layer group using the passed options.
            @param {Object} options
            @private
        */
        initialize: function (options) {
            options = options || {};
            L.Util.setOptions(this, options);

            if (this.options.images.indexOf('/', this.options.images.length - 1) === -1) {
                this.options.images += '/';
            }

            this._layers = {};
        },
        /**
            Store a reference to the map and call the requestData() method.
            @private
        */
        onAdd: function (map) {
            map.on('moveend', this.requestData, this);
            this._map = map;
            this.requestData();
        },
        /**
            Remove the 'moveend' event listener and clear all the markers.
            @private
        */
        onRemove: function (map) {
            map.off('moveend', this.requestData, this);
            this.clearLayers();
            this._layers = {};
        },
        requestNewURL: function (lang,url) {
            this.clearLayers();
            this._layers = {};
	    this.options.url = url;
	    this.options.lang = lang;
	    if (document.getElementById("language")) {
		document.getElementById("language").innerHTML = lang;
	    };
	    this.requestData();
	},
        /**
            Send a query request for JSONP data.
            @private
        */
        requestData: function () {
            var zoom = this._map.getZoom(),
                origin = this._map.getCenter(),
                data = {
                    format: 'json',
                    action: 'query',
                    list: 'geosearch',
                    gslimit: this.options.limit,
                    gsradius: this.getRadius(),
                    gscoord: origin.lat + '|' + origin.lng
                },
                self = this;

	    if (this.options.query != "") {
		var customquery = this.options.query;
		customquery = customquery.replace("__RADIUS__",this.getRadius());
		customquery = customquery.replace("__LOCATION__",'"'+origin.lat + '|' + origin.lng+'"');
		console.log("Custom query: "+customquery);
		try {
		    data = JSON.parse(customquery);
		} catch(err) {
		    alert("Custom query failed. "+err);
		    console.log("Custom query failed. "+err);
		}
	    }

	    try {
	    // document.getElementById('messages').appendChild(document.createTextNode("WP: "+this.options.url + this.API));
		var query = "";
		for(var index in data) { 
		    if (index === "format") {
		    } else {
			query = query + index + "=" + data[index] + "&";
		    }
		}
		var fullurl = this.options.url + this.API + "?" + query;
		console.log("WP: "+ fullurl);
		fullurl = fullurl.replace("format=json","");
		if (document.getElementById("apiquery")) 
		    document.getElementById("apiquery").href = fullurl;
		if (document.getElementById("radius").innerHTML)
		    document.getElementById("radius").innerHTML = parseInt(this.getRadius());
	    } catch(err) {
		console.log("Oops.");
	    };
            if (zoom >= this.options.minZoom && zoom <= this.options.maxZoom) {
                JSONP({
                    url: this.options.url + this.API,
                    data: data,
                    success: function (response) { self.parseData(response); }
                });
            } else {
                this.clearLayers();
                this._layers = {};
            }
        },
        /**
            Create a new marker.
            @param {Object} result - JSON data
            @return {L.marker} The new marker.
            @private
        */
        getMarker: function (result) {
	    var lat = 0, lon=0;
	    if (result.lat) {
		// result from list=geosearch
		lat = result.lat;
		lon = result.lon;
	    } else {
		// result from generator=geosearch
		lat = result.coordinates[0].lat;
		lon = result.coordinates[0].lon;
	    }
            var icon = new L.Icon.WikipediaIcon({
                    iconUrl: this.options.images + 'wikipedia-icon.png',
                    iconRetinaUrl: this.options.images + 'wikipedia-icon-2x.png'
                }),	    
                marker = L.marker([lat, lon], { icon: icon }),
                href = this.options.url + this.PAGE + result.pageid,
                popup = '<a href="' + href + '" target="' + this.options.target + '">' + result.title + '</a>';

	    try {

		if (result.terms) {
		    var mytext = result.terms.description;
		    popup = popup.concat("<br>"+mytext); 
		} else {
		    popup = popup.concat("<br>(No description.)");
		}		
		popup = popup.concat("<br>"); 
		if (result.thumbnail) {
		    popup = popup.concat("<img height=\""+result.thumbnail.height+"\" width=\""+result.thumbnail.width+"\" src=\""+result.thumbnail.source+"\">"); 
		}
		popup = popup.concat("<ul>"); 
		var mylang = this.options.lang;
		if (mylang != "data") {
		    var link = "<a href=\"http://"+mylang+".wikipedia.org/wiki/"+result.title+"\">"+mylang+":"+result.title+"</a>";
		    popup = popup.concat("<li>"+link+"</li>"); 
		}
		if (result.langlinks) {
		    var index = 0;
		    for (index; index < result.langlinks.length; index += 1) {
			var mylang = result.langlinks[index].lang;
			var mytext = result.langlinks[index]['*'];
			var link = "<a href=\"http://"+mylang+".wikipedia.org/wiki/"+mytext+"\">"+mylang+":"+mytext+"</a>";
			popup = popup.concat("<li>"+link+"</li>"); 
		    }
		} else {
		    //		    popup = popup.concat("<br>No langlinks.");
		}
		popup = popup.concat("</ul>"); 
		if (mylang != "data") {
		    if (result.pageprops) {
			var mytext = result.pageprops.wikibase_item;
			var link = "<a href=\"http://www.wikidata.org/wiki/"+mytext+"\">"+mytext+"</a>";
			popup = popup.concat("<br>Wikidata: "+link); 
		    } else {
			popup = popup.concat("<br>No wikidata.");
		    }
		}
	    } catch(err) {
		popup = popup.concat("No further values."); 
	    }

            marker.bindPopup(popup);

            if (this.options.popupOnMouseover) {
                marker.on('mouseover', function (event) {
                    event.target.openPopup();
                });
            }

            return marker;
        },
        /**
            Add a marker by calling the addMarker() method.
            @param {Object} result - JSON data
            @private
        */
        addMarker: function (result) {
            var marker = this.getMarker(result),
                key = result.pageid;

            if (!this._layers[key]) {
                this._layers[key] = marker;
                this.addLayer(marker);
            }
        },
        /**
            Parse the response data and call the addMarker() method for each result.
            @param {Object} response - JSON data
            @private
        */
        parseData: function (response) {
	    var results = {};
	    var length = 0;
	    var retrieved = 0;
	    if (response.query) {
		if (response.query.geosearch) {
		    results = response.query.geosearch;
		    length = results.length;
		    // retrieved = length + 1;
		    console.log("Mode geosearch: Retrieved "+retrieved+" items.");
		    var index = 0;
		    for (index; index < length; index += 1) {
			if (results[index].lat) {
			    retrieved++;
			    this.addMarker(results[index]);
			}
		    }
		} else {
		    results = response.query.pages;
		    for (var prop in results) {
			if (results[prop].coordinates) {
			    retrieved++;
			    this.addMarker(results[prop]);
			}
		    }
		    console.log("Mode geosearch generator: Retrieved "+retrieved+" items.");
		}
	    }
	    if ( document.getElementById("elements"))
		document.getElementById("elements").innerHTML = retrieved;

            if (this.options.clearOutsideBounds) {
                this.clearOutsideBounds();
            }
        },
        /**
            Get the radius for the Wikipedia search based on the current map bounds.
            This is limited to the maximum supported by the API, which is 10000.
            @return {number} The radius to search.
            @private
        */
        getRadius: function () {
            var bounds = this._map.getBounds(),
                northWest = bounds.getNorthWest(),
                southEast = bounds.getSouthEast(),
                radius = northWest.distanceTo(southEast) / 2;

            return radius > 10000 ? 10000 : radius;
        },
        /**
            Clear all markers currently outside the map bounds.
            @private
        */
        clearOutsideBounds: function () {
            var bounds = this._map.getBounds(),
                latLng,
                key;

            for (key in this._layers) {
                if (this._layers.hasOwnProperty(key)) {
                    latLng = this._layers[key].getLatLng();

                    if (!bounds.contains(latLng)) {
                        this.removeLayer(this._layers[key]);
                        delete this._layers[key];
                    }
                }
            }
        }
    }
);

/**
    Creates a new Wikipedia layer.
    @method wikipediaLayer
    @returns {module:wikipedia-layer~WikipediaLayer} A new Wikipedia layer.
*/
L.layerGroup.wikipediaLayer = function (options) {
    return new L.LayerGroup.WikipediaLayer(options);
};

return L;
}));
