/*global AppName */
if (!this.AppName || typeof this.AppName !== 'object') {
    this.AppName = {};
}
(function () {
  //'use strict';
  /**
   * Central manager for interactions with the Map
   * All interactions with the map are through this component
   * and ideally through commands / requests. This allows
   * us to keep the application very decoupled from the Map
   */
  AppName.module('Components.MapController', function (MapController, App, Backbone, Marionette, $, _) {

    MapController.addInitializer(function (options) {
        //boot up the map controller as soon as the module loads
        App.MapController = new MapController.Controller(options);          
    });

    //===========  M A P    F U N C T I O N S ========================
    /**
     * create a new map and optionally load it
     */
    App.reqres.setHandler('map:create', function( options ){
        return App.MapController.createMap( options );
    });

    /**
     * Reset the map to the original state when it loaded
     */
    App.commands.setHandler('map:reset', function(){
        App.MapController.resetMap();
    });

    /**
     * Set the basemap
     * @param  {string} basemap Name of the basemap
     */
    App.commands.setHandler('map:set:basemap', function(basemapName){
        App.MapController._setBasemap(basemapName);
    });

    /**
     * Show a message over the map
     * @param  {string} msg Message to be displayed to the user
     */
    App.commands.setHandler('map:show-message', function(msg, duration){
        App.MapController._showMessage(msg, duration);
    });


    //The controller - nothing should make calls directly to this, rather the calls
    //should be proxied through the App event busses - commands or requests
    MapController.Controller = Marionette.Controller.extend({
      searchExtentLayerName: 'SearchExtentLayer',

      mapType: 'leaflet',

      initialize: function(options){
        //_.bindAll(this);
        // a place to store methods called before the map is ready
        this.methodQueue = [];        
      },

      _layerCallbacks: [],

      close: function(){
          //unhook event handlers
      },

      /**
       * Destroy the map if it exists
       */
      destroy: function(callback){
        if (this._map) {
          this._map.destroy();
        }
      },

      //====== P U B L I C   H A N D L E R S =======
    

      /**
       * Create the map
       * @param  {object} options           options hash
       * Returns a promise
       */
      createMap: function( options ) {
        var deferred = $.Deferred();
        var self = this; 
        if(!options){
            options = {
              mapdiv : 'map'
            };
        }
        //make sure we have a div in the page  
        //this._injectMapDiv(options); 

        this._map = L.map(options.mapdiv).setView([37.75, -122.23], 10);
        //add a default basemap
        L.esri.basemapLayer('Topographic').addTo(this._map);

        //Leaflet is syncronous, but dojo is not
        //so we still use a deferred. 
        //We do not resolve with the map - the map 
        //should remain contained in the map controller
        deferred.resolve();

        //add all handlers and proxy to events
        //map.on('layer-add-result', this._onLayerAdded);
        // map.on('layer-remove', this._onLayerRemoved);
        // map.on('layers-removed', this._onLayersRemoved);
        // map.on('extent-change', this._onExtentChanged);
        return deferred.promise();
      },
      
      /**
       * Reset the map 
       * Relies on other functions
       */
      resetMap: function(){
        //this is only relevant IF we have a map
        //so just skip it otherwise
        if(this._map){
          // this.clearGraphics();
          // this.infoWindowHide();
          // this._searchExtentHideLayer();
          // this._removeSelectedFeature();
          // this._setExtent(this.initialExtentJson);
          // this.removeAllDatasetsExcept();
        }
      },

      //-------- P R I V A T E   F U N C T I O N S --------
      
 
      

      /**
       * Creates an entry in the method queue, excuted once this._map is ready
       */
      _addToMethodQueue: function(name, args){
        this.methodQueue.push({ method: name, args: args });
      },






      /*
      * Change maps current visible basemap
      */ 
      _setBasemap: function(name) {
        //console.log('   MapController: _changeBasemap');
        var self = this;
        if (layer) {
          this._map.removeLayer(layer);
        }
        layer = L.esri.basemapLayer(basemap);
        map.addLayer(layer);
        if (layerLabels) {
          map.removeLayer(layerLabels);
        }

        if (basemap === 'ShadedRelief' || basemap === 'Oceans' || basemap === 'Gray' || basemap === 'DarkGray' || basemap === 'Imagery' || basemap === 'Terrain') {

          layerLabels = L.esri.basemapLayer(basemap + 'Labels');
          map.addLayer(layerLabels);
        }
       
      },

      /**
       * Make a call to the esri geocoder service with the
       * passed in query.
       * @param  {string}   query         Geocode query - address, place etc
       * @param  {Function} callback      Success callback for the ajax call
       * @param  {Function} errorCallback Error callback for the ajax call
       */
      _geocodeFind: function(params, callback, errorCallback){
          //toss this over to the util class
          util.Geocoder.find(params, callback, errorCallback);
      },

      /**
       * Get suggestions from the esri geocoder service
       * @param  {string}   query         Geocode query - address, place etc
       * @param  {Function} callback      Success callback for the ajax call
       * @param  {Function} errorCallback Error callback for the ajax call
       */
      _geocodeSuggest: function(query, callback, errorCallback){
          //toss this over to the util class, passing in 
          //some map goodies
          //if(this._map){
              //get the center of the map
          var ctr = this._map.extent.getCenter().toJson();
          var dist = Math.abs(this._map.extent.xmax - this._map.extent.xmin);
          //}
          util.Geocoder.suggest(query, ctr, dist, callback, errorCallback);
      },


      /**
       * Return a json representation of the Extent
       */
      _getExtentJson: function(){
        ////console.log('   MapController: getExtentJson');
        if(this._map){
          var ext = this._map.extent;
          var obj = {};
          obj.extent = ext.toJson();
          obj.geographicExtent = esri.geometry.webMercatorToGeographic(ext).toJson();
          //round the values
          obj.geographicExtent.xmin = Math.round(obj.geographicExtent.xmin * 1000) / 1000;
          obj.geographicExtent.xmax = Math.round(obj.geographicExtent.xmax * 1000) / 1000;
          obj.geographicExtent.ymin = Math.round(obj.geographicExtent.ymin * 1000) / 1000;
          obj.geographicExtent.ymax = Math.round(obj.geographicExtent.ymax * 1000) / 1000;
          return obj;
        }
      },

     

   

      /**
       * Helper that will stuff a div into the page, optionally
       * contained within a containerDiv specified in the options
       * @param  {Object} options Options hash
       */
      _injectMapDiv: function( options ){

        //see if we have a map-div in the page before we worry about injecting a new one
        //if they specified a div in the options use that, otherwise use map-div
        this.mapDiv = options.mapDiv || 'map-div';

        if($('#' + this.mapDiv).length === 0){
          var containerDiv = $(options.containerDiv);
          //if we have been passed the id of a container div, and it exists
          if(containerDiv.length){
            //inject the map div into it, replacing existing content
            $('<div id="' + this.mapDiv + '" ></div>').appendTo(options.containerDiv);

          }else{
            //otherwise, inject it into the body and set it to hidden
            $('<div id="' + this.mapDiv + '" class="hidden"></div>').appendTo('body');
          }
        }
      },

      /**
       * Ask the map to resize itself
       */
      _notifyMapResize: function () {
        //console.log('_notifyMapResize');
        if (this._map) {
          this._map.resize();
        } 
      },

      /**
       * Handler for all click events on the graphics 
       * layer. Acts as a proxy into the application
       * @param  {event} e  JS API Event object
       */
      _onGraphicClicked: function(e){

        
          //raise the event as though it was a normal graphic in a layer
          App.vent.trigger('layer:' + e.graphic.attributes.layerId + ':click', evt);
        
      },

      /**
       * Proxy handler for graphic layer click
       * events. Raises an event into the application
       * with a json version of the graphic
       * @param  {event} e  JS API Event object
       */
      _onLayerClicked: function(e, datasetId){
        //we don't want the js api objects to move into 
        //AppName, so we convert the graphic to json
        var jsonGraphic = this._jsApiGraphicToGraphicJson(e.graphic); //.toJson();
        //for some reason the geometery type is not serialized
        //jsonGraphic.geometry.type = e.graphic.geometry.type;

        //create a simple json event object
        //we can add other needed things to this
        var evt = {
          layerX: e.clientX,
          layerY: e.clientY,
          layerName:  e.graphic._graphicsLayer.name,
          jsonGraphic: jsonGraphic,
          fields: e.graphic._graphicsLayer.fields
        };

        App.vent.trigger('layer:' + datasetId + ':click', evt);

      },



      /**
       * Proxy handler so we can raise events in the app 
       */
     _onLayerAdded: function(hash){
          //check for error in the hash with if(hash.error)
          var layer = hash.layer;
          var map = hash.target;
          //get the index of this layer based on it's id
          var idx = map.layerIds.indexOf(layer.id);
          if(idx < 0){
              //check the graphics layers
              idx = map.graphicsLayerIds.indexOf(layer.id) + map.layerIds.length;
          }
          //create a layerInfo object from a layer
          //App.log('   MMv1._onLayerAdded: Raising map:evt:layer-added for layer ' + layer.id + ' at ' + idx);
          var layerInfoObj = this._createLayerInfoFromLayer(layer);

          //convert to global event to any component can listen in on this without
          //requiring additional model level event triggering
          //App.MapsModule.trigger('map:evt:layer-added', {layerInfo: layerInfoObj, index: idx});
          App.vent.trigger('map:evt:layer-added', {layerInfo: layerInfoObj, index: idx});
      },
      
      /**
       * Proxy handler so we can raise events in the app 
       */
      _onLayerRemoved: function(hash){
          //App.log('   MMv1._onLayerRemoved: Raising map:evt:layer-removed for ' + hash.layer.id);
          if(!hash.error){
              //App.MapsModule.trigger('map:evt:layer-removed', hash.layer.id);
              App.vent.trigger('map:evt:layer-removed', hash.layer.id);
          }else{
              App.log('Error removing layer from map!');
          }
          
      },

      /**
       * Proxy handler so we can raise events in the app 
       */
      _onLayersRemoved: function(){
         
      },

      /**
       * Proxy handler so we can raise events in the app 
       */
      _onExtentChanged: function(options){
          ////console.log('MapController._onExtentChanged');
          //jsonify the extent, and the point so we can keep the jsapi 
          //contained in this class
          var obj={};
          obj.extent = options.extent.toJson();
          obj.geographicExtent = esri.geometry.webMercatorToGeographic(options.extent).toJson();
          //round the values
          obj.geographicExtent.xmin = Math.round(obj.geographicExtent.xmin * 1000) / 1000;
          obj.geographicExtent.xmax = Math.round(obj.geographicExtent.xmax * 1000) / 1000;
          obj.geographicExtent.ymin = Math.round(obj.geographicExtent.ymin * 1000) / 1000;
          obj.geographicExtent.ymax = Math.round(obj.geographicExtent.ymax * 1000) / 1000;

          App.vent.trigger('map:evt:extent-change', obj);

      },

      /**
       * empties the method queue
       * @return {[type]} [description]
       */
      _purgeMethodQueue: function(){

        if(this.methodQueue.length > 0){
          ////console.log('    MapController:Purge method queue');
          var self = this;
          _.each(this.methodQueue, function(action, i){
            ////console.log('   * MapControllerQueue Calling ' + action.method);
            self[action.method].apply(self, action.args);  
          });
        }
      },




 
    

      /**
       * Set the extent on the map
       * @param {Object} extentJson Extent as json objects
       */
      _setExtent: function(extentJson){
          if(!extentJson.spatialReference){
            //if no spatialRef is specified, assume webmercator
            _.extend(extentJson, {spatialReference:{wkid:3857}});
          }
          var extent = new esri.geometry.Extent(extentJson);
          this._map.setExtent(extent,true);
      },


     

      /**
       * Show a message over the map
       * @param  {string} msg Message to be displayed to the user
       */
      _showMessage: function (msg, duration) {              
        if (!msg) {
          //don't throw errors from here (because we're probably trying to display an error message), just exit
          return;
        }

        var obj = {
          msg: msg
        };
        var model = new Backbone.Model(obj);

        var opt = {
          template: 'MapController/message-template', 
          model: model, 
          timeout: true
        };
        if(duration){
          opt.duration = duration;
        }

        messageModal = new App.Views.ModalView(opt);
       
        messageModal.show(); 
      }

     

    });

  });
})();
