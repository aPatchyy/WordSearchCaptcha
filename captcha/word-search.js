import { WordSearchGenerator } from "./word-search-generator.js"
import { WordInfo } from "./word-info.js"
import { reverseString } from "./util.js"
export class WordSearch {
    constructor(availableWords, numberOfWords, allowedDirections, sizeX, sizeY = 0) {
        this.words = []
        this.wordsLeft = []
        this.availableWords = availableWords
        this.sizeX = sizeX
        this.sizeY = sizeY === 0 ? sizeX : sizeY
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
        let wordsOfSize = this.availableWords.filter(word => word.length <= Math.max(this.sizeX, this.sizeY))
        while(this.words.length < this.numberOfWords) {
            let randomIndex = Math.floor(wordsOfSize.length * Math.random())
            let randomWord = wordsOfSize[randomIndex]
            if(!this.words.includes(randomWord))
                this.words.push(randomWord)
        }
        this.wordsLeft = [...this.words]
        let wordInfos = this.words.map(word => new WordInfo(word))
        let generator = new WordSearchGenerator(wordInfos, this.allowedDirections, this.sizeX, this.sizeY)
        try {
            this.letters = generator.execute()
        } catch (error) {
            this.generate()
        }
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
        str += this.letters[y][x]
        for(let i=0; i<length; i++) {
            if(startX != endX)
                x += startX < endX ? 1 : -1
            if(startY != endY)
                y += startY < endY ? 1 : -1
            str += this.letters[y][x]
        }
        return str
    }
    
}