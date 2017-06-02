/* 
 *
 * This file is used to provide tool functions that provide accessibility to other data operations
 *
 */


var Util = (function(global) {
    var win = global.window;

    var prefix = 'frogger_game_';
    /* Localstorage is stored as a string, so the JSON object needs to 
     * be transformed before it can be accessed, read the same
     */
    var StorageGetter = function(key) {
        var stringValue = win.localStorage.getItem(prefix + key);
        return JSON.parse(stringValue);
    };
    var StorageSetter = function(key, value) {
        var stringValue = JSON.stringify(value);
        win.localStorage.setItem(prefix + key, stringValue);
    };

    /* Caching picture resources to Localstorage*/
    var storeImg = function(img, url) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        /* Ensure canvas is large enough */
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        var storageFile = StorageGetter(url) || {};

        /* The following is the key to capturing image information as a string, which requires running this line of code on the server.
         * and requires META tags inside the HTML, set access rights across the domain processing, otherwise canvas can not
         * URL execution Todataurl function for other domains
         */
        storageFile.img = canvas.toDataURL(url);
        storageFile.time = Date.now();
        try {
            StorageSetter(url, storageFile);
        } catch (e) {
            console.log("Storage failed: " + e);
        }
    };

    /* Read the corresponding picture resource from Localstorage */
    var getImg = function(url) {
        var storageFile = StorageGetter(url);
        var now = Date.now();

        /* Set a expiration times, over which you need to retrieve from the server */
        var warrantyPeriod = 1000 * 60 * 60 * 24 * 30;
        if (storageFile === null || (now - storageFile.time) > warrantyPeriod) {
            return null;
        }
        return storageFile.img;
    };

    return {
        StorageGetter: StorageGetter,
        StorageSetter: StorageSetter,

        getImg: getImg,
        storeImg: storeImg

    };
})(this);
