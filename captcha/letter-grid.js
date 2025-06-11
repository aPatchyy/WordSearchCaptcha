export class LetterGrid {
    constructor(sizeX, sizeY = 0) {
        this.sizeX = sizeX
        this.sizeY = sizeY === 0 ? sizeX : sizeY
        this.grid = new Array(sizeX)

        for(let i=0; i<sizeX;i++) {
            let a = []
            for(let j=0; j<sizeY;j++) {
                a.push(randomLetter())
            }
            this.grid[i] = a
        }

        
    }

    placeLetter(letter, x, y) {
        this.grid[y][x] = letter
    }

    stringFromSelection(startX, startY, endX, endY) {
        var length
        var str = ""
        if(startX == endX) {
            length = Math.abs(endY - startY)
        } else {
            length = Math.abs(endX - startX)
        }
        let x = startX
        let y = startY
        str += this.grid[y][x]
        for(let i=0; i<length; i++) {
            if(startX != endX)
                x += startX < endX ? 1 : -1
            if(startY != endY)
                y += startY < endY ? 1 : -1
            str += this.grid[y][x]
        }
        return str
    }
}