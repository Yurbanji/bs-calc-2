import test from 'node:test';
import assert from 'node:assert/strict';
import {cassetteConfig} from './dist/cassettes.js';
import {defaults,calculate} from './dist/model.js';
test('standard groups include cassette banks on both sides of pole',()=>{for(const [capMode,c,parallel] of [[0,2.24,3],[1,4.48,3],[2,11.55,1]])for(const capRows of [1,2]){const r=cassetteConfig({...defaults,capMode,capRows});assert.equal(r.cassette,c);assert.equal(r.groupC,c*parallel/(2*capRows));assert.equal(r.cassettesPerPole,2*capRows*parallel);}});
test('custom series assemblies divide element capacitance',()=>{for(let customAssembly=1;customAssembly<=6;customAssembly++){const r=cassetteConfig({...defaults,capMode:3,customAssembly,customParallel:12,customCassetteParallel:3});const base=customAssembly<=3?0.056:0.33;const series=customAssembly<=3?customAssembly:customAssembly-3;assert.equal(r.cassette,base*12/series);}});
test('rows and secondary series poles reduce equivalent C independently',()=>{const p={...defaults,poles:6,combination:2};for(const capRows of [1,2]){const c=cassetteConfig({...p,capRows});const r=calculate({...p,cassette:c.cassette,capParallel:c.parallel,capSeries:c.serialSections});assert.equal(r.totalCassettes,36*capRows);assert.ok(Math.abs(r.capacitance-5.04/capRows)<1e-10);}});

test('custom third row has six serial banks per pole',()=>{
 const p={...defaults,capMode:3,customAssembly:3,customParallel:40,customCassetteParallel:3};
 const one=cassetteConfig({...p,capRows:1});
 const three=cassetteConfig({...p,capRows:3});
 assert.equal(three.serialSections,6);
 assert.equal(three.cassettesPerPole,18);
 assert.ok(Math.abs(three.groupC-one.groupC/3)<1e-10);
 const r=calculate({...p,cassette:three.cassette,capParallel:three.parallel,capSeries:three.serialSections});
 assert.equal(r.totalCassettes,p.poles*18);
});
