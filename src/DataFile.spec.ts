////////////////////////////////////////////////////////////////////////////////
// DataFile.test.ts
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

import test from "node:test";
import assert from "node:assert";
import * as fs from "fs";

import DataFile from './DataFile';

////////////////////////////////////////////////////////////////////////////////
// Tests for DataFile
////////////////////////////////////////////////////////////////////////////////
test( "DataFile tests", async ( t ) => {
    // Setup
    // Check for db, delete if exist
    const newDbName = "datafile-new-test-db.db";
    if( fs.existsSync( newDbName ) ) {
        console.warn( "Removing " + newDbName + " for test, should not be present." );
        fs.unlinkSync( newDbName );
    }

    // Tests
    // Open new db
    let dataFile: DataFile = await DataFile.open( newDbName );

    // Check if exists
    t.test( "newly created db should exist", ( t ) => {
        let fileExists = fs.existsSync( newDbName );
        assert.strictEqual( fileExists, true );
    });

    // Check if empty
    await t.test( "newly created db should be empty", async ( t ) => {
        let events = await dataFile.getCalendarWorkoutEvents();
        assert.strictEqual( events.length, 0 );
    });

    // Call merge with new data, check it was added
    await t.test( "add one new workout", async ( t ) => {
        let payload = JSON.parse( fs.readFileSync( "test-data/workoutA.json", 'utf8' ) );

        await t.test( "callback should be called once for new data", async( t ) => {
            let callbackCount = 0;
            function callback() {
                callbackCount++;
            }

            await dataFile.mergeData( payload, callback );
            assert.strictEqual( callbackCount, 1 );
        });

        await t.test( "should have 1 CalendarWorkoutEvent in db", async( t ) => {
            let events = await dataFile.getCalendarWorkoutEvents();
            assert.strictEqual( events.length, 1 );
        });
    });

    // Call merge with new + old data, ensure only new data merged
    await t.test( "add one new workout and one old workout", async ( t ) => {
        let payload = JSON.parse( fs.readFileSync( "test-data/workoutA-workoutB.json", 'utf8' ) )

        await t.test( "callback should be called once for new data", async( t ) => {
            let callbackCount = 0;
            function callback() {
                callbackCount++;
            }

            await dataFile.mergeData( payload, callback );
            assert.strictEqual( callbackCount, 1 );
        });

        await t.test( "should have 2 CalendarWorkoutEvent in db", async( t ) => {
            let events = await dataFile.getCalendarWorkoutEvents();
            assert.strictEqual( events.length, 2 );
        });
    });

    // Call merge with only old data, ensure no merge occurred
    await t.test( "add two old workouts", async ( t ) => {
        let payload = JSON.parse( fs.readFileSync( "test-data/workoutA-workoutB.json", 'utf8' ) );

        await t.test( "callback should not be called", async( t ) => {
            let callbackCount = 0;
            function callback() {
                callbackCount++;
            }

            await dataFile.mergeData( payload, callback );
            assert.strictEqual( callbackCount, 0 );
        });

        await t.test( "should have 2 CalendarWorkoutEvent in db", async( t ) => {
            let events = await dataFile.getCalendarWorkoutEvents();
            assert.strictEqual( events.length, 2 );
        });
    });

    // Check if closes without issue
    await t.test( "should close", async( t ) => {
        await dataFile.close();
    });

    // Cleanup
    fs.unlinkSync( newDbName );
});
