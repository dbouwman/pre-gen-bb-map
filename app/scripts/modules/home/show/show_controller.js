/*global AppName */
if (!this.AppName || typeof this.AppName !== 'object') {
    this.AppName = {};
}

(function () {

    'use strict';
    
    
    AppName.module('HomeModule.Show', function (Show, App, Backbone, Marionette, $, _) {
            
        /**
         * Home controller for the main page of the application
         */
        Show.Controller = App.Controllers.Base.extend({ 

            initialize: function(options){
                //having a page name can be useful...
                this.pageName = 'page:home:show';

                //Add application logic to spin up the page. 
                //Usually this involves fetching models, and initializing views
                this.view = new Show.View();
                
                this.view.on('show', function(){
                    console.log('View Show');
                    App.request('map:create', {mapdiv:'map'}).then(function(){
                    //do things after the map is created
                    });
                });
                this.region.on('show', function(view){
                    console.log('Region Show ', view);
                });
                this.region.on('before:show', function(view){
                    console.log('Region before:show ', view);
                });
                this.region.on('before:swap', function(view){
                    console.log('Region before:swap ', view);
                });
                this.region.on('swap', function(view){
                    console.log('Region swap ', view);
                });
                this.region.show(this.view);
            },

            
            /**
             * Clean up function. 
             */
            onClose: function(e){
                console.log('CLEANING: HomeModule.show.onClose fired');
                //add any additonal destroy logic
            }

        });

    });

})();
