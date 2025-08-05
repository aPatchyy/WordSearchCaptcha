import { WordSearch } from "./word-search.js"
import { WORDS } from "./words.js"
import { COLORS } from "./colors.js"
import { WordInfo } from "./word-info.js"
import { DirectedLocation } from "./directed-location.js"
import { DIRECTION, print, reverseString, createDisplacementMap, invertDirection, angleToDirection, drawStroke } from "./util.js"

//  Number of words to place and find in the puzzle
const NUMBER_OF_WORDS = 6

//  Grid Dimensions
const ROWS = 5
const COLUMNS = 6

//  Directions words can be placed (all directions located in util)
const ALLOWED_DIRECTIONS = [
    DIRECTION.RIGHT,
    DIRECTION.DOWN,
    DIRECTION.UP_RIGHT,
    DIRECTION.DOWN_RIGHT
]

//  Images applied to background of noise element and randomly offset
const ENABLE_NOISE = true
const NOISE_IMAGES = ["scribble.png", "perlin.png"]

//  Make the letters (and/or strokes) wobbly like typical captchas
const ENABLE_DISPLACEMENT_EFFECT_TEXT = false
const ENABLE_DISPLACEMENT_EFFECT_STROKE = false
const DISPLACEMENT_SCALE = 20

//  Generate new puzzle after selecting maximum number of incorrect selections
const ENABLE_FAILING = true
const MAX_INCORRECT_SELECTIONS = 5

const container = document.getElementById("captcha-container")
const containerWidth = container.getBoundingClientRect().width
const containerHeight = container.getBoundingClientRect().height
const CANVAS_WIDTH = containerWidth > containerHeight ? (COLUMNS / ROWS) * containerHeight : containerWidth
const CANVAS_HEIGHT = containerWidth > containerHeight ? containerHeight : (ROWS / COLUMNS) * containerWidth

const SQUARE_SIZE = CANVAS_HEIGHT / ROWS

//  Change these numbers as needed for different fonts and board sizes
const STROKE_RADIUS = SQUARE_SIZE * 0.35
const FONT_SIZE = SQUARE_SIZE * 0.6

const canvasContainer = document.getElementById("canvas-container")
const instructionOverlay = document.getElementById("instructions-overlay")
const instructionMessage = instructionOverlay.querySelector("h2")
instructionMessage.textContent = "Solve this word search to continue. Find all " + NUMBER_OF_WORDS + " words."

const startButton = instructionOverlay.querySelector("button")
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

if (containerWidth / containerHeight > COLUMNS / ROWS) {
    letterGrid.classList.add("pillar-box")
    underlayCanvas.classList.add("pillar-box")
    selectionCanvas.classList.add("pillar-box")
} else {
    letterGrid.classList.add("letter-box")
    underlayCanvas.classList.add("letter-box")
    selectionCanvas.classList.add("letter-box")
}

if (ENABLE_DISPLACEMENT_EFFECT_TEXT) {
    letterGridContainer.classList.add("displace")
}

if (ENABLE_DISPLACEMENT_EFFECT_STROKE) {
    if (navigator.userAgent.indexOf("Safari") === -1) {
        canvasContainer.classList.add("displace")
    }
}

if (ENABLE_NOISE) {
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
let selectionDirection = null
let incorrectSelections = 0

startButton.addEventListener('click', () => {
    instructionOverlay.style.display = "none"
    container.addEventListener('touchmove', (e) => e.preventDefault())
})

container.addEventListener("contextmenu", (e) => e.preventDefault())
underlayCanvas.addEventListener("pointerdown", handleSelectionStart)
underlayCanvas.addEventListener("pointerup", handleSelectionEnd)

initialize()

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
    noiseElement.style.backgroundPositionX = `${1000 * 2 * (Math.random() - 0.5)}%`
    noiseElement.style.backgroundPositionY = `${1000 * 2 * (Math.random() - 0.5)}%`
    let mapURL = await createDisplacementMap(Math.round(containerWidth / 10), Math.round(containerHeight / 10))
    document.querySelector("feImage").setAttribute("href", mapURL)
    document.querySelector("feDisplacementMap").setAttribute("scale", DISPLACEMENT_SCALE)
}

function refresh() {
    underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    selectionContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    letterGrid.innerHTML = ''
    selectionStart = null
    selectionEnd = null
    selectionDirection = null
    incorrectSelections = 0
    colorIndex = Math.floor(COLORS.length * Math.random())
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

        let selectedString = wordSearch.stringFromSelection(selectionStart.column, selectionStart.row, selectionEnd.column, selectionEnd.row)
        let forwardWord = new WordInfo(selectedString, new DirectedLocation(selectionStart.column, selectionStart.row, selectionDirection))
        let reverseWord = new WordInfo(reverseString(selectedString), new DirectedLocation(selectionEnd.column, selectionEnd.row, invertDirection(selectionDirection)))

        if (wordSearch.checkWord(forwardWord) || wordSearch.checkWord(reverseWord)) {
            drawStroke(selectionContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
            colorIndex = (colorIndex + 1) % COLORS.length
        } else {
            incorrectSelections++
            drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, "red")
            setTimeout(() => underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT), 200)
        }

        if (wordSearch.isSolved()) {
            setTimeout(() => window.top.postMessage("success", '*'), 1000);
        }

        if (ENABLE_FAILING && incorrectSelections >= MAX_INCORRECT_SELECTIONS) {
            instructionMessage.textContent = "Too many incorrect words selected."
            startButton.textContent = "Try Again"
            instructionOverlay.style.display = "flex"
            refresh()
        }
    }

    selectionStart = null
    selectionEnd = null
    selectionDirection = null
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
    let snapUnit = ((180 / Math.PI) * snappedAngle % 90 == 0 ? 1 : Math.sqrt(2)) * SQUARE_SIZE
    let snappedMagnitude = snapUnit * Math.round(relativeMagnitude / snapUnit)
    let snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
    let snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)

    while (snappedMouseX > CANVAS_WIDTH || snappedMouseX < 0 || snappedMouseY > CANVAS_HEIGHT || snappedMouseY < 0) {
        snappedMagnitude -= snapUnit
        snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
        snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)
    }

    let column = Math.floor(snappedMouseX / SQUARE_SIZE)
    let row = Math.floor(snappedMouseY / SQUARE_SIZE)
    let centerX = (column + 0.5) * SQUARE_SIZE
    let centerY = (row + 0.5) * SQUARE_SIZE

    selectionDirection = angleToDirection(snappedAngle * 180 / Math.PI)
    selectionEnd = {
        column,
        row,
        centerX,
        centerY
    }

    underlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
}