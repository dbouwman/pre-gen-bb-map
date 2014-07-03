
(function(){
    'use strict';
    //Extensions to the Marionette Application object
    _.extend(Backbone.Marionette.Application.prototype,{

        //App.navigate should be called over direct calls to the Backbone.history object
        navigate: function(route, options){
            this.logPageView(route);
            var ops = options || {};
            this._previousRoute = this.getCurrentRoute();
            window.scrollTo(0, 0);
            Backbone.history.navigate(route, ops);
        },

        //Return the current route
        getCurrentRoute: function(){
            var frag = Backbone.history.fragment;

            //fragment does not handle optional or wildcard routes
            //so we manually tack in the search
            //lifted and simplified from https://github.com/jhudson8/backbone-query-parameters/blob/master/backbone.queryparams.js
            if(Backbone.history.location.search && frag && frag.indexOf(unescape(Backbone.history.location.search)) < 0){
                frag = frag + Backbone.history.location.search;
            }

            if(_.isEmpty(frag)){
                return '';
            }else{
                return frag;
            }
        },

        /**
         * Wrapper to send Events to Google Analytics
         * @param  {string} action   Action we are logging. lower-case
         * @param  {string} category standardized event categories
         * @param  {string} label    optional description
         */
        logUiEvent: function(action, category, label){
            var lb = label || '';
            if(window.ga){
                ga('send','event', category, action, lb );
            }

            if(this.environment === 'development') {
                console.log('GA: event: ' + category + '::' + action + ' l: ' + lb);
            }
        },

        /**
         * Centralized function to cleanse strings of markup
         * @param  {string} string String to cleanse
         * @return {string}        Cleansed string
         */
        demarkup: function(string){
          return util.Bleach.demarkup(string);
        },


        /**
         * Wrapper to send Error Events to Google Analytics
         * @param  {string} errorName   [description]
         * @param  {string} description [description]
         * @return {[type]}             [description]
         */
        logError: function(errorName,description){
            this.logUiEvent(errorName, 'errors', description);
            if(console && console.error){
                console.error(errorName + ' :: ' + description);
            }
            
        },

        /**
         * Wrapper that allows us to log pageviews
         * in our SPA 
         */
        logPageView: function(route){

            if(window.ga){
                ga('send','pageview', route);
            }

            if(this.environment === 'development'){
                console.log('GA: pageview::' +  route);
            }
        },

        /**
         * Add an event timer to a hash
         */
        startTimer: function( eventName, category, label , maxDuration){

            if(!this.timers) {
              this.timers = {};
            }
            var obj = {
              eventName: eventName,
              category: category,
              maxDuration: 20000,
              label: 'Telemetry'
            };
            //if optional args are passes, tack them on
            if(label) { obj.label = label; }
            if(maxDuration) { 
                obj.maxDuration = maxDuration; 
            }

            if(this.timers[eventName]){
              console.log('There is already an timer running for event ' + eventName + '. Can you use another name?');
            }else{
              var t = new AppName.Models.Took(obj);
              this.timers[eventName] = t;
            }
            
        },

        /**
         * Find the timer, stop it, report the time, and remove it
         */
        stopTimer: function( eventName ){
          var self = this;
          if(this.timers && this.timers[eventName]){
            this.timers[eventName].stop();
            this.timers[eventName].log();

            var onDone = _.bind(function(){
                delete self.timers[eventName];               
            },this);
            
            this.timers[eventName].store().done(onDone);
            
          }else{
            console.log('No timer running for event ' + eventName + '.');
          }
        },

        /**
         * Simple centralized way to set the title for the current page
         * @param {string} title Title of the page
         */
        setTitle: function(title){
             $(document).attr('title', title);
        },

       

        /**
         * Set the current page and maintain the previous
         * page so the app can take correct transitional actions
         * @param {string} page Page name in the style of 'page:item:map'
         */
        setCurrentPage: function(page){
            if(this._currentPage){
                this._previousPage = this._currentPage;
            }
            this._currentPage = page;
            this.vent.trigger('pageChange', page); 
        },

        /**
         * Get the current page name 
         * @param {string} page Page name in the style of 'page:item:map'
         */
        getCurrentPage: function(){
            if(this._currentPage){
                return this._currentPage;
            }else{
                return '';
            }
        },

        /**
         * Get the name of the previous page
         * @param {string} page Page name in the style of 'page:item:map'
         */
        getPreviousPage: function(){
            if(this._previousPage){
                return this._previousPage;
            }else{
                return '';
            }
        },

        /**
         * Deparameterise a url query string into
         * a json object. Abstracted to App to keep
         * the dependency pushed to the edge of AppName.
         * @param  {string} params Query string params
         * @return {object}        Hash of the parameters
         */
        deparam: function(params, coerce){
            return $.deparam(params, coerce);
        },

        /**
         * Centralized Ajax function for the AppName 
         * application. This avoids having different
         * implementations, strategies etc scattered 
         * all over the application. This simply proxies
         * over to a util class which then uses jQuery
         * @param {string} url     Url that the request will be sent to
         * @param {object} options jQuery ajax options hash
         */
        ajax: function(url, options){

            return util.Xhr.ajax(url, options);
        },

        getJson: function(url){
            
            url = util.UrlHelper.updateUrl(url);
            return $.ajax({
              dataType: 'jsonp',
              url: url
            }).fail(this._reportXhrError);
        },
        /**
         * Report an xhr error.
         * @param  {[type]} jqXhr            Xhr object from Jquery
         * @param  {[type]} textStatus       text status from jquery
         * @param  {[type]} jqXhrErrorThrown Error object from jquery
         */
        _reportXhrError: function(jqXhr, textStatus, jqXhrErrorThrown){
            // for now just log this out
            console.error('XHR Error: ' + textStatus + ' ' + jqXhrErrorThrown  );
            throw 'xhr error!';

        },



        //Simple wrapper for starting the history
        startHistory: function(){
            if(Backbone.history){
                console.log('Hisotry Started w/o push state');
                //todo: add check for pushstate support
                Backbone.history.start({ pushState: false });
            }
        },

        /**
         * Shows a message in a modal dialog
         * @param  {[type]} msg   the message to display
         * @param  {[type]} title the title (optional)
         * @param  {[type]} level the level - info, warning, error (optional, default == info)
         */
        showMessage: function(msg, title, level) { 
          if (!msg) {
            //don't throw errors from here (because we're probably trying to display an error message), just exit
            this.log('AppName.showMessage was called without a message.', null, 0);
            return;
          }

          if (!level) { level = 'info'; }

          //display the message
          var obj = {
            msg: msg,
            title: title,
            level: level
          };
          var model = new Backbone.Model(obj);

          if (!this.messageModal) {
            this.messageModal = new this.Views.ModalView({ 
                template: 'marionette/message-template', 
                model: model 
            });
          } else {
            this.messageModal.model = model;
            this.messageModal.render();
          }
          this.messageModal.show(); 

          //log it to the console
          var logLevel = 5;
          if (level === 'warning') { logLevel = 3; }
          if (level === 'error') { logLevel = 1; } 
          AppName.log(msg, null, logLevel);
        }
        
    });
})();
