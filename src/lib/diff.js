var findResponsVo = require('./utils').findResponsVo;
var getVosDependencies = require('./utils').getVosDependencies;
var diffVo = require('./utils').diffVo;
var diffBasic = require('./utils').diffBasic;

function getTagMaps(json) {

    return json.tags.reduce(function (map, tag) {
        map[tag.name] = tag.description;
        return map;
    }, {});
}
function getParamsMaps(parameters) {
    if (!parameters) {
        return {};
    }
    return parameters.reduce(function (map, param) {
        map[param.name] = param;
        return map;
    }, {});
}
function arrayEquals(oldV, newV) {
    if (!oldV && !newV) {
        return true;
    }
    if (oldV && newV) {
        return oldV.join(', ') === newV.join(', ')
    }
    return false;
}
function isAttrEqual(oldV, newV, key) {
    if (Object.prototype.toString.call(newV[key]) === '[object Object]') {
        return JSON.stringify(oldV[key]) === JSON.stringify(newV[key]);
    } else if (Object.prototype.toString.call(newV[key]) === '[object Array]'
        || Object.prototype.toString.call(oldV[key]) === '[object Array]') {
        return newV[key].join && oldV[key].join && (newV[key].join(',') === oldV[key].join(','));
    } else {
        return oldV[key] === newV[key];
    }
}
function diffReqParams(oldMethod, newMethod, allChanges) {
    var oldP = getParamsMaps(oldMethod.parameters);
    var newP = getParamsMaps(newMethod.parameters);

    if (!allChanges.reqParams) {
        allChanges.reqParams = [];
    }
    function updateChange(attr, label, p, type) {
        if (type === 'update') {
            allChanges.reqParams.push({
                type: type,
                name: p.name,
                attr: attr,
                label: label,
                oldV: oldP[p.name][attr],
                newV: p[attr]
            });
        } else if (type === 'add' || type === 'remove') {
            allChanges.reqParams.push({
                type: type,
                name: p.name,
                attr: attr,
                label: label,
                definition: p
            });
        }
    }

    function addChange(p) {
        allChanges.reqParams.push({
            type: 'add',
            name: p.name,
            definition: p
        });
    }
    var labelsMap = {
        'in': '参数位置',
        'required': '必填',
        'description': '参数描述',
        'type': '参数类型',
        'enum': '参数枚举值',
        'schema': '参数数据格式'
    }
    newMethod.parameters && newMethod.parameters.forEach(function (p) {
        if (!oldP[p.name]) {
            addChange(p);
            return;
        }
        Object.keys(p).forEach(function (key) {
            if (!(key in oldP[p.name])) {
                updateChange(key, labelsMap[key] || '', p, 'add');
                return;
            }
            if (!isAttrEqual(oldP[p.name], p, key)) {
                updateChange(key, labelsMap[key] || '', p, 'update');
            }
        })
        Object.keys(oldP[p.name]).forEach(function (key) {
            if (!(key in p)) {
                updateChange(key, labelsMap[key] || '', oldP[p.name], 'remove');
                return;
            }
        })
    });

    oldMethod.parameters && oldMethod.parameters.forEach(function (p) {
        if (!newP[p.name]) {
            allChanges.reqParams.push({
                type: 'remove',
                name: p.name,
                definition: p
            });
        }
    });
    return allChanges;
}

function getVoApiMapping(paths, tagMaps) {
    const voURLMappings = {};
    paths && Object.keys(paths).forEach(function (url) {
        let urlDefinition = paths[url];
        Object.keys(urlDefinition).forEach(function (method) {
            let methodDefinition = urlDefinition[method];
            if (methodDefinition.parameters) {
                const requstVos = {};
                methodDefinition.parameters.forEach(function (pa) {
                    const changedVo = Object.keys(findResponsVo(pa));
                    if (changedVo && changedVo.length) {
                        changedVo.forEach(function (cv) {
                            if (!requstVos[cv]) {
                                requstVos[cv] = []
                            }
                            requstVos[cv].push(pa.name);
                        })
                    }
                })
                Object.keys(requstVos).forEach(function (vo) {
                    methodDefinition.tags.forEach(function (t) {
                        if (!voURLMappings[vo]) {
                            voURLMappings[vo] = [];
                        }
                        voURLMappings[vo].push({
                            url: url,
                            tag: t,
                            effectedParams: requstVos[vo],
                            _type: 'request',
                            tagName: tagMaps[t],
                            definition: methodDefinition,
                            method: method
                        });
                    })
                })
            }
            if (methodDefinition.responses) {
                Object.keys(methodDefinition.responses).forEach(function (status) {
                    const vos = Object.keys(findResponsVo(methodDefinition.responses[status]));
                    if (vos && vos.length && methodDefinition.tags) {
                        methodDefinition.tags.forEach(function (t) {
                            vos.forEach(function (vo) {
                                if (!voURLMappings[vo]) {
                                    voURLMappings[vo] = [];
                                }
                                voURLMappings[vo].push({
                                    url: url,
                                    status: status,
                                    tag: t,
                                    _type: 'response',
                                    tagName: tagMaps[t],
                                    definition: methodDefinition,
                                    method: method
                                });
                            })
                        })
                    }
                })
            }
        });
    });
    return voURLMappings;
}
function diffResponse(oldMethod, newMethod, allChanges) {
    if (!allChanges.resParams) {
        allChanges.resParams = [];
    }
    Object.keys(newMethod.responses).forEach(function (status) {
        if (!oldMethod.responses[status]) {
            allChanges.resParams.push({
                type: 'add',
                name: status,
                definition: newMethod.responses[status]
            });
            return;
        }
        if (JSON.stringify(oldMethod.responses[status]) !== JSON.stringify(newMethod.responses[status])) {
            allChanges.resParams.push({
                type: 'update',
                name: status,
                oldV: oldMethod.responses[status],
                newV: newMethod.responses[status]
            });
        }
    })
    Object.keys(oldMethod.responses).forEach(function (status) {
        if (!newMethod.responses[status]) {
            allChanges.resParams.push({
                type: 'remove',
                name: status,
                definition: oldMethod.responses[status]
            });
        }
    })
    return allChanges;
}
function diffUrlParams(oldMethod, newMethod, data, changes, oldTagMaps, newTagMaps) {
    if (!oldMethod && !newMethod) {
        return;
    }
    var isExists = false;
    var allChanges = Object.assign({}, data);

    function addHeader(attrName, label, type) {
        if (!isExists) {
            isExists = true;
            allChanges.params = [];
        }
        var data;
        if (type === 'update') {
            data = {
                type: type,
                name: attrName,
                label: label,
                oldV: oldMethod[attrName],
                newV: newMethod[attrName]
            };
        } else if (type === 'add') {
            data = {
                type: type,
                name: attrName,
                label: label,
                definition: newMethod[attrName]
            };
        } else if (type === 'remove') {
            data = {
                type: type,
                name: attrName,
                label: label,
                definition: oldMethod[attrName]
            };
        }
        allChanges.params.push(data)
    }

    function handleAttr(attrName, label) {
        if (!oldMethod[attrName] && newMethod[attrName]) {
            addHeader(attrName, label, 'add');
        } else if (oldMethod[attrName] && !newMethod[attrName]) {
            addHeader(attrName, label, 'remove');
        } else if (oldMethod[attrName] !== newMethod[attrName]) {
            addHeader(attrName, label, 'update');
        }
    }
    if (oldMethod.summary !== newMethod.summary) {
        handleAttr('summary', '接口描述信息');
    }
    if (oldMethod.description !== newMethod.description) {
        handleAttr('description', '接口介绍信息');
    }
    if (oldMethod.operationId !== newMethod.operationId) {
        handleAttr('operationId', '接口方法名称');
    }
    if (oldMethod.deprecated !== newMethod.deprecated) {
        handleAttr('deprecated', '接口废弃状态');
    }
    if (!arrayEquals(oldMethod.consumes, newMethod.consumes)) {
        handleAttr('consumes', '请求参数格式');
    }
    if (!arrayEquals(oldMethod.produces, newMethod.produces)) {
        handleAttr('produces', '请求响应格式');
    }
    if (!arrayEquals(oldMethod.tags, newMethod.tags)) {
        oldMethod.tags.forEach(function (tag) {
            if (newMethod.tags.indexOf(tag) === -1) {
                if (!changes[tag]) {
                    changes[tag] = [];
                }
                changes[tag].push({
                    type: 'remove',
                    url: data.url,
                    tagName: oldTagMaps[tag],
                    method: data.method,
                    definition: oldMethod
                });
            }
        });

        newMethod.tags.forEach(function (tag) {
            if (oldMethod.tags.indexOf(tag) === -1) {
                if (!changes[tag]) {
                    changes[tag] = [];
                }
                changes[tag].push({
                    type: 'add',
                    url: data.url,
                    tagName: newTagMaps[tag],
                    method: data.method,
                    definition: newMethod
                });
            }
        });
    } else {
        allChanges.tagName = newMethod.tags.map(function (tag) {
            return newTagMaps[tag];
        }).join(' ');
    }

    diffReqParams(oldMethod, newMethod, allChanges);
    diffResponse(oldMethod, newMethod, allChanges);
    if (!isExists) {
        isExists = allChanges.reqParams && allChanges.reqParams.length;
    }
    if (!isExists) {
        isExists = allChanges.resParams && allChanges.resParams.length;
    }
    if (isExists) {
        newMethod.tags.forEach(function (tag) {
            if (!changes[tag]) {
                changes[tag] = [];
            }
            changes[tag].push(allChanges);
        });
    }
}

function diffTag(oldTagMaps, newTagMaps) {
    const changes = {};
    Object.keys(oldTagMaps).forEach(function (tag) {
        if (!newTagMaps[tag]) {
            changes[tag] = {
                type: 'remove',
                definition: oldTagMaps[tag]
            }
        }
    });
    Object.keys(newTagMaps).forEach(function (tag) {
        if (!oldTagMaps[tag]) {
            changes[tag] = {
                type: 'add',
                definition: newTagMaps[tag]
            };
            return;
        }
        if (oldTagMaps[tag] !== newTagMaps[tag]) {
            changes[tag] = {
                type: 'update',
                oldV: oldTagMaps[tag],
                newV: newTagMaps[tag],
            }
            return;
        }
    });
    return changes;
}
function diffReponseStructChanges(voChanges, voURLMappings, voDependencies, changes, oldJson, newJson) {
    voChanges.forEach(function (voChange) {
        const voName = voChange.name;
        const relationsVos = [voName].concat(voDependencies[voName]);
        relationsVos && relationsVos.forEach(function (relatedVo) {
            const apis = voURLMappings[relatedVo];
            apis && apis.forEach(function (api) {
                if (!changes[api.tag]) {
                    changes[api.tag] = [];
                }
                var urlChange = changes[api.tag].find(change => change.url === api.url && change.method === api.method);
                if (!urlChange) {
                    urlChange = {
                        url: api.url,
                        method: api.method,
                        type: 'update',
                        tagName: api.tagName,
                        definition: api.definition,
                        resParams: [],
                        reqParams: []
                    };
                    changes[api.tag].push(urlChange);
                }
                if (!urlChange.resParams) {
                    urlChange.resParams = []
                }
                if (!urlChange.reqParams) {
                    urlChange.reqParams = []
                }
                if (api._type === 'request') {
                    urlChange.reqParams.push({
                        name: api.status,
                        causedBy: voName,
                        effectedParams: api.effectedParams,
                        newV: newJson.definitions[voName.replace('#/definitions/', '')],
                        oldV: oldJson.definitions[voName.replace('#/definitions/', '')],
                        type: 'update'
                    });
                } else if (api._type === 'response') {
                    urlChange.resParams.push({
                        name: api.status,
                        causedBy: voName,
                        newV: newJson.definitions[voName.replace('#/definitions/', '')],
                        oldV: oldJson.definitions[voName.replace('#/definitions/', '')],
                        type: 'update'
                    });
                }
            })
        })
    })
}

module.exports = function (oldJson, newJson) {
    if (!oldJson || !newJson || !Object.keys(oldJson).length || !Object.keys(newJson).length) {
        return;
    }

    var oldTagMaps = getTagMaps(oldJson);
    var newTagMaps = getTagMaps(newJson);

    var voURLMappings = getVoApiMapping(newJson.paths, newTagMaps);

    var changes = {};
    Object.keys(oldJson.paths).forEach(function (apiPath) {
        var oldPathUrlMethods = oldJson.paths[apiPath];
        var pathUrlMethods = newJson.paths[apiPath];
        if (!pathUrlMethods) {
            Object.keys(oldPathUrlMethods).forEach(function (method) {
                oldPathUrlMethods[method].tags.forEach(function (tag) {
                    if (!changes[tag]) {
                        changes[tag] = [];
                    }
                    changes[tag].push({
                        type: 'remove',
                        url: apiPath,
                        tagName: oldTagMaps[tag],
                        method: method,
                        definition: oldPathUrlMethods[method]
                    });
                });
            });
        }
    });
    Object.keys(newJson.paths).forEach(function (apiPath) {
        var oldPathUrlMethods = oldJson.paths[apiPath];
        var pathUrlMethods = newJson.paths[apiPath];
        if (!oldPathUrlMethods) {
            Object.keys(pathUrlMethods).forEach(function (method) {
                pathUrlMethods[method].tags.forEach(function (tag) {
                    if (!changes[tag]) {
                        changes[tag] = [];
                    }
                    changes[tag].push({
                        type: 'add',
                        url: apiPath,
                        tagName: newTagMaps[tag],
                        method: method,
                        definition: pathUrlMethods[method]
                    });
                });
            });
            return;
        }
        Object.keys(oldPathUrlMethods).forEach(function (method) {
            if (!pathUrlMethods[method]) {
                oldPathUrlMethods[method].tags.forEach(function (tag) {
                    if (!changes[tag]) {
                        changes[tag] = [];
                    }
                    changes[tag].push({
                        type: 'remove',
                        tagName: oldTagMaps[tag],
                        url: apiPath,
                        method: method,
                        definition: oldPathUrlMethods[method]
                    });
                });
            }
        });
        Object.keys(pathUrlMethods).forEach(function (method) {
            if (!oldPathUrlMethods[method]) {
                pathUrlMethods[method].tags.forEach(function (tag) {
                    if (!changes[tag]) {
                        changes[tag] = [];
                    }
                    changes[tag].push({
                        type: 'add',
                        url: apiPath,
                        tagName: newTagMaps[tag],
                        method: method,
                        definition: pathUrlMethods[method]
                    });
                });
                return;
            }
            diffUrlParams(oldPathUrlMethods[method], pathUrlMethods[method], {
                type: 'update',
                url: apiPath,
                method: method,
                definition: pathUrlMethods[method]
            }, changes, oldTagMaps, newTagMaps);
        });
    });
    const voDependencies = getVosDependencies(newJson.definitions);
    const voChanges = diffVo(oldJson.definitions, newJson.definitions);
    diffReponseStructChanges(voChanges, voURLMappings, voDependencies, changes, oldJson, newJson);
    const tagChanges = diffTag(oldTagMaps, newTagMaps);
    const basicChanges = diffBasic(oldJson, newJson);
    return {
        apiChanges: changes,
        tagChanges: tagChanges,
        basicChanges: basicChanges,
        isChange: Object.keys(changes).length || Object.keys(tagChanges).length || basicChanges.length
    };
}

