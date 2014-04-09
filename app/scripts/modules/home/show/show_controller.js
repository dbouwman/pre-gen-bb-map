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
