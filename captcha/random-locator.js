import { DIRECTION, shuffle, print } from "./util.js"
import { DirectedLocation } from "./directed-location.js"

export class RandomLocator {
    constructor(sizeX, sizeY = 0) {
        sizeY = sizeY === 0 ? sizeX : sizeY
        this.locations = []
        
        for(let i=0; i<sizeX; i++) {
            for(let j=0; j<sizeY; j++) {
                Object.values(DIRECTION).forEach(direction => {
                    this.locations.push(new DirectedLocation(i, j, direction))
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