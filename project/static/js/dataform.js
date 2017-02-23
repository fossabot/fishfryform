/*
(function() {
    
}).call(this);
*/

var map = new L.Map('map', {
  center: [40.440734,-80.0091294],
  zoom: 10
});

function makeMap() {

  /*L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
    attribution: 'Stamen'
  }).addTo(map);
  */
  L.tileLayer(
    //'http://{s}.sm.mapstack.stamen.com/((toner-lite,$000%5B@80%5D,$8ad3f4%5Bhsl-color%5D,mapbox-water%5Bdestination-in%5D),(toner,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D),(toner-hybrid,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D),(terrain-background,$000%5B@40%5D,$ffffff%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D)%5Blighter@40%5D)/{z}/{x}/{y}.png',
    //'http://{s}.sm.mapstack.stamen.com/((terrain-background,$000[@30],$fff[hsl-saturation@80],$b2c4cc[hsl-color],mapbox-water[destination-in]),(watercolor,$fff[difference],$808080[hsl-color],mapbox-water[destination-out]),(terrain-background,$000[@40],$ffffff[hsl-color],mapbox-water[destination-out])[screen@60],(streets-and-labels,$fedd9a[hsl-color])[@50])/{z}/{x}/{y}.png',
    'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    {
    maxZoom: 18,
    attribution: 'Tiles via <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> license. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.',
    }
  ).addTo(map);
  
  // Adjust the map to zoom to the feature
  cartodb.createLayer(map, 'https://christianbgass.carto.com/api/v2/viz/bbab7804-df59-11e6-925f-0e05a8b3e3d7/viz.json')
    .addTo(map)
    .on('done', function(layer){
        layer.setInteraction(true);
        layer.on('featureClick', function(e, latlng, pos, data) {
          //cartodb.log.log(e, latlng, pos, data);
          cartodb.log.log(latlng, data);
        });
        layer.on('error', function(err) {
          cartodb.log.log('error: ' + err);
        });
    })
    .on('error', function(err) {
      alert("An error occurred: " + err);
    });
    return map;
}

/******************************************************************************/

/**
 * FishFryFormClass - class for every venue on the Fish Fry Form. Inherits from
 * ServiceKeys class
 * @class
 */

function FishFryFormClass() {
  /**
   * CARTO fish fry venues table id
   * @type number
   */
  this.cartodb_id = null;
  
  /**
   * a UUID, generated by the server
   * Used to keep track of records independently, to workaround limitations of
   * the CARTO SQL API
   */
  this.uuid = null;

  /**
   * Venue Details
   */

  // "type": "string"
  this.venue_name = "";
  // "type": "string"
  this.venue_type = "";
  // "type": "string"
  this.venue_notes = "";
  // "type": "string"
  this.website = "";
  // "type": "string"
  this.email = "";
  // "type": "string"
  this.phone = "";

  /**
   * Venue Address - used for geocoding and directions
   * @type string
   * @example 10 Main Street Pittsburgh PA
   */
  this.venue_address = "";

  /**
   * geometry
   * @type geometry
   */
  //"type": "geometry"
  this.the_geom = null;

  /**
     * Event Dates/Times object (dictionary): temporary structure for storing
     * event dates and times with a UUID, to facilitate adding/removing.
     * The "event_uuid_string" placeholder is not persisted outside of the
     * current class instance.
     * @example
     * {
     *   "event_uuid_string": {
     *      "dt_start": "2017-03-21T15:00:00Z",
     *      "st_end": "2017-03-21T19:00:00Z",
     *   },
     *   "event_uuid_string": {
     *      ...
         },
     *   ...
     * }
     */
  this.events = {};

  /**
   * Event Parameters
   */
  //"type": "boolean"
  this.homemade_pierogies = null;
  //"type": "boolean"
  this.lunch = null;
  // "type": "boolean"
  this.handicap = null;
  // "type": "boolean"
  this.take_out = null;
  // "type": "boolean"        
  this.alcohol = null;
  // "type": "string"
  this.menu = "";
  // "type": "string"
  this.etc = "";

  /**
   * ash wed flag - auto populated
   * @type boolan
   */
  //this.ash_wed = null;
  /**
   * good friday flag - auto populated
   * @type boolan
   */
  //this.good_fri = null;

  /**
   * Data validation flag - set to true through fishfryform
   * @type boolean
   */
  this.validated = false;

  /**
   * Data publication flag - set to true through fishfryform admin or in DB directly, once validated
   * @type boolean
   * @private
   */
  this.publish = false;
}


/**
 * FishFryForm Class loadJSON method: loads a record from the a GeoJSON
 * feature into the this class.
 */
FishFryFormClass.prototype.loadJSON = function(fishfry_json) {
  var self = this;
  // push attributes in
  var properties = fishfry_json.properties;
  for (var p in properties) {
    if (properties.hasOwnProperty(p)) {
      self[p] = properties[p];
    }
  }
  // push geometry in
  self.the_geom = fishfry_json.geometry;
};

/**
 * FishFryForm Class loadJSON method: pushes class properties to form elements.
 * This assumes that form elements have and an id that corresponds to property
 * names.
 *
 * For forms with predefined value ranges, it maps values from class to those
 * used in the form. e.g., alcohol=true : "Yes"
 */
FishFryFormClass.prototype.pushToForm = function() {
  /* for each property in the fish fry json, we are going to auto-update the
   * value in the corresponding form field
   */
  var self = this;
  var boolean_lookup = {
    'true': 'Yes',
    'false': 'No',
    'null': 'Unsure / N/A',
    '': 'Unsure / N/A'
  };
  for (var p in self) {
    if (self.hasOwnProperty(p)) {
      //console.log(p + ": " + self[p]);

      /* skip some properties - some don't have corresponding fields, some we
       * deal with separately
       */
      if ($.inArray(p, ['cartodb_id', 'events', 'ash_wed', 'good_fri', 'validated', 'publish', 'the_geom', 'uuid']) == -1) {
        // handle boolean values with a lookup to get text for dropdowns
        if ($.inArray(p, ['alcohol', 'lunch', 'homemade_pierogies', 'handicap', 'take_out']) != -1) {
          {
            $("#" + p).val(boolean_lookup[self[p]]);
          }
        // handle boolean values for checkboxed attributes
        } else if ($.inArray(p, ['publish', 'validated']) != -1) {
          var b = {'true':true,'false':false, 'null':false,'':false};
          $("#" + p).prop('checked', b[self[p]]);
        //everything else is text
        } else {
          $("#" + p).val(self[p]);
        }
      }
    }
  }
};


/**
 * FishFryForm Class pushToFormEvents method - push events recorded in events
 * property to the form by constructing a list. Also utilized by daterangepicker.
 * Utilizes momentjs for datetime parsing
 */
FishFryFormClass.prototype.pushToFormEvents = function() {
  var self = this;
  // update the datetime list; clear it out first
  $("#events").empty();
  // (future - check UUIDs and add/remove based on matching)
  // assemble a new one and 
  $.each(self.events, function(k, v) {

    //convert date/time to readable format (only for display; class value remains)
    var event_start = moment(v.dt_start).format('YYYY-MM-DD HH:mm');
    var event_end = moment(v.dt_end).format('YYYY-MM-DD HH:mm');

    // write UUID as element ID field; used to manage updates.
    var event_dt_li = '<li class="list-group-item" id="' + k + '"><div class="form-group"><div class="input-group">';
    // add start and end time to the list
    event_dt_li += '<input disabled="disabled" type="text" class="form-control" value="' + event_start + '&mdash;' + event_end + '">';
    event_dt_li += '<span class="input-group-btn"><button name="remove_dt" id="' + k + '"class="btn btn-danger" type="button"><span class="glyphicon glyphicon-remove" aria-hidden="true"></button></span>';
    event_dt_li += '</div></div></li>';

    // ADD RESULT TO PAGE ELEMENT
    $("#events").append(event_dt_li);

    // bind a remove function (rm datetime from list on "X" button click)
    $("button[id='" + k + "']").bind('click', function() {
      // remove the UI item
      $(this).closest(".list-group-item").remove();
      // remove the class item
      console.log("Removed " + JSON.stringify(self.events[k]) + " from events list.");
      delete self.events[k];

    });
  });
  //console.log(self.events);
};

/**
 * geocode function
 * submit to geocoder and provide feedback to user for errors
 * this is using Mapzen Search, but could be any geocoder
 */
FishFryFormClass.prototype.geocode = function() {
  //assign this class instance to self
  var self = this;
  // if value is something:
  if (self.venue_address !== null) {
    // submit value to geocoder service
    return $.ajax({
      url: "https://search.mapzen.com/v1/search",
      data: {
        "api_key": "search-AxvxH8H",
        "text": self.venue_address,
        "focus.point.lat": 40.4417157,
        "focus.point.lon": -80.0111941
      },
      cache: false,
      type: "GET",
      success: function(response) {
        //response from mapzen is an extended geojson spec
        self.the_geom = response.features[0].geometry; //.features[0].geometry.coordinates;
        console.log("ajax geocode success");
        console.log(self.the_geom.coordinates);
      },
      error: function(xhr) {
        console.log(xhr);
      }
    });

  } else {
    alert("You must provide an address");
  }
};

/**
 * FishFryForm Class readFromForm method: reads form data into the class. Basically
 * the same as pushToForm, but instead of writing to form, uses property names
 * to get form values, then writes them back to the class.
 * This could potentially be run by an event listener on all the form fields,
 * so that the class is always updated.
 */
FishFryFormClass.prototype.readFromForm = function() {

  var self = this;
  var boolean_lookup = {
    'Yes': true,
    'No': false,
    'Unsure / N/A': null,
    '': null
  };
  /* run the geocoder if the user hasn't.
  var geocoded;
  if (!self.the_geom) {
    geocoded = self.geocode();
  } else {
    geocoded = self.the_geom;
  }
  */
  
  //$.when(geocoded).done(function() {
    for (var p in self) {
      if (self.hasOwnProperty(p)) {
  
        /* skip some properties - some don't have corresponding fields, some we
         * deal with separately:
         * - events are updated through the daterangepicker functions
         * - validated and published are handled in a modal as part of a
         * confirmation workflow
         * - cartodb_id and uuid aren't entered by the user
         * - ash_wed and good_fri are booleans but aren't being used right now
         * (they could be autodetected based on the event dates)
         * 
         */
        if ($.inArray(p, ['uuid', 'cartodb_id', 'events', 'ash_wed', 'good_fri', 'validated', 'publish', 'the_geom']) == -1) {
          // handle boolean values with a lookup to get text for dropdowns 
          if ($.inArray(p, ['alcohol', 'lunch', 'homemade_pierogies', 'handicap', 'take_out']) != -1) {
            self[p] = boolean_lookup[$("select#" + p).val()];
          // everything else is text.
          } else {
            self[p] = $("#" + p).val();
          }
        }
      }
    }
  console.log(self);
  //});
};

/**
 * FishFryForm Class return json method: returns all data stored in class
 */
FishFryFormClass.prototype.returnJSON = function() {
  var fishfry_json = {};
  for (var p in this) {
    if (this.hasOwnProperty(p)) {
      fishfry_json[p] = this[p];
    }
  }

  return fishfry_json;
};


/******************************************************************************/

/**
 * instantiate FishFryForm Class, used for all interaction with the form.
 */

FishFryForm = new FishFryFormClass();

/******************************************************************************/

/**
 * Initiate Date/Time Picker with div element name="daterange"
 *
 * This works on an instance of FishFryFormClass; it is not a method.
 */
$(function() {
  $('input[name="daterange"]').daterangepicker({
    autoUpdateInput: false,
    timePicker: true,
    timePickerIncrement: 15,
    timePicker24Hour: false,
    locale: {
      cancelLabel: 'Clear'
    }
  });

  $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD HH:mm') + ' - ' + picker.endDate.format('YYYY-MM-DD HH:mm'));
  });

  $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
    console.log('cancel datetime selection');
    $(this).val('');
  });

  /**
   * add datetime to list on button click using datetimepicker form data
   */
  $('input[name="daterange"]').on('apply.daterangepicker', function(evt, picker) {
    // read in value from the picker and push to the FishFryForm class instance.
    var id = uuid.v4();
    FishFryForm.events[id] = {
      "dt_start": moment(picker.startDate.format('YYYY-MM-DD HH:mm'), 'YYYY-MM-DD HH:mm').format(),
      "dt_end": moment(picker.endDate.format('YYYY-MM-DD HH:mm'), 'YYYY-MM-DD HH:mm').format()
    };
    //update the datetime list; clear it out first
    $("#events").empty();
    // assemble a new event list using the class method
    FishFryForm.pushToFormEvents();
  });

});

/**
 * geocode on geocode button click using entered form data
 */
$(function() {
  $('#venue_address_geocode').on('click', function() {
    //read in value from venue_address form field to the class
    FishFryForm.venue_address = $("#venue_address").val();
    // run the geocode method
    var runGeocoder = FishFryForm.geocode();
    // when it's complete, get the coordinates out of it and add to the page.
    $.when(runGeocoder).done(function() {
      var xy = FishFryForm.the_geom.coordinates[0] + ", " + FishFryForm.the_geom.coordinates[1];
      // ADD RESULT TO PAGE ELEMENT
      $("#venue_address_geocoded").empty();
      $("#venue_address_geocoded").append(xy);
      var center = L.latLng(FishFryForm.the_geom.coordinates[1],FishFryForm.the_geom.coordinates[0]);
      map.setView(center, 15);
    });
  });
});

/**
 * on confirm button click, the modal will open. It also fires the method
 * to read all the data from the form.
 */
$(function(){
  $('#confirmbutton').on('click', function() {
    FishFryForm.readFromForm();
  });
});


/**
 * on checking of publish box, show the publish confirmation
 *
$('#publishThis input:checkbox').change(function() {
    if ($(this).attr("checked")) {
      console.log("checked");
      $('#publishConfirmation').show();
    } else {
      console.log("unchecked");
      $('#publishConfirmation').hide();
    }
});
*/
/**
 * disable publish checkbox unless validate is checked
 *
$('#publishThis input:checkbox').change(function() {
    if ($(this).is(":checked")) {
      console.log("checked");
      $('#publishThis').prop('disabled', false);
    } else {
      console.log("unchecked");
      $('#publishThis').prop('disabled', true);
    }
});
*/


/**
 * initate form submission. calls internal Flask route, which handles
 * submission of form data to database.
 */
$(function() {
  $('#submitbutton').on('click', function() {
    
    // read the form and get the json
    var fishfry_json = FishFryForm.returnJSON();
    
    // Last-minute property updates...
    // check if validation checkbox on confirmation modal is true
    if ($('#validated').prop('checked')) {
      fishfry_json.validated = true;
    }
    // then also check if both publish confirmations have been checked.
    //if (($('#publishThis').prop('checked')) & ($('#publishThisYesReally').prop('checked'))) {
    if ($('#publish').prop('checked')) {
      fishfry_json.publish = true;
    }
    console.log("---");
    console.log("Submitted Fish Fry:");
    console.log(fishfry_json);
    
    $.ajax({
      url: $SCRIPT_ROOT + '/contribute/fishfry/submit',
      data: JSON.stringify(fishfry_json),
      type: 'POST',
      //dataType: 'application/json;charset=UTF-8',
      success: function(response) {
        console.log("success");
        console.log(response);
        r = JSON.parse(response);
        console.log(r);
        $("#myModal").modal('hide');
        $("#alert-success").show();
        // a redirect param will be provided if the fish fry was new
        if (r.redirect) {
          /* the redirect loads the newly submitted Fish Fry into the editing
           * version of the form via '/contribute/fishfry/<int:ff_id>'
           */
          window.location.replace($SCRIPT_ROOT + r.redirect);
        }
      },
      error: function(error) {
        console.log("error");
        console.log(error);
        $("#myModal").modal('hide');
        $("#alert-warning").show();
      }
    });
    
  });
});