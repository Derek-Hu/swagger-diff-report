var fs = require('fs');
var logger = require('./logger');
var isSwagger = require('./utils').isSwagger;

module.exports = function loadCacheSwagger(filePath) {
    var errorMsg = '缓存中未发现有效的Swagger定义：' + filePath;
    return new Promise(function (resolve) {
        fs.readFile(filePath, function (error, data) {
            if (error) {
                resolve(null);
                return;
            }
            try {
                var result = JSON.parse(data);
                if (isSwagger(result)) {
                    resolve(result);
                } else {
                    logger.warn(errorMsg);
                    resolve(null);
                }
            } catch (e) {
                logger.warn(errorMsg);
                resolve(null);
            }
        });
    });
}