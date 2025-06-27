import { WordSearchGenerator } from "./word-search-generator.js"
import { WordInfo } from "./word-info.js"
import { reverseString, print } from "./util.js"
export class WordSearch {
    constructor(availableWords, numberOfWords, allowedDirections, columns, rows = 0) {
        this.words = []
        this.wordsLeft = []
        this.availableWords = availableWords
        this.columns = columns
        this.rows = rows === 0 ? columns : rows
        this.numberOfWords = numberOfWords
        this.allowedDirections = allowedDirections
    }

    isSolved = () => this.wordsLeft.length === 0

    checkWord(wordToCheck) {
        if (this.wordsLeft.includes(wordToCheck)) {
            this.wordsLeft = this.wordsLeft.filter(word => wordToCheck !== word)
            return true
        } else if (this.wordsLeft.includes(reverseString(wordToCheck))) {
            this.wordsLeft = this.wordsLeft.filter(word => reverseString(wordToCheck) !== word)
            return true
        }
        return false
    }

    generate() {
        this.words = []
        let wordsOfSize = this.availableWords.filter(word => word.length <= Math.max(this.columns, this.rows))
        while (this.words.length < this.numberOfWords) {
            let randomIndex = Math.floor(wordsOfSize.length * Math.random())
            let randomWord = wordsOfSize[randomIndex]
            if (!this.words.includes(randomWord))
                this.words.push(randomWord)
        }
        this.wordsLeft = [...this.words]
        let wordInfos = this.words.map(word => new WordInfo(word))
        let generator = new WordSearchGenerator(wordInfos, this.allowedDirections, this.columns, this.rows)
        try {
            this.letters = generator.execute()
        } catch (error) {
            this.generate()
        }
    }


    stringFromSelection(startColumn, startRow, endColumn, endRow) {
        var length
        var str = ""
        if (startColumn == endColumn) {
            length = Math.abs(endRow - startRow)
        } else {
            length = Math.abs(endColumn - startColumn)
        }
        let row = startRow
        let column = startColumn
        str += this.letters[row][column]
        for (let i = 0; i < length; i++) {
            if (startRow != endRow)
                row += startRow < endRow ? 1 : -1
            if (startColumn != endColumn)
                column += startColumn < endColumn ? 1 : -1
            str += this.letters[row][column]
        }
        return str
    }

}