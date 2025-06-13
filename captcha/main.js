import { WordSearch } from "./word-search.js"
import { WORDS } from "./words.js"
import { COLORS } from "./colors.js"
import { print } from "./util.js"

const NUMBER_OF_WORDS = 4
const ROWS = 5
const COLUMNS = 5

const container = document.getElementById("captcha-container")
const containerWidth = container.getBoundingClientRect().width
const containerHeight = container.getBoundingClientRect().height

const CANVAS_WIDTH = containerWidth > containerHeight ? (COLUMNS / ROWS) * containerHeight : containerWidth
const CANVAS_HEIGHT = containerWidth > containerHeight ? containerHeight : (ROWS / COLUMNS) * containerWidth
const SQUARE_SIZE = CANVAS_HEIGHT / ROWS
const STROKE_RADIUS = SQUARE_SIZE / 3.5

const wordSearchContainer = document.getElementById("wordsearch-container")
const letterGrid = document.getElementById("letter-grid")
const underlayCanvas = document.getElementById("underlay-canvas")
const underlayContext = underlayCanvas.getContext("2d")
underlayCanvas.width = CANVAS_WIDTH
underlayCanvas.height = CANVAS_HEIGHT
underlayContext.globalAlpha = 0.8

const selectionCanvas = document.getElementById("selection-canvas")
const selectionContext = selectionCanvas.getContext("2d")
selectionCanvas.width = CANVAS_WIDTH
selectionCanvas.height = CANVAS_HEIGHT
selectionContext.globalAlpha = 0.5

document.documentElement.style.setProperty("--rows", `${ROWS}`)
document.documentElement.style.setProperty("--columns", `${COLUMNS}`)
document.documentElement.style.setProperty("--random-1", `${ 1000 * 2 *(Math.random() - 0.5)}`)
document.documentElement.style.setProperty("--random-2", `${ 1000 * 2 *(Math.random() - 0.5)}`)
document.documentElement.style.setProperty("--random-3", `${ 1000 * 2 *(Math.random() - 0.5)}`)


if(containerWidth / containerHeight > COLUMNS / ROWS) {
    wordSearchContainer.classList.add("pillar-box")
} else {
    wordSearchContainer.classList.add("letter-box")
}

let selectionStart = null
let selectionEnd = null
let colorIndex = Math.floor(COLORS.length * Math.random())
let wordSearch = new WordSearch(WORDS, NUMBER_OF_WORDS, ROWS, COLUMNS)

document.getElementById("start-button").addEventListener('click', () => {
    document.getElementById("instructions-overlay").style.display = "none"
})

container.addEventListener("contextmenu", (e) => e.preventDefault())
underlayCanvas.addEventListener('touchmove', (e) => e.preventDefault())
underlayCanvas.addEventListener("pointerdown", handleSelectionStart)
underlayCanvas.addEventListener("pointerup", handleSelectionEnd)

function initialize() {
    wordSearch.generate()
    for(let i=0; i<COLUMNS; i++) {
        for(let j=0; j<ROWS; j++) {
            const newSpan = document.createElement("span")
            newSpan.textContent = wordSearch.letters[i][j]
            newSpan.classList.add("letter")
            newSpan.style.fontSize = `${SQUARE_SIZE/2}px`
            letterGrid.appendChild(newSpan)
        }
    }
}

function handleSelectionStart(e) {
    if(!e.isPrimary) return
    let rect = underlayCanvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * underlayCanvas.width / rect.width 
    let mouseY = (e.clientY - rect.top) * underlayCanvas.height / rect.height 
    let gridX = Math.floor(mouseX/SQUARE_SIZE)
    let gridY = Math.floor(mouseY/SQUARE_SIZE)
    let centerX = (gridX + 0.5) * SQUARE_SIZE
    let centerY = (gridY + 0.5) * SQUARE_SIZE
    let radX = Math.abs(centerX - mouseX)
    let radY = Math.abs(centerY - mouseY)
    let rad = Math.sqrt(radX * radX + radY * radY)
    
    selectionStart = {
        x: gridX,
        y: gridY,
        centerX,
        centerY
    }

    underlayCanvas.setPointerCapture(e.pointerId)
    underlayCanvas.addEventListener("pointermove", handleSelectionMove)
    
}

function handleSelectionEnd(e) {
    underlayCanvas.releasePointerCapture(e.pointerId)
    underlayContext.clearRect(0,0,underlayCanvas.width, underlayCanvas.height)
    if(selectionEnd !== null) {
        
        let selection = wordSearch.stringFromSelection(selectionStart.x, selectionStart.y,  selectionEnd.x, selectionEnd.y)
        if(wordSearch.checkWord(selection)) {
            drawStroke(selectionContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
            colorIndex = (colorIndex + 1) % (COLORS.length - 1)
        } else {
            drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, "red")
            setTimeout(() => underlayContext.clearRect(0,0,underlayCanvas.width, underlayCanvas.height), 200)
        }
        
        if(wordSearch.isSolved()) {
            setTimeout(() => window.top.postMessage("success", '*'), 1000);
        }
    }
   
    selectionStart = null
    selectionEnd = null
    underlayCanvas.removeEventListener("pointermove", handleSelectionMove)
}

function handleSelectionMove(e) {
    let rect = underlayCanvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * underlayCanvas.width / rect.width 
    let mouseY = (e.clientY - rect.top) * underlayCanvas.height / rect.height
    let relativeX = mouseX - selectionStart.centerX
    let relativeY = mouseY - selectionStart.centerY
    let relativeMagnitude = Math.sqrt(relativeX * relativeX + relativeY * relativeY) 
    let angle = Math.atan2(relativeY, relativeX)
    let snappedAngle = (Math.PI / 4) * Math.round(4 * angle / Math.PI)
    let snapLength = ((180/Math.PI)*snappedAngle % 90 == 0 ? 1 : Math.sqrt(2)) * SQUARE_SIZE
    let snappedMagnitude = snapLength * Math.round(relativeMagnitude / snapLength)
    let snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
    let snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)

    while(snappedMouseX > CANVAS_WIDTH || snappedMouseX < 0 || snappedMouseY > CANVAS_HEIGHT || snappedMouseY < 0) {
        snappedMagnitude -= snapLength
        snappedMouseX = selectionStart.centerX + snappedMagnitude * Math.cos(snappedAngle)
        snappedMouseY = selectionStart.centerY + snappedMagnitude * Math.sin(snappedAngle)
    }
    
    let gridX = Math.floor(snappedMouseX/SQUARE_SIZE)
    let gridY = Math.floor(snappedMouseY/SQUARE_SIZE)
    let centerX = (gridX + 0.5) * SQUARE_SIZE
    let centerY = (gridY + 0.5) * SQUARE_SIZE
    
    selectionEnd = {
        x:gridX,
        y:gridY,
        centerX,
        centerY
    }
    underlayContext.clearRect(0,0, underlayCanvas.width, underlayCanvas.height)
    drawStroke(underlayContext, selectionStart.centerX, selectionStart.centerY, selectionEnd.centerX, selectionEnd.centerY, STROKE_RADIUS, COLORS[colorIndex])
}

function drawStroke(context, startX, startY, endX, endY, radius,  color) {
    let strokeAngle = Math.atan2(endY - startY, endX - startX)
    let angle1 = strokeAngle + Math.PI/2
    let angle2 = angle1 + Math.PI
    context.beginPath()
    context.arc(startX, startY, radius, angle1, angle2)
    context.arc(endX, endY, radius, angle2, angle1)
    context.fillStyle = color
    context.fill()
    context.closePath()
}

initialize()


