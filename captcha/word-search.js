import { WordSearchGenerator } from "./word-search-generator.js"
import { WordInfo } from "./word-info.js"
import { createLetterGenerator, DIRECTION, reverseString } from "./util.js"
import { DirectedLocation } from "./directed-location.js"

// Look at README for explanation of this class. 

export class WordSearch {
    static DIRECTIONS = [DIRECTION.RIGHT, DIRECTION.UP_RIGHT, DIRECTION.DOWN, DIRECTION.DOWN_RIGHT]
    static GENERATION_ATTEMPTS = 100
    constructor({
        words,
        rows,
        columns,
        directions,
        numberOfWords,
        recycleWords,
        fillEmpty,
    }) {
        const regex = /^[A-Za-z]+$/
        if (words == null ||
            words.length === 0 ||
            !Array.isArray(words) ||
            !words.every(word => typeof word === "string") ||
            !words.every(word => regex.test(word))) {
            throw new Error("words array must be a non-empty array of strings containing no spaces, numbers, or special characters.")
        }

        if (rows == null && columns == null) {
            const maxWordLength = Math.max(...words.map(word => word.length))
            rows = maxWordLength
            columns = maxWordLength
        } else {
            rows = rows == null ? columns : rows
            columns = columns == null ? rows : columns

            if (typeof rows !== "number" || typeof columns !== "number" || rows < 1 || columns < 1) {
                throw new Error("rows and columns must be a whole number.")
            }

            const maxDimension = Math.max(rows, columns)
            words = words.filter(word => word.length <= maxDimension)

            if (words.length === 0) {
                throw new Error("words array does not contain words that can fit within the specified dimensions. Use smaller words or increase the number of rows or columns.")
            }
        }

        if (numberOfWords != null) {
            if (typeof numberOfWords !== "number" || numberOfWords < 1) {
                throw new Error("numberOfWords must be a whole number.")
            }

            if (numberOfWords > words.length) {
                throw new Error("words array length is smaller than numberOfWords. Ensure all words can fit into the dimensions of the puzzle.")
            }
        }

        if (directions != null && !Array.isArray(directions)) {
            throw new Error("directions must be an array direction values.")
        }

        if (recycleWords != null && typeof recycleWords !== "boolean") {
            throw new Error("recycleWords must be a boolean.")
        }

        if (fillEmpty != null && typeof fillEmpty !== "boolean") {
            throw new Error("fillEmpty must be a boolean.")
        }

        this.words = words.map(word => word.toUpperCase())
        this.rows = rows
        this.columns = columns
        this.numberOfWords = numberOfWords
        this.directions = directions ?? WordSearch.DIRECTIONS
        this.recycleWords = recycleWords ?? false
        this.fillEmpty = fillEmpty ?? true
        this.wordsUsed = []
        this.wordsPlaced = []
        this.wordsFound = []
        this.letterGrid = null
    }

    isSolved() {
        return this.wordsPlaced.length === this.wordsFound.length
    }

    generate() {
        //  Verify enough words to make puzzle and filter out words already used.
        const numberOfWordsNotUsed = this.words.length - this.wordsUsed.length
        if ((numberOfWordsNotUsed === 0 || numberOfWordsNotUsed < this.numberOfWords)) {
                throw new Error("not enough words to generate word search.")
        }
        const availableWords = this.wordsUsed.length > 0 ? this.words.filter(word => !this.wordsUsed.includes(word)) : this.words

        //  Attempt to generate several puzzles and track the best scoring one.
        let bestScore = 0
        let bestWords = null
        for (let i = 0; i < WordSearch.GENERATION_ATTEMPTS; i++) {
            let wordsToPlace = []
            if (this.numberOfWords != null && availableWords.length > this.numberOfWords) {
                while (wordsToPlace.length < this.numberOfWords) {
                    const randomIndex = Math.floor(availableWords.length * Math.random())
                    const randomWord = availableWords[randomIndex]
                    if (!wordsToPlace.includes(randomWord))
                        wordsToPlace.push(randomWord)
                }
            } else {
                wordsToPlace = availableWords
            }

            try {
                const wordsPlaced = new WordSearchGenerator(
                    wordsToPlace.map(word => new WordInfo(word)),
                    this.directions,
                    this.columns,
                    this.rows
                ).execute()

                //  Count how many words placed in each direction.
                //  Anti-parallel directions (Up and Down, Left and Right, ...) are combined.
                //  Score is the reciprocal of the direction with the largest count. 
                //  More aligned words results in lower score.
                const alignedDirectionsCount = Array(4).fill(0)
                wordsPlaced.forEach(word => alignedDirectionsCount[word.location.direction % 4]++)
                const score = 1 / Math.max(...alignedDirectionsCount)
                if (score > bestScore) {
                    bestScore = score
                    bestWords = wordsPlaced
                }
            } catch (error) {
                continue
            }
        }

        //  Finish creating puzzle from words with best score.
        const randomLetter = createLetterGenerator()
        if (bestWords != null) {
            if(!this.recycleWords) {
                this.wordsUsed = this.wordsUsed.concat(bestWords.map(wordInfo => wordInfo.value))
            }
            this.wordsPlaced = bestWords
            this.wordsFound = []
            this.letterGrid = Array.from({ length: this.rows }, _ =>
                Array.from({ length: this.columns }, _ =>
                    this.fillEmpty ? randomLetter() : ""
                )
            )
            bestWords.forEach(word => {
                const locations = word.getAllLocations()
                locations.forEach(location => {
                    this.letterGrid[location.row][location.column] = word.letterAt(location)
                })
            })
        } else {
            throw new Error("maximum word search generation attempts reached with no valid placement found.")
        }
    }

    checkWord(wordInfo) {
        for (let i = 0; i < this.wordsPlaced.length; i++) {
            const wordPlaced = this.wordsPlaced[i]
            if (wordPlaced.equals(wordInfo)) {
                this.wordsFound.push(wordPlaced)
                return true
            }
        }
        return false
    }

    checkSelection(start, end) {
        let length = 0
        let str = ""

        if (start.column === end.column) {
            length = Math.abs(start.row - end.row)
        } else {
            length = Math.abs(start.column - end.column)
        }

        let row = start.row
        let column = start.column
        str += this.letterGrid[row][column]
        for (let i = 0; i < length; i++) {
            if (start.row != end.row)
                row += start.row < end.row ? 1 : -1
            if (start.column != end.column)
                column += start.column < end.column ? 1 : -1
            str += this.letterGrid[row][column]
        }

        const angle = -1 * (180 / Math.PI) * Math.atan2(end.row - start.row, end.column - start.column)
        const direction = DIRECTION.angleToDirection(angle)

        const wordForward = new WordInfo(str, new DirectedLocation(start.column, start.row, direction))
        const wordReverse = new WordInfo(reverseString(str), new DirectedLocation(end.column, end.row, DIRECTION.invert(direction)))
        return this.checkWord(wordForward) || this.checkWord(wordReverse)
    }

    //  For printing to console.
    toString() {
        let str = ""
        for (let row = 0; row < this.rows; row++) {
            const letterRow = this.letterGrid[row].map(letter =>
                letter.length === 0 ? " " : letter
            )
            str += letterRow.join(" ")
            str += row != this.rows - 1 ? "\n" : ""
        }
        return str
    }
}