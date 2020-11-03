const logger = require('../src/lib/logger');

test('日志工具支持', () => {
    expect('info' in logger).toBe(true);
    expect('warn' in logger).toBe(true);
    expect('debug' in logger).toBe(true);
    expect('error' in logger).toBe(true);
});