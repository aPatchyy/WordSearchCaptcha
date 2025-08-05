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

export function randomLetter() {
    const random = Math.floor(Math.random() * 26);
    const code = 97 + random;
    return String.fromCharCode(code);
}

export function reverseString(str) {
    return str.split('').reverse().join('');
}

export function gaussianRandom(sigma = 1, mu = 0) {
    let u0 = Math.random()
    let u1 = Math.random()
    while (u0 === 0) u0 = Math.random()
    while (u1 === 0) u1 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u0)) * Math.cos(2.0 * Math.PI * u1)
    const z1 = Math.sqrt(-2.0 * Math.log(u0)) * Math.sin(2.0 * Math.PI * u1)
    return [mu + sigma * z0, mu + sigma * z1]
}

export function drawStroke(context, startX, startY, endX, endY, radius, color) {
    let strokeAngle = Math.atan2(endY - startY, endX - startX)
    let angle1 = strokeAngle + Math.PI / 2
    let angle2 = angle1 + Math.PI
    context.beginPath()
    context.arc(startX, startY, radius, angle1, angle2)
    context.arc(endX, endY, radius, angle2, angle1)
    context.fillStyle = color
    context.fill()
    context.closePath()
}


export function angleToDirection(angle) {
    let direction = null
    switch(angle) {
        case 0:
            direction = DIRECTION.RIGHT
            break;
        case -45:
            direction = DIRECTION.UP_RIGHT
            break;
        case -90:
            direction = DIRECTION.UP
            break;
        case -135:
            direction = DIRECTION.UP_LEFT
            break;
        case -180:
            direction = DIRECTION.LEFT
            break;
        case 180:
            direction = DIRECTION.LEFT
            break;
        case 135:
            direction = DIRECTION.DOWN_LEFT
            break;
        case 90:
            direction = DIRECTION.DOWN
            break;
        case 45:
            direction = DIRECTION.DOWN_RIGHT
            break;
        }
    return direction
}

export function invertDirection(direction) {
    return (direction + 4) % 8
}

export function createDisplacementMap(width, height, sigma = 0.2) {
    if (width === 0 || height === 0)
        return ""
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext("2d")
    const imageData = context.createImageData(width, height)
    const data = imageData.data
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < 2; j++) {
            let gaussianPair = gaussianRandom(sigma)
            data[i + j] = 127 + Math.floor(128 * gaussianPair[0])
            data[i + j] = 127 + Math.floor(128 * gaussianPair[1])
            gaussianPair = gaussianRandom(0.15)
            data[i + j + 2] = 127 + Math.floor(128 * gaussianPair[0])
            data[i + j + 2] = 127 + Math.floor(128 * gaussianPair[1])
        }
    }
    context.putImageData(imageData, 0, 0)
    return canvas.convertToBlob().then(blob => URL.createObjectURL(blob))
}