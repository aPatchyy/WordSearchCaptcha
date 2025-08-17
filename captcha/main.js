import { createColorGenerator, createDisplacementMap, drawStroke } from "./util.js";
import { WordSearch } from "./word-search.js";
import { WORDS } from "./words.js";

const STAGES = [
    new WordSearch({
        words: ["prime", "sub", "chat"],
    }),
    new WordSearch({
        words: WORDS,
        numberOfWords: 7,
        rows: 5,
        columns: 8,
    }),
    new WordSearch({
        words: WORDS,
        numberOfWords: 10,
        rows: 6,
        columns: 10,
    }),
]

const SHOW_NOISE = true
const NOISE_IMAGES = ["scribble.png", "perlin.png"]

const DISPLACE_LETTERS = false
const DISPLACE_STROKE = false
const DISPLACE_SCALE = 15

const ENABLE_FAILING = true
const MAX_INCORRECT_SELECTIONS = 5

const STROKE_SCALE = 0.35
const LETTER_SCALE = 0.6

const challengeContainer = document.getElementById("ws-challenge")
const canvasContainer = document.getElementById("canvas-container")
const letterGridContainer = document.getElementById("letter-grid-container")
const letterGrid = document.getElementById("letter-grid")
const underlayCanvas = document.getElementById("underlay-canvas")
const underlayContext = underlayCanvas.getContext("2d")
const selectionCanvas = document.getElementById("selection-canvas")
const selectionContext = selectionCanvas.getContext("2d")
const refreshButton = document.getElementById("refresh-button")

let generateColor = createColorGenerator()
let color = generateColor()
let stageIndex = 0
let selectionStart = null
let selectionEnd = null
let incorrectSelections = 0
let canvasSize = null
let squareSize = null

if (DISPLACE_LETTERS) {
    letterGridContainer.classList.add("displace")
}

if (DISPLACE_STROKE) {
    if (navigator.userAgent.indexOf("Safari") === -1) {
        canvasContainer.classList.add("displace")
    }
}

if (SHOW_NOISE) {
    let backgroundImage = ""
    NOISE_IMAGES.forEach(filename => {
        backgroundImage += " url(img/" + filename + "),"
    })
    letterGridContainer.style.backgroundImage = backgroundImage.slice(0, -1)
}

window.addEventListener("contextmenu", (e) => e.preventDefault())
challengeContainer.addEventListener('touchmove', (e) => e.preventDefault())
refreshButton.addEventListener("click", refresh)

initialize()
async function initialize() {
    let stage = STAGES[stageIndex]
    const wordCount = stage.numberOfWords ?? stage.words.length
    const rows = stage.rows
    const columns = stage.columns
    letterGrid.style.setProperty("--rows", `${rows}`)
    letterGrid.style.setProperty("--columns", `${columns}`)

    //  Setup canvas size and boxing style based on aspect ratios
    const containerWidth = challengeContainer.getBoundingClientRect().width
    const containerHeight = challengeContainer.getBoundingClientRect().height
    const canvasWidth = containerWidth > containerHeight ? (columns / rows) * containerHeight : containerWidth
    const canvasHeight = containerWidth > containerHeight ? containerHeight : (rows / columns) * containerWidth
    canvasSize = { width: canvasWidth, height: canvasHeight }
    squareSize = canvasHeight / rows
    underlayCanvas.width = canvasWidth
    underlayCanvas.height = canvasHeight
    underlayContext.globalAlpha = 0.5
    selectionCanvas.width = canvasWidth
    selectionCanvas.height = canvasHeight
    selectionContext.globalAlpha = 0.4

    Array.from([letterGrid, underlayCanvas, selectionCanvas]).forEach(element => {
        if (containerWidth / containerHeight > columns / rows) {
            element.classList.remove("letter-box")
            element.classList.add("pillar-box")
        } else {
            element.classList.remove("pillar-box")
            element.classList.add("letter-box")
        }
    })

    //  Attempt to generate, switch to safer word search if error occurs.
    try {
        stage.generate()
    } catch (error) {
        STAGES[stageIndex] = new WordSearch({
            words: WORDS,
            rows: rows,
            columns: columns,
            recycleWords: true,
            numberOfWords: wordCount
        })
        stage = STAGES[stageIndex]
        stage.generate()
    }

    //  Populate letter grid element
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const div = document.createElement("div")
            const newSpan = document.createElement("span")
            const letter = stage.letterGrid[row][column]
            newSpan.style.fontSize = `${LETTER_SCALE * squareSize}px`
            newSpan.textContent = letter
            div.appendChild(newSpan)
            letterGrid.append(div)
        }
    }

    //  Randomly offset noise images.
    if (SHOW_NOISE) {
        let positionX = []
        let positionY = []
        NOISE_IMAGES.forEach(_ => {
            positionX.push(`${1000 * 2 * (Math.random() - 0.5)}%`)
            positionY.push(`${1000 * 2 * (Math.random() - 0.5)}%`)
        })
        letterGridContainer.style.backgroundPositionX = positionX.join(",")
        letterGridContainer.style.backgroundPositionY = positionY.join(",")
    }

    //  Generate new displacement map to distort letters and/or strokes
    if (DISPLACE_LETTERS || DISPLACE_STROKE) {
        let mapURL = await createDisplacementMap(Math.round(containerWidth / 10), Math.round(containerHeight / 10))
        document.querySelector("feImage").setAttribute("href", mapURL)
        document.querySelector("feDisplacementMap").setAttribute("scale", DISPLACE_SCALE)
    }

    //  Update instruction text
    const instructionElement = document.getElementById("ws-instruction")
    const wordCountText = numberstowords.toInternationalWords(wordCount, { useComma: true, useAnd: true })
    if (wordCount > 1) {
        instructionElement.lastChild.textContent = `Find all ${wordCountText} words.`
    } else {
        instructionElement.lastChild.textContent = "Find one word."
    }

    underlayCanvas.addEventListener("pointerdown", handleSelectionStart)
    underlayCanvas.addEventListener("pointerup", handleSelectionEnd)
}

async function refresh() {
    underlayCanvas.removeEventListener("pointerdown", handleSelectionStart)
    underlayCanvas.removeEventListener("pointerup", handleSelectionEnd)
    underlayContext.clearRect(0, 0, underlayCanvas.width, underlayCanvas.height)
    selectionContext.clearRect(0, 0, selectionContext.width, selectionContext.height)
    letterGrid.innerHTML = ''
    generateColor = createColorGenerator()
    color = generateColor()
    selectionStart = null
    selectionEnd = null
    incorrectSelections = 0
    canvasSize = null
    squareSize = null
    await initialize()
}

function handleSelectionStart(e) {
    if (!e.isPrimary || e.button !== 0) return
    const rect = underlayCanvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * canvasSize.width / rect.width
    let mouseY = (e.clientY - rect.top) * canvasSize.height / rect.height
    mouseX = Math.min(canvasSize.width - 1, Math.max(0, mouseX))
    mouseY = Math.min(canvasSize.height - 1, Math.max(0, mouseY))
    const column = Math.floor(mouseX / squareSize)
    const row = Math.floor(mouseY / squareSize)
    const centerX = (column + 0.5) * squareSize
    const centerY = (row + 0.5) * squareSize

    selectionStart = {
        column,
        row,
        x: centerX,
        y: centerY
    }
    underlayCanvas.setPointerCapture(e.pointerId)
    underlayCanvas.addEventListener("pointermove", handleSelectionMove)
}

function handleSelectionEnd(e) {
    underlayCanvas.removeEventListener("pointermove", handleSelectionMove)
    underlayCanvas.releasePointerCapture(e.pointerId)
    underlayContext.clearRect(0, 0, canvasSize.width, canvasSize.height)
    const stage = STAGES[stageIndex]

    if (selectionEnd !== null) {
        if (stage.checkSelection(selectionStart, selectionEnd)) {
            drawStroke(selectionContext, selectionStart, selectionEnd, STROKE_SCALE * squareSize, color)
            color = generateColor()
            if (stage.isSolved()) {
                underlayCanvas.removeEventListener("pointerdown", handleSelectionStart)
                underlayCanvas.removeEventListener("pointerup", handleSelectionEnd)
                if (stageIndex !== STAGES.length - 1) {
                    showMessage({
                        type: MESSAGE_TYPE.PASS,
                        html: "<strong>Solved!</strong> Continue to complete verification.",
                        duration: 2,
                        callback: () => {
                            stageIndex += 1
                            refresh()
                        }
                    })
                } else {
                    const randomPercent = (Math.random() * Math.random() * 100).toFixed(2)
                    showMessage({
                        type: MESSAGE_TYPE.PASS,
                        html: `<strong>Verified!</strong> You beat ${randomPercent}% of users!`,
                        duration: 3,
                        callback: () => {
                            window.top.postMessage("success", '*')
                        }
                    })
                }
            }
        } else {
            incorrectSelections++
            drawStroke(underlayContext, selectionStart, selectionEnd, STROKE_SCALE * squareSize, "red")
            setTimeout(() => underlayContext.clearRect(0, 0, canvasSize.width, canvasSize.height), 200)
            if (ENABLE_FAILING && incorrectSelections >= MAX_INCORRECT_SELECTIONS) {
                underlayCanvas.removeEventListener("pointerdown", handleSelectionStart)
                underlayCanvas.removeEventListener("pointerup", handleSelectionEnd)
                showMessage({
                    type: MESSAGE_TYPE.FAIL,
                    html: "<strong>Try again!</strong> Too many incorrect words selected.",
                    duration: 3,
                    callback: refresh
                })
            }
        }
    }
    selectionStart = null
    selectionEnd = null
}

function handleSelectionMove(e) {
    const rect = underlayCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * canvasSize.width / rect.width
    const mouseY = (e.clientY - rect.top) * canvasSize.height / rect.height
    const relativeX = mouseX - selectionStart.x
    const relativeY = mouseY - selectionStart.y
    const relativeMagnitude = Math.sqrt(relativeX * relativeX + relativeY * relativeY)
    const angle = Math.atan2(relativeY, relativeX)
    const snappedAngle = (Math.PI / 4) * Math.round(angle * (4 / Math.PI))
    const snapUnit = ((180 / Math.PI) * snappedAngle % 90 == 0 ? 1 : Math.sqrt(2)) * squareSize
    let snappedMagnitude = snapUnit * Math.round(relativeMagnitude / snapUnit)
    let snappedMouseX = selectionStart.x + snappedMagnitude * Math.cos(snappedAngle)
    let snappedMouseY = selectionStart.y + snappedMagnitude * Math.sin(snappedAngle)

    while (snappedMouseX > canvasSize.width || snappedMouseX < 0 || snappedMouseY > canvasSize.height || snappedMouseY < 0) {
        snappedMagnitude -= snapUnit
        snappedMouseX = selectionStart.x + snappedMagnitude * Math.cos(snappedAngle)
        snappedMouseY = selectionStart.y + snappedMagnitude * Math.sin(snappedAngle)
    }

    const column = Math.floor(snappedMouseX / squareSize)
    const row = Math.floor(snappedMouseY / squareSize)
    const centerX = (column + 0.5) * squareSize
    const centerY = (row + 0.5) * squareSize

    selectionEnd = {
        column,
        row,
        x: centerX,
        y: centerY
    }

    underlayContext.clearRect(0, 0, canvasSize.width, canvasSize.height)
    drawStroke(underlayContext, selectionStart, selectionEnd, STROKE_SCALE * squareSize, color)
}

const MESSAGE_TYPE = {
    FAIL: 0,
    PASS: 1,
}

function showMessage({ type, html, duration, callback }) {
    const header = document.getElementById("ws-header")
    const container = document.getElementById("ws-container")
    Array.from(header.children).forEach(child => child.classList.add("hidden"))

    const span = document.createElement("span")
    span.innerHTML = html ?? ''
    header.appendChild(span)

    let classStyle
    switch (type) {
        case MESSAGE_TYPE.FAIL:
            classStyle = 'fail'
            break;
        case MESSAGE_TYPE.PASS:
            classStyle = 'pass'
            break;
    }

    if (classStyle != null) {
        container.classList.add(classStyle)
    }

    setTimeout(() => {
        if (classStyle != null) {
            container.classList.remove(classStyle)
        }
        span.remove()
        Array.from(header.children).forEach(child => child.classList.remove("hidden"))
        callback?.call()
    }, (duration ?? 2) * 1000);
}


