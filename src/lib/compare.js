var ejs = require('ejs');
var path = require('path');
const notifier = require('node-notifier');
var jsdiff = require('./diff');
var logger = require('./logger');
var writeSync = require('./utils').writeSync;
var loadCache = require('./loadCache');
var loadRemote = require('./loadRemote');

function getTimeMessage() {
	var time = new Date();
	var hour = time.getHours();
	var min = time.getMinutes();
	var sec = time.getSeconds();
	return time.getFullYear() + '年' + (time.getMonth() + 1) + '月' + time.getDate() + '日 ' + (hour < 10 ? '0' + hour : hour) + ':' + (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
}
function printDiffs(totalChanges, options) {
	if (!totalChanges.isChange) {
		return null;
	}
	return new Promise(function (resolve) {
		ejs.renderFile(path.resolve(__dirname, '../template/html.ejs'), Object.assign({
			externalLinkBase: options.linkBase,
			url: options.api,
			reportTitle: options.title,
			compareTime: getTimeMessage()
		}, totalChanges), function (err, str) {
			if (err) {
				logger.error(err);
				resolve(null);
			} else {
				resolve(str);;
			}
		});
	});
}
function diffDetail(oldJson, newJson, options) {
	var diffs = null;
	if (JSON.stringify(oldJson) === JSON.stringify(newJson)) {
		return;
	}
	if (oldJson && newJson) {
		logger.debug('比对Swagger定义数据差异...');
		diffs = printDiffs(jsdiff(oldJson, newJson), options)
	}
	if (newJson) {
		logger.debug('更新缓存中Swagger定义');
		writeSync(options.cacheFile, JSON.stringify(newJson, null, 2));
	}
	return diffs;
}
function compare(options, browserData) {
	const newData = browserData ? Promise.resolve(browserData) : loadRemote(options.api);
	return Promise.all([newData, loadCache(options.cacheFile)]).then(
		function (datas) {
			return diffDetail(datas[1], datas[0], options);
		},
		function (errors) {
			notifier.notify({
				title: '加载Swagger API文档失败',
				message: errors,
				timeout: 10
			});
			logger.error(errors);
			return;
		}
	);
}
module.exports = compare;
module.exports.printDiffs = printDiffs;
