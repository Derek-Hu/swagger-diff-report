var fs = require('fs');
var path = require('path');
const notifier = require('node-notifier');

var jsdiff = require('../lib/diff');
var printDiffs = require('../lib/compare').printDiffs;

var oldJson = require('../../test/data/.swagger.json');
var newJson = require('./remote.json');

var differences = jsdiff(oldJson, newJson);
var reports = printDiffs(differences, {
    linkBase: 'http://10.18.19.126:22700/swagger-ui.html'
});

if (reports) {
    reports.then(function (data) {
        fs.writeFileSync(path.resolve(__dirname, 'report.html'), data);
        notifier.notify({
            title: 'Swagger文档存在更新',
            message: '详情见：' + path.resolve(__dirname, 'report.html'),
            timeout: 5
        });
    })
}