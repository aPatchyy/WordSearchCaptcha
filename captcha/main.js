import { WordSearch } from "./word-search.js"

const print = console.log

const CANVAS_SIZE = 400
const NUMBER_OF_WORDS = 3
const GRID_SIZE = 5
const GRID_GAP = 3
const SIZE_RATIO = CANVAS_SIZE / GRID_SIZE
const RADIUS_THRESHOLD = SIZE_RATIO/3




const container = document.getElementById("captcha-container")
const overlay = document.getElementById("overlay-canvas")
const overlay_context = overlay.getContext("2d")
const letter_grid = document.getElementById("letter-grid")
const underlay = document.getElementById("underlay-canvas")
const underlay_context = underlay.getContext("2d")

let current_cell = null
let selection_start = null
let selection_end = null
let wordSearch = new WordSearch(["POOP", "BOND", "SEA", "TREE", "FOUND", "ZEBRA"], NUMBER_OF_WORDS, GRID_SIZE)
wordSearch.generate()
print(wordSearch)
for(let i=0; i<GRID_SIZE; i++) {
    for(let j=0; j<GRID_SIZE; j++) {
        const newSpan = document.createElement("span")
        newSpan.textContent = wordSearch.letterGrid[i][j]
        letter_grid.appendChild(newSpan)
    }
}




container.addEventListener("contextmenu", (e) => e.preventDefault())

overlay.addEventListener("pointermove", handleUpdateCurrentCell)

function handleUpdateCurrentCell(e) {
    let rect = overlay.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * overlay.width / rect.width 
    let mouseY = (e.clientY - rect.top) * overlay.height / rect.height 
    let gridX = Math.floor(mouseX/SIZE_RATIO)
    let gridY = Math.floor(mouseY/SIZE_RATIO)
    let centerX = (gridX + 0.5) * SIZE_RATIO
    let centerY = (gridY + 0.5) * SIZE_RATIO
    let radX = Math.abs(centerX - mouseX)
    let radY = Math.abs(centerY - mouseY)
    let rad = Math.sqrt(radX * radX + radY * radY)
    
    if(rad < RADIUS_THRESHOLD) {
        current_cell = {
            x: gridX,
            y: gridY,
            centerX,
            centerY
        }
    } else {
        current_cell = null
    }
}


overlay.addEventListener("pointerdown", handleSelectionStart)
function handleSelectionStart(e) {
    if(current_cell == null)
        return
    
    //PREVENT MULTIPLE TOUCHES FOR PHONE
    overlay.setPointerCapture(e.pointerId)
    overlay.addEventListener("pointermove", handleSelectionMove)
    selection_start = current_cell
}

overlay.addEventListener("pointerup", handleSelectionEnd)
function handleSelectionEnd(e) {
    overlay.releasePointerCapture(e.pointerId)
    underlay_context.clearRect(0,0,overlay.width, overlay.height)
    
    console.log(wordSearch.stringFromSelection(selection_start.x, selection_start.y,  selection_end.x, selection_end.y))
    selection_start = null
    selection_end = null
    overlay.removeEventListener("pointermove", handleSelectionMove)
}

function handleSelectionMove(e) {
    let rect = overlay.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * overlay.width / rect.width 
    let mouseY = (e.clientY - rect.top) * overlay.height / rect.height
    let relativeX = mouseX - selection_start.centerX
    let relativeY = mouseY - selection_start.centerY
    let relativeMagnitude = Math.sqrt(relativeX * relativeX + relativeY * relativeY) 
    let angle = Math.atan2(relativeY, relativeX)
    let snappedAngle = (Math.PI / 4) * Math.round(4 * angle / Math.PI)
    let snapLength = ((180/Math.PI)*snappedAngle % 90 == 0 ? 1 : Math.sqrt(2)) * SIZE_RATIO
    let snappedMagnitude = snapLength * Math.round(relativeMagnitude / snapLength)
    let snappedMouseX = selection_start.centerX + snappedMagnitude * Math.cos(snappedAngle)
    let snappedMouseY = selection_start.centerY + snappedMagnitude * Math.sin(snappedAngle)

    while(snappedMouseX > CANVAS_SIZE || snappedMouseX < 0 || snappedMouseY > CANVAS_SIZE || snappedMouseY < 0) {
        snappedMagnitude -= snapLength
        snappedMouseX = selection_start.centerX + snappedMagnitude * Math.cos(snappedAngle)
        snappedMouseY = selection_start.centerY + snappedMagnitude * Math.sin(snappedAngle)
    }
    
    let gridX = Math.floor(snappedMouseX/SIZE_RATIO)
    let gridY = Math.floor(snappedMouseY/SIZE_RATIO)
    let centerX = (gridX + 0.5) * SIZE_RATIO
    let centerY = (gridY + 0.5) * SIZE_RATIO
    
    selection_end = {
        x:gridX,
        y:gridY,
        centerX,
        centerY
    }

    underlay_context.clearRect(0,0,overlay.width, overlay.height)
    underlay_context.beginPath()
    underlay_context.arc(selection_start.centerX, selection_start.centerY, RADIUS_THRESHOLD, 0, 2*Math.PI)
    underlay_context.arc(snappedMouseX, snappedMouseY, RADIUS_THRESHOLD, 0, 2*Math.PI)
    underlay_context.fillStyle = "rgba(0, 255, 255)"
    underlay_context.fill()
    underlay_context.closePath()
    
    underlay_context.beginPath()
    underlay_context.moveTo(selection_start.centerX, selection_start.centerY)
    underlay_context.lineTo(snappedMouseX, snappedMouseY)
    underlay_context.lineWidth = 2 * RADIUS_THRESHOLD
    underlay_context.strokeStyle = "rgba(0, 255, 255)"
    underlay_context.stroke()
    underlay_context.closePath()
}


