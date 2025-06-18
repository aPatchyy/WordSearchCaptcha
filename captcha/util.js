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

export function gaussianRandom(sigma = 1, mu = 0) {
    let u0 = Math.random()
    let u1 = Math.random()
    while(u0 === 0) u0 = Math.random()
    while(u1 === 0) u1 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u0)) * Math.cos(2.0 * Math.PI * u1)
    const z1 = Math.sqrt(-2.0 * Math.log(u0)) * Math.sin(2.0 * Math.PI * u1)
    return [mu + sigma*z0, mu + sigma*z1]
}