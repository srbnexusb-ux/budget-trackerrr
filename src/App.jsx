import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SUPABASE_URL = "https://iggerytxqfuhuiguetsh.supabase.co";
const SUPABASE_KEY = "sb_publishable_AopIbi5NDdaxj6aUgWNrwQ_xB7P4dlS";
const CORRECT_PIN = "473824";
const PIN_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// March-first fiscal year
const MONTHS = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];
const MONTH_FULL = ["March","April","May","June","July","August","September","October","November","December","January","February"];

const INCOME_CATS = ["Nexus","Bonus","Other"];
const SAVINGS_CATS = ["Mom","HYS","Retirement","Other"];
const EXPENSE_GROUPS = ["Credit Cards","Car","Fixed","Lifestyle","Food","Gifts","Gretchen","Other"];
const EXPENSE_CATS = [
  {cat:"Discover",         group:"Credit Cards"},
  {cat:"Chase 4",          group:"Credit Cards"},
  {cat:"Chase 6",          group:"Credit Cards"},
  {cat:"Jeep",             group:"Car"},
  {cat:"Gas",              group:"Car"},
  {cat:"Car Insurance",    group:"Car"},
  {cat:"Life Insurance",   group:"Fixed"},
  {cat:"Subscriptions",    group:"Fixed"},
  {cat:"Supplements",      group:"Lifestyle"},
  {cat:"Personal Care",    group:"Lifestyle"},
  {cat:"Clothing",         group:"Lifestyle"},
  {cat:"Entertainment",    group:"Lifestyle"},
  {cat:"Dining Out",       group:"Food"},
  {cat:"Groceries",        group:"Food"},
  {cat:"Gifts",            group:"Gifts"},
  {cat:"Gretchen Food",    group:"Gretchen"},
  {cat:"Gretchen Supplies",group:"Gretchen"},
  {cat:"Travel",           group:"Other"},
  {cat:"Misc",             group:"Other"},
];

const P = {
  bg:"#F6F4D2",panel:"#ffffff",card:"#ffffff",sage:"#D4E09B",mint:"#CBDFBD",
  salmon:"#F19C79",terra:"#A44A3F",text:"#3d2b27",muted:"#7a6a5a",
  border:"#CBDFBD",input:"#F6F4D2",positive:"#5a7a3a",tabBg:"#ede9b8",
};
const CHART_COLORS = ["#A44A3F","#7a9e5a","#F19C79","#CBDFBD","#c17f24","#D4E09B","#e8b89a","#8fad6e","#d4735a","#b5cc85","#f0a882","#6b9e7a","#bf6a60","#d9e8a0","#A44A3F","#c17f24","#7a9e5a","#CBDFBD","#F19C79"];
const fmt = v => v==null||v===""?"": `$${parseFloat(v||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const num = v => parseFloat(v)||0;
const card = (extra={}) => ({background:P.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",...extra});
const tooltipStyle = {background:P.panel,border:`1px solid ${P.border}`,borderRadius:8,fontSize:11,color:P.text};

/* ── PIN SCREEN ── */
function PinScreen({onUnlock}) {
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  const handleDigit = d => {
    if (entered.length >= 6) return;
    const next = entered + d;
    setEntered(next);
    setError(false);
    if (next.length === 6) {
      if (next === CORRECT_PIN) {
        setTimeout(() => onUnlock(), 150);
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => { setShake(false); setEntered(""); }, 600);
      }
    }
  };
  const handleDelete = () => { setEntered(e => e.slice(0,-1)); setError(false); };

  const dots = Array.from({length:6},(_,i) => (
    <div key={i} style={{width:14,height:14,borderRadius:"50%",background:i<entered.length?(error?P.terra:P.positive):P.border,transition:"background 0.15s"}}/>
  ));

  const keys = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,-apple-system,sans-serif"}}>
      <div style={{textAlign:"center",width:280}}>
        <div style={{fontSize:44,marginBottom:8}}>💰</div>
        <h1 style={{margin:"0 0 4px",fontSize:22,fontWeight:700,color:P.terra}}>Budget Tracker</h1>
        <p style={{margin:"0 0 32px",fontSize:13,color:P.muted}}>Enter your PIN to continue</p>

        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:32,animation:shake?"shake 0.5s":""}}>{dots}</div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {keys.flat().map((k,i) => (
            <button key={i} onClick={()=>k==="⌫"?handleDelete():k!==""?handleDigit(k):null}
              style={{height:64,borderRadius:14,border:"none",fontSize:k==="⌫"?20:22,fontWeight:600,
                background:k===""?"transparent":k==="⌫"?"#e8e0b0":P.panel,
                color:P.text,cursor:k===""?"default":"pointer",
                boxShadow:k===""||k==="⌫"?"none":"0 2px 6px rgba(0,0,0,0.08)",
                transition:"transform 0.1s",WebkitTapHighlightColor:"transparent"}}>
              {k}
            </button>
          ))}
        </div>
        {error&&<p style={{marginTop:16,color:P.terra,fontSize:13,fontWeight:600}}>Incorrect PIN — try again</p>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

/* ── NUM INPUT ── */
function NumInput({value, onCommit, style}) {
  const [local, setLocal] = useState(value===0?"":String(value));
  useEffect(()=>{ setLocal(value===0?"":String(value)); },[value]);
  return (
    <input type="text" inputMode="decimal" value={local} placeholder="0"
      onChange={e=>setLocal(e.target.value)}
      onBlur={()=>{ const n=parseFloat(local)||0; onCommit(n); setLocal(n===0?"":String(n)); }}
      style={style}/>
  );
}

const defaultAnnualBudget = () => ({
  income:   INCOME_CATS.map(c=>({cat:c,...Object.fromEntries(MONTHS.map(m=>[m,0]))})),
  expenses: EXPENSE_GROUPS.map(g=>({cat:g,...Object.fromEntries(MONTHS.map(m=>[m,0]))})),
  savings:  SAVINGS_CATS.map(c=>({cat:c,...Object.fromEntries(MONTHS.map(m=>[m,0]))})),
});
const defaultMonthActuals = () => ({
  income:       INCOME_CATS.map(c=>({cat:c,amount:0,note:""})),
  savings:      SAVINGS_CATS.map(c=>({cat:c,amount:0,note:""})),
  transactions: [],
});
const defaultActuals = () => Object.fromEntries(MONTHS.map(m=>[m,defaultMonthActuals()]));

async function dbGet(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/budget?id=eq.${id}&select=data`,{headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}});
  const rows = await r.json();
  return rows?.[0]?.data||null;
}
async function dbSet(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/budget?id=eq.${id}`,{method:"PATCH",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({data,updated_at:new Date().toISOString()})});
}

/* ── MAIN APP ── */
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("annual-plan");
  const [annualBudget, setAnnualBudget] = useState(defaultAnnualBudget);
  const [actuals, setActuals] = useState(defaultActuals);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimer = useRef(null);
  const inactivityTimer = useRef(null);
  const latestBudget = useRef(annualBudget);
  const latestActuals = useRef(actuals);

  useEffect(()=>{ latestBudget.current = annualBudget; },[annualBudget]);
  useEffect(()=>{ latestActuals.current = actuals; },[actuals]);

  // Inactivity lock
  const resetInactivity = useCallback(()=>{
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(()=>setUnlocked(false), PIN_TIMEOUT);
  },[]);

  useEffect(()=>{
    if (!unlocked) return;
    const events = ["mousedown","touchstart","keydown","scroll"];
    events.forEach(e=>window.addEventListener(e,resetInactivity));
    resetInactivity();
    return ()=>{ events.forEach(e=>window.removeEventListener(e,resetInactivity)); if(inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  },[unlocked,resetInactivity]);

  useEffect(()=>{
    async function load() {
      try {
        const [bd,ad] = await Promise.all([dbGet("annual"),dbGet("actuals")]);
        if (bd&&Object.keys(bd).length>0) {
          const merged = defaultAnnualBudget();
          ["income","expenses","savings"].forEach(sec=>{
            merged[sec]=merged[sec].map(row=>{
              const saved=bd[sec]?.find(r=>r.cat===row.cat);
              return saved?{...row,...saved}:row;
            });
          });
          setAnnualBudget(merged);
        }
        if (ad&&Object.keys(ad).length>0) {
          const mergedAct = defaultActuals();
          MONTHS.forEach(m=>{
            if (ad[m]) {
              ["income","savings"].forEach(sec=>{
                if (ad[m][sec]) mergedAct[m][sec]=mergedAct[m][sec].map(row=>{
                  const saved=ad[m][sec]?.find(r=>r.cat===row.cat);
                  return saved?{...row,...saved}:row;
                });
              });
              if (ad[m].transactions) mergedAct[m].transactions=ad[m].transactions;
            }
          });
          setActuals(mergedAct);
        }
      } catch(e){console.error(e);}
      setLoading(false);
    }
    load();
  },[]);

  const doSave = useCallback(async(nb,na)=>{
    setSaveStatus("saving");
    try { await Promise.all([dbSet("annual",nb),dbSet("actuals",na)]); setSaveStatus("saved"); }
    catch(e){ setSaveStatus("error"); }
  },[]);

  const scheduleSave = useCallback((nb,na)=>{
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>doSave(nb,na),1500);
  },[doSave]);

  const handleManualSave = async()=>{
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await doSave(latestBudget.current, latestActuals.current);
  };

  const updateBudget = useCallback((section,ri,month,val)=>{
    setAnnualBudget(prev=>{
      const next={...prev,[section]:prev[section].map((r,i)=>i===ri?{...r,[month]:val}:r)};
      scheduleSave(next,latestActuals.current); return next;
    });
  },[scheduleSave]);

  const updateActualSimple = useCallback((month,section,ri,field,val)=>{
    setActuals(prev=>{
      const next={...prev,[month]:{...prev[month],[section]:prev[month][section].map((r,i)=>i===ri?{...r,[field]:val}:r)}};
      scheduleSave(latestBudget.current,next); return next;
    });
  },[scheduleSave]);

  const addTransaction = useCallback((month,txn)=>{
    setActuals(prev=>{
      const next={...prev,[month]:{...prev[month],transactions:[...prev[month].transactions,{...txn,id:Date.now()}]}};
      scheduleSave(latestBudget.current,next); return next;
    });
  },[scheduleSave]);

  const deleteTransaction = useCallback((month,id)=>{
    setActuals(prev=>{
      const next={...prev,[month]:{...prev[month],transactions:prev[month].transactions.filter(t=>t.id!==id)}};
      scheduleSave(latestBudget.current,next); return next;
    });
  },[scheduleSave]);

  const monthlyBudgetTotals = m=>({
    income:   annualBudget.income.reduce((s,r)=>s+num(r[m]),0),
    expenses: annualBudget.expenses.reduce((s,r)=>s+num(r[m]),0),
    savings:  annualBudget.savings.reduce((s,r)=>s+num(r[m]),0),
  });
  const monthlyActualTotals = m=>({
    income:   actuals[m].income.reduce((s,r)=>s+num(r.amount),0),
    expenses: actuals[m].transactions.reduce((s,t)=>s+num(t.amount),0),
    savings:  actuals[m].savings.reduce((s,r)=>s+num(r.amount),0),
  });

  if (!unlocked) return <PinScreen onUnlock={()=>setUnlocked(true)}/>;

  const tabs=[{id:"annual-plan",label:"📋 Annual Plan"},{id:"annual-summary",label:"📊 Summary"},...MONTHS.map(m=>({id:`month-${m}`,label:m}))];

  const statusColor = saveStatus==="saved"?P.positive:saveStatus==="saving"?"#c17f24":saveStatus==="error"?P.terra:"#c17f24";
  const statusLabel = saveStatus==="saved"?"✓ Saved":saveStatus==="saving"?"⏳ Saving…":saveStatus==="error"?"⚠ Error":"● Unsaved";

  if (loading) return (
    <div style={{background:P.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>💰</div><div style={{color:P.muted,fontSize:14}}>Loading your budget…</div></div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",background:P.bg,minHeight:"100vh",color:P.text}}>
      <div style={{background:`linear-gradient(135deg,${P.mint},${P.sage})`,padding:"14px 16px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{margin:0,fontSize:19,fontWeight:700,color:P.terra}}>💰 Budget Tracker</h1>
          <p style={{margin:"1px 0 0",fontSize:11,color:P.muted}}>Annual planning & monthly spending</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:11,fontWeight:600,color:statusColor,background:"rgba(255,255,255,0.6)",padding:"4px 10px",borderRadius:20}}>{statusLabel}</div>
          <button onClick={handleManualSave} disabled={saveStatus==="saving"}
            style={{background:P.terra,color:"#fff",border:"none",borderRadius:20,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer",opacity:saveStatus==="saving"?0.6:1,WebkitTapHighlightColor:"transparent"}}>
            Save
          </button>
        </div>
      </div>

      <div style={{display:"flex",overflowX:"auto",background:P.tabBg,borderBottom:`1px solid ${P.border}`,padding:"0 4px",WebkitOverflowScrolling:"touch"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"10px 12px",border:"none",background:"none",color:activeTab===t.id?P.terra:P.muted,borderBottom:activeTab===t.id?`2px solid ${P.terra}`:"2px solid transparent",cursor:"pointer",fontSize:12,fontWeight:activeTab===t.id?700:400,whiteSpace:"nowrap",WebkitTapHighlightColor:"transparent"}}>{t.label}</button>
        ))}
      </div>

      <div style={{padding:14,maxWidth:1400,margin:"0 auto"}}>
        {activeTab==="annual-plan"&&<AnnualPlanTab annualBudget={annualBudget} updateBudget={updateBudget} monthlyBudgetTotals={monthlyBudgetTotals}/>}
        {activeTab==="annual-summary"&&<AnnualSummaryTab annualBudget={annualBudget} actuals={actuals} monthlyActualTotals={monthlyActualTotals} monthlyBudgetTotals={monthlyBudgetTotals}/>}
        {MONTHS.map((m,i)=>activeTab===`month-${m}`&&(
          <MonthTab key={m} month={m} monthFull={MONTH_FULL[i]} annualBudget={annualBudget}
            actuals={actuals[m]}
            updateActualSimple={(sec,ri,f,v)=>updateActualSimple(m,sec,ri,f,v)}
            addTransaction={txn=>addTransaction(m,txn)}
            deleteTransaction={id=>deleteTransaction(m,id)}
            budgetTotals={monthlyBudgetTotals(m)} actualTotals={monthlyActualTotals(m)}/>
        ))}
      </div>
    </div>
  );
}

/* ── ANNUAL PLAN ── */
function AnnualPlanTab({annualBudget,updateBudget,monthlyBudgetTotals}) {
  const sectionTotals=sk=>MONTHS.map(m=>annualBudget[sk].reduce((s,r)=>s+num(r[m]),0));
  const rowTotal=row=>MONTHS.reduce((s,m)=>s+num(row[m]),0);
  const netByMonth=MONTHS.map(m=>{const t=monthlyBudgetTotals(m);return{month:m,...t,net:t.income-t.expenses-t.savings};});
  const grand=netByMonth.reduce((a,r)=>({income:a.income+r.income,expenses:a.expenses+r.expenses,savings:a.savings+r.savings,net:a.net+r.net}),{income:0,expenses:0,savings:0,net:0});
  const iStyle={width:"100%",background:P.input,border:`1px solid ${P.border}`,borderRadius:5,color:P.text,padding:"4px 5px",fontSize:11,textAlign:"right",boxSizing:"border-box",outline:"none"};

  const Section=({title,sectionKey,color,emoji})=>(
    <div style={{marginBottom:24}}>
      <h3 style={{margin:"0 0 8px",color,fontSize:13,fontWeight:700}}>{emoji} {title}</h3>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,background:P.panel}}>
          <thead>
            <tr style={{background:P.mint}}>
              <th style={{padding:"7px 10px",textAlign:"left",color:P.text,width:120,position:"sticky",left:0,background:P.mint,fontWeight:600}}>Category</th>
              {MONTHS.map(m=><th key={m} style={{padding:"7px 5px",textAlign:"right",color:P.text,minWidth:70,fontWeight:600}}>{m}</th>)}
              <th style={{padding:"7px 8px",textAlign:"right",color:P.text,minWidth:82,fontWeight:600}}>Annual</th>
            </tr>
          </thead>
          <tbody>
            {annualBudget[sectionKey].map((row,ri)=>(
              <tr key={row.cat} style={{borderBottom:`1px solid ${P.bg}`}}>
                <td style={{padding:"5px 10px",color:P.text,background:P.panel,position:"sticky",left:0,fontWeight:500}}>{row.cat}</td>
                {MONTHS.map(m=>(
                  <td key={m} style={{padding:"3px 3px"}}>
                    <NumInput value={num(row[m])} onCommit={v=>updateBudget(sectionKey,ri,m,v)} style={iStyle}/>
                  </td>
                ))}
                <td style={{padding:"5px 8px",textAlign:"right",color,fontWeight:700}}>{fmt(rowTotal(row))}</td>
              </tr>
            ))}
            <tr style={{background:P.sage,fontWeight:700}}>
              <td style={{padding:"6px 10px",color:P.terra,position:"sticky",left:0,background:P.sage}}>Total</td>
              {sectionTotals(sectionKey).map((t,i)=><td key={i} style={{padding:"6px 5px",textAlign:"right",color:P.terra}}>{fmt(t)}</td>)}
              <td style={{padding:"6px 8px",textAlign:"right",color:P.terra}}>{fmt(sectionTotals(sectionKey).reduce((a,b)=>a+b,0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        {[{l:"Annual Income",v:grand.income,c:P.positive,b:P.mint},{l:"Annual Expenses",v:grand.expenses,c:P.terra,b:P.salmon},{l:"Annual Savings",v:grand.savings,c:"#7a6a2a",b:P.sage},{l:"Annual Net",v:grand.net,c:grand.net>=0?P.positive:P.terra,b:P.border}].map(x=>(
          <div key={x.l} style={{...card({flex:"1 1 130px",borderLeft:`3px solid ${x.c}`,background:x.b})}}>
            <div style={{fontSize:10,color:P.muted,marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:x.c}}>{fmt(x.v)}</div>
          </div>
        ))}
      </div>
      <div style={{...card({marginBottom:20})}}>
        <h3 style={{margin:"0 0 10px",fontSize:12,color:P.muted,fontWeight:600}}>📈 MONTHLY BUDGET OVERVIEW</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={netByMonth} margin={{top:5,right:5,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.border}/>
            <XAxis dataKey="month" tick={{fill:P.muted,fontSize:10}}/>
            <YAxis tick={{fill:P.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={42}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="income" fill={P.mint} name="Income" radius={[3,3,0,0]}/>
            <Bar dataKey="expenses" fill={P.salmon} name="Expenses" radius={[3,3,0,0]}/>
            <Bar dataKey="savings" fill={P.sage} name="Savings" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Section title="Income" sectionKey="income" color={P.positive} emoji="💵"/>
      <Section title="Expenses" sectionKey="expenses" color={P.terra} emoji="💸"/>
      <Section title="Savings" sectionKey="savings" color="#7a6a2a" emoji="🏦"/>
    </div>
  );
}

/* ── ANNUAL SUMMARY ── */
function AnnualSummaryTab({annualBudget,actuals,monthlyActualTotals,monthlyBudgetTotals}) {
  const ytdData=MONTHS.map(m=>{const b=monthlyBudgetTotals(m),a=monthlyActualTotals(m);return{month:m,budgetIncome:b.income,actualIncome:a.income,budgetExp:b.expenses,actualExp:a.expenses,budgetSav:b.savings,actualSav:a.savings};});
  const totals=ytdData.reduce((acc,r)=>({budgetIncome:acc.budgetIncome+r.budgetIncome,actualIncome:acc.actualIncome+r.actualIncome,budgetExp:acc.budgetExp+r.budgetExp,actualExp:acc.actualExp+r.actualExp,budgetSav:acc.budgetSav+r.budgetSav,actualSav:acc.actualSav+r.actualSav}),{budgetIncome:0,actualIncome:0,budgetExp:0,actualExp:0,budgetSav:0,actualSav:0});
  const groupTotals=EXPENSE_GROUPS.map(g=>({name:g,value:MONTHS.reduce((s,m)=>s+actuals[m].transactions.filter(t=>t.group===g).reduce((a,t)=>a+num(t.amount),0),0)})).filter(r=>r.value>0);
  const groupVsData=EXPENSE_GROUPS.map(g=>({cat:g,budget:MONTHS.reduce((s,m)=>s+num(annualBudget.expenses.find(r=>r.cat===g)?.[m]),0),actual:MONTHS.reduce((s,m)=>s+actuals[m].transactions.filter(t=>t.group===g).reduce((a,t)=>a+num(t.amount),0),0)})).filter(r=>r.budget>0||r.actual>0);

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[{l:"Budgeted Income",v:totals.budgetIncome,c:P.positive,bg:P.mint},{l:"Actual Income",v:totals.actualIncome,c:P.positive,bg:"#e8f0d4"},{l:"Budgeted Expenses",v:totals.budgetExp,c:P.terra,bg:"#fde8dc"},{l:"Actual Expenses",v:totals.actualExp,c:P.terra,bg:P.salmon},{l:"Budgeted Savings",v:totals.budgetSav,c:"#7a6a2a",bg:P.sage},{l:"Actual Savings",v:totals.actualSav,c:"#7a6a2a",bg:"#e8edba"}].map(x=>(
          <div key={x.l} style={{...card({flex:"1 1 120px",background:x.bg})}}>
            <div style={{fontSize:10,color:P.muted,marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:15,fontWeight:700,color:x.c}}>{fmt(x.v)}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        <div style={card()}>
          <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>📊 BUDGET VS ACTUAL</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ytdData} margin={{top:5,right:5,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border}/>
              <XAxis dataKey="month" tick={{fill:P.muted,fontSize:9}}/>
              <YAxis tick={{fill:P.muted,fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={38}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{fontSize:9}}/>
              <Bar dataKey="budgetIncome" fill={P.mint} name="Budg Inc" radius={[3,3,0,0]}/>
              <Bar dataKey="actualIncome" fill="#7aa85a" name="Act Inc" radius={[3,3,0,0]}/>
              <Bar dataKey="budgetExp" fill="#f7c5aa" name="Budg Exp" radius={[3,3,0,0]}/>
              <Bar dataKey="actualExp" fill={P.terra} name="Act Exp" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>🥧 SPENDING BY GROUP</h3>
          {groupTotals.length>0?(
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={groupTotals} cx="50%" cy="50%" outerRadius={72} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={8}>
                  {groupTotals.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
              </PieChart>
            </ResponsiveContainer>
          ):<Empty/>}
        </div>
      </div>
      <div style={{...card({marginBottom:14})}}>
        <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>📉 EXPENSES: BUDGET VS ACTUAL BY GROUP</h3>
        {groupVsData.length>0?(
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groupVsData} margin={{top:5,right:10,left:0,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border}/>
              <XAxis dataKey="cat" tick={{fill:P.muted,fontSize:9}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:P.muted,fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={38}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="budget" fill={P.sage} name="Budget" radius={[3,3,0,0]}/>
              <Bar dataKey="actual" fill={P.terra} name="Actual" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<Empty/>}
      </div>
      <div style={card()}>
        <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>📋 ANNUAL TABLE</h3>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead>
              <tr style={{background:P.mint}}>
                {["Month","Budg Inc","Act Inc","Var","Budg Exp","Act Exp","Var","Budg Sav","Act Sav","Var"].map((h,i)=>(
                  <th key={i} style={{padding:"6px 7px",textAlign:i===0?"left":"right",color:P.text,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m,i)=>{
                const b=monthlyBudgetTotals(m),a=monthlyActualTotals(m);
                const iV=a.income-b.income,eV=b.expenses-a.expenses,sV=a.savings-b.savings;
                return(
                  <tr key={m} style={{borderBottom:`1px solid ${P.border}`,background:i%2===0?P.bg:P.panel}}>
                    <td style={{padding:"5px 7px",color:P.text,fontWeight:600}}>{m}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:P.muted}}>{fmt(b.income)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:P.positive}}>{fmt(a.income)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:iV>=0?P.positive:P.terra,fontWeight:600}}>{iV>=0?"+":""}{fmt(iV)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:P.muted}}>{fmt(b.expenses)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:P.terra}}>{fmt(a.expenses)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:eV>=0?P.positive:P.terra,fontWeight:600}}>{eV>=0?"+":""}{fmt(eV)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:P.muted}}>{fmt(b.savings)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:"#7a6a2a"}}>{fmt(a.savings)}</td>
                    <td style={{padding:"5px 7px",textAlign:"right",color:sV>=0?P.positive:P.terra,fontWeight:600}}>{sV>=0?"+":""}{fmt(sV)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── MONTH TAB ── */
function MonthTab({month,monthFull,annualBudget,actuals,updateActualSimple,addTransaction,deleteTransaction,budgetTotals,actualTotals}) {
  const [newDesc,setNewDesc]=useState("");
  const [newAmt,setNewAmt]=useState("");
  const [newCat,setNewCat]=useState(EXPENSE_CATS[0].cat);
  const [showAdd,setShowAdd]=useState(false);

  const netBudget=budgetTotals.income-budgetTotals.expenses-budgetTotals.savings;
  const netActual=actualTotals.income-actualTotals.expenses-actualTotals.savings;

  const handleAdd=()=>{
    const a=parseFloat(newAmt);
    if (!a||!newDesc.trim()) return;
    const catObj=EXPENSE_CATS.find(c=>c.cat===newCat);
    addTransaction({cat:newCat,group:catObj.group,desc:newDesc.trim(),amount:a});
    setNewDesc(""); setNewAmt(""); setShowAdd(false);
  };

  const catSummary=EXPENSE_CATS.map(({cat,group})=>{
    const txns=actuals.transactions.filter(t=>t.cat===cat);
    return{cat,group,txns,total:txns.reduce((s,t)=>s+num(t.amount),0)};
  }).filter(r=>r.txns.length>0);

  const groupSummary=EXPENSE_GROUPS.map(g=>{
    const cats=catSummary.filter(c=>c.group===g);
    const budgeted=num(annualBudget.expenses.find(r=>r.cat===g)?.[month]);
    const actual=cats.reduce((s,c)=>s+c.total,0);
    return{group:g,cats,budgeted,actual};
  }).filter(r=>r.cats.length>0||r.budgeted>0);

  const iStyle={background:P.input,border:`1px solid ${P.border}`,borderRadius:5,color:P.text,padding:"7px 10px",fontSize:13,outline:"none",boxSizing:"border-box"};
  const pieData=catSummary.filter(r=>r.total>0).map(r=>({name:r.cat,value:r.total}));
  const vsData=[{name:"Income",budget:budgetTotals.income,actual:actualTotals.income},{name:"Expenses",budget:budgetTotals.expenses,actual:actualTotals.expenses},{name:"Savings",budget:budgetTotals.savings,actual:actualTotals.savings}];

  const SimpleSection=({title,sectionKey,color,emoji,budgetRows})=>(
    <div style={{marginBottom:18}}>
      <h3 style={{margin:"0 0 7px",color,fontSize:13,fontWeight:700}}>{emoji} {title}</h3>
      <div style={{borderRadius:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,background:P.panel}}>
          <thead>
            <tr style={{background:P.mint}}>
              {["Category","Budgeted","Actual","Variance"].map((h,i)=>(
                <th key={h} style={{padding:"6px 8px",textAlign:i===0?"left":"right",color:P.text,fontWeight:600}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actuals[sectionKey].map((row,ri)=>{
              const budgeted=num(budgetRows.find(r=>r.cat===row.cat)?.[month]);
              const actual=num(row.amount);
              const variance=actual-budgeted;
              return(
                <tr key={row.cat} style={{borderBottom:`1px solid ${P.bg}`}}>
                  <td style={{padding:"5px 8px",color:P.text,fontWeight:500}}>{row.cat}</td>
                  <td style={{padding:"5px 8px",textAlign:"right",color:P.muted}}>{fmt(budgeted)}</td>
                  <td style={{padding:"4px 4px"}}>
                    <NumInput value={actual} onCommit={v=>updateActualSimple(sectionKey,ri,"amount",v)}
                      style={{...iStyle,width:"100%",fontSize:12,padding:"4px 6px",textAlign:"right"}}/>
                  </td>
                  <td style={{padding:"5px 8px",textAlign:"right",color:variance>=0?P.positive:P.terra,fontWeight:600}}>
                    {budgeted===0&&actual===0?"—":`${variance>=0?"+":""}${fmt(variance)}`}
                  </td>
                </tr>
              );
            })}
            <tr style={{background:P.sage,fontWeight:700}}>
              <td style={{padding:"6px 8px",color:P.terra}}>Total</td>
              <td style={{padding:"6px 8px",textAlign:"right",color:P.muted}}>{fmt(actuals[sectionKey].reduce((_,r)=>{const b=budgetRows.find(x=>x.cat===r.cat);return _+num(b?.[month]);},0))}</td>
              <td style={{padding:"6px 8px",textAlign:"right",color}}>{fmt(actuals[sectionKey].reduce((s,r)=>s+num(r.amount),0))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{margin:"0 0 12px",fontSize:20,color:P.terra,fontWeight:700}}>{monthFull}</h2>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[{l:"Income",b:budgetTotals.income,a:actualTotals.income,c:P.positive,bg:P.mint},{l:"Expenses",b:budgetTotals.expenses,a:actualTotals.expenses,c:P.terra,bg:"#fde8dc"},{l:"Savings",b:budgetTotals.savings,a:actualTotals.savings,c:"#7a6a2a",bg:P.sage},{l:"Net Flow",b:netBudget,a:netActual,c:netActual>=0?P.positive:P.terra,bg:P.border}].map(x=>(
          <div key={x.l} style={{...card({flex:"1 1 120px",background:x.bg})}}>
            <div style={{fontSize:10,color:P.muted,marginBottom:4,fontWeight:600}}>{x.l}</div>
            <div style={{fontSize:11,color:P.muted}}>Budget: <span style={{color:P.text,fontWeight:600}}>{fmt(x.b)}</span></div>
            <div style={{fontSize:15,fontWeight:700,color:x.c,marginTop:2}}>Actual: {fmt(x.a)}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        <div style={card()}>
          <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>📊 BUDGET VS ACTUAL</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vsData} margin={{top:5,right:5,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border}/>
              <XAxis dataKey="name" tick={{fill:P.muted,fontSize:10}}/>
              <YAxis tick={{fill:P.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={38}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="budget" fill={P.sage} name="Budget" radius={[3,3,0,0]}/>
              <Bar dataKey="actual" fill={P.terra} name="Actual" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <h3 style={{margin:"0 0 8px",fontSize:12,color:P.muted,fontWeight:600}}>🥧 SPENDING</h3>
          {pieData.length>0?(
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={68} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={8}>
                  {pieData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={tooltipStyle}/>
              </PieChart>
            </ResponsiveContainer>
          ):<Empty/>}
        </div>
      </div>

      {/* Transaction Log */}
      <div style={{...card({marginBottom:16})}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:13,color:P.muted,fontWeight:600}}>💳 EXPENSE LOG</h3>
          <button onClick={()=>setShowAdd(v=>!v)} style={{background:P.terra,color:"#fff",border:"none",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
            {showAdd?"Cancel":"+ Add"}
          </button>
        </div>
        {showAdd&&(
          <div style={{background:P.bg,borderRadius:10,padding:12,marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
            <select value={newCat} onChange={e=>setNewCat(e.target.value)} style={{...iStyle,width:"100%"}}>
              {EXPENSE_GROUPS.map(g=>(
                <optgroup key={g} label={g}>
                  {EXPENSE_CATS.filter(c=>c.group===g).map(c=>(
                    <option key={c.cat} value={c.cat}>{c.cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input type="text" placeholder="Description" value={newDesc} onChange={e=>setNewDesc(e.target.value)} style={{...iStyle,width:"100%"}}/>
            <div style={{display:"flex",gap:8}}>
              <input type="text" inputMode="decimal" placeholder="Amount" value={newAmt} onChange={e=>setNewAmt(e.target.value)} style={{...iStyle,flex:1}}/>
              <button onClick={handleAdd} style={{background:P.positive,color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:600,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>Save</button>
            </div>
          </div>
        )}
        {actuals.transactions.length===0?(
          <div style={{textAlign:"center",color:P.muted,fontSize:12,padding:"16px 0"}}>No transactions yet — tap + Add to log an expense</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {[...actuals.transactions].reverse().map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 4px",borderBottom:`1px solid ${P.bg}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:P.text,fontWeight:500}}>{t.desc}</div>
                  <div style={{fontSize:11,color:P.muted}}>{t.cat} · {t.group}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:P.terra,marginRight:12}}>{fmt(t.amount)}</div>
                <button onClick={()=>deleteTransaction(t.id)} style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1,WebkitTapHighlightColor:"transparent"}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Summary */}
      {groupSummary.length>0&&(
        <div style={{...card({marginBottom:16})}}>
          <h3 style={{margin:"0 0 12px",fontSize:13,color:P.muted,fontWeight:600}}>📂 EXPENSE SUMMARY BY GROUP</h3>
          {groupSummary.map(({group,cats,budgeted,actual})=>{
            const variance=budgeted-actual;
            return(
              <div key={group} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`2px solid ${P.mint}`}}>
                  <span style={{fontWeight:700,color:P.terra,fontSize:13}}>{group}</span>
                  <div style={{textAlign:"right"}}>
                    {budgeted>0&&<span style={{fontSize:11,color:P.muted,marginRight:8}}>Budget: {fmt(budgeted)}</span>}
                    <span style={{fontSize:13,fontWeight:700,color:P.terra}}>Actual: {fmt(actual)}</span>
                    {budgeted>0&&<span style={{fontSize:11,fontWeight:600,color:variance>=0?P.positive:P.terra,marginLeft:8}}>{variance>=0?"+":""}{fmt(variance)}</span>}
                  </div>
                </div>
                {cats.map(({cat,txns,total})=>(
                  <div key={cat}>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:P.bg,marginTop:2,borderRadius:4}}>
                      <span style={{fontSize:12,color:P.text,fontWeight:600}}>{cat}</span>
                      <span style={{fontSize:12,fontWeight:700,color:P.text}}>{fmt(total)}</span>
                    </div>
                    {txns.map(t=>(
                      <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 16px",fontSize:11,color:P.muted}}>
                        <span>{t.desc}</span>
                        <span>{fmt(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Income & Savings */}
      <div style={card()}>
        <h3 style={{margin:"0 0 12px",fontSize:12,color:P.muted,fontWeight:600}}>💵 INCOME & SAVINGS</h3>
        <SimpleSection title="Income" sectionKey="income" color={P.positive} emoji="💵" budgetRows={annualBudget.income}/>
        <SimpleSection title="Savings" sectionKey="savings" color="#7a6a2a" emoji="🏦" budgetRows={annualBudget.savings}/>
      </div>
    </div>
  );
}

const Empty=()=>(
  <div style={{height:185,display:"flex",alignItems:"center",justifyContent:"center",color:P.border,fontSize:12}}>Enter data to see chart</div>
);