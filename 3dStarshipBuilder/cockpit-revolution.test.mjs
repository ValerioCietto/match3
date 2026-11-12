import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cockpitProfile} from './cockpit-revolution.js';
test('SVG section determines radius, closes the poles and merges overlapping cabin paths',()=>{
 const shape=[{x:3,y:0},{x:5,y:5},{x:3,y:10},{x:1,y:5}];
 const a=cockpitProfile([shape]),b=cockpitProfile([shape,shape]);assert.equal(a.centerX,3);assert.deepEqual(a,b);
 assert.equal(a.profile[0].radius,0);assert.equal(a.profile.at(-1).radius,0);assert.equal(a.profile[80].radius,2);
 for(const {radius,y} of a.profile){assert.ok(Number.isFinite(radius)&&radius>=0);assert.ok(Math.abs(radius-(2-Math.abs(y-5)*.4))<1e-8);}
});
