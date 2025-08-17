import { DirectedLocation } from "./directed-location.js"
import { DIRECTION } from "./util.js"

export class WordInfo {
    constructor(string, location = null) {
        this.value = string
        this.location = location
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
        return this.value === otherWord.value && this.location.equals(otherWord.location)
    }

    letterAt(location) {
        let index = -1
        if ((this.location.direction === DIRECTION.RIGHT || this.location.direction === DIRECTION.LEFT) && this.location.row - location.row === 0 ) {
            index = Math.abs(this.location.column - location.column)
        } else if ((this.location.direction === DIRECTION.UP || this.location.direction === DIRECTION.DOWN) && this.location.column - location.column === 0) {
            index = Math.abs(this.location.row - location.row)
        } else if (Math.abs(this.location.column - location.column) === Math.abs(this.location.row - location.row)) {
            index = Math.abs(this.location.column - location.column)
        }
        return index < 0 ? null : this.value[index]
    }

    getAllLocations() {
        let locations = []
        if (this.location !== null) {
            let column = this.location.column
            let row = this.location.row
            let dColumn = 0
            let dRow = 0
            switch (this.location.direction) {
                case DIRECTION.RIGHT:
                case DIRECTION.UP_RIGHT:
                case DIRECTION.DOWN_RIGHT:
                    dColumn = 1
                    break
                case DIRECTION.LEFT:
                case DIRECTION.UP_LEFT:
                case DIRECTION.DOWN_LEFT:
                    dColumn = -1
                    break
            }
            switch (this.location.direction) {
                case DIRECTION.UP:
                case DIRECTION.UP_RIGHT:
                case DIRECTION.UP_LEFT:
                    dRow = -1
                    break
                case DIRECTION.DOWN:
                case DIRECTION.DOWN_RIGHT:
                case DIRECTION.DOWN_LEFT:
                    dRow = 1
                    break
            }
            for (let i = 0; i < this.value.length; i++) {
                locations.push(new DirectedLocation(column, row, this.location.direction))
                column += dColumn
                row += dRow
            }
        }
        return locations
    }


    conflict(otherWordInfo) {
        let locations = this.getAllLocations()
        let otherLocations = otherWordInfo.getAllLocations()
        if (otherLocations.length == 0)
            return false
        for (let i = 0; i < locations.length; i++) {
            let location = locations[i]
            for (let j = 0; j < otherLocations.length; j++) {
                let otherLocation = otherLocations[j]
                if (location.equals(otherLocation)) {
                    return true
                }
                if (location.column === otherLocation.column && location.row === otherLocation.row && location.direction !== otherLocation.direction) {
                    if (this.letterAt(location) !== otherWordInfo.letterAt(otherLocation)) {
                        return true
                    }
                }
            }
        }
        return false
    }
}