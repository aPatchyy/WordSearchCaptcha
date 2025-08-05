import { WordSearchGenerator } from "./word-search-generator.js"
import { WordInfo } from "./word-info.js"

export class WordSearch {
    constructor(availableWords, numberOfWords, allowedDirections, columns, rows = 0) {
        this.wordsLeft = []
        this.availableWords = availableWords
        this.columns = columns
        this.rows = rows === 0 ? columns : rows
        this.numberOfWords = numberOfWords
        this.allowedDirections = allowedDirections
    }

    isSolved = () => this.wordsLeft.length === 0
    
    checkWord(wordToCheck) {
        for(let i=0; i<this.wordsLeft.length; i++) {
            let wordLeft = this.wordsLeft[i]
            if(wordLeft.equals(wordToCheck)) {
                this.wordsLeft = this.wordsLeft.filter(word => !wordLeft.equals(word))
                return true
            }
        }
        return false
    }

    generate() {
        let words = []
        let wordsOfSize = this.availableWords.filter(word => word.length <= Math.max(this.columns, this.rows))
        while (words.length < this.numberOfWords) {
            let randomIndex = Math.floor(wordsOfSize.length * Math.random())
            let randomWord = wordsOfSize[randomIndex]
            if (!words.includes(randomWord))
                words.push(randomWord)
        }
        let wordInfos = words.map(word => new WordInfo(word))
        this.wordsLeft = wordInfos
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