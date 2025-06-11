import { WordInfo } from "./word-info.js"
import { RandomLocator } from "./random-locator.js"
import { randomLetter, print } from "./util.js"


const OPERATION_MODE = {
    FORWARD:0,
    BACKWARD:1
}

export class WordSearchGenerator {
    constructor(stringList, sizeX, sizeY = 0) {
        this.wordList = []
        this.sizeX = sizeX
        this.sizeY = sizeY === 0 ? sizeX : sizeY
        this.mode = OPERATION_MODE.FORWARD
        this.globalLocator = new RandomLocator(sizeX, sizeY)

        stringList.forEach(str => {
            this.wordList.push(new WordInfo(str))
        })
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

        let letter_grid = Array.from({length: this.sizeY}, _ => Array.from({length: this.sizeX}, _ => randomLetter()))

        this.wordList.forEach(word => {
            let locations = word.getAllLocations()
            locations.forEach(location => {
                letter_grid[location.y][location.x] = word.letterAt(location)
            })
        })
        print(this)
        return letter_grid
    }

    #placeWord(word) {
        print(Object.keys(OPERATION_MODE)[this.mode])
        let localLocator
        if(this.mode === OPERATION_MODE.FORWARD)
            localLocator = this.globalLocator
        else {
            this.globalLocator.add(word.location)
            word.moveLocationToTested()
            localLocator = this.globalLocator.excluding(word.testedLocations)
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
        wordToTest.location = locationCandidate
        let wordLocations = wordToTest.getAllLocations()
        let lastLocation = wordLocations.at(-1)
        
        if(lastLocation.x < 0 || lastLocation.x > this.sizeX - 1 || lastLocation.y < 0 || lastLocation.y > this.sizeY - 1) {
            wordToTest.location = null
            return false
        }

        this.wordList.forEach(word => {
            if(!wordToTest.equals(word)) {
                if(wordToTest.conflict(word))
                    wordToTest.location = null
                    return false
            }
        })

        return true
    }

    // #validPlacement(wordToTest, locationCandidate) {
    //     let endX = locationCandidate.x
    //     let endY = locationCandidate.y

    //     switch(locationCandidate.direction) {
    //         case DIRECTION.RIGHT:
    //         case DIRECTION.UP_RIGHT:
    //         case DIRECTION.DOWN_RIGHT:
    //             endX += wordToTest.length - 1
    //             break
    //         case DIRECTION.LEFT:
    //         case DIRECTION.UP_LEFT:
    //         case DIRECTION.DOWN_LEFT:
    //             endX -= wordToTest.length - 1
    //             break
    //     }

    //     switch(locationCandidate.direction) {
    //         case DIRECTION.UP:
    //         case DIRECTION.UP_RIGHT:
    //         case DIRECTION.UP_LEFT:
    //             endY -= wordToTest.length - 1
    //             break
    //         case DIRECTION.DOWN:
    //         case DIRECTION.DOWN_RIGHT:
    //         case DIRECTION.DOWN_LEFT:
    //             endY += wordToTest.length - 1
    //             break
    //     }

    //     if(endX < 0 || endY < 0 || endX >= this.size || endY >= this.size)
    //         return false

    //     let points = []

    //     let x = locationCandidate.x
    //     let y = locationCandidate.y
    //     points.push({x,y})
    //     for(let i=0; i<wordToTest.length-1;i++) {
    //         if(locationCandidate.x != endX)
    //             x += locationCandidate.x < endX ? 1 : -1
    //         if(locationCandidate.y != endY)
    //             y += locationCandidate.y < endY ? 1 : -1
    //         points.push({x,y})
    //     }

    //     let placedWords = this.wordList.filter(word => word.location != null)
        
    //     points.forEach((pointToTest, i) => {
    //         placedWords.forEach(placedWord => {

    //             let is_overlap = false
                
    //             placedWord.points.forEach((point, j) => {
    //                 if(pointToTest.x == point.x && pointToTest.y == point.y) {
    //                     print(wordToTest.word[i], placedWord.word[j], wordToTest.word[i] != placedWord.word[j])
    //                     if(wordToTest.word[i] != placedWord.word[j] || is_overlap) {
    //                         print("FAILED TO OVERLAP")
    //                         return false
    //                     } else {
    //                         is_overlap = true
    //                     }
    //                 }
                    
    //             })
    //         })
    //     })

    //     wordToTest.location = locationCandidate
    //     wordToTest.points = points
    //     return true
    // }





}