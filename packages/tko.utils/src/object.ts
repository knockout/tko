//
// Object functions
//

export function hasOwnProperty(obj: any, propName: string) {
  return Object.prototype.hasOwnProperty.call(obj, propName) as boolean;
}

export function extend(target: any, source: any) {
  if (source) {
    for (const prop in source) {
      if (hasOwnProperty(source, prop)) {
        target[prop] = source[prop];
      }
    }
  }
  return target;
}

export function objectForEach<T>(obj: T, action: (prop: keyof T, value: T[keyof T]) => void) {
  for (const prop in obj) {
    if (hasOwnProperty(obj, prop)) {
      action(prop, obj[prop]);
    }
  }
}

export type MappingFunction<TSource, TThis= void> = (value: TSource[keyof TSource], prop: keyof TSource, source: TSource) => any;
export function objectMap<TSource, TThis= void>(source: TSource, mapping: MappingFunction<TSource, TThis>, thisArg?: TThis) {
  if (!source) { return source; }
  if (thisArg) { mapping = mapping.bind(thisArg); }
  const target: any = {};
  for (const prop in source) {
    if (hasOwnProperty(source, prop)) {
      target[prop] = mapping(source[prop], prop, source);
    }
  }
  return target;
}
export function getObjectOwnProperty<TSource>(obj: TSource, propName: keyof TSource) {
  return hasOwnProperty(obj, propName) ? obj[propName] : undefined;
}

export function clonePlainObjectDeep(obj: any, seen?: any[]) {
  if (!seen) { seen = []; }

  if (!obj || typeof obj !== 'object' ||
        obj.constructor !== Object ||
        seen.indexOf(obj) !== -1) {
    return obj;
  }

    // Anything that makes it below is a plain object that has not yet
    // been seen/cloned.
  seen.push(obj);

  const result: any = {};
  for (const prop in obj) {
    if (hasOwnProperty(obj, prop)) {
      result[prop] = clonePlainObjectDeep(obj[prop], seen);
    }
  }
  return result;
}
