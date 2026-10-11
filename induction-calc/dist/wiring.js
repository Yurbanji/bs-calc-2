import {calculateBS} from './model.js';

// Physical order: inverter, level from top to bottom, pole from left to right.
// Consecutive primary coils form equal series branches, as in the supplied example.
export function primaryWiring(p){
 const bs=calculateBS(p);
 if(bs.errors.length)return {errors:bs.errors,lines:[],coils:[]};
 const coils=[],lines=[];
 let number=0;
 for(let inverter=1;inverter<=p.inverters;inverter++){
  const local=[];
  for(let level=0;level<p.coils;level++)for(let pole=1;pole<=p.poles;pole++)local.push({inverter,pole,level});
  for(let i=0;i<local.length;i+=p.primarySeries){
   number++;
   const line={number,label:'L'+number,inverter,color:`hsl(${(((number-1)*137.508)%360).toFixed(3)} 65% 34%)`,coils:local.slice(i,i+p.primarySeries).map(c=>({...c,line:number,label:'L'+number}))};
   lines.push(line);coils.push(...line.coils);
  }
 }
 return {errors:[],lines,coils};
}

export function primarySvg(p){
 const wiring=primaryWiring(p);
 if(wiring.errors.length)return {wiring,svg:''};
 const spacing=110,first=130,last=first+(p.poles-1)*spacing,width=last+130;
 const blockHeight=p.coils*62+70,height=p.inverters*blockHeight+80;
 const x=c=>first+(c.pole-1)*spacing;
 const y=c=>120+(c.inverter-1)*blockHeight+c.level*62;
 const path=(d,color)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Первичная обмотка: ${p.poles} столбов, ${wiring.lines.length} цветных линий, ${wiring.coils.length} катушек" style="min-width:${p.poles<=4?0:p.poles*100}px"><rect width="${width}" height="${height}" fill="#fff"/>`;
 for(let pole=1;pole<=p.poles;pole++){
  const cx=first+(pole-1)*spacing;
  svg+=`<rect x="${cx-51}" y="65" width="102" height="${height-100}" rx="10" fill="#f0f4f6" stroke="#dbe4e8"/><text x="${cx}" y="40" text-anchor="middle" fill="#36535f" font-size="14" font-weight="700">Столб ${pole}</text>`;
 }
 for(let inverter=1;inverter<=p.inverters;inverter++){
  const top=120+(inverter-1)*blockHeight,bottom=top+(p.coils-1)*62;
  svg+=path(`M40 ${top-24} V${bottom+24}`,'#526d7a')+path(`M${width-40} ${top-24} V${bottom+24}`,'#526d7a');
  svg+=`<text x="60" y="${top-34}" fill="#36535f" font-size="13" font-weight="700">Инвертор ${inverter}</text><text x="8" y="${top-22}" fill="#526d7a" font-size="10">Вход</text><text x="${width-60}" y="${top-22}" fill="#526d7a" font-size="10">Выход</text>`;
 }
 for(const line of wiring.lines){
  const a=line.coils[0],z=line.coils.at(-1),ax=x(a)-40,ay=y(a),zx=x(z)+40,zy=y(z),color=line.color;
  // Feed and return run above/below the coil row, never through another coil.
  svg+=path(`M40 ${ay-24} H${ax-13} V${ay} H${ax}`,color);
  svg+=path(`M${zx} ${zy} H${zx+13} V${zy+24} H${width-40}`,color);
  svg+=`<circle cx="40" cy="${ay-24}" r="3" fill="${color}"/><circle cx="${width-40}" cy="${zy+24}" r="3" fill="${color}"/>`;
  for(let k=1;k<line.coils.length;k++){
   const previous=line.coils[k-1],next=line.coils[k],px=x(previous)+40,py=y(previous),nx=x(next)-40,ny=y(next);
   if(py===ny)svg+=path(`M${px} ${py} H${nx}`,color);
   else svg+=path(`M${px} ${py} H${px+22} V${py+25} H70 V${ny} H${nx}`,color);
  }
 }
 // Draw terminals and coils last: labels stay readable at wire crossings.
 for(const c of wiring.coils){const color=wiring.lines[c.line-1].color,cx=x(c),cy=y(c);
  svg+=`<rect x="${cx-40}" y="${cy-17}" width="80" height="34" rx="5" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-width="2"/><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="14" font-weight="700" fill="${color}">${c.label}</text><circle cx="${cx-40}" cy="${cy}" r="3" fill="${color}"/><circle cx="${cx+40}" cy="${cy}" r="3" fill="${color}"/>`;
 }
 svg+='</svg>';
 return {wiring,svg};
}

