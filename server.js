
var fs = require('fs');
const Plugin = require('./src/index');
var express = require('express');
var bodyParser = require('body-parser');

['SIGINT', 'SIGTERM'].forEach(function(sig) {
    process.on(sig, function() {
      process.exit();
    });
});

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json({
    limit: '50000kb'
}))

const html = `
<html>
    <head>
    <meta charset="utf-8">
    </head>
    <body>
        使用文档：Body中传递数据格式如下：
        <code><pre>{
            // [Required] 远程Swagger JSON URL
            api: 'http://my.site.com/v2/api-docs?group=api',
            // [Required] Swagger JSON 内容
            browserData: {},
            // [Optional] 缓存数据文件夹，默认值为【.swagger】
            cacheFolder: '.swagger',
            // [Optional] 缓存文件名
            cacheFileName: 'cacheSwagger.json',
            // [Optional] 报告文件名
            reportName: 'swagger-change-report.html',
            // [Optional] 报告标题，默认为‘Swagger更新检测报告’
            title: '接口变更报告',
            // [Optional] Swagger文档首页，以方便从HTML报告跳转至Swagger文档查看信息
            linkBase: 'http://my.site.com',
        }
        </pre></code>
    </body>
</html>`

let reportPath;
app.use(function (request, response, next) {
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }
    next();
});
app.get('/', function (request, response) {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    if (reportPath) {
        let reportData;
        try {
            reportData = fs.readFileSync(reportPath);
        } catch (e) {
            reportData = html;
        }
        response.end(reportData);
    } else {
        response.end(html);
    }
});

app.post('/', function (request, response) {
    try {
        const param = request.body;
        if (!param.api || !param.browserData) {
            console.log(e);
            response.writeHead(400, { 'Content-Type': 'text/html' });
            response.end(html);
            return;
        }
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        new Plugin(param).apply().then(data => {
            if (data) {
                reportPath = data;
                response.end(JSON.stringify({ hasChange: true }))
            } else {
                response.end();
            }
        }).catch(() => {
            response.end();
        });
    } catch (e) {
        console.log(e);
        response.writeHead(500);
        response.end(JSON.stringify(e.toString()));
    }
});

module.exports = function (port) {
    const host = '127.0.0.1'
    app.listen(port, host, function () {
        console.log(`Listening at http://${host}:${port}`)
    })
};
