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
                _.bindAll(this);
                this.pageName = 'page:home:show';
            },


            /**
             * Initialize the map
             */
            initMap: function(){
              this._execMapReset();
              
            },

            //Initializer
            initUi: function () {
                _.bindAll(this);
                

             

            },

            
            /**
             * Clean up function. 
             */
            onClose: function(e){
                //App.log('CLEANING: HomeModule.show.onClose fired');
                //add any additonal destroy logic
            },

            
            /**
             * Callback for a pjax request to load the #main-region with the bulk of the page
             * Attach in the layout, and all the views
             */
            _processFullPageResults: function(){
                
                //now that the pjax content request is completed, show the content
                App.setPageStyles(this.pageName);
                App.slideRegion.show(this.view, 'home');
                //===================================================
                //IMPORTANT! has to be after the show call
                //so that if we were on search page AND it had WithinExtent
                //enabled, AND the user hit the BACK button to get here
                //we need to make sure that the Search layout is closed,
                //which is what detaches the onMapExtentChanged handler.
                //If not, the the mapReset in initMap will fire the 
                //extent handler, and this will be a search
                this.initMap();
                //===================================================
                App.loaderDone(true);
                
            },

            /* 
             * Execute wrappers so we can spy/fake these calls 
             */
            _execSearchClear: function(){
              App.execute('search:clear');
            }

        });

    });

})();
