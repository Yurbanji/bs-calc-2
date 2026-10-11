import {defaults,calculate,calculateBS,validCombinations} from './model.js';
import {primarySvg} from './wiring.js';
import {cassetteConfig} from './cassettes.js';
const $=id=>document.getElementById(id);
let state={...defaults};try{const saved=JSON.parse(localStorage.getItem('bs-calc-v1'));if(saved&&typeof saved==='object')for(const key of Object.keys(defaults))if(typeof saved[key]==='number')state[key]=saved[key];}catch{}
const definitions={
 'part-fields':[['diameter','Диаметр прута','мм',1,500,1],['zone','Длина зоны нагрева','мм',1,3000,1],['t0','Начальная температура','°C',0,1199,1],['target','Целевая температура','°C',1,1200,1],['time','Время нагрева','с',1,36000,1]],
 'coil-fields':[['gap','Радиальный зазор','мм',0.1,100,0.5],['turns','Число витков','шт',1,100,1],['coilLength','Длина намотки','мм',1,3000,1],['tube','Наружный диаметр трубки','мм',1,100,0.5],['wall','Толщина стенки трубки','мм',0.1,20,0.1],['frequency','Рабочая частота','кГц',7,60,0.1]],
 'generator-fields':[['inverters','Количество инверторов','шт',1,8,1],['poles','Количество столбов','select',[1,2,4,6,8]],['inverterVoltage','Напряжение одного инвертора','В',1,600,0.5],['inverterCurrent','Входной ток одного инвертора','А',0,80,1],['coils','Катушек на столб от инвертора','шт',1,32,1],['primarySeries','Катушек последовательно в ветви','шт',1,128,1]],
 'cap-fields':[['customParallel','Параллельных сборок в кассете','шт',1,1000,1],['customCassetteParallel','Кассет параллельно в каждом участке','шт',1,100,1]],
 'model-fields':[['cp','Средняя теплоёмкость','Дж/кг·К',1,2000,10],['density','Плотность','кг/м³',1,20000,10],['rho20','Удельное сопротивление при 20 °C','мкОм·м',0.01,10,0.01],['alpha','Температурный коэффициент ρ','1/К',0,0.02,0.0001],['mu','Относительная проницаемость μr','',1,1000,1],['lFactor','Поправка L с деталью','×',0.1,100,0.1],['emissivity','Степень черноты поверхности','',0,1,0.05],['h','Коэффициент конвекции','Вт/м²·К',0,500,1],['extraLoss','Дополнительные теплопотери','%',0,500,1]]};
for(const [container,fields] of Object.entries(definitions))$(container).innerHTML=fields.map(([key,label,unit,min,max,step])=>`<label>${label}${unit==='select'?`<select id="${key}">${min.map(v=>`<option value="${v}">${v}</option>`).join('')}</select>`:`<div class="field-control"><input id="${key}" type="number" min="${min}" max="${max}" step="${step}" required><span class="unit">${unit}</span></div>`}</label>`).join('');
const fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('ru-RU',{maximumFractionDigits:d}):'—';
const val=(n,unit,d=1)=>`${fmt(n,d)} <span>${unit}</span>`;
function sync(){for(const key of Object.keys(defaults))$(key).value=state[key];}
function toast(text){const t=document.createElement('div');t.className='toast';t.textContent=text;document.body.append(t);setTimeout(()=>t.remove(),2500);}
let schemeMode='primary';
function diagram(r){
 if(schemeMode==='primary'){
  const {wiring,svg}=primarySvg(state);
  $('scheme').innerHTML=svg;
  $('scheme').className='wiring-scroll';
  $('scheme-legend').innerHTML=wiring.lines.map(line=>`<span class="line-key"><i style="background:${line.color}"></i>${line.label} · И${line.inverter}</span>`).join('');
  $('scheme-caption').textContent=`Столбы 1–${state.poles}; сверху вниз ${state.inverters*state.coils} катушек на столб. Цвет и L-номер обозначают одну линию от входа до выхода; ${state.primarySeries} катушек последовательно в каждой. Точки на проводах — соединения, пересечения без точки не соединены. Показана регулярная раскладка по образцу PDF; фактическая фазировка не проверяется.`;
  return;
 }
 $('scheme').className='';$('scheme-legend').innerHTML='<span>● Столб / вторичка 1 виток</span><span>▰ Группа кассет</span>';
 const rows=r.b,height=80+rows*54,left=38,right=430,start=92,end=370;
 let body=`<svg viewBox="0 0 510 ${height}" role="img" aria-label="${rows} параллельных ветвей, в каждой ${r.s} столбов последовательно и группа кассет; индуктор подключён между шинами"><g fill="none" stroke="#6d9398" stroke-width="2"><path d="M${left} 35 H216 M244 35 H${right}"/><path d="M${left} 35 V${height-28} M${right} 35 V${height-28}"/></g><rect x="216" y="22" width="28" height="26" rx="5" fill="#edf2f5" stroke="#587482"/><text x="230" y="39" text-anchor="middle" font-size="12" fill="#36535f">L</text><text x="257" y="24" font-size="10" fill="#546f7b">Индуктор</text>`;
 for(let j=0;j<rows;j++){const y=62+j*54;body+=`<path d="M${left} ${y} H${right}" stroke="#6d9398" stroke-width="2"/>`;for(let k=0;k<r.s;k++){const x=65+k*85;body+=`<rect x="${x}" y="${y-13}" width="28" height="26" rx="5" fill="#e2f4ef" stroke="#087f79"/><text x="${x+14}" y="${y+4}" text-anchor="middle" font-size="11" fill="#087f79">${j*r.s+k+1}</text><rect x="${x+37}" y="${y-13}" width="38" height="26" rx="4" fill="#fff4d9" stroke="#c9a451"/><text x="${x+56}" y="${y+4}" text-anchor="middle" font-size="10" fill="#8c712e">Cгр</text>`;}}
 body+='</svg>';
 $('scheme').innerHTML=body;$('scheme-caption').textContent=`${r.b} вторичных ветв. × ${r.s} столб. · Группа на каждом столбе: ${state.capSeries} последовательно × ${state.capParallel} параллельно. Полярности согласованы; первичные связи условно не показаны.`;
}
let result;
let bsResult;
function render(){
 const custom=state.capMode===3;
 const thirdRow=$('capRows').querySelector('option[value="3"]');
 thirdRow.hidden=!custom;thirdRow.disabled=!custom;
 if(!custom&&state.capRows===3){state.capRows=2;$('capRows').value=2;}
 const cap=cassetteConfig(state);
 state.cassette=cap.cassette;state.capSeries=cap.serialSections;state.capParallel=cap.parallel;
 for(const key of ['cassette','capSeries','capParallel'])$(key).value=state[key];
 $('custom-cap-settings').hidden=state.capMode!==3;
 $('cap-summary').textContent=`Кассета: ${fmt(cap.cassette,4)} мкФ. ${['Один ряд','Два ряда','Три ряда'][state.capRows-1]}: ${cap.serialSections} последовательных участка, в каждом ${cap.parallel} кассет параллельно. На столб ${cap.cassettesPerPole} кассет; суммарная ёмкость его группы ${fmt(cap.groupC,4)} мкФ.`;
 const capErrors=[];
 if(![0,1,2,3].includes(state.capMode)||!(custom?[1,2,3]:[1,2]).includes(state.capRows))capErrors.push('Выберите тип кассеты и количество рядов.');
 if(state.capMode===3&&(![1,2,3,4,5,6].includes(state.customAssembly)||!Number.isInteger(state.customParallel)||state.customParallel<1||!Number.isInteger(state.customCassetteParallel)||state.customCassetteParallel<1))capErrors.push('Количество параллельных сборок и кассет должно быть положительным целым числом.');
 const allowed=validCombinations(state.poles);for(const o of $('combination').options)o.disabled=!allowed.includes(Number(o.value));
 if(!allowed.includes(state.combination)){state.combination=1;$('combination').value=1;}
 bsResult=calculateBS(state);
 if(bsResult.errors.length){$('current').textContent='—';$('voltage').textContent='—';$('status').textContent='Проверьте параметры генератора и соединение катушек/столбов.';$('status').className='status bad';$('primary-summary').textContent='';}
 else{const bs=bsResult;$('current').innerHTML=val(bs.sourceI,'А',0);$('voltage').innerHTML=val(bs.sourceU,'В',2);$('status').className='status';$('status').textContent=`При ${fmt(state.inverterVoltage)} В и ${fmt(state.inverterCurrent)} А на каждый инвертор. Без влияния кассет, индуктора и резонанса; потери не учтены. Ток пересчитан из заданного входного тока, рабочий режим нагрузки не определяется.`;$('primary-summary').textContent=`Один инвертор: ${bs.totalCoils} катушек → ${bs.primaryBranches} параллельных ветвей по ${state.primarySeries} катушек последовательно. Ток линии ${fmt(bs.lineI,2)} А; напряжение катушки ${fmt(bs.coilU,2)} В. Каждый сердечник: ${fmt(bs.coreU,2)} В во вторичке. Один столб: ${fmt(bs.poleU,2)} В / ${fmt(bs.poleI,2)} А; всего ${state.coils*state.inverters} отдельных сердечников на столбе.`;}
 result=calculate(state);result.errors.push(...capErrors);try{localStorage.setItem('bs-calc-v1',JSON.stringify(state));}catch{}
 if(result.errors.length){$('metrics').innerHTML='';if(bsResult.errors.length){$('scheme').innerHTML='';$('scheme-caption').textContent='';}else diagram(bsResult);$('warnings').replaceChildren(...result.errors.map(t=>{const e=document.createElement('div');e.className='warning error';e.textContent=t;return e;}));return;}
 const r=result;
 const metrics=[['Требуемая мощность в детали',r.thermalPower/1000,'кВт'],['Доступная мощность в детали¹',r.availablePower/1000,'кВт'],['Требуемое напряжение источника',r.requiredU,'В'],['Предельное напряжение источника',r.sourceU,'В'],['Предельный ток источника',r.sourceI,'А'],['Предел генератора²',r.maxVA/1000,'кВА'],['Масса зоны нагрева',r.mass,'кг',3],['Энергия без теплопотерь',r.energy/1000,'кДж'],['Средние потери в среду',r.loss,'Вт'],['L пустого / с деталью',`${fmt(r.airL,2)} / ${fmt(r.inductance,2)}`,'мкГн'],['Эквивалентная ёмкость',r.capacitance,'мкФ',2],['Резонанс по модели',r.resonance,'кГц'],['Ёмкость для выбранной частоты',r.resonanceC,'мкФ',2],['Напряжение на Cэкв при Iтреб',r.capacitorU,'В'],['Ток одной вторичной ветви',r.requiredI/r.b,'А'],['Всего конденсаторных кассет',state.poles*state.capSeries*state.capParallel,'шт'],['R нагрузки / R меди',`${fmt(r.loadR*1000,2)} / ${fmt(r.copperR*1000,2)}`,'мОм'],['Глубина проникновения по модели',r.skin*1000,'мм',2],['Температура оценки свойств',r.modelTemperature,'°C'],['Внутренний диаметр спирали',state.diameter+2*state.gap,'мм']];
 metrics.unshift(['Оценка требуемого тока индуктора',r.requiredI,'А',0],['Оценка напряжения на индукторе',r.inductorU,'В',0]);
 $('metrics').innerHTML=metrics.map(([name,value,unit,digits=1])=>`<div class="metric"><div class="metric-name">${name}</div><div class="metric-value">${typeof value==='string'?value:fmt(value,digits)} <span>${unit}</span></div></div>`).join('')+`<p class="hint">¹ При выбранной частоте, L/R и кассетах, с ограничением тока. ² U×I; не полезная мощность нагрева.</p>`;
 $('warnings').replaceChildren(...r.warnings.map(t=>{const e=document.createElement('div');e.className='warning';e.textContent=t;return e;}));
 const note=document.createElement('p');note.className='note';note.textContent='Пределы напряжения и тока кассет, нагрев меди, охлаждение и насыщение сердечников пока не проверяются. Ток и напряжение на индукторе — требуемые значения для задачи, а не показания реальной установки.';$('warnings').append(note);diagram(r);
}
for(const key of Object.keys(defaults))$(key).addEventListener('input',()=>{state[key]=$(key).value===''?NaN:Number($(key).value);render();});
for(const button of document.querySelectorAll('[data-scheme]'))button.addEventListener('click',()=>{schemeMode=button.dataset.scheme;for(const b of document.querySelectorAll('[data-scheme]')){b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));}if(!bsResult.errors.length)diagram(bsResult);});
$('reset').addEventListener('click',()=>{state={...defaults};sync();render();toast('Пример восстановлен');});
$('fit').addEventListener('click',()=>{state.coilLength=state.zone;sync();render();toast('Длина намотки равна зоне нагрева');});
$('export').addEventListener('click',()=>{if(result.errors.length){toast('Сначала исправьте исходные данные');return;}const data={version:1,created:new Date().toISOString(),inputs:state,results:result,units:'Длины: мм; частота: кГц; температуры: °C. Результаты: СИ, кроме L/C (мкГн/мкФ), резонанса (кГц).',model:'Непроверенная приближённая модель; свойства Ст3 не калиброваны.'};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='BS-Calc-расчёт.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Расчёт сохранён');});
sync();render();

