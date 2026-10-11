export function cassetteConfig(p){
 const presets=[{c:2.24,n:40,base:0.056,parallel:3},{c:4.48,n:80,base:0.056,parallel:3},{c:11.55,n:35,base:0.33,parallel:1}];
 const preset=presets[p.capMode];
 const assembly=p.customAssembly;
 const base=assembly<=3?0.056:0.33;
 const series=assembly<=3?assembly:assembly-3;
 const cassette=preset?preset.c:base*p.customParallel/series;
 const parallel=preset?preset.parallel:p.customCassetteParallel;
 const serialSections=2*p.capRows;
 return {cassette,parallel,serialSections,groupC:cassette*parallel/serialSections,cassettesPerPole:serialSections*parallel,base:preset?preset.base:base,assemblySeries:preset?1:series,assemblies:preset?preset.n:p.customParallel};
}
