var path = require('path');
const URL = require('url');
const notifier = require('node-notifier');
var Utils = require('./lib/utils');
var compare = require('./lib/compare');
var logger = require('./lib/logger');
const xxhashjs = require('xxhashjs');
const opener = require('opener');

const H = xxhashjs.h32(0xABCD) // seed = 0xABCD

function Plugin(params) {
    if (!params || !params.api) {
        return;
    }
    var options = Object.assign({
        cacheFolder: '.swagger'
    }, params);

    var myURL = URL.parse(options.api);
    if (!options.reportName) {
        options.reportName = myURL.host.replace(':', '-');
    }
    if (!(/\.html$/.test(options.reportName))) {
        options.reportName += '.html';
    }
    if (!options.linkBase) {
        options.linkBase = myURL.protocol + '//' + myURL.host + '/swagger-ui.html'
    }
    if (options.cacheFileName) {
        options.cacheFileName = options.cacheFileName.replace(/\.json$/, '');
    }
    var cacheFileName = (options.cacheFileName || H.update(options.api).digest().toString(16)) + '.json';
    options.cacheFile = path.resolve(process.cwd(), options.cacheFolder, cacheFileName);

    this.options = options;
}
Plugin.prototype.apply = function (compiler) {
    var self = this;

    const cacheReportPath = path.resolve(process.cwd(), self.options.cacheFolder, self.options.reportName);
    function notify(data, notOpen) {
        Utils.writeSync(cacheReportPath, data);
        notifier.notify({
            title: 'Swagger文档存在更新',
            message: '详情见：' + cacheReportPath,
            timeout: 10
        });
        if (self.options.open !== false) {
            opener(`${cacheReportPath}`);
        }
        logger.warn('Swagger文档存在更新，详情见：\n' + cacheReportPath)
    }
    // 浏览器使用
    if (!compiler) {
        self.options.open = false;
        return compare(self.options, self.options.browserData)
            .then(function (data) {
                if (data) {
                    notify(data);
                    return cacheReportPath
                }
                return null;
            }).catch(() => {
                return null;
            })
    }
    compiler.plugin("emit", function (compilation, callback) {

        if (self.options.emit) {
            compare(self.options).then(function (data) {
                if (data) {
                    self.existChange = true;
                    notify(data);
                    compilation.assets[self.options.reportName] = {
                        source: function () {
                            return data;
                        },
                        size: function () {
                            return data.length;
                        }
                    };
                }
                callback();
            }, function () {
                callback();
            });
        } else {
            callback();
            compare(self.options).then(function (data) {
                if (data) {
                    notify(data);
                }
            })
        }

    });
}

module.exports = Plugin;