import { DIRECTION, shuffle, print } from "./util.js"
import { DirectedLocation } from "./directed-location.js"

export class RandomLocator {
    constructor(allowedDirections, columns, rows = 0) {
        rows = rows === 0 ? columns : rows
        this.locations = []
        
        for(let column=0; column<columns; column++) {
            for(let row=0; row<rows; row++) {
                allowedDirections.forEach(direction => {
                    this.locations.push(new DirectedLocation(column, row, direction))
                })
            }
        }
        this.locations = shuffle(this.locations)
    }
    
    get size() {
        return this.locations.length
    }

    getLocationAt(index) {
        return this.locations[index]
    }

    add(location) {
        this.locations.push(location)
    }

    remove(locationToRemove) {
        this.locations = 
            this.locations.filter(location => !location.equals(locationToRemove))
        return locationToRemove
    }

    excluding(locationsToExclude) {
        let locationsExcluding = []

        this.locations.forEach(location => {
            let shouldExclude = locationsToExclude.some(locationToExclude => locationToExclude.equals(location))
            if(!shouldExclude)
                locationsExcluding.push(location)
        })
        return locationsExcluding
    }
}