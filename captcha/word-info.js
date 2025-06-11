import { DirectedLocation } from "./directed-location.js"
import { DIRECTION, print } from "./util.js"

export class WordInfo {
    constructor(string) {
        this.value = string
        this.location = null
        this.testedLocations = []
    }

    clearTestedLocations() {
        this.testedLocations = []
    }

    moveLocationToTested() {
        this.testedLocations.push(this.location)
        this.location = null
    }

    equals(otherWord) {
        return this.value === otherWord.value && 
            this.location.equals(otherWord.location) && 
            this.testedLocations.length === otherWord.testedLocations.length &&
            this.testedLocations.every((location, i) => {location.equals(otherWord.testedLocations[i])})
    }

    letterAt(location) {
        let index
        if(location.direction === DIRECTION.RIGHT || location.direction === DIRECTION.LEFT) {
            index = Math.abs(this.location.x - location.x)
        } else {
            index = Math.abs(this.location.y - location.y)
        }
        return this.value[index]
    }

    getAllLocations() {
        let locations = []
        if(this.location != null) {
            for(let i=0; i<this.value.length; i++) {
                let x = this.location.x
                let y = this.location.y

                switch(this.location.direction) {
                    case DIRECTION.RIGHT:
                    case DIRECTION.UP_RIGHT:
                    case DIRECTION.DOWN_RIGHT:
                        x += i
                        break
                    case DIRECTION.LEFT:
                    case DIRECTION.UP_LEFT:
                    case DIRECTION.DOWN_LEFT:
                        x -= i
                        break
                }

                switch(this.location.direction) {
                    case DIRECTION.UP:
                    case DIRECTION.UP_RIGHT:
                    case DIRECTION.UP_LEFT:
                        y -= i
                        break
                    case DIRECTION.DOWN:
                    case DIRECTION.DOWN_RIGHT:
                    case DIRECTION.DOWN_LEFT:
                        y += i
                        break
                }

                locations.push(new DirectedLocation(x, y, this.location.direction))
            }
        }
        return locations
    }

    conflict(otherWordInfo) {
        let locations = this.getAllLocations()
        let otherLocations = otherWordInfo.getAllLocations()
        if(otherLocations.length > 0) {
            locations.forEach(location => {
                otherLocations.forEach(otherLocation => {
                    // if(location.equals(otherLocation)) {
                    //     return true
                    // }
                    if(location.x === otherLocation.x && location.y === otherLocation.y && location.direction !== otherLocation.direction) {
                        print(this.letterAt(location), otherWordInfo.letterAt(otherLocation))
                        if(this.letterAt(location) !== otherWordInfo.letterAt(otherLocation)){
                            print("LETTERS DIFFERENT")
                            return true
                        }
                    }
                })
            })
        }
        return false
    }
}