import { WordSearch } from "./word-search.js"
import { WORDS } from "./words.js"
import { COLORS } from "./colors.js"
import { DIRECTION, gaussianRandom, print } from "./util.js"

// Change these to adjust difficulty
const NUMBER_OF_WORDS = 4
const ROWS = 5
const COLUMNS = 6
const ALLOWED_DIRECTIONS = [DIRECTION.RIGHT, DIRECTION.DOWN, DIRECTION.UP, DIRECTION.UP_RIGHT, DIRECTION.DOWN_RIGHT]
const NOISE_IMAGES = ["scribble.png", "perlin2.png"]
const ENABLE_BACKGROUND_NOISE = true
const ENABLE_DISPLACEMENT_EFFECT = true
const DISPLACEMENT_SCALE = 27


const container = document.getElementById("captcha-container")
const containerWidth = container.getBoundingClientRect().width
const containerHeight = container.getBoundingClientRect().height
const CANVAS_WIDTH = containerWidth > containerHeight ? (COLUMNS / ROWS) * containerHeight : containerWidth
const CANVAS_HEIGHT = containerWidth > containerHeight ? containerHeight : (ROWS / COLUMNS) * containerWidth

const SQUARE_SIZE = CANVAS_HEIGHT / ROWS

//  Change these as needed for different fonts and board sizes
const STROKE_RADIUS = SQUARE_SIZE * 0.35
const FONT_SIZE = SQUARE_SIZE * 0.6

const letterGridContainer = document.getElementById("letter-grid-container")
const letterGrid = document.getElementById("letter-grid")
const noiseElement = document.getElementById("noise")
const underlayCanvas = document.getElementById("underlay-canvas")
const underlayContext = underlayCanvas.getContext("2d")
underlayCanvas.width = CANVAS_WIDTH
underlayCanvas.height = CANVAS_HEIGHT
underlayContext.globalAlpha = 0.6
const selectionCanvas = document.getElementById("selection-canvas")
const selectionContext = selectionCanvas.getContext("2d")
selectionCanvas.width = CANVAS_WIDTH
selectionCanvas.height = CANVAS_HEIGHT
selectionContext.globalAlpha = 0.5

document.documentElement.style.setProperty("--rows", `${ROWS}`)
document.documentElement.style.setProperty("--columns", `${COLUMNS}`)

document.documentElement.style.setProperty("--random-1", `${1000 * 2 * (Math.random() - 0.5)}`)
document.documentElement.style.setProperty("--random-2", `${1000 * 2 * (Math.random() - 0.5)}`)
document.documentElement.style.setProperty("--random-3", `${1000 * 2 * (Math.random() - 0.5)}`)

if (containerWidth / containerHeight > COLUMNS / ROWS) {
    letterGrid.classList.add("pillar-box")
    underlayCanvas.classList.add("pillar-box")
    selectionCanvas.classList.add("pillar-box")
} else {
    letterGrid.classList.add("letter-box")
    underlayCanvas.classList.add("letter-box")
    selectionCanvas.classList.add("letter-box")
}

if (ENABLE_DISPLACEMENT_EFFECT) {
    if(navigator.userAgent.indexOf("Safari") === -1) {
        underlayCanvas.classList.add("displace")
        selectionCanvas.classList.add("displace")
    }
    letterGridContainer.classList.add("displace")
}

if (ENABLE_BACKGROUND_NOISE) {
    let backgroundImage = ""
    NOISE_IMAGES.forEach(filename => {
        backgroundImage += " url(img/" + filename + "),"
    })
    noiseElement.style.backgroundImage = backgroundImage.slice(0, -1)
}

let wordSearch = new WordSearch(WORDS, NUMBER_OF_WORDS, ALLOWED_DIRECTIONS, COLUMNS, ROWS)
let colorIndex = Math.floor(COLORS.length * Math.random())
let selectionStart = null
let selectionEnd = null

initialize()

document.getElementById("start-button").addEventListener('click', () => {
    document.getElementById("instructions-overlay").style.display = "none"
    container.addEventListener('touchmove', (e) => e.preventDefault())
})

container.addEventListener("contextmenu", (e) => e.preventDefault())
underlayCanvas.addEventListener("pointerdown", handleSelectionStart)
underlayCanvas.addEventListener("pointerup", handleSelectionEnd)
async function initialize() {
    wordSearch.generate()
    for (let row = 0; row < ROWS; row++) {
        for (let column = 0; column < COLUMNS; column++) {
            const div = document.createElement("div")
            const newSpan = document.createElement("span")
            const letter = wordSearch.letters[row][column]
            newSpan.style.fontSize = `${FONT_SIZE}px`
            newSpan.textContent = letter
            div.appendChild(newSpan)
            letterGrid.append(div)
        }
    }
    let map = await createDisplacementMap(Math.round(containerWidth / 10), Math.round(containerHeight / 10))
    document.querySelector("feImage").setAttribute("href", map)
    document.querySelector("feDisplacementMap").setAttribute("scale", DISPLACEMENT_SCALE)
}

function refresh() {
    underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    selectionContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    letterGrid.innerHTML = ''
    selectionStart = null
    selectionEnd = null
    colorIndex = Math.floor(COLORS.length * Math.random())
    document.documentElement.style.setProperty("--random-1", `${1000 * 2 * (Math.random() - 0.5)}`)
    document.documentElement.style.setProperty("--random-2", `${1000 * 2 * (Math.random() - 0.5)}`)
    document.documentElement.style.setProperty("--random-3", `${1000 * 2 * (Math.random() - 0.5)}`)
    initialize()
}

function handleSelectionStart(e) {
    if (!e.isPrimary) return
    
    let rect = underlayCanvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * CANVAS_WIDTH / rect.width
    let mouseY = (e.clientY - rect.top) * CANVAS_HEIGHT / rect.height
    let column = Math.floor(mouseX / SQUARE_SIZE)
    let row = Math.floor(mouseY / SQUARE_SIZE)
    let centerX = (column + 0.5) * SQUARE_SIZE
    let centerY = (row + 0.5) * SQUARE_SIZE

    selectionStart = {
        column,
        row,
        centerX,
        centerY
    }
    
    underlayCanvas.setPointerCapture(e.pointerId)
    underlayCanvas.addEventListener("pointermove", handleSelectionMove)

}

function handleSelectionEnd(e) {
    underlayCanvas.releasePointerCapture(e.pointerId)
    underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    if (selectionEnd !== null) {

        let selection = wordSearch.stringFromSelection(selectionStart.column, selectionStart.row, selectionEnd.column, selectionEnd.row)
        if (wordSearch.checkWord(selection)) {
            drawStroke(selectionContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
            colorIndex = (colorIndex + 1) % COLORS.length
        } else {
            drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, "red")
            setTimeout(() => underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT), 200)
        }

        if (wordSearch.isSolved()) {
            setTimeout(() => window.top.postMessage("success", '*'), 1000);
        }
    }

    selectionStart = null
    selectionEnd = null
    underlayCanvas.removeEventListener("pointermove", handleSelectionMove)
}

function handleSelectionMove(e) {
    let rect = underlayCanvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * CANVAS_WIDTH / rect.width
    let mouseY = (e.clientY - rect.top) * CANVAS_HEIGHT / rect.height
    let relativeX = mouseX - selectionStart.centerX
    let relativeY = mouseY - selectionStart.centerY
    let relativeMagnitude = Math.sqrt(relativeX * relativeX + relativeY * relativeY)
    let angle = Math.atan2(relativeY, relativeX)
    let snappedAngle = (Math.PI / 4) * Math.round(angle * (4 / Math.PI))
    let snapLength = ((180 / Math.PI) * snappedAngle % 90 == 0 ? 1 : Math.sqrt(2)) * SQUARE_SIZE
    let snappedMagnitude = snapLength * Math.round(relativeMagnitude / snapLength)
    let snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
    let snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)

    while (snappedMouseX > CANVAS_WIDTH || snappedMouseX < 0 || snappedMouseY > CANVAS_HEIGHT || snappedMouseY < 0) {
        snappedMagnitude -= snapLength
        snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
        snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)
    }

    let column = Math.floor(snappedMouseX / SQUARE_SIZE)
    let row = Math.floor(snappedMouseY / SQUARE_SIZE)
    let centerX = (column + 0.5) * SQUARE_SIZE
    let centerY = (row + 0.5) * SQUARE_SIZE

    selectionEnd = {
        column,
        row,
        centerX,
        centerY
    }

    underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
}

function drawStroke(context, startX, startY, endX, endY, radius, color) {
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

function createDisplacementMap(width, height, sigma = 0.2) {
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