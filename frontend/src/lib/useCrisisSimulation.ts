"use client";
import { useState, useCallback, useRef, useEffect } from "react";

export type RiskLevel = "normal" | "warn" | "alert" | "critical";
export interface AssetData { symbol: string; name: string; price: number; peg: number; deviation: number; change24h: number; riskLevel: RiskLevel; }
export interface SignalData { name: string; value: number; weight: string; }
interface CrisisFrame { risk: number; assets: AssetData[]; signals: SignalData[]; newAction?: any; reputation?: { score: number; successful: number; failed: number }; }

const INIT_ASSETS: AssetData[] = [
  { symbol: "USDY", name: "Ondo USD Yield", price: 1.0002, peg: 1.0, deviation: 0.0002, change24h: 0.01, riskLevel: "normal" },
  { symbol: "mETH", name: "Mantle ETH", price: 3247.82, peg: 3245.0, deviation: 0.00087, change24h: 1.24, riskLevel: "normal" },
  { symbol: "fBTC", name: "Firebitcoin", price: 67842.5, peg: 67800.0, deviation: 0.00063, change24h: 0.45, riskLevel: "normal" },
];
const INIT_SIGNALS: SignalData[] = [
  { name: "De-peg Risk", value: 5.7, weight: "35%" }, { name: "Liquidity Risk", value: 8.0, weight: "25%" },
  { name: "Correlation", value: 18.0, weight: "20%" }, { name: "Volatility", value: 13.3, weight: "10%" },
  { name: "TradFi Macro", value: 20.0, weight: "10%" },
];

function mkAsset(s: string, n: string, p: number, pg: number, d: number, c: number, r: RiskLevel): AssetData {
  return { symbol: s, name: n, price: +p.toFixed(4), peg: pg, deviation: d, change24h: c, riskLevel: r };
}

function genFrames(): CrisisFrame[] {
  const f: CrisisFrame[] = [];
  for (let i = 0; i < 8; i++) { const t = i/7; f.push({ risk: Math.round(12+t*23), assets: [mkAsset("USDY","Ondo USD Yield",1.0002-t*0.004,1,-(t*0.004),-(t*0.4),t>0.5?"warn":"normal"), mkAsset("mETH","Mantle ETH",3247.82-t*80,3245,-t*0.012,-(t*2.5),"normal"), mkAsset("fBTC","Firebitcoin",67842.5-t*500,67800,-t*0.005,-(t*0.8),"normal")], signals: [{name:"De-peg Risk",value:+(5.7+t*25),weight:"35%"},{name:"Liquidity Risk",value:+(8+t*15),weight:"25%"},{name:"Correlation",value:+(18+t*10),weight:"20%"},{name:"Volatility",value:+(13.3+t*20),weight:"10%"},{name:"TradFi Macro",value:+(20+t*15),weight:"10%"}] }); }
  f.push({ risk:42, assets:[mkAsset("USDY","Ondo USD Yield",0.9935,1,-0.0065,-0.65,"warn"),mkAsset("mETH","Mantle ETH",3148.2,3245,-0.03,-3.1,"warn"),mkAsset("fBTC","Firebitcoin",66890,67800,-0.013,-1.4,"normal")], signals:[{name:"De-peg Risk",value:42,weight:"35%"},{name:"Liquidity Risk",value:35,weight:"25%"},{name:"Correlation",value:38,weight:"20%"},{name:"Volatility",value:45,weight:"10%"},{name:"TradFi Macro",value:50,weight:"10%"}], newAction:{id:"act-001",timestamp:new Date().toISOString(),actionType:"REDUCE_25",asset:"USDY",riskScore:42,txHash:"0x7a3f8c2e1b9d0e5f4a6c8b7d3e2f1a0c9b8d7e6f",success:true}, reputation:{score:520,successful:1,failed:0} });
  for (let i = 0; i < 5; i++) { const t = i/4; f.push({ risk: Math.round(48+t*24), assets: [mkAsset("USDY","Ondo USD Yield",0.9935-t*0.015,1,-(0.0065+t*0.015),-(0.65+t*1.5),t>0.5?"alert":"warn"), mkAsset("mETH","Mantle ETH",3148.2-t*200,3245,-(0.03+t*0.04),-(3.1+t*4),"warn"), mkAsset("fBTC","Firebitcoin",66890-t*1500,67800,-(0.013+t*0.02),-(1.4+t*2.2),t>0.6?"warn":"normal")], signals:[{name:"De-peg Risk",value:+(42+t*35),weight:"35%"},{name:"Liquidity Risk",value:+(35+t*30),weight:"25%"},{name:"Correlation",value:+(38+t*25),weight:"20%"},{name:"Volatility",value:+(45+t*30),weight:"10%"},{name:"TradFi Macro",value:+(50+t*15),weight:"10%"}] }); }
  f.push({ risk:65, assets:[mkAsset("USDY","Ondo USD Yield",0.9755,1,-0.0245,-2.45,"alert"),mkAsset("mETH","Mantle ETH",2920.4,3245,-0.10,-8.0,"alert"),mkAsset("fBTC","Firebitcoin",64800,67800,-0.044,-4.5,"warn")], signals:[{name:"De-peg Risk",value:70,weight:"35%"},{name:"Liquidity Risk",value:62,weight:"25%"},{name:"Correlation",value:58,weight:"20%"},{name:"Volatility",value:72,weight:"10%"},{name:"TradFi Macro",value:60,weight:"10%"}], newAction:{id:"act-002",timestamp:new Date(Date.now()+60000).toISOString(),actionType:"REDUCE_50",asset:"USDY",riskScore:65,txHash:"0x2b4d6e8f0a1c3e5d7b9f0a2c4e6d8b0a1c3e5d7f",success:true}, reputation:{score:580,successful:2,failed:0} });
  for (let i = 0; i < 4; i++) { const t = i/3; f.push({ risk: Math.round(72+t*10), assets: [mkAsset("USDY","Ondo USD Yield",0.9755-t*0.012,1,-(0.0245+t*0.012),-(2.45+t*1.2),"critical"), mkAsset("mETH","Mantle ETH",2920-t*150,3245,-(0.10+t*0.03),-(8+t*3),"alert"), mkAsset("fBTC","Firebitcoin",64800-t*800,67800,-(0.044+t*0.01),-(4.5+t*1.5),"alert")], signals:[{name:"De-peg Risk",value:+(70+t*25),weight:"35%"},{name:"Liquidity Risk",value:+(62+t*20),weight:"25%"},{name:"Correlation",value:+(58+t*20),weight:"20%"},{name:"Volatility",value:+(72+t*18),weight:"10%"},{name:"TradFi Macro",value:+(60+t*20),weight:"10%"}] }); }
  f.push({ risk:82, assets:[mkAsset("USDY","Ondo USD Yield",0.965,1,-0.035,-3.5,"critical"),mkAsset("mETH","Mantle ETH",2780,3245,-0.143,-11.2,"critical"),mkAsset("fBTC","Firebitcoin",63200,67800,-0.068,-6.8,"alert")], signals:[{name:"De-peg Risk",value:100,weight:"35%"},{name:"Liquidity Risk",value:85,weight:"25%"},{name:"Correlation",value:78,weight:"20%"},{name:"Volatility",value:90,weight:"10%"},{name:"TradFi Macro",value:80,weight:"10%"}], newAction:{id:"act-003",timestamp:new Date(Date.now()+120000).toISOString(),actionType:"FULL_EXIT",asset:"ALL",riskScore:82,txHash:"0x9c1d3e5f7a2b4c6d8e0f1a3b5c7d9e0f2a4b6c8d",success:true}, reputation:{score:620,successful:3,failed:0} });
  return f;
}

export function useCrisisSimulation() {
  const [risk, setRisk] = useState(12);
  const [assets, setAssets] = useState(INIT_ASSETS);
  const [signals, setSignals] = useState(INIT_SIGNALS);
  const [actions, setActions] = useState<any[]>([]);
  const [rep, setRep] = useState({ score: 500, successful: 0, failed: 0 });
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const frame = useRef(0);
  const frames = useRef<CrisisFrame[]>([]);

  const start = useCallback(() => {
    frames.current = genFrames(); frame.current = 0; setRunning(true); setCycle(0);
    timer.current = setInterval(() => {
      const idx = frame.current;
      if (idx >= frames.current.length) { if (timer.current) clearInterval(timer.current); setRunning(false); return; }
      const f = frames.current[idx];
      setRisk(f.risk); setAssets(f.assets); setSignals(f.signals); setCycle(idx + 1);
      if (f.newAction) setActions(p => [f.newAction!, ...p]);
      if (f.reputation) setRep(f.reputation);
      frame.current++;
    }, 800);
  }, []);

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false); setRisk(12); setAssets(INIT_ASSETS); setSignals(INIT_SIGNALS);
    setActions([]); setRep({ score: 500, successful: 0, failed: 0 }); setCycle(0); frame.current = 0;
  }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return { risk, assets, signals, actions, rep, running, cycle, start, reset };
}
