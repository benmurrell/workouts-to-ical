////////////////////////////////////////////////////////////////////////////////
// DataFile.ts
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

import sqlite3 from "sqlite3";
import * as sqliteAsync from "sqlite";

import fs from "fs";
import CalendarWorkoutEvent from "./CalendarWorkoutEvent";

////////////////////////////////////////////////////////////////////////////////
// DataFile - used to read persist received fitness data
////////////////////////////////////////////////////////////////////////////////
export default class DataFile {
    private db: sqliteAsync.Database;

    ////////////////////////////////////////////////////////////////////////////
    // constructor - do not use, call DataFile.open().
    ////////////////////////////////////////////////////////////////////////////
    private constructor() {
        // cannot have async constructor
    }

    ////////////////////////////////////////////////////////////////////////////
    // Open (and create if it does not exist) the underlying database in the
    // given aFilename
    ////////////////////////////////////////////////////////////////////////////
    static async open(
        aFilename: string = "workouts.db"
    ) {
        let ret = new DataFile();

        ret.db = await sqliteAsync.open({
            filename: aFilename,
            mode: sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
            driver: sqlite3.Database
        });

        ret.db.getDatabaseInstance().serialize();
        await ret.db.exec( fs.readFileSync( 'sql/workouts.sql', 'utf8' ) );

        return ret;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Close the underlying db; this DataFile is no longer usable after it is
    // closed.
    ////////////////////////////////////////////////////////////////////////////
    async close() {
        await this.db.close();
    }

    ////////////////////////////////////////////////////////////////////////////
    // Merge aData with the current data in this file, call aOnNewWorkout for
    // each new (not previously seen) workout in aData.
    ////////////////////////////////////////////////////////////////////////////
    async mergeData( aData, aOnNewWorkout ) {
        await Promise.allSettled( aData.workouts.map( async ( aWorkout ) => {
            // Check against existing workouts, use start as key (assumes no two workouts will start at the same time)
            let countStatement = await this.db.prepare( 'SELECT COUNT(*) AS "count" FROM workouts WHERE start = ?' );
            let count = ( await countStatement.get( aWorkout.start ) ).count;
            await countStatement.finalize();

            // If we haven't seen this workout before, merge it into this DataFile and call aOnNewWorkout
            if( count === 0 ) {
                let insertStatement = await this.db.prepare( 'INSERT INTO workouts (value) VALUES (?)' );
                await insertStatement.run( JSON.stringify( aWorkout ) );
                await insertStatement.finalize();
                aOnNewWorkout( aWorkout );
            }
        }));
    }

    ////////////////////////////////////////////////////////////////////////////
    // Get an array of CalendarWorkoutEvent for all workouts in the DataFile
    ////////////////////////////////////////////////////////////////////////////
    async getCalendarWorkoutEvents() {
        let ret: CalendarWorkoutEvent[] = [];

        let statement = await this.db.prepare( 'SELECT value FROM workouts' );
        let rowCount = await statement.each( ( aErr, aRow ) => {
            if( aErr ) {
                throw aErr;
            }

            let workoutEvent = CalendarWorkoutEvent.createFromWorkoutData( JSON.parse( aRow.value ) );
            if( workoutEvent ) {
                ret.push( workoutEvent );
            }
        });

        await statement.finalize();
        return ret;
    }
}
