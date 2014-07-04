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
      /*
      Initializer called when the view is created
       */
      initialize: function(options){
        console.log('HomeModule.Show.View initializing');
      }

    });


  });
})();