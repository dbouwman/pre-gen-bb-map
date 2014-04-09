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
     * Add a dataset to the map
     * @param  {Dataset}  datasetModel Dataset Model
     * @param  {Function} callback     Callback when the layer is added to the map
     */
    App.commands.setHandler('map:add:dataset', function(datasetModel, callback){
        App.MapController.addDataset(datasetModel, callback);
    });
    
    /**
     * Add array of extents to the map as graphics
     * @param  {Array} extents Array of extent json objects
     */
    App.commands.setHandler('map:add:extents', function (extents, zoomToAll) {
        App.MapController.addExtents(extents, zoomToAll);
    });


    /**
     * clear the built-in graphics layer
     */
    App.commands.setHandler('map:clear:graphics', function(){
        App.MapController.clearGraphics();
    });

    /**
     * create a new map and optionally load it
     */
    App.commands.setHandler('map:create', function(mapReadyCallback, options){
        App.MapController.createMap(mapReadyCallback, options);
    });

    /**
     * Reset the map to the original state when it loaded
     */
    App.commands.setHandler('map:reset', function(){
        App.MapController.resetMap();
    });

    /**
     * Remove all layers execept the specified one if it 
     * is in the map
     */
    App.commands.setHandler('map:remove:datasets', function(datasetId){
      App.MapController.removeAllDatasetsExcept(datasetId);
    });

    App.commands.setHandler('map:clear:extents', function(){
      App.MapController.clearExtents();
    });


    /**
     * Return the current map extent
     * DEPRECATED - DO NOT USE THIS!
     * @return {esri.geometry.extent} extent JS API Extent
     */
    App.reqres.setHandler('map:get:extent', function(){
        return App.MapController._getExtent();
    });

    /**
     * Return a json represetation of the map extent
     * @return {object} Json representation of the map extent
     */
    App.reqres.setHandler('map:get:extent-json', function(){
        return App.MapController._getExtentJson();
    });

    /**
     * Set the basemap
     * @param  {string} basemap Name of the basemap
     */
    App.commands.setHandler('map:new:basemap', function(basemap){
        App.MapController._changeBasemap(basemap);
    });

    /**
     * Remove a layer from the map.
     * @param  {string} datasetId DatsetId
     */
    App.commands.setHandler('map:remove:dataset', function(datasetId){
        App.MapController.removeDataset(datasetId);
    });

    /**
     * Resize the map
     * @param  {[type]} mapReadyCallback [description]
     * @param  {[type]} options          [description]
     * @return {[type]}                  [description]
     */
    App.commands.setHandler('map:resize', function(mapReadyCallback, options){
        if(App.MapController && App.MapController._map){
            App.MapController._map.resize();
        }
    });

    /**
     * Show all the search extents
     */
    App.commands.setHandler('map:search:extent:all', function(){
        App.MapController._searchExtentShowAll();
    });

    /**
     * focuses the search extent to passed in id
     * @param  {string} datasetId 
     */
    App.commands.setHandler('map:search:extent:focus', function(datasetId){
        App.MapController._searchExtentFocus( datasetId );
    });

    /**
     * hides the search extents layer
     * @return {[type]} [description]
     */
    App.commands.setHandler('map:search:layer:hide', function(){
        App.MapController._searchExtentHideLayer();
    });
    
    /**
     * shows the search extents layer
     */
    App.commands.setHandler('map:search:layer:show', function(){
        App.MapController._searchExtentShowLayer();
    });

    /**
     * Add a graphic to the selection layer
     * @param  {object} graphic Graphic to add to the map
     */
    App.commands.setHandler('map:selection:add-graphic', function(graphicJson, fields, datasetId) {
      App.MapController._removeSelectedFeature();
      App.MapController._selectFeature( graphicJson, fields, datasetId );
    });

    /**
     * Remove all graphics from the map
     */
    App.commands.setHandler('map:selection:clear-graphics', function() {
      App.MapController._removeSelectedFeature();
    });

    /**
     * Set the map extent. If no SpatialReference is on the json object
     * it assumes Web Mercator (wkid:3857)
     * @param  {object} extentJson Extent as json
     */
    App.commands.setHandler('map:set:extent', function (extentJson) {
        App.MapController._setExtent(extentJson);
    });

    /**
     * Show a message over the map
     * @param  {string} msg Message to be displayed to the user
     */
    App.commands.setHandler('map:show-message', function(msg, duration){
        App.MapController._showMessage(msg, duration);
    });

    /**
     * toggles the scrollWheelZoom property on the map
     * @param  {boolean} scroll Enable or Disable scroll
     */
    App.commands.setHandler('map:toggle-scroll-zoom', function( scroll ){
        App.MapController._toggleScrollZoom( scroll );
    });


    //===========  I N F O  W I N D O W   F U N C T I O N S ========================

    /**
     * Show the info window
     * @param  {object} options Options passed to the InfoWindow 
     */
    App.commands.setHandler('info-window:show', function(options){
      App.MapController.infoWindowShow(options);
    });
    /**
     * Hides the info window if it is visible
     */
    App.commands.setHandler('info-window:hide', function(){
      App.MapController.infoWindowHide();
    });

    /**
     * Update the attributes shown in the info window
     * @param  {object} attributes Hash of attribute values
     */
    App.commands.setHandler('info-window:set-attributes', function(attributes){
      App.MapController.infoWindowUpdateAttributes(attributes);
    });


    //===========  L A Y E R   F U N C T I O N S ========================
    
    /**
     * Get the layer associated wtih the dataset
     * @param  {[type]} dataset [description]
     */
    App.reqres.setHandler('layer:get:dataset', function(dataset){
        return App.MapController._getDataset(dataset);
    });

    /**
     * Return the number of features in a layer, based on the 
     * dataset
     * @param  {Dataset} dataset Dataset Model
     * @return {number}          Number of graphics loaded for the layer
     */
    App.reqres.setHandler('layer:get:feature:count', function(dataset){
      var layer = App.MapController._getDataset(dataset);
      return layer.graphics.length;
    });

    /**
     * Get the ids from the layer associated with the specified dataset which are within the current map extent
     * @param  {[type]} dataset [description]
     */
    App.reqres.setHandler('layer:get:ids-in-extent', function(dataset){
        return App.MapController._getIdsInExtent(dataset);
    });
    
    /**
     * Select a particular feature on a layer
     * @param  {Dataset} dataset Dataset Model
     * @param  {number} oid     ObjectId of the feature
     */
    App.commands.setHandler('layer:select:feature', function(dataset, oid) {
      App.MapController._removeSelectedFeature();
      var graphic = App.MapController._getGraphicByOid(dataset, oid);
      if (graphic) {
        //convert from JS API graphic into json graphic
        var g = App.MapController._jsApiGraphicToGraphicJson(graphic);
        App.MapController._selectFeature( g, dataset.get('id') );
      }else{
        console.warn('No Graphic Found for OID ' + oid);
      }
    });
    
    /**
     * Get the attributes from a sample feature in a dataset. Defaults
     * to the first graphic
     * @param  {Dataset} dataset Dataset Model
     */
    App.reqres.setHandler('layer:get:sample-feature', function(dataset){
        return App.MapController._getSampleFeatureFromDataset(dataset);
    });



    /**
     * Set filters on layer by param
     * @attribute  {Dataset} dataset Dataset Model
     */
    App.commands.setHandler("layer:set:filter", function( dataset ) {
      App.MapController._applyFilterToLayer( dataset );
    });

    //===========  L O C A T O R   F U N C T I O N S ========================

    /**
     * Find a specific location
     */
    App.commands.setHandler('geocode:find', function(query, callback, errorCallback){
        App.MapController._geocodeFind(query, callback,errorCallback);
    });

    /**
     * Suggest locations based on a partial string
     */
    App.commands.setHandler('geocode:suggest', function(query, callback, errorCallback){
        App.MapController._geocodeSuggest(query, callback,errorCallback);
    });



    //The controller - nothing should make calls directly to this, rather the calls
    //should be proxied through the App event busses - commands or requests
    MapController.Controller = Marionette.Controller.extend({
      searchExtentLayerName: 'SearchExtentLayer',

      mapType: 'dojo',
      initialize: function(options){
        _.bindAll(this);
       
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
       * Add a layer to the map
       */
      addDataset: function(datasetModel, callback){
        var self = this;
        //add the layer to the map
        //create the feature layer
        if ( !this._map ) {
          
          this._addToMethodQueue('addDataset', [datasetModel, callback]);
          //console.log('added addDataset to method queue');

        } else {
          //check if we have the layer in the map already, and if so, just fire the callback
          if ( _.indexOf( this._map.graphicsLayerIds, datasetModel.get('id') ) > -1){

            //already in the map - fire the callback
            ////console.log('Dataset ' + datasetModel.get('id') + ' already in the map', callback);
            callback();

          } else {
            //console.log('Adding dataset to map from url: ' + datasetModel.get('data_url'));
            var layerUrl = util.UrlHelper.updateUrl(datasetModel.get('data_url'));

            var layerOptions = {
                url: util.UrlHelper.updateUrl(datasetModel.get('data_url')),
                mode: datasetModel.getLayerMode(), 
                id: datasetModel.get('id'),
                geometryType: datasetModel.get('geometry_type')
            };
            //console.log('layermode: ' + layerOptions.mode);
            if (layerOptions.mode === 0) {
              //if we're putting it in snapshot mode it won't autogeneralize
              //because it askes for everything once
              //set maxAllowableOffset so the features aren't unecessarily complex
              //number of vertices per pixel at max zoom
              //1 = 1 vertex per pixel which is the most detailed it is possible to draw it
              var pixelTolerance = 1;
              var offset = 0.29858214164732144 * pixelTolerance;
              layerOptions.maxAllowableOffset = offset;
              ////console.log('   Adding with mode: ' + layerOptions.mode);
            }

            this._addDefaultSymbols(layerOptions);

            //create a layer object
            var layer = this._createFeatureLayer(layerOptions);


            //layer-add-result won't work - we need the layer to be fully hydrated
            //so we listen for the update-end event on the layer - but only once
            if (callback && _.isFunction(callback)) {
              //.once is not supported so we use on and wrap the callback in another function that removes the handler
              func = _.wrap(callback, function () {
                if(layer.graphics.length > 0){
                  callback();
                  handler.remove();
                }else{
                  App.logError('Feature Layer Update-End', 'update-end fired, but no features present yet. Dataset: ' + datasetModel.get('id'));
                }
                ////console.log(' layer update-end has fired...' + layer.graphics.length);
              });
              var handler = layer.on('update-end', func);
            }

            //hookup a bunch of event handlers that will act as proxies 
            //so controllers don't have direct access to map or layers
            var clickClosure = function(e){
              //App.vent.trigger('layer:' + datasetModel.get('id') + ':click', e);
              self._onLayerClicked(e, datasetModel.get('id'));
            };

            layer.on('click', clickClosure );

            layer.on('query-limit-exceeded', function (e) {
              App.vent.trigger('layer:' + datasetModel.get('id') + ':query-limit-exceeded', e);                      
            });

            var extentJson = datasetModel.get('extent');
            if (extentJson.coordinates) {
              //the format of the extent in a dataset is slightly funky
              //and it's in 4326 (lat/long) so we manually create the extent
              //object
              var ext;                    
              
              if(extentJson.coordinates){
                  ext = {
                      xmax: extentJson.coordinates[1][0],
                      ymax: extentJson.coordinates[1][1],
                      xmin: extentJson.coordinates[0][0],
                      ymin: extentJson.coordinates[0][1]
                  };
                  _.extend(ext, {spatialReference:{wkid:4326}});
              }else{
                  //console.debug('setting extent from json w/o coordaintes - if zoom is weird - this is likely why');
                  ext = extentJson;
              }
              var extent = new esri.geometry.Extent(ext);

              //just zoom to the extent of the layer                        
              this._map.setExtent(extent,true);
              
            }else{
              //extent is null... we should report this somehow
              App.logUiEvent('set-map-extent', 'error','Dataset ' + datasetModel.get('id') + ' had null extent');
              App.logError('Attempt to load dataset with null extent : ' + datasetModel.get('name') + ':' + datasetModel.get('id') );
            }

            //squash scale ranges - we need the layer to draw at all scales
            if (datasetModel.get('max_scale') || datasetModel.get('min_scale')) {
              //clear the min/max scales so the map will request features
              layer.on('load', function(){
                layer.minScale = 0; 
                layer.maxScale = 0;
              });
            }

            //Add the layer to the map
            ////console.log("adding layer to map");
            this._map.addLayer(layer); 
          }
        }
      },

      /**
       * Create a feature layer based on the passed in options
       */
      _createFeatureLayer: function(layerJson){
        //setup some options
        var options = {};
        //for now, default the outfields to *
        if (layerJson.mode === 0) {
          options.outFields = [ '*' ];
        }

        //opacity can be 0 which is falsy, so we can't just check as a property name
        if(layerJson.hasOwnProperty('opacity')){
            options.opacity = layerJson.opacity;
        }else{
            //if geometry type is polygon, make this semi-transparent by default
            if(layerJson.geometryType && layerJson.geometryType === 'esriGeometryPolygon'){
                options.opacity = 0.75;
            }
        }
        //since visibility is a boolean, we need to be trickier
        if(layerJson.hasOwnProperty('visibility')){
            options.visible = layerJson.visibility;
        }
        //mode can have value 0, which is falsy
        if(layerJson.hasOwnProperty('mode')){
            options.mode = layerJson.mode;
        }else{
            options.mode = esri.layers.FeatureLayer.MODE_ONDEMAND;
        }

        if (layerJson.maxAllowableOffset) {
          options.maxAllowableOffset = layerJson.maxAllowableOffset;
        }

        //FORCE ALL LAYERS INTO SNAPSHOT MODE SO THAT THE FILTERS
        //CAN SIMPLY CALL .HIDE() or .SHOW() ON GRAPHICS
        // if(layerJson.hasOwnProperty('mode') ){
        //     options.mode = layerJson.mode;
        // }else{
        //     options.mode = esri.layers.FeatureLayer.MODE_SNAPSHOT;
        // }
        
        //options.mode = esri.layers.FeatureLayer.MODE_ONDEMAND;

        if(layerJson.id){
            options.id = layerJson.id;
        }
        
        //Since we use jasmine tests running from a file:// location
        //we can not directly test this. Tests for UrlHelper are in place
        // var protocol = window.location.protocol;
        // if(protocol === 'https:'){
        //     var chk = util.UrlHelper.isKnownServer(layerJson.url);
        //     if(chk){
        //         layerJson.url = util.UrlHelper.convertToSsl(layerJson.url);
        //     }
        // }
        //the layer will always get it's default renderer info from the server
        ////console.log('>> FEATURE LAYER OPTIONS', options);
        var layer = new esri.layers.FeatureLayer(layerJson.url, options);

        //apply custom renderer overrides if defined.
        if(layerJson.layerDefinition){
            //apply renderers
            if(layerJson.layerDefinition.drawingInfo){
                layer.setRenderer(this._createRendererFromJson(layerJson.layerDefinition.drawingInfo.renderer));
            }
            //Apply definition expression
            if(layerJson.layerDefinition.definitionExpression){
                layer.setDefinitionExpression(layerJson.layerDefinition.definitionExpression);
            }
        }

        return layer;
      },

      //given a renderer node from an operational layer, 
      //return the correct Esri Renderer object
      _createRendererFromJson: function(rendererJson){
          var renderer;
          switch (rendererJson.type){
              case 'simple':
                  //create the default symbol
                  renderer = new esri.renderer.SimpleRenderer(rendererJson);
                  break;
              case 'classBreaks':
                  renderer = new esri.renderer.ClassBreaksRenderer(rendererJson);
                  break;
          }
          return renderer;
      },


      /**
       * Clear extents from the searchExtentLayer
       */
      clearExtents: function(){
        if(this._map){
          if(this.searchExtentLayer){
            this.searchExtentLayer.clear();
          }
        }
      },
      /**
       * Add extents to the map in a dedicated graphics layer.
       * Note: The extents passed in are simple objects, NOT esri.geometry.Extent instances
       */
      addExtents: function(extents, zoomToAll) {
        var self = this;

        if(!this._map){
          this._addToMethodQueue('addExtents', [extents, zoomToAll]);
          ////console.log('added addExtents to method queue');
        }else{
          ////console.log('added addExtents');

          // create an extent layer if doesnt exist
          if ( !self.searchExtentLayer ){
            self._createSearchStyles();
            self.searchExtentLayer = new esri.layers.GraphicsLayer({id:this.searchExtentLayerName});
            self._map.addLayer( self.searchExtentLayer );
          } else {
            self.searchExtentLayer.clear();
          }
          
          var graphics = [],
          extent,
          graphic;
        
          _.each(extents, function (item){
            //the item we get is a json version of an extent - it's not
            //and actual 'real' extent so we use it to hydrate an extent
            //extent = new esri.geometry.Extent(item);
            extent = new esri.geometry.Extent(
              item.xmin, 
              item.ymin, 
              item.xmax, 
              item.ymax, 
              new esri.SpatialReference({ wkid:4326 })
            );    
            //graphic = new esri.Graphic(item, defSym, {id: item.id});
            graphic = new esri.Graphic(extent, self.defaultSym, {id: item.id});
            
            graphics.push(graphic);
            
            self.searchExtentLayer.add(graphic);
          }, self);

          ////console.log('added ' + graphics.length + ' extents to the map');

          if(zoomToAll){
            //zoom to the extent of all the extents
            ////console.log('zooming to all extents');
            self._map.setExtent(esri.graphicsExtent(graphics));
          }
          
        }
      },

      /**
       * clear the built-in graphics layer
       */
      clearGraphics: function(){
          if ( this._map && this._map.graphics ){
              this._map.graphics.clear();
          }
      },
      
      /**
       * Callback that fires when dojo is loaded.
       * @param  {function} mapReadyCallback callback for when the map is ready
       */
      _onDojoLoaded: function(mapReadyCallback, mapOptions){
        var self = this;
        
        mapOptions = _.extend({
            minZoom: 2,
            wrapAround180:true,
            sliderOrientation:'horizontal',
            sliderPosition: 'top-right',
            smartNavigation:false,
            navigationMode: 'css-transforms'
        }, mapOptions);

        //set the extent if is was passed in as json (it always should be)
        if(mapOptions.extentJson){
          mapOptions.extent = new esri.geometry.Extent(mapOptions.extentJson);
          //hold onto this
          this.initialExtentJson = mapOptions.extentJson;
        }

        //create the map and pass it off to the normal loadWebMap flow
        ////console.log('   creating the map');
        var map = new esri.Map(this.mapDiv, mapOptions);

        //should fire when acetate is loaded
        map.on('load', function(e){
            ////console.log('   map.on load...');
            if(e.map.graphics){
              e.map.graphics.on('click', self._onGraphicClicked);
            }else{
              //console.log("GRAPHICS NOT DEFINED");
            }
            self._map = e.map;

            App.stopTimer('map-create');
            self._purgeMethodQueue();

            if(mapReadyCallback){
              ////console.log('firing the callbacks');
              mapReadyCallback(null,e.map); 
            }
        });


        //add acetate
        var acetateLayer = this._createAcetateLayer();
        map._basemap = 'acetate';

        //add it to the map
        ////console.log('   adding acetate to map');
        map.addLayer(acetateLayer);

        ////console.log('   attaching events');
        //attach handlers - not sure @ scope on this
        map.on('layer-add-result', this._onLayerAdded);
        map.on('layer-remove', this._onLayerRemoved);
        map.on('layers-removed', this._onLayersRemoved);
        map.on('extent-change', this._onExtentChanged);


      },

      /**
       * Create the acetate layer
       * @return {esri.WebMapTiledLayer} Layer that can be added to a map
       */
      _createAcetateLayer: function(){
        var acetateUrl = "http://${subDomain}.acetate.geoiq.com/tiles/acetate/${level}/${col}/${row}.png";
        var copyright = '©' + new Date().getFullYear() + ' Esri & Stamen, Data from OSM and Natural Earth';
        var acetate = new esri.layers.WebTiledLayer(
          acetateUrl, 
          {"copyright": copyright,
            "id": "bm_Acetate",
            "subDomains": ["a1", "a2", "a3"]
          });
        acetate.name = 'Acetate';
        acetate.id = 'bm_Acetate';
        return acetate;
      },

      /**
       * Create the map
       * @param  {function} mapReadyCallback Callback to fire when the map is ready
       * @param  {object} options           options hash
       */
      createMap: function(mapReadyCallback, options){
        ////console.log('Options ', options);
        var self = this; 
        App.startTimer('map-create', 'map','dojo pre-loaded');
        if(!options){
            options = {};
        }
        //make sure we have a div in the page  
        this._injectMapDiv(options); 

        var dojoOnLoadCallback = function(){
          //all the map creation logic here...
          self._onDojoLoaded(mapReadyCallback, options.mapOptions);
        };

        if(!window.dojo){
          ////console.log('   MANUALLY LOADING DOJO');
          this._loadDojo(dojoOnLoadCallback);
        }else{
          ////console.log('   DOJO ALREADY LOADED');
          dojo.addOnLoad(dojoOnLoadCallback);
        }

        
      },
      
      /**
       * Reset the map 
       * Relies on other functions
       */
      resetMap: function(){
        //this is only relevant IF we have a map
        //so just skip it otherwise
        if(this._map){
          this.clearGraphics();
          this.infoWindowHide();
          this._searchExtentHideLayer();
          this._removeSelectedFeature();
          this._setExtent(this.initialExtentJson);
          this.removeAllDatasetsExcept();
        }
      },

      
      /**
       * Show InfoWindow
       * @param  {object} options Options hash passed to the info window
       */
      infoWindowShow: function(options){
        if ( !this.infowindow ) {
          this.infowindow = new window.InfoWindow({ container: "info-window-container", isAsync: options.isAsync });
        }
        this.infowindow.show( options );
      },

      /**
       * Hide the infowindow if it exists
       */
      infoWindowHide: function(){
        if(this.infowindow){
          this.infowindow.hide();
        }
      },

      /**
       * Update InfoWindow Attributes
       * @param  {object} options Options hash
       */
      infoWindowUpdateAttributes: function(attributes){
        if ( this.infowindow ) {
          this.infowindow._listAttributes( attributes );
        }
      },


      /**
       * Remove a layer from the map.
       * @param  {string} datasetId DatsetId
       */
      removeDataset: function(datasetId){
          //get the layer
          //console.log('   MapController: Removing dataset');
          if(this._map){
            var theLayer = this._map.getLayer(datasetId);
            if(theLayer){
              this._map.removeLayer(theLayer);
            }
          }else{
            //console.log('   MapController: removeDataset MAP NOT DEFINED!');
          }
      },

      /**
       * Remove all the datasets (graphics layers)
       * in the map, with the exception of one that 
       * is passed in
       * @param  {string} datasetId Id of the dataset to keep it is should be loaded
       */
      removeAllDatasetsExcept: function(datasetId){
        //only relevant if the map is loaded
        if(this._map){
          //iterate the layerIds
          var ids = this._map.graphicsLayerIds;
          _.each(ids, function(id){
            if(id !== this.searchExtentLayerName && id !== datasetId){
              this.removeDataset(id);
            }
          }, this);  
        }
        
      },


      //-------- P R I V A T E   F U N C T I O N S --------
      
      /**
       * Append in default layer styling by adding/updateing 
       * layerOptions.layerDefinition.drawingInfo and setting it's properties
       * as though it was set from webmap.
       * @param {Object} layerOptions Json hash of layer properties. Either from a webmap
       * or constructed for a layer in a feature service
       */
      _addDefaultSymbols: function(layerOptions){
          //add the layerDefinition node
          if(!layerOptions.layerDefinition){
              layerOptions.layerDefinition = {};
              layerOptions.layerDefinition.drawingInfo = {};
          }
          if(!layerOptions.layerDefinition.drawingInfo){
              layerOptions.layerDefinition.drawingInfo = {};
          }

          //depending on the type, load in the default renderer as json
          switch (layerOptions.geometryType){
              case 'esriGeometryPolygon':
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultPolygonRenderer;
                  break;
              case 'esriGeometryPoint':
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultPointRenderer;
                  break;
              case 'esriGeometryMultipoint':
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultPointRenderer;
                  break;
              case 'esriGeometryPolyline':
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultLineRenderer;
                  break;
              case 'esriGeometryLine':
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultLineRenderer;
                  break;
              default: 
                  layerOptions.layerDefinition.drawingInfo.renderer = util.Defaults.defaultPolygonRenderer;
          }
          return layerOptions;
      },
      

      /**
       * Creates an entry in the method queue, excuted once this._map is ready
       */
      _addToMethodQueue: function(name, args){
        this.methodQueue.push({ method: name, args: args });
      },

      /**
       * Apply a filter to a layer in the map
       * @param  {Dataset} dataset  Dataset Model
       */
      _applyFilterToLayer: function(dataset){

        console.log('   MapController: _applyFilterToLayer Node: ' + dataset.getLayerMode());
        if(dataset.get('feature_count') > -1){
          if (dataset.getLayerMode() === 0) {
            //we're using snapshot mode and handling it in the browser
            return this._applyFilterToSmallLayer(dataset);
          } else {
            //we're using dynamic mode and using setDefinitionExpression
            return this._applyFilterToLargeLayer(dataset);
          }
        }else{
          //no features
        }
      },

      /**
       * Apply dataset filters to a layer that is in snapshot 
       * mode and thus fully loaded into the map
       * @param  {Dataset} dataset  Dataset Model
       */
      _applyFilterToSmallLayer: function (dataset) {
        //console.log('   MapController:  _applyFilterToSmallLayer');
        var self = this;
        var min = null, max = null, layer, category;
        var visibleFeatures = 0;

        layer = this._getDataset(dataset);
        var activeFilters = dataset.filters.getNonEmptyFilters();
        if ( activeFilters.length > 0 ) {
          var query = [], i = 0;
         
          _.each(layer.graphics, function(graphic, field) {
            //apply all the filters to the graphic
            var result = true; //assume we will show a graphic unless a filter hides it

            _.each(activeFilters, function(filterModel){
              
              var subResult, value;
              var fieldVal = graphic.attributes[filterModel.get('fieldName')];

              switch( filterModel.get('type') ){

                case 'range':
                  //apply a range filter
                  var min = filterModel.get('parameters')[0],
                      max = filterModel.get('parameters')[1];
                  subResult = (fieldVal >= min && fieldVal <= max);
                  break;

                case 'like':
                  var chk = ('' + fieldVal).toLowerCase();
                  subResult = _.any(filterModel.get('parameters'), function (param){
                    value = param.toLowerCase() || '';
                    return fieldVal !== null && chk.indexOf(value) > -1;
                  });
                  break;

                case 'term':
                  subResult = _.any(filterModel.get('parameters'), function (param){
                    //we expect numbers here (but we'll treat them as strings)
                    return fieldVal !== null && param === '' + fieldVal;
                  });
                  break;

                case 'exact-match':
                  value = filterModel.get('parameters')[0].toLowerCase();
                  subResult = (fieldVal.toLowerCase() === value);
                  break;

                case 'in':
                  break;
              }
              result = (result && subResult);
              
            });
            
            //applied all the filters for this graphic... check the result
            //and show/hide the grapic
            if ( result ) {
                graphic.show();
                visibleFeatures++;
              } else {
                graphic.hide();
            }

          });
        } else {
          //if NO filters show all!
          _.each(layer.graphics, function(graphic, i) {
            graphic.show();
          });
          visibleFeatures = layer.graphics.length;
        }
        
        return visibleFeatures;
      },

      /**
       * Apply the dataset filters to the layer
       * @param  {Dataset} dataset Dataset Model
       */
      _applyFilterToLargeLayer: function (dataset) {
        //console.log('   MapController:  _applyFilterToLargeLayer');
        var layer = this._getDataset(dataset);
        if(layer){
          if ( dataset.filters.length > 0 ) {
            var expression = dataset.filters.toQuery();
            layer.setDefinitionExpression(expression);
          } else {
            layer.setDefinitionExpression('');
          }
        }else{
          //do nothing
        }
        
      },



      /*
      * Change maps current visible basemap
      */ 
      _changeBasemap: function(id) {
        //console.log('   MapController: _changeBasemap');
        var self = this;

        var basemaps = this._map.basemapLayerIds;
        var layers = this._map.layerIds;
        
        if ( basemaps && basemaps !== undefined && id !== "satellite" ) {
          _.each(basemaps, function(basemap,i) {
            var layer = self._map.getLayer(basemap);
            if ( layer !== undefined ) {
              self._map.removeLayer(layer);
            }
          });
        }

        //remove acetate
        if (id !== 'acetate') {
          _.each(layers, function(basemap,i) {
            if ( basemap === "bm_Acetate") {
              self._map.removeLayer(AppName.MapController._map.getLayer('bm_Acetate'));
            }
            self._map.setBasemap( id );
          });
        } else {
          //add acetate
          var acetateLayer = this._createAcetateLayer();
          this._map._basemap = 'acetate';
          this._map.addLayer(acetateLayer);
        }
      },

      /**
       * Create a LayerInfo model from a layer
       * @param  {esri.Layer | json} layer Layer object from a map or json from a feature service
       * @return {LayerInfoModel}       LayerInfo model used by AppName
       */
      _createLayerInfoFromLayer:function(layer){
          var li = new App.Models.LayerInfoModel();

          //detach field properties from the object chain
          var flds = _.map(layer.fields, function(field) { return {name: field.name, alias: field.alias, type: field.type}; });
          
          //This is somewhat crufty, but the only way we know that a layer is a basemap
          //is to set that as a property when we load it into the map.
          var isBasemap = false;
          if(layer._AppName && layer._AppName.isBasemap){
              isBasemap = layer._AppName.isBasemap;
          }
          li.set('isBasemap', isBasemap);

          if(layer.url){
              li.set('url', layer.url); 
          }else{
              li.set('isFeatureCollection', true);
          }
          
          li.set('layerId', layer.id);
          li.set('layerName', layer.name);
          li.set('state', 'ready');
          li.set('fields', flds);
          li.set('objectIdField', layer.objectIdField);
          if(layer.declaredClass){
              li.set('type', layer.declaredClass);
          }else if(layer.type){
              li.set('type', layer.type);                    
          }else{
              li.set('type', 'unknown');
          }
          return li;
      },


      /**
       * create accessible search extent styles one for hover, one for all else
       */
      _createSearchStyles: function(){
        this.hoverSym = esri.symbol.SimpleFillSymbol(
          esri.symbol.SimpleFillSymbol.STYLE_SOLID,
          new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([155,155,155]), 4),
          new dojo.Color([93,173,221,0.25])
        );

        this.defaultSym = esri.symbol.SimpleFillSymbol(
          esri.symbol.SimpleFillSymbol.STYLE_SOLID,
          new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,255]), 1),
          new dojo.Color([93,173,221,0.1])
        );
      },


      /**
       * The default webmap json for a new map
       */
      _defaultWebMap: function(){
        return {
          item: {
            created: new Date().getTime(),
            modified: new Date().getTime(),
            guid: null,
            name: null,
            title: I18n.t('map.edit_title') || 'Edit Map Title...',
            type: "Web Map",
            typeKeywords: [],
            description: null,
            tags: [ ],
            snippet: "",
            thumbnail: "",
            documentation: null,
            //extent: [[-134, 29],[-53, 49]],
            extent: [[-174, -53],[186, 60]], 
            spatialReference: null,
            accessInformation: null,
            licenseInfo: null,
            culture: "en-us",
            properties: null,
            url: null,
            access: "private",
            size: null,
            commentsEnabled: true,
            permissions: {
              'everyone': false,
              'org': false
            }
          },
          itemData: {
            operationalLayers: [],
            baseMap: {
              baseMapLayers: [{
                "opacity": 1,
                "visibility": true,
                "type": "Acetate"
              }]
            }
          }
        };
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
       * Return the extent from the map
       * @return {Object} json object representing the current map extent
       */
      _getExtent: function(){
        ////console.log('   MapController: getExtent');
          if(this._map){
            console.error('    MapController._getExtent should not be used! Leaks JS API into AppName. Please Refactor to use getExtentJson');
              return _.clone(this._map.extent);
          }
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
       * Return the number of features in a dataset.
       * Relies on the graphics layer
       * @param  {DatasetModel} dataset Model
       * @return {number}         Number of features in the layer
       */
      _getDatasetFeatureCount: function(dataset){
        ////console.log('   MapController: _getDatasetFeatureCount');
          //var layer = this._map.getLayer( dataset.get('name') + '-' + dataset.get('layer_id') );
          var layer = this._getDataset(dataset);
          return layer.graphics.length;
      },

      /**
       * Get a sample feature from the dataset. Defaults to the first feature in the graphics collection
       * @param  {[type]} dataset [description]
       */
      _getSampleFeatureFromDataset: function (dataset) {
        ////console.log('   MapController: _getSampleFeatureFromDataset');
        var layer = this._getDataset(dataset);
        var item = (layer && layer.graphics && layer.graphics.length) ? layer.graphics[0].toJson() : {};
        return item;
      },

      /**
       * Get a reference to the layer in the map representing a dataset
       * Should not be exposed to callers outside this module as we want to
       * contain the "map" objects here
       * @param  {Dataset} dataset Dataset Model
       */
      _getDataset: function (dataset) {
        ////console.log('   MapController: _getDataset');
        var layer = this._map.getLayer( dataset.get('id') );
        return layer;
      },

      _getIdsInExtent: function (dataset) {
        var graphics = this._getDataset(dataset).graphics;
        var extent = this._map.extent;
        var oidFieldName = dataset.get('object_id_field');
        return _.filter(graphics, function (item) {
          return item.geometry && extent.intersects(item.geometry);
        }).map(function (filteredItem) {
          return filteredItem.attributes[oidFieldName];
        });
      },

      /**
       * Get a graphic by it's objectId
       * @param  {Dataset} dataset Dataset Model
       * @param  {number} oid      ObjectId of the graphic
       */
      _getGraphicByOid: function (dataset, oid) {
        
        ////console.log('   MapController: _getGraphicByOid');
        var layer = this._getDataset(dataset);
        var fieldName = dataset.get('object_id_field');
        if (layer && layer.graphics) {
          return _.find(layer.graphics, function (graphic) {
            return graphic.attributes[fieldName] === oid;
          });
        }
      },

      /**
       * Helper that will stuff a div into the page, optionally
       * contained within a containerDiv specified in the options
       * @param  {Object} options Options hash
       */
      _injectMapDiv: function(options){
        ////console.log('_injectMapDiv');
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
       * Convert a JS API graphic into a generic json 
       * representation that we can toss to AppName 
       * without breaking containment
       * @param  {esri.graphic} jsapiGraphic Graphic from the js api
       */
      _jsApiGraphicToGraphicJson: function(jsapiGraphic){
        var jsonGraphic = jsapiGraphic.toJson();
        //for some reason the geometery type is not serialized
        jsonGraphic.geometry.type = jsapiGraphic.geometry.type;
        return jsonGraphic;
      },

      /**
       * load dojo, with a callback
       * @param  {function} dojoOnLoadCallback Callback function to fire when dojo is loaded
       */
      _loadDojo: function(dojoOnLoadCallback){

        //we now load dojo early
        dojo.addOnLoad(function () {
          App._dojoIsLoaded = true;
          if(dojoOnLoadCallback && _.isFunction(dojoOnLoadCallback)) {
            dojoOnLoadCallback();
          }
        });
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
        //grab the oid, find that graphic and then raise the event like normal
        //problem: how do we know the OID field?
        //check if the graphic has a layerId
        var jsonGraphic = e.graphic.toJson();
        //for some reason the geometery type is not serialized
        jsonGraphic.geometry.type = e.graphic.geometry.type;
        //create a simple json event object
        //we can add other needed things to this
        var evt = {
          layerX: e.clientX,
          layerY: e.clientY,
          jsonGraphic: jsonGraphic,
          fields: (e.graphic.attributes) ? e.graphic.attributes.selectedGraphicFields : null
        };
        if(e.graphic.attributes.layerId){
          //raise the event as though it was a normal graphic in a layer
          App.vent.trigger('layer:' + e.graphic.attributes.layerId + ':click', evt);
        }else{
          //no layer id... hmmm
          App.logError('graphic-click','Graphic layer clicked but graphic does not have layerId - not propogating');
        }
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

      /*
      * Removes all existing selected graphics
      */
      _removeSelectedFeature: function() {
        ////console.log('_removeSelectedFeature');
        var self = this;
        //this can get called before anything is in the map
        if(!this._map){
          return;
        }
        //NOTE: Not sure if this is the best way to handle this
        _.each(this._map.graphics.graphics, function(gra,index){
          if(gra.attributes && gra.attributes.id === "selectedGraphic"){
            self._map.graphics.remove( gra );
          }
        });
      },


      /**
       * Show all the extents in the searchExtentLayer
       */
      _searchExtentShowAll: function( ){
        var self = this;
        if (this.searchExtentLayer){
          _.each(this.searchExtentLayer.graphics, function(g){
            g.setSymbol( self.defaultSym );
          });
        }
      },

      /**
       * Hilight a particular extent
       * @param  {string} id ExtentId
       */
      _searchExtentFocus: function( id ){
        var self = this;
        if (this.searchExtentLayer){
          _.each(this.searchExtentLayer.graphics, function(g){
            if ( g.attributes.id != id ) {
              g.setSymbol( self.defaultSym );
            } else {
              g.setSymbol( self.hoverSym );
            }
          });
        }
      },

      /**
       * Hide the search extent layer
       */
      _searchExtentHideLayer: function( ){
        if (this.searchExtentLayer){
          this.searchExtentLayer.hide();
        }
      },

      /**
       * Show the search extent layer
       */
      _searchExtentShowLayer: function( ){
        if (this.searchExtentLayer){
          this.searchExtentLayer.show();
          this._searchExtentShowAll();
        }
      },

      /*
      * Called on graphic selected. Takes given graphic and creates a new one with selected styling
      * @param {object} selected graphic
      */
      _selectFeature: function( graphicJson, fields, datasetId ) {
       //merge the attributes with a few extras
        graphicJson.attributes = _.extend(graphicJson.attributes,{ 
          "id": "selectedGraphic", 
          "layerId" : datasetId,
          "selectedGraphicFields": fields
        });
      

        if ( graphicJson.geometry.type === "point" ) {
          graphicJson.symbol = {
              "color":[255,255,255,1],"size":8,"angle":0,"xoffset":0,"yoffset":0,"type":"esriSMS","style":"esriSMSCircle",
              "outline":{"color":[255,255,255,255],"width":2,
              "type":"esriSLS","style":"esriSLSSolid"}
          };

        } else if ( graphicJson.geometry.type === "polyline" ) {
          graphicJson.symbol = {
              "color":[255,255,255,1],"size":8,"angle":0,"xoffset":0,"yoffset":0,"type":"esriSMS","style":"esriSMSCircle",
              "outline":{"color":[255,255,255,255],"width":2,
              "type":"esriSLS","style":"esriSLSSolid"}
          };

        } else if ( graphicJson.geometry.type === "polygon" ) {
           graphicJson.symbol = {
              "color":[255,255,255,64],"outline":{"color":[255,255,255,255],
              "width":2,"type":"esriSLS","style":"esriSLSSolid"},
              "type":"esriSFS","style":"esriSFSSolid"
            };

        }
        var g = new esri.Graphic( graphicJson );
        //add to map
        this._map.graphics.add( g );

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


      //set filters on layer 
      _setFilters: function( filters ) {
        var self = this;
        var min = null, max = null, layer, category;

        /*
         * Manual labor to show hide graphics 
         * Used for faster response on client! AND if !layer._collection ( everything but feature services... )
         * 
         */
        if ( filters !== undefined ) {
          var query = [], i = 0;
          
          _.each(filters, function( filter, field ) {

            layer = self._map.getLayer( filter.id );
            query.push( { field: filter.attribute, min: filter.min, max: filter.max } );

          });
          
          //if numeric! 
          _.each(layer.graphics, function(graphic, field) {
            var cond = "", num = 0;
            cond = ( graphic.attributes[ query[ 0 ].field ] >= query[ 0 ].min && graphic.attributes[ query[ 0 ].field ] <= query[ 0 ].max ) ? true : false;
            
            if ( query.length > 1 ) {
              _.each(query, function(q, itr ) {
                cond = ( cond && (graphic.attributes[ q.field ] >= q.min && graphic.attributes[ q.field ] <= q.max)) ? true : false;
              });
            }
            
            if ( cond ) {
                graphic.show();
              } else {
                graphic.hide();
            }
          });

        } else {
          
          //if NO filters show all!
          _.each(layer.graphics, function(graphic, i) {
            graphic.show();
          });
          
        }

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
      },

      /**
       * toggles the scrollWheelZoom property on the map
       * @param  {boolean} scroll Enable or Disable scroll
       */
      _toggleScrollZoom: function( scroll ){
        if ( scroll ){
          if (this._map) this._map.enableScrollWheelZoom();
        } else {
          if (this._map) this._map.disableScrollWheelZoom();
        }
      }

    });

  });
})();
