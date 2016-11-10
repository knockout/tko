//
// Object functions
//

export function extend(target, source) {
    if (source) {
        for(var prop in source) {
            if(source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
}

export function objectForEach(obj, action) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            action(prop, obj[prop]);
        }
    }
}


export function objectMap(source, mapping) {
    if (!source)
        return source;
    var target = {};
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
            target[prop] = mapping(source[prop], prop, source);
        }
    }
    return target;
}


export function getObjectOwnProperty(obj, propName) {
    return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
}


export function clonePlainObjectDeep(obj, seen) {
    if (!seen) { seen = []; }

    if (!obj || typeof obj !== 'object'
        || obj.constructor !== Object
        || seen.indexOf(obj) !== -1) {
        return obj;
    }

    // Anything that makes it below is a plain object that has not yet
    // been seen/cloned.
    seen.push(obj);

    var result = {};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            result[prop] = clonePlainObjectDeep(obj[prop], seen);
        }
    }
    return result;
}