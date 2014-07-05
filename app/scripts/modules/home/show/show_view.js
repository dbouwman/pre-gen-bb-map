/*global AppName */
if (!this.AppName || typeof this.AppName !== 'object') {
  this.AppName = {};
}
(function () {
  'use strict';
  AppName.module('HomeModule.Show', function (Show, App, Backbone, Marionette, $, _) {

    /*
     * Home/Show/View
     */
    Show.View = Backbone.Marionette.ItemView.extend({
      
      template: 'home/show/show_view.jst.html',

      onRender: function(){
        // App.request('map:create', {mapdiv:'map'}).then(function(){
        //   //do things after the map is created
        // });
      },

      onShow: function(){
        console.log('ShowView.onShow');
        App.request('map:create', {mapdiv:'map', basemap: 'Gray', center: [40,-95], zoom:5 }).then(function(){
          //add our feature layers
          //fire perimeters
          App.execute('map:add:feature-layer','wildfire-perimeters', 'http://tmservices1.esri.com/arcgis/rest/services/LiveFeeds/Wildfire_Activity/MapServer/2',{
            simplifyFactor: 0.75,

            style: function(feature) { 
                return {color:'red', weight:1,opacity:.8,fillColor:'#FF0000',fillOpacity:.2 };
            }

          } );
          //points
          App.execute('map:add:clustered-feature-layer','wildfire-points', 'http://tmservices1.esri.com/arcgis/rest/services/LiveFeeds/Wildfire_Activity/MapServer/0',{
            where: "ACTIVE='Y'",
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            pointToLayer: function (geojson, latlng) {
              return L.marker(latlng, {
                icon: L.icon({
                  iconUrl: 'images/active-fire.png',
                  iconSize: [24, 24],
                  iconAnchor: [8, 8],
                  popupAnchor: [0, -11],
                })
              });
            },
          });

        });
      },

      onBeforeDestroy: function(){
        App.vent.trigger('map:destroy');
      },

      /*
      Initializer called when the view is created
       */
      initialize: function(options){
        console.log('HomeModule.Show.View initializing');
      }

    });


  });
})();