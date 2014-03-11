/*global AppName */
if (!this.AppName || typeof this.AppName !== 'object') {
    this.AppName = {};
}
(function () {
    
    'use strict';
    //Home Module that controls the / and /home routes
    AppName.module('HomeModule', function (HomeModule, App, Backbone, Marionette, $, _) {
        
        //Router for the module
        HomeModule.Router = Backbone.Marionette.AppRouter.extend({
            appRoutes:{
                '':'show',
                'home': 'show',
                'about': 'about'
            }
        });

        //Add the router during the initialization 
        HomeModule.addInitializer(function (options) {
            new HomeModule.Router({controller:HomeModule.API});           
        });

        //Simple API object that provides the implementation for the routes
        HomeModule.API = {
            show: function(options){

                if(!this.homeController){
                  this.homeController = new HomeModule.Show.Controller(options);
                }

                this.homeController.initUi(options);
            },
            about: function(options){
                if(!this.aboutController){
                  this.aboutController = new AboutModule.Show.Controller(options);
                }

                this.aboutController.initUi(options);
            }
        };

    });
})();