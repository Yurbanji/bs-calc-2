import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from './dist/model.js';
import {primaryWiring,primarySvg} from './dist/wiring.js';
test('reference PDF primary layout: two serial coils per line, four parallel lines',()=>{const p={...defaults,inverters:1,poles:4,coils:2,primarySeries:2};const w=primaryWiring(p);assert.deepEqual(w.lines.map(l=>l.coils.map(c=>[c.pole,c.level])),[[[1,0],[2,0]],[[3,0],[4,0]],[[1,1],[2,1]],[[3,1],[4,1]]]);assert.deepEqual(w.lines.map(l=>l.label),['L1','L2','L3','L4']);});
test('every coil belongs to exactly one inverter and one complete line',()=>{for(const poles of [1,2,4,6,8])for(const inverters of [1,3,8])for(const coils of [1,2,4]){const w=primaryWiring({...defaults,poles,inverters,coils,primarySeries:1});assert.equal(w.coils.length,poles*inverters*coils);assert.equal(new Set(w.coils.map(c=>`${c.inverter}/${c.pole}/${c.level}`)).size,w.coils.length);for(const l of w.lines)assert.ok(l.coils.every(c=>c.inverter===l.inverter));}});
test('series chains may cross physical levels without duplicating coils',()=>{const w=primaryWiring({...defaults,inverters:2,poles:6,coils:2,primarySeries:4});assert.equal(w.lines.length,6);assert.ok(w.lines.every(l=>l.coils.length===4));assert.equal(new Set(w.lines.map(l=>l.color)).size,6);assert.ok(primarySvg({...defaults,inverters:2,poles:6,coils:2,primarySeries:4}).svg.includes('Столб 6'));});
test('invalid primary topology produces no wiring',()=>{assert.equal(primaryWiring({...defaults,primarySeries:3}).lines.length,0);});
