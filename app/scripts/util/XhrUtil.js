/**
 * Centralized Ajax Calls
 *
 * In order ensure consistency in how ajax requests are made across the library
 * we have centralized them in this utility class.
 */

if (!this.util || typeof this.util !== 'object') {
    this.util = {};
}

util.Xhr = {

  /**
   * Simple proxy to jquery but is a handy central means
   * to handle all the ajax requests.
   * @param  {string} url     Url of the request
   * @param  {object} options Hash of options
   */
  ajax: function(url, options){
    //console.info('ajax url: ' + url);
    //remove any handlers as we expect to chain 
    //via the deferreds
    if(options.success){
      delete options.success;
      console.warn('XHR Warning: success callback to util.Xhr.ajax is deprecated. Use .done().');
    }
    if(options.error){
      delete options.error;
      console.warn('XHR Warning: error callback to util.Xhr.ajax is deprecated. Use .fail().');
    }
    if(options.complete){
      delete options.complete;
      console.warn('XHR Warning: complete callback to util.Xhr.ajax is deprecated. Use .always().');
    }
    url = util.UrlHelper.updateUrl(url);    
    return $.ajax(url, options);
  },

  /**
   * Single proxy to jquery.getJson
   * @param  {string} url     Url of the request
   * @param  {object} options Hash of options
   */
  getJSON: function(url){
    //console.info('getJSON url: ' + url);
    url = util.UrlHelper.updateUrl(url);
    return $.getJSON(url);
  }

};
