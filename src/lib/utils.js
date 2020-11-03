var path = require('path');
var fs = require('fs');
var iconv = require('iconv-lite');

module.exports.isSwagger = function isSwagger(json) {
    return json && ('swagger' in json);
}

function createFolderIfNotExists(outputFilePath) {
    var parent = path.dirname(outputFilePath);
    if (!fs.existsSync(parent)) {
        createFolderIfNotExists(parent);
        fs.mkdirSync(parent);
    }
}
module.exports.diffBasic = function (oldJson, newJson) {
    var changes = [];
    if (oldJson.swagger !== newJson.swagger) {
        changes.push({
            type: 'update',
            name: 'swagger',
            oldV: oldJson.swagger,
            newV: newJson.swagger
        });
    }
    if (oldJson.basePath !== newJson.basePath) {
        changes.push({
            type: 'update',
            name: 'basePath',
            oldV: oldJson.basePath,
            newV: newJson.basePath
        });
    }
    return changes;
}
module.exports.diffVo = function (oldDefinitions, newDefinitions) {
    const changes = [];
    newDefinitions && Object.keys(newDefinitions).forEach(function (definition) {
        if (!oldDefinitions || !oldDefinitions[definition]) {
            changes.push({
                type: 'add',
                name: '#/definitions/' + definition,
                definition: newDefinitions[definition]
            })
        } else if (oldDefinitions[definition]) {
            if (JSON.stringify(oldDefinitions[definition]) !== JSON.stringify(newDefinitions[definition])) {
                changes.push({
                    type: 'update',
                    name: '#/definitions/' + definition,
                    newV: newDefinitions[definition],
                    oldV: oldDefinitions[definition]
                })
            }
        }
    });

    oldDefinitions && Object.keys(oldDefinitions).forEach(function (definition) {
        if (!newDefinitions || !newDefinitions[definition]) {
            changes.push({
                type: 'remove',
                name: '#/definitions/' + definition,
                definition: oldDefinitions[definition]
            })
        }
    });

    return changes;
};
module.exports.writeSync = function (outputFilePath, content) {
    createFolderIfNotExists(outputFilePath);
    fs.writeFileSync(iconv.encode(outputFilePath, 'utf8'), content);
}
function getAllVoEffected(currentVo, voDependencies, relationsVos) {
    while (currentVo && currentVo.length) {
        const isAdded = currentVo.every(function (v) {
            return relationsVos.indexOf(v) !== -1;
        })
        if (isAdded) {
            break;
        }
        currentVo.forEach(function (vo) {
            if (relationsVos.indexOf(vo) === -1) {
                relationsVos.push(vo);
                getAllVoEffected(voDependencies[vo], voDependencies, relationsVos)
            }
        })
    }
}
module.exports.getVosDependencies = function (definitions) {
    var mappings = {};
    if (!definitions) {
        return mappings;
    }
    Object.keys(definitions).forEach(function (definition) {
        const vos = findVo(definitions[definition]);
        vos && Object.keys(vos).forEach(function (vo) {
            if (!mappings[vo]) {
                mappings[vo] = [];
            }
            mappings[vo].push('#/definitions/' + definition);
        })
    });

    const finalMapping = {};
    Object.keys(mappings).forEach(function (vo) {
        const relationsVos = [];
        getAllVoEffected(mappings[vo], mappings, relationsVos);
        finalMapping[vo] = relationsVos;
    })
    return finalMapping;
}

function findVo(json) {
    if (!json) {
        return {};
    }
    var vos = {};
    Object.keys(json).forEach(function (key) {
        if (key === '$ref') {
            vos[json[key]] = true;
        } else if (Object.prototype.toString.call(json[key]) === '[object Object]') {
            vos = Object.assign(vos, findVo(json[key]));
        }
    })
    return vos;
}

module.exports.findResponsVo = findVo;

