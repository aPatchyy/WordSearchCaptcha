import { WordSearchGenerator } from "./word-search-generator.js"

export class WordSearch {
    constructor(availableWords, numberOfWords, sizeX, sizeY = 0) {
        this.words = []
        this.wordsLeft = []
        this.letterGrid = []
        this.availableWords = availableWords
        this.sizeX = sizeX
        this.sizeY = sizeY === 0 ? sizeX : sizeY
        this.numberOfWords = numberOfWords
    }

    isSolved = () => this.wordsLeft.length == 0

    checkWord(wordToCheck) {
        if (words.includes(wordToCheck)) {
            this.wordsLeft = this.wordsLeft.filter(word => wordToCheck != word)
            return true
        }
        return false
    }

    generate() {
        this.words = []
        while(this.words.length < this.numberOfWords) {
            let randomIndex = Math.floor(this.availableWords.length * Math.random())
            let randomWord = this.availableWords[randomIndex]
            if(!this.words.includes(randomWord))
                this.words.push(randomWord)
        }
        this.wordsLeft = [...this.words]
        
        let generator = new WordSearchGenerator(this.words, this.sizeX, this.sizeY)
        this.letterGrid = generator.execute()
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
        str += this.letterGrid[y][x]
        for(let i=0; i<length; i++) {
            if(startX != endX)
                x += startX < endX ? 1 : -1
            if(startY != endY)
                y += startY < endY ? 1 : -1
            str += this.letterGrid[y][x]
        }
        return str
    }
    
}