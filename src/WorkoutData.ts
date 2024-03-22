////////////////////////////////////////////////////////////////////////////////
// WorkoutData.ts
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

import Ajv, {JSONSchemaType} from 'ajv';
import dayjs from 'dayjs';

////////////////////////////////////////////////////////////////////////////////
// WorkoutData - interface for one workout of data received from the Auto Export 
// app
////////////////////////////////////////////////////////////////////////////////
export default interface WorkoutData {
    name: string,
    start: string,
    end: string,
    isIndoor?: boolean,
    activeEnergy: {
        qty: number
    },
    stepCadence: {
        qty: number
    },
    distance: {
        qty: number
    },
    speed: {
        qty: number
    },
    avgHeartRate: {
        qty: number
    }
    maxHeartRate: {
        qty: number
    }
};


////////////////////////////////////////////////////////////////////////////////
// workoutDataSchema - schema for one workout of data received from the Auto 
// Export app
////////////////////////////////////////////////////////////////////////////////
const workoutDataSchema: JSONSchemaType<WorkoutData> = {
    type: "object",
    properties: {
        name: { type: "string" },
        start: { type: "string", format: "workout-timestamp" },
        end: { type: "string", format: "workout-timestamp" },
        isIndoor: { type: "boolean", nullable: true },
        activeEnergy: { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
        stepCadence: { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
        distance:  { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
        speed:  { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
        avgHeartRate:  { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
        maxHeartRate:  { 
            type: "object", 
            properties: {
                qty: { type: "number" }
            },
            required: [ "qty" ]
        },
    },
    required: [ "name", "start", "end", "activeEnergy", "stepCadence", "distance", "speed", "avgHeartRate", "maxHeartRate" ],
    additionalProperties: true
};

const ajv = new Ajv();
ajv.addFormat( "workout-timestamp", {
    type: "string",
    validate: ( aVal ) => dayjs( aVal ).isValid()
});

////////////////////////////////////////////////////////////////////////////////
// isWorkoutData - schema validation function that can be used as a type guard
////////////////////////////////////////////////////////////////////////////////
const isWorkoutData = ajv.compile( workoutDataSchema );
export { isWorkoutData as isWorkoutData };
