const diff = require('../src/lib/diff');
const fs = require('fs');
const path = require('path');
var cacheFilePath = path.resolve(__dirname, 'data/.swagger.json');
var remoteFilePath = path.resolve(__dirname, 'data/remote.json');

const localJson = JSON.parse(fs.readFileSync(cacheFilePath));
const remoteJson = JSON.parse(fs.readFileSync(remoteFilePath));

var totalChanges = diff(localJson, remoteJson);

var changes = totalChanges.apiChanges;
var tagChanges = totalChanges.tagChanges;
var basicChanges = totalChanges.basicChanges;

test('检测Swagger URL Method变动', () => {
    expect(changes['health-controller'].length > 0).toBe(true);
    const healthChange = changes['health-controller'].find(change => change.url === '/checkhealth');
    expect(healthChange).not.toBeNull();
    const summaryChange = healthChange.params.find(change => change.name === 'summary');
    expect(summaryChange).toEqual({
        label: "接口描述信息",
        name: "summary",
        oldV: "应用检测",
        newV: "应用健康检测",
        type: "update"
    });

    const consumesChange = healthChange.params.find(change => change.name === 'consumes');
    expect(consumesChange).toEqual({
        "type": "update",
        "name": "consumes",
        "label": "请求参数格式",
        "oldV": ["application/json"],
        "newV": ["x-www-form-urlencoded"]
    });

    const producesChange = healthChange.params.find(change => change.name === 'produces');
    expect(producesChange).toEqual({
        "type": "update",
        "name": "produces",
        "label": "请求响应格式",
        "oldV": ["*/*"],
        "newV": ["*/*", "*/html"]
    });

    const operationIdChange = healthChange.params.find(change => change.name === 'operationId');
    expect(operationIdChange).toEqual({
        "type": "update",
        "name": "operationId",
        "label": "接口方法名称",
        "oldV": "healthCheckUsingGET",
        "newV": "healthStatusCheckUsingGET"
    });

});

test('检测Swagger URL 请求参数变动', () => {
    expect(changes['health-controller'].length > 0).toBe(true);
    const healthChange = changes['health-controller'].find(change => change.url === '/checkhealth');
    expect(healthChange).not.toBeNull();
    const descriptionChange = healthChange.reqParams.find(change => change.name === 'Authorization' && change.attr === 'description');
    expect(descriptionChange).toEqual({
        "type": "update",
        "name": "Authorization",
        "attr": "description",
        "label": "参数描述",
        "oldV": "JWT令牌",
        "newV": "JWT身份令牌"
    });

    const requiredChange = healthChange.reqParams.find(change => change.name === 'Authorization' && change.attr === 'required');
    expect(requiredChange).toEqual({
        "type": "update",
        "name": "Authorization",
        "attr": "required",
        "label": "必填",
        "oldV": false,
        "newV": true
    });

    const inChange = healthChange.reqParams.find(change => change.name === 'Authorization' && change.attr === 'in');
    expect(inChange).toEqual({
        "type": "update",
        "name": "Authorization",
        "attr": "in",
        "label": "参数位置",
        "oldV": "header",
        "newV": "body"
    });

    const typeChange = healthChange.reqParams.find(change => change.name === 'Authorization' && change.attr === 'type');
    expect(typeChange).toEqual({
        "type": "update",
        "name": "Authorization",
        "attr": "type",
        "label": "参数类型",
        "oldV": "string",
        "newV": "number"
    });

    const timeChange = healthChange.reqParams.find(change => change.name === 'time');
    expect(timeChange).toEqual({
        "type": "add",
        "name": "time",
        "definition": { "name": "time", "in": "query", "description": "时间戳", "required": false, "type": "number" }
    });

});

test('检测Swagger URL 响应数据结构变动', () => {
    expect(changes['health-controller'].length > 0).toBe(true);
    const healthChange = changes['health-controller'].find(change => change.url === '/checkhealth');
    expect(healthChange).not.toBeNull();
    const updateChange = healthChange.resParams.find(change => change.name === '200');
    expect(updateChange).toEqual({
        "type": "update",
        "name": "200",
        "oldV": { "description": "OK", "schema": { "type": "string" } },
        "newV": { "description": "Done", "schema": { "type": "string" } }
    });

    const removeChange = healthChange.resParams.find(change => change.name === '401');
    expect(removeChange).toEqual({
        "type": "remove",
        "name": "401",
        "definition": { "description": "Unauthorized" }
    });

    const addChange = healthChange.resParams.find(change => change.name === '301');
    expect(addChange).toEqual({
        "definition": {
            "description": "Moved Permanently",
            "schema": { "type": "string" }
        },
        "name": "301",
        "type": "add"
    });

});

test('检测某URL所有接口删除', () => {
    expect(changes['InternalLoanAppConfigController'].length > 0).toBe(true);
    expect(changes['InternalLoanAppConfigController'].every(method => method.type === 'remove')).toBe(true);
});

test('检测URL某HTTP Method接口删除与添加', () => {
    expect(changes['LoanApplicationController'].length > 0).toBe(true);
    expect(changes['LoanApplicationController'].find(change => change.type === 'remove' && change.method === 'post')).not.toBeNull();
    expect(changes['LoanApplicationController'].find(change => change.type === 'add' && change.method === 'put')).not.toBeNull();
});

test('检测URL添加', () => {
    expect(changes['EcommerceAuthorizationController'].length > 0).toBe(true);
    expect(changes['EcommerceAuthorizationController'].find(change => change.type === 'remove')).not.toBeNull();
    expect(changes['EcommerceAuthorizationController'].find(change => change.type === 'add')).not.toBeNull();
});

test('检测URL Controller目录调整', () => {
    expect(changes['BankStateAuthorizationController'].length > 0).toBe(true);
    expect(changes['BankStateAuthorizationController'].every(change => change.type === 'add')).toBe(true);

    expect(changes['BankStatementAuthorizationController'].length > 0).toBe(true);
    expect(changes['BankStatementAuthorizationController'].every(change => change.type === 'remove')).toBe(true);
});

test('检测tags信息修改', () => {
    expect(changes['BankStateAuthorizationController'].length > 0).toBe(true);
    expect(changes['BankStateAuthorizationController'].every(change => change.type === 'add')).toBe(true);

    expect(changes['BankStatementAuthorizationController'].length > 0).toBe(true);
    expect(changes['BankStatementAuthorizationController'].every(change => change.type === 'remove')).toBe(true);
});

test('检测tags信息单独修改', () => {
    var addChange = tagChanges['BankStateAuthorizationController'];
    expect(addChange).not.toBeNull();
    expect(addChange.type).toBe('add');

    var addChange = tagChanges['NBACreditAppController'];
    expect(addChange).not.toBeNull();
    expect(addChange.type).toBe('remove');

    var addChange = tagChanges['BillController'];
    expect(addChange).not.toBeNull();
    expect(addChange.type).toBe('update');

})

test('检测Response数据结构修改', () => {
    var addChange = changes['CreditCardAuthorizationController'].find(change => change.url === '/v3/authorizations/credit-card/bank-acronyms' && change.method === 'get');
    expect(addChange).not.toBeNull();
    expect(addChange.resParams.length > 0).toBe(true);
})

test('检测基本信息修改', () => {
    var addChange = basicChanges.find(change => change.name === 'swagger');
    expect(addChange).not.toBeNull();
    expect(addChange).toEqual({
        type: 'update',
        name: 'swagger',
        oldV: '2.0',
        newV: '2.1'
    });

    var addChange = basicChanges.find(change => change.name === 'basePath');
    expect(addChange).not.toBeNull();
    expect(addChange).toEqual({
        type: 'update',
        name: 'basePath',
        oldV: '/',
        newV: '/api'
    });

})

test('检测响应数据结构改变导致URL修改', () => {
    var voChange = changes['SocialInsuranceAuthorizationController'].find(change => change.url === '/v3/authorizations/social-insurance/confirmations');
    expect(voChange).not.toBeNull();
    expect(voChange.resParams).not.toBeNull();
    expect(voChange.resParams[0].causedBy).toBe('#/definitions/NextDataSourceBo');

    voChange = changes['HouseFundAuthorizationController'].find(change => change.url === '/v3/authorizations/housing-fund/confirmations');
    expect(voChange).not.toBeNull();
    expect(voChange.resParams).not.toBeNull();
    expect(voChange.resParams[0].causedBy).toBe('#/definitions/NextDataSourceBo');

})

test('检测接口废弃状态变更', () => {
    const healthChange = changes['RepaymentController'].find(change => change.url === '/v3/borrow-accounts/{borrowerId}/loans/{loanId}' && change.method === 'get');
    expect(healthChange).not.toBeNull();
    const operationIdChange = healthChange.params.find(change => change.name === 'deprecated');
    expect(operationIdChange).toEqual({
        "definition": true,
        "label": "接口废弃状态",
        "name": "deprecated",
        "type": "remove"
    });
})