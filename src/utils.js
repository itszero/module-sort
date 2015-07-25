export function stringSplice(str, idx, cnt, add) {
  return str.slice(0, idx) + (add || '') + str.slice(idx + cnt);
}

export function minBy(arr, func) {
  return Math.min.apply(null, arr.map(func));
}

export function maxBy(arr, func) {
  return Math.max.apply(null, arr.map(func));
}
