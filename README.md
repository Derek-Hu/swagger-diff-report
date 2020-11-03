[Webpack插件](https://webpack.js.org/plugins/)：
用于检测Swagger API文档是否存在更新，若存在则会生成HTML报告，示例报告见`src/sample/diff.html`
## Usage

```sh
npm install --save-dev @dr/swagger-change-detect-plugin
```

```javascript
// webpack.config.js
const swaggerReportPlugin = require('@dr/swagger-change-detect-plugin');
module.exports = {
    plugins: [
        new swaggerReportPlugin({
            api: 'http://my.site.com/v2/api-docs?group=api'
        })
    ],
};
```
## Full API
```javascript
// webpack.config.js
const swaggerReportPlugin = require('@dr/swagger-change-detect-plugin');

module.exports = {

    plugins: [
        new swaggerReportPlugin({
            // [Required] Swagger API JSON文档定义路径
            api: 'http://my.site.com/v2/api-docs?group=api',
            // [Optional] 缓存Swagger文档目录，用于比对使用，
            // 默认值为【.swagger】
            cacheFolder: '.swagger',
            cacheFileName: 'cacheSwagger.json',
            // [Optional] 当存在更新时，生成的HTML报告文件名
            reportName: 'swagger-change-report.html',
            // [Optional] 是否使用浏览器打开文件，默认为true
            open: true,
            // [Optional] 报告标题，默认为‘Swagger更新检测报告’
            title: '接口变更报告',
            // [Optional] Swagger文档首页，以方便从HTML报告跳转至Swagger文档查看信息
            linkBase: 'http://my.site.com',
            // [Optional] 是否通过webpack生成此报告，当为【true】时，将输出至webpack output指定的目录中
            // 默认值为【false】：生成至【cacheFolder】指定的目录中
            emit: false
        })
    ],
};
```

## 浏览器中使用
当使用Webpack Plugin使用不能获取远程Swagger JSON时，可以通过浏览器获取后，将JSON发送至`@dr/swagger-change-detect-plugin/server.js`, 通过Post方法将数据传输至服务器进行分析
数据格式如下：
```json
{
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
```
## Sample
```
npm install
npm start
```
open `src/sample/report.html` view the result

## Test
```
npm test
```

