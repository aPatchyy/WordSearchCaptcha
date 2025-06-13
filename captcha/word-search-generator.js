import { RandomLocator } from "./random-locator.js"
import { randomLetter, print } from "./util.js"


const OPERATION_MODE = {
    FORWARD:0,
    BACKWARD:1
}

export class WordSearchGenerator {
    constructor(wordList, sizeX, sizeY = 0) {
        this.wordList = wordList
        this.sizeX = sizeX
        this.sizeY = sizeY === 0 ? sizeX : sizeY
        this.mode = OPERATION_MODE.FORWARD
        this.globalLocator = new RandomLocator(sizeX, sizeY)
    }

    execute() {
        let currentWordIndex = 0
        let currentWord = this.wordList[currentWordIndex]
        
        while(true) {
            if(this.#placeWord(currentWord)) {
                if(currentWordIndex === this.wordList.length - 1)
                    break
                currentWordIndex += 1
                currentWord = this.wordList[currentWordIndex]
                this.mode = OPERATION_MODE.FORWARD
            } else {
                if(currentWordIndex == 0)
                    throw new Error("WordSearch Generation Failed")
                currentWord.clearTestedLocations()
                currentWordIndex -= 1
                currentWord = this.wordList[currentWordIndex]
                this.mode = OPERATION_MODE.BACKWARD
            }
        }

        let letterGrid = Array.from({length: this.sizeY}, _ => Array.from({length: this.sizeX}, _ => randomLetter()))

        this.wordList.forEach(word => {
            let locations = word.getAllLocations()
            locations.forEach(location => {
                letterGrid[location.y][location.x] = word.letterAt(location)
            })
        })
        return letterGrid
    }

    #placeWord(word) {
        let globalExcludingTested = this.globalLocator.excluding(word.testedLocations)
        
        let localLocator
        if(this.mode === OPERATION_MODE.BACKWARD) {
            this.globalLocator.add(word.location)
            word.moveLocationToTested()
            
            localLocator = globalExcludingTested
        } else {
            localLocator = this.globalLocator
        }

        let locationIndex = 0
        while(locationIndex < localLocator.size) {
            let locationCandidate = localLocator.getLocationAt([locationIndex])
            if (this.#validPlacement(word, locationCandidate)) {
                this.globalLocator.remove(locationCandidate)
                return true
            } else {
                locationIndex++
            }
        }   
        return false
    }

    #validPlacement(wordToTest, locationCandidate) {
        wordToTest.place(locationCandidate)
        let wordLocations = wordToTest.getAllLocations()
        let lastLocation = wordLocations.at(-1)
        
        if(lastLocation.x < 0 || lastLocation.x > this.sizeX - 1 || lastLocation.y < 0 || lastLocation.y > this.sizeY - 1) {
            wordToTest.unplace()
            return false
        }


        for(let i=0; i<this.wordList.length;i++) {
            let word = this.wordList[i]
            if(!wordToTest.equals(word)) {
                if(wordToTest.conflict(word)) {
                    wordToTest.unplace()
                    return false
                }
            }
        }

        return true
    }
}