var request = require('request');
var isSwagger = require('./utils').isSwagger;

module.exports = function loadLatestSwagger(url) {
    return new Promise(function (resolve, reject) {
        var errorMsg = '无效的Swagger JSON数据：' + url;
        request.get({ url }, function (error, response, body) {
            if (error) {
                reject(error);
                return;
            }
            try {
                var result = JSON.parse(body);
                isSwagger(result) ? resolve(result) : reject(errorMsg);
            } catch (e) {
                reject(errorMsg);
            }
        });
    });
}