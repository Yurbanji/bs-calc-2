export const defaults={diameter:30,zone:100,t0:20,target:800,time:60,inverters:2,poles:4,combination:1,coils:2,primarySeries:2,frequency:41.2,cassette:2.24,capSeries:2,capParallel:3,gap:8,turns:6,coilLength:100,tube:8,wall:1,cp:600,density:7850,rho20:0.16,alpha:0.004,mu:1,lFactor:1,emissivity:0.7,h:15,extraLoss:15};
defaults.inverterVoltage=540;
defaults.inverterCurrent=80;
defaults.capMode=0;
defaults.capRows=1;
defaults.customAssembly=1;
defaults.customParallel=40;
defaults.customCassetteParallel=3;
const labels={diameter:'диаметр прута',zone:'длина зоны нагрева',time:'время нагрева',coils:'катушки на столб',primarySeries:'катушки последовательно',frequency:'частота',cassette:'ёмкость кассеты',capSeries:'кассеты последовательно',capParallel:'параллельные ветви кассет',gap:'зазор',turns:'число витков',coilLength:'длина намотки',tube:'диаметр трубки',wall:'толщина стенки',cp:'теплоёмкость',density:'плотность',rho20:'удельное сопротивление',mu:'магнитная проницаемость',lFactor:'поправка индуктивности',inverters:'число инверторов',poles:'число столбов'};
export function seriesPoles(p){return p.combination===3?4:p.combination===2?2:1;}
export function validCombinations(m){return [1,...(m%2===0?[2]:[]),...(m===4?[3]:[])];}
const finitePositive=(v)=>Number.isFinite(v)&&v>0;
export function calculateBS(p){
 const errors=[];
 if(!finitePositive(p.inverterVoltage))errors.push('Напряжение одного инвертора должно быть положительным.');
 if(!Number.isFinite(p.inverterCurrent)||p.inverterCurrent<0||p.inverterCurrent>80)errors.push('Входной ток одного инвертора: от 0 до 80 А.');
 if(!Number.isInteger(p.inverters)||p.inverters<1||p.inverters>8)errors.push('Количество инверторов: от 1 до 8.');
 if(![1,2,4,6,8].includes(p.poles)||!validCombinations(p.poles).includes(p.combination))errors.push('Недопустимое соединение столбов.');
 for(const key of ['coils','primarySeries'])if(!Number.isInteger(p[key])||p[key]<1)errors.push('Требуется положительное целое количество: '+labels[key]+'.');
 const totalCoils=p.poles*p.coils;
 if(totalCoils%p.primarySeries!==0)errors.push('Число катушек одного инвертора должно делиться на число катушек последовательно.');
 if(errors.length)return {errors};
 const s=seriesPoles(p),b=p.poles/s,primaryBranches=totalCoils/p.primarySeries;
 // Each primary coil has its own core. Voltages induced along a pole add;
 // the same secondary current passes through every core on that pole.
 const coilU=p.inverterVoltage/p.primarySeries,coreU=coilU/30;
 const lineI=p.inverterCurrent/primaryBranches;
 const poleU=coreU*p.coils*p.inverters,poleI=lineI*30;
 const sourceU=poleU*s,sourceI=poleI*b;
 return {errors:[],s,b,primaryBranches,totalCoils,coilU,coreU,lineI,poleU,poleI,sourceU,sourceI,maxVA:sourceU*sourceI};
}
export function calculate(p){
 const errors=[];const warnings=[];
 errors.push(...calculateBS(p).errors);
 for(const key of Object.keys(defaults)) if(!(p.capMode!==3&&["customAssembly","customParallel","customCassetteParallel"].includes(key))&&!Number.isFinite(p[key])) errors.push('Заполните все числовые поля.');
 for(const key of ['diameter','zone','time','coils','primarySeries','frequency','cassette','capSeries','capParallel','gap','turns','coilLength','tube','wall','cp','density','rho20','mu','lFactor'])if(!finitePositive(p[key]))errors.push('Положительное значение требуется: '+labels[key]+'.');
 for(const key of ['inverters','poles','coils','primarySeries','capSeries','capParallel','turns'])if(!Number.isInteger(p[key]))errors.push('Количество элементов должно быть целым: '+labels[key]+'.');
 if(![1,2,4,6,8].includes(p.poles)||!validCombinations(p.poles).includes(p.combination))errors.push('Недопустимое соединение столбов.');
 if(p.inverters<1||p.inverters>8)errors.push('Количество инверторов: от 1 до 8.');
 if(p.frequency<7||p.frequency>60)errors.push('Частота генератора: от 7 до 60 кГц.');
 if(p.t0<0||p.target>1200||p.target<=p.t0)errors.push('Температура: 0–1200 °C; целевая выше начальной.');
 if(p.wall*2>=p.tube)errors.push('Толщина стенки должна быть меньше половины диаметра трубки.');
 if(p.coilLength<p.turns*p.tube)errors.push('Витки не помещаются по длине: увеличьте намотку или уменьшите число витков/диаметр трубки.');
 if(p.emissivity<0||p.emissivity>1||p.h<0||p.extraLoss<0||p.alpha<0)errors.push('Проверьте коэффициенты потерь и материала.');
 if(1+p.alpha*((p.t0+p.target)/2-20)<=0)errors.push('Коэффициент температурной зависимости даёт неположительное сопротивление.');
 const totalCoils=p.poles*p.coils;
 if(totalCoils%p.primarySeries!==0)errors.push('Число катушек одного инвертора должно делиться на число катушек последовательно.');
 if(errors.length)return {errors:[...new Set(errors)],warnings};
 const {s,b,primaryBranches,sourceU,sourceI,maxVA}=calculateBS(p);
 const groupC=p.cassette*p.capParallel/p.capSeries,branchC=groupC/s,capacitance=branchC*b,totalCassettes=p.poles*p.capSeries*p.capParallel;
 const d=p.diameter/1000,z=p.zone/1000,length=p.coilLength/1000,meanD=(p.diameter+2*p.gap+p.tube)/1000;
 const mass=p.density*Math.PI*d*d/4*z,energy=mass*p.cp*(p.target-p.t0);
 const surface=Math.PI*d*z+2*Math.PI*d*d/4;
 // Linear temperature ramp; numerical quadrature for average radiation and convection.
 let loss=0;for(let j=0;j<100;j++){const t=p.t0+(p.target-p.t0)*(j+0.5)/100;loss+=surface*(p.emissivity*5.670374419e-8*((t+273.15)**4-(p.t0+273.15)**4)+p.h*(t-p.t0))/100;}
 const thermalPower=energy/p.time+loss+energy/p.time*p.extraLoss/100;
 const rIn=meanD/2/0.0254,lIn=length/0.0254;
 const airL=rIn*rIn*p.turns*p.turns/(9*rIn+10*lIn); // Wheeler, μH, dimensions in inches.
 const inductance=airL*p.lFactor,w=2*Math.PI*p.frequency*1000;
 const modelTemperature=(p.t0+p.target)/2;
 const resistivity=p.rho20*1e-6*(1+p.alpha*(modelTemperature-20));
 const skin=Math.sqrt(2*resistivity/(w*4*Math.PI*1e-7*p.mu));
 const surfaceResistance=resistivity/skin;
 const fieldFactor=length*length/(length*length+meanD*meanD);
 // Surface-loss approximation for a long cylinder in an axial field H≈NI/l.
 // This ignores ends, nonlinear magnetism and thermal diffusion; NOT calibrated for Ст3.
 const loadR=surfaceResistance*Math.PI*d*Math.min(z,length)*p.turns*p.turns/(length*length)*fieldFactor;
 const cuRho=1.724e-8,cuSkin=Math.sqrt(2*cuRho/(w*4*Math.PI*1e-7));
 const outer=p.tube/1000,inner=outer-2*p.wall/1000;
 const copperArea=Math.min(Math.PI*(outer*outer-inner*inner)/4,Math.PI*outer*cuSkin);
 const tubeLength=p.turns*Math.sqrt((Math.PI*meanD)**2+(length/p.turns)**2);
 const copperR=cuRho*tubeLength/copperArea;
 const resistance=loadR+copperR,xL=w*inductance*1e-6,xC=1/(w*capacitance*1e-6),impedance=Math.hypot(resistance,xL-xC);
 const requiredI=Math.sqrt(thermalPower/loadR),requiredU=requiredI*impedance,inductorU=requiredI*Math.hypot(resistance,xL),capacitorU=requiredI*xC;
 const currentAtSource=sourceU/impedance,availableI=Math.min(currentAtSource,sourceI),availablePower=availableI*availableI*loadR;
 const feasible=requiredI<=sourceI&&requiredU<=sourceU;
 const resonance=1/(2*Math.PI*Math.sqrt(inductance*1e-6*capacitance*1e-6))/1000;
 const resonanceC=1/(w*w*inductance*1e-6)*1e6;
 if(skin>d/6)warnings.push('Глубина проникновения велика относительно радиуса прута: поверхностная модель нагрузки мало применима.');
 if(p.target>650&&p.mu!==1)warnings.push('Магнитные свойства при высоких температурах нельзя описать одним постоянным μr; сравните отдельные холодный и горячий режимы.');
 if(p.target>650)warnings.push('При высоких температурах постоянная теплоёмкость даёт лишь грубую оценку энергии; превращения в стали не учтены.');
 if(p.coilLength!==p.zone)warnings.push('Длина намотки отличается от зоны нагрева. Распределение температуры и краевые эффекты не рассчитаны.');
 if(resonance<7||resonance>60)warnings.push('Расчётный резонанс вне диапазона генератора 7–60 кГц.');
 if(!feasible)warnings.push('Выбранная конфигурация не обеспечивает заданное время по этой модели: превышен доступный ток или напряжение.');
 warnings.push('Параллельные ветви и инверторы предполагаются одинаковыми, согласованными по фазе и полярности.');
 return {errors:[],warnings,sourceU,sourceI,maxVA,primaryBranches,totalCoils,s,b,groupC,branchC,totalCassettes,capacitance,mass,energy,loss,thermalPower,airL,inductance,modelTemperature,resistivity,skin,loadR,copperR,resistance,requiredI,requiredU,inductorU,capacitorU,currentAtSource,availableI,availablePower,feasible,resonance,resonanceC,xL,xC,tubeLength};
}



