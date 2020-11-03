const loadRemote = require('../src/lib/loadRemote');

jest.mock('request');
const request = require('request');

test('加载远程Swagger网络异常', () => {
    request.get.mockImplementation((params, cb) => cb('Newwork Issue'))

    return loadRemote('http://www.baidu.com').catch((result) => {
        expect(result).toBe('Newwork Issue');
    });
});

test('加载远程Swagger: 无效内容', () => {
    request.get.mockImplementation((params, cb) => cb(null, null, '{}'))

    return loadRemote('http://www.baidu.com').catch((result) => {
        expect(typeof result).toBe('string');
    });
});

test('加载有效Swagger', () => {
    request.get.mockImplementation((params, cb) => cb(null, null, '{ "swagger": "2.0" }'))

    return loadRemote('http://www.baidu.com').then((result) => {
        expect(result).toEqual({ swagger: '2.0' });
    });
});