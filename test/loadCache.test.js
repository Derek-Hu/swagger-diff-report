const loadCache = require('../src/lib/loadCache');
const Utils = require('../src/lib/utils');
const path = require('path');

test('读取有效缓存', () => {
    var filePath = path.resolve(__dirname, 'data/.swagger.json');
    loadCache(filePath).then(result => {
        expect(!!Utils.isSwagger(result)).toBe(true);
    });
});

test('读取无效缓存', () => {
    var filePath = path.resolve(__dirname, 'data/.invalid.swagger.json');
    loadCache(filePath).then(result => {
        expect(!!Utils.isSwagger(result)).toBe(false);
    });
});
test('读取不存在文件', () => {
    var filePath = path.resolve(__dirname, 'data/.notExists.json');
    loadCache(filePath).then(result => {
        expect(!!Utils.isSwagger(result)).toBe(false);
    });
});