import { DirectedLocation } from "./directed-location.js"
import { DIRECTION, print } from "./util.js"

export class WordInfo {
    constructor(string) {
        this.value = string
        this.location = null
        this.testedLocations = []
    }

    place(location) {
        this.location = DirectedLocation.from(location)
    }

    unplace() {
        this.location = null
    }

    clearTestedLocations() {
        this.testedLocations = []
    }

    moveLocationToTested() {
        this.testedLocations.push(this.location)
        this.location = null
    }

    equals(otherWord) {
        return this.value === otherWord.value
    }

    letterAt(location) {
        let index = -1
        if(this.location.direction === DIRECTION.RIGHT || this.location.direction === DIRECTION.LEFT) {
            index = Math.abs(this.location.column - location.column)
        } else if(this.location.direction === DIRECTION.UP || this.location.direction === DIRECTION.DOWN) {
            index = Math.abs(this.location.row - location.row)
        } else if(Math.abs(this.location.column - location.column) === Math.abs(this.location.row - location.row)){
            index = Math.abs(this.location.column - location.column)
        }
        return index < 0 ? null : this.value[index]
    }

    getAllLocations() {
        let locations = []
        if(this.location !== null) {
            for(let i=0; i<this.value.length; i++) {
                let column = this.location.column
                let row = this.location.row

                switch(this.location.direction) {
                    case DIRECTION.RIGHT:
                    case DIRECTION.UP_RIGHT:
                    case DIRECTION.DOWN_RIGHT:
                        column += i
                        break
                    case DIRECTION.LEFT:
                    case DIRECTION.UP_LEFT:
                    case DIRECTION.DOWN_LEFT:
                        column -= i
                        break
                }

                switch(this.location.direction) {
                    case DIRECTION.UP:
                    case DIRECTION.UP_RIGHT:
                    case DIRECTION.UP_LEFT:
                        row -= i
                        break
                    case DIRECTION.DOWN:
                    case DIRECTION.DOWN_RIGHT:
                    case DIRECTION.DOWN_LEFT:
                        row += i
                        break
                }
                locations.push(new DirectedLocation(column, row, this.location.direction))
            }
        }
        return locations
    }


    conflict(otherWordInfo) {
        let locations = this.getAllLocations()
        let otherLocations = otherWordInfo.getAllLocations()
        if (otherLocations.length == 0)
            return false
        for(let i=0; i<locations.length; i++) {
            let location = locations[i]
            for(let j=0; j<otherLocations.length; j++) {
                let otherLocation = otherLocations[j]
                if(location.equals(otherLocation)) {
                    return true
                }
                if(location.column === otherLocation.column && location.row === otherLocation.row && location.direction !== otherLocation.direction) {
                    if(this.letterAt(location) !== otherWordInfo.letterAt(otherLocation)){
                        return true
                    }
                }
            }
        }
        return false
    }
}