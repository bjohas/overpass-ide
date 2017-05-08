// mwapisetup module
if (typeof turbo === "undefined") turbo={};
turbo.mwapisetup = function() {
  var cache = {};

  var mwapisetup = {};

  function request(search, callback) {
    // ajax (GET) request to mwapisetup
    $.ajax("https://mwapisetup.openstreetmap.org/search"+"?X-Requested-With="+configs.appname, {
      data:{
        format:"json",
        q: search
      },
      success: function(data) {
        // hacky firefox hack :( (it is not properly detecting json from the content-type header)
        if (typeof data == "string") { // if the data is a string, but looks more like a json object
          try {
            data = JSON.parse(data);
          } catch (e) {}
        }
        cache[search] = data;
        callback(undefined,data);
      },
      error: function() {
        var err = "An error occured while contacting the osm search server mwapisetup.openstreetmap.org :(";
        console.log(err);
        callback(err,null);
      },
    });
  }

  mwapisetup.init = function(ide, instructions) {
      console.log("Wikipedia API layer.");
      console.log('3' + instructions);
      instructions = instructions.replace(/^\s+/, "").replace(/\s+$/, "");
      var result = instructions.split(";");
      var wikipedialanguage = "de";
      if (result[0]) {
      var wikipedialanguage = result[0];
      }
      //      var wikipediaquery = '{"action":"query","prop":"coordinates|pageimages|pageterms|langlinks|pageprops","ppprop":"wikibase_item","colimit":"max","coprimary":"all","piprop":"thumbnail","pithumbsize":"144","pilimit":"max","lllimit":"max","wbptterms":"description","generator":"categorymembers","gcmlimit":"max","gcmtitle":"Kategorie:Ur-_und_Fr%C3%BChgeschichte_(Menorca)","format":"json"}';
      var cat1 = '{"action":"query","prop":"coordinates|pageimages|pageterms|langlinks|pageprops","ppprop":"wikibase_item","colimit":"max","coprimary":"all","piprop":"thumbnail","pithumbsize":"144","pilimit":"max","lllimit":"max","wbptterms":"description","generator":"categorymembers","gcmlimit":"max","gcmtitle":"';
      var cat2 = '","format":"json"}';
      var geosearch = '{"action":"query","prop":"coordinates|pageimages|pageterms|langlinks|pageprops","ppprop":"wikibase_item","colimit":"max","coprimary":"all","piprop":"thumbnail","pithumbsize":"144","pilimit":"max","lllimit":"max","wbptterms":"description","generator":"geosearch","ggscoord":__LOCATION__,"ggsradius":__RADIUS__,"ggslimit":"max","format":"json"}';
      if (result[1]) {
	  if (result[1] == "category") {
	      if (result[2]) {
		  wikipediaquery = cat1 + result[2] + cat2;
	      } else {
		  wikipediaquery = geosearch;
	      };
	  } else if (result[1] == "geosearch") {
	      wikipediaquery = geosearch;
	  } else {
	      wikipediaquery = geosearch;
	  };
      }
      console.log("WP Language: " + wikipedialanguage);
      console.log("WP Query: " + wikipediaquery);
      var wpuri = 'https://'+wikipedialanguage+'.wikipedia.org/';
      if (wikipedialanguage == "data") {
	  wpuri = 'https://www.wikidata.org/';
      };
      // Add Wikipedia layer                                                                                                                                                
      var WPL = new L.layerGroup.wikipediaLayer({
	      target: '_blank',
	      url: wpuri,
	      query: decodeURIComponent(wikipediaquery),
	      popupOnMouseover : true,
	      images: 'extra_images'
	  });
      WPL.addTo(ide.map);
      try {
      document.getElementById("wikiSearch_DATA").addEventListener("click", function() {
	      WPL.requestNewURL("data","https://www.wikidata.org/");
	  }, false);
      document.getElementById("wikiSearch_EN").addEventListener("click", function() {
	      WPL.requestNewURL("en","https://en.wikipedia.org/");
	  }, false);
      document.getElementById("wikiSearch_DE").addEventListener("click", function() {
	      WPL.requestNewURL("de","https://de.wikipedia.org/");
	  }, false);
      document.getElementById("wikiSearch_CA").addEventListener("click", function() {
	      WPL.requestNewURL("ca","https://ca.wikipedia.org/");
	  }, false);
      document.getElementById("wikiSearch_ES").addEventListener("click", function() {
	      WPL.requestNewURL("es","https://es.wikipedia.org/");
	  }, false);
      } catch(err) {
	  console.log('Error in link assignment: '+err);
      }
    return mwapisetup;
  };

  return mwapisetup;
};
