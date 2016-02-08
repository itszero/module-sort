/* @flow */

export function stringSplice(str: string, idx: number, cnt: number, add: string): string {
  return str.slice(0, idx) + (add || '') + str.slice(idx + cnt);
}

export function minBy(arr: Array<any>, func: Function): any {
  return Math.min.apply(null, arr.map(func));
}

export function maxBy(arr: Array<any>, func: Function): any {
  return Math.max.apply(null, arr.map(func));
}
