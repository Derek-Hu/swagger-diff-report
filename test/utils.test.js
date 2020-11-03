const Utils = require('../src/lib/utils');
const path = require('path');
const fs = require('fs');
const fileName = path.resolve(__dirname, '.test/.test.txt');

test('检测内容是否为Swagger', () => {
    expect(Utils.isSwagger({
        swagger: '2.0'
    })).toBe(true);

    expect(Utils.isSwagger({
        name: '2.0'
    })).toBe(false);
});

test('写入文件时，自动生成目录', () => {
    expect(() => {
        try {
            fs.unlinkSync(fileName);
        } catch (e) {
        }
        Utils.writeSync(
            fileName,
            'test data'
        );
        fs.unlinkSync(fileName);
        fs.rmdirSync(path.resolve(__dirname, '.test'));
    }).not.toThrow();

});

test('检测获取Schema', () => {
    expect(Utils.findResponsVo({
        "type": "object",
        "properties": {
            "appStatusExt": {
                "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.AppStatusExt"
            },
            "extra": {
                "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.extra"
            },
            "job": {
                "$ref": "#/definitions/借款主题工作信息: LoanAppConfigBo.Job"
            }
        }
    })).toEqual({
        '#/definitions/loanApp拓展属性:LoanAppConfigBo.AppStatusExt': true,
        '#/definitions/loanApp拓展属性:LoanAppConfigBo.extra': true,
        '#/definitions/借款主题工作信息: LoanAppConfigBo.Job': true
    })
});


test('检测响应数据结构依赖关系', () => {
    expect(Utils.getVosDependencies({
        "App": {
            "type": "object",
            "properties": {
                "appStatusExt": {
                    "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.AppStatusExt"
                }
            }
        },
        'loanApp拓展属性:LoanAppConfigBo.AppStatusExt': {
            "type": "object",
            "properties": {
                "link": {
                    "type": "string"
                },
            }
        },
        "ApplicationAbilityBo": {
            "type": "object",
            "properties": {
                "applicationMode": {
                    "type": "string",
                    "enum": [
                        "FIRST_LOAN",
                        "RELOAN",
                        "FORBIDDEN"
                    ]
                }
            }
        },
    })).toEqual({
        "#/definitions/loanApp拓展属性:LoanAppConfigBo.AppStatusExt": [
            '#/definitions/App'
        ]
    })
});

test('检测响应数据结构变化', () => {
    const changes = Utils.diffVo(
        {
            "App": {
                "type": "object",
                "properties": {
                    "appStatusExt": {
                        "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.AppStatusExt"
                    },
                    "extra": {
                        "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.extra"
                    },
                    "job": {
                        "$ref": "#/definitions/借款主题工作信息: LoanAppConfigBo.Job"
                    },
                    "loan": {
                        "$ref": "#/definitions/借款基本信息: LoanAppConfigBo.Loan"
                    },
                    "loanRefer": {
                        "$ref": "#/definitions/借款销售关系表: LoanAppConfigBo.LoanRefer"
                    },
                    "person": {
                        "$ref": "#/definitions/个人信息:LoanAppConfigBo.Person"
                    }
                }
            },
            'Student': {
                "type": 'string'
            }
        },
        {
            'Teacher': {
                id: 'number'
            },
            "App": {
                "type": "object",
                "properties": {
                    "appStatusExt": {
                        "type": "string"
                    },
                    "extra": {
                        "$ref": "#/definitions/loanApp拓展属性:LoanAppConfigBo.extra"
                    },
                    "job": {
                        "$ref": "#/definitions/借款主题工作信息: LoanAppConfigBo.Job"
                    },
                    "loan": {
                        "$ref": "#/definitions/借款基本信息: LoanAppConfigBo.Loan"
                    },
                    "loanRefer": {
                        "$ref": "#/definitions/借款销售关系表: LoanAppConfigBo.LoanRefer"
                    },
                    "person": {
                        "$ref": "#/definitions/个人信息:LoanAppConfigBo.Person"
                    }
                }
            },
        });
    expect(changes.find(change => change.name === '#/definitions/Student').type).toBe('remove')
    expect(changes.find(change => change.name === '#/definitions/App').type).toBe('update');
    expect(changes.find(change => change.name === '#/definitions/Teacher').type).toBe('add')
})