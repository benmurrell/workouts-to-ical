////////////////////////////////////////////////////////////////////////////////
// main.ts
//
// Receive workout data posted from Health Auto Export iOS app, transmute into a 
// subscribable calendar in order to make fitness streaks easier to appreciate.
//
// Run using "ts-node src/main.ts", see readme.md for more info.
//
// Copyright (c) 2024 Ben Murrell
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
////////////////////////////////////////////////////////////////////////////////

import ical from 'ical-generator';

import Config from '../Config';
import DataFile from './DataFile';
import WorkoutsToIcalApp from "./WorkoutsToIcalApp";

////////////////////////////////////////////////////////////////////////////////
// main - entry point for workouts-to-ical
////////////////////////////////////////////////////////////////////////////////
async function main() {
    let config = new Config();

    console.log( new Date() + " - Opening DB ..." );
    let dataFile: DataFile = await DataFile.open( config.dbFilename );

    let calendar = ical({
        name: config.calendarName
    });

    let app = new WorkoutsToIcalApp( dataFile, calendar, config );
    app.start();
}

// Call entry point!
main();
