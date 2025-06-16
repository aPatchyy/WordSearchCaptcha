export const DIRECTION = {
    RIGHT: 0,
    UP_RIGHT: 1,
    UP: 2,
    UP_LEFT: 3,
    LEFT: 4,
    DOWN_LEFT: 5,
    DOWN: 6,
    DOWN_RIGHT: 7,
}


export const print = console.log

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
        return array;
}

export function randomLetter(isUppercase = false) {
  const startCharCode = isUppercase ? 65 : 97;
  const randomInt = Math.floor(Math.random() * 26);
  const charCode = startCharCode + randomInt;
  return String.fromCharCode(charCode);
}

export function reverseString(str) {
    return str.split('').reverse().join('');
}