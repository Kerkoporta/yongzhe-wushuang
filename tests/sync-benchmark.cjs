'use strict';
// No dependencies. Measures actual game snapshot codec/handlers between isolated VM clients.
// Storage events are queued in memory; this is NOT a browser localStorage or WAN RTT claim.
const {gameContext}=require('./helpers/game-context.cjs');
const {performance}=require('node:perf_hooks');const fs=require('node:fs');
async function bench(interval,duration=2500){
 const a=gameContext({interval}),b=gameContext({interval});const store=new Map(),latencies=[];let sent=0,received=0,acks=0,snaps=0;
 for(const [src,dst,host]of [[a,b,true],[b,a,false]]){
  src.localStorage.getItem=k=>store.get(k)||null;
  src.localStorage.setItem=(key,value)=>{store.set(key,value);if(!key.startsWith('zf_coop_'))return;sent++;const start=performance.now();setImmediate(()=>{dst.__dispatch('storage',{key,newValue:value});received++;if(host&&key.endsWith('_snap')){snaps++;const ack=JSON.parse(value);setImmediate(()=>{JSON.stringify({type:'ack',wave:ack.wave});latencies.push(performance.now()-start);acks++;});}});};
 }
 a.run(`closeHome();enterCoop('bench',1);paused=false;zombies=Array.from({length:50},(_,i)=>makePiglin(500+i*20,600));`);
 b.run(`closeHome();enterCoop('bench',2);paused=false;`);
 const cpu=process.cpuUsage(),begin=performance.now();let prev=begin,snapT=0,frames=0;
 await new Promise(resolve=>{const timer=setInterval(()=>{const now=performance.now(),dt=(now-prev)/1000;prev=now;frames++;a.run(`netTick(${dt});`);b.run(`netTick(${dt});`);snapT-=dt;if(snapT<=0){snapT=interval/1000;a.run('coopSendSnap();');}if(now-begin>=duration){clearInterval(timer);setImmediate(()=>setImmediate(resolve));}},16);});
 const elapsed=performance.now()-begin,usage=process.cpuUsage(cpu);latencies.sort((x,y)=>x-y);
 return {intervalMs:interval,durationMs:+elapsed.toFixed(1),snapshotHz:+(snaps/elapsed*1000).toFixed(2),totalMessageHz:+(sent/elapsed*1000).toFixed(2),rttMedianMs:+(latencies[Math.floor(latencies.length*.5)]||0).toFixed(3),rttP95Ms:+(latencies[Math.floor(latencies.length*.95)]||0).toFixed(3),cpuPercent:+((usage.user+usage.system)/elapsed/10).toFixed(2),sent,received,acks,lossPercent:+((sent-received)/Math.max(1,sent)*100).toFixed(2),frames};
}
(async()=>{const rows=[];for(const interval of [100,50,25,16]){const r=await bench(interval);rows.push(r);console.log(JSON.stringify(r));}const report={scope:'Node isolated full game VM clients, real timers, 50 piglins; in-memory queued StorageEvent adapter, codec/handler RTT only; no browser disk or MQTT measured',selectedIntervalMs:16,rows};fs.writeFileSync('reports/sync-benchmark.json',JSON.stringify(report,null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1});
