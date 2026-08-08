"use strict";
/* ============================== utilities ============================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtDate=iso=>new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
const tokenize=s=>(String(s).toLowerCase().match(/[a-z][a-z'-]{1,}/g))||[];

const ICON={
 graph:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="11" r="2.2"/><circle cx="12" cy="4" r="2.2"/><circle cx="12" cy="12" r="1.7"/><path d="M5.8 9.7L10.3 5.3M6 11.4l4.3.4M11.6 6.2l.3 4"/></svg>',
 mic:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5"/><path d="M3 7.5a5 5 0 0010 0M8 12.5V15"/></svg>',
 inbox:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 9.5L4.5 3h7L14 9.5V13H2z"/><path d="M2 9.5h4l1 2h2l1-2h4"/></svg>',
 branch:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="3.5" r="2"/><circle cx="4" cy="12.5" r="2"/><circle cx="12" cy="8" r="2"/><path d="M4 5.5v5M5.7 4.5c3 1.5 4.6 2.5 4.6 2.5"/></svg>',
 search:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
 export:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 10V2M5 5l3-3 3 3M2.5 10.5v3h11v-3"/></svg>',
 lock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V4.5a2.5 2.5 0 015 0V7"/></svg>',
 spark:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 1.5l1.3 3.9L13.5 7l-4.2 1.6L8 12.5 6.7 8.6 2.5 7l4.2-1.6z"/><path d="M12.5 11l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z"/></svg>',
 check:'✓'
};

/* ============================== lexicon ============================== */
const LEXICON={
 "Feedback Loops":["feedback","loop","loops","response","responses","signal","signals","correction","corrections","adjust","adjusts","reinforce","reinforcement","output","adjustment"],
 "Trial & Error":["trial","error","errors","mistake","mistakes","attempt","attempts","fail","fails","failure","retry","experiment","experiments"],
 "Learning":["learn","learning","learned","study","practice","improve","improvement","adapt","skill","memory","teach"],
 "Adaptation":["adapt","adaptation","adaptations","evolve","evolution","evolutionary","survive","environment","selection","fitness"],
 "Fear Response":["fear","threat","threats","danger","anxiety","flight","fight","freeze","alarm","stress","amygdala","cortisol"],
 "Psychology":["mind","psychology","psychological","emotion","emotions","emotional","behavior","behaviour","cognitive","brain","mental"],
 "AI Agents":["agent","agents","architecture","architectures","llm","model","models","prompt","autonomous","planner","autocomplete"],
 "Systems Thinking":["system","systems","emergent","network","networks","structure","component","components","interaction","interconnected","holistic"],
 "Nature & Biology":["nature","biology","biological","organism","organisms","forest","ecosystem","species","roots","fungi","cell","neural","organismic"],
 "Philosophy of Mind":["consciousness","philosophy","philosophical","meaning","intention","subjective","qualia","epistemic","epistemological","reflection"],
 "Habits":["habit","habits","routine","routines","discipline","willpower","cue","trigger","automatic","gym"],
 "Writing & Ideas":["writing","essay","draft","metaphor","narrative","story","concept","concepts","idea","ideas","position"]
};
const CONCEPT_DOMAIN={
 "Feedback Loops":"Systems","Trial & Error":"Learning","Learning":"Learning","Adaptation":"Evolution",
 "Fear Response":"Psychology","Psychology":"Psychology","AI Agents":"Artificial Intelligence",
 "Systems Thinking":"Systems","Nature & Biology":"Biology","Philosophy of Mind":"Philosophy",
 "Habits":"Psychology","Writing & Ideas":"Ideas"
};
const DOMAIN_COLORS={"Psychology":"#C8A2FF","Biology":"#8FE388","Systems":"#57E3C4","Learning":"#FFD166","Evolution":"#FF9E64","Artificial Intelligence":"#7CC7FF","Philosophy":"#FF9AC2","Ideas":"#EAF0D0"};
const ASSOC={
 "Feedback Loops":["Trial & Error","Learning","Adaptation"],
 "Trial & Error":["Feedback Loops","Learning"],
 "Learning":["Feedback Loops","Trial & Error","Adaptation","Habits"],
 "Adaptation":["Feedback Loops","Learning","Nature & Biology"],
 "Fear Response":["Psychology","Feedback Loops"],
 "AI Agents":["Systems Thinking","Feedback Loops"],
 "Systems Thinking":["AI Agents","Nature & Biology","Feedback Loops"],
 "Nature & Biology":["Adaptation","Systems Thinking"],
 "Philosophy of Mind":["Psychology","Learning"],
 "Habits":["Learning","Psychology"],
 "Psychology":["Fear Response","Philosophy of Mind","Habits"],
 "Writing & Ideas":["Philosophy of Mind"]
};

/* ============================== state & seed ============================== */
const LSKEY="rhizome_state_v1";
let state=null;

function seedState(){
 const N=(num,source,date,title,original,refined,concepts,domains,interpretation,confidence,limitations)=>({id:"n"+num,num,source,createdAt:date,title,original,refined,concepts,domains,interpretation,confidence,limitations,status:"active"});
 const S=(id,a,b,type,status,score,confidence,reason,date)=>({id,a,b,type,status,score,confidence,reason,createdAt:date,resolvedAt:status!=="pending"?date:null});
 const C=(n,s)=>({name:n,score:s});
 return {
  seq:64, sel:null,
  notes:[
   N(17,"voice","2023-05-20T09:12:00Z","The adjustment is the learning",
    "uh so basically everything I've learned worth keeping came from trial and error, not from reading, you try, you fail, you adjust, you try again, and the adjustment IS the learning, books can point at the door but walking through it is feedback",
    "Everything I have learned that was worth keeping arrived through trial and error rather than through reading. You try, you fail, you adjust, you try again — and the adjustment itself is the learning. Books can point at the door, but walking through it is feedback.",
    [C("Trial & Error",.95),C("Learning",.9),C("Feedback Loops",.7)],["Philosophy","Learning"],
    "An epistemological claim: durable knowledge is produced by iterative correction (trial and error), with reading positioned as orientation rather than acquisition. Core concepts: Trial & Error, Learning, Feedback Loops.",
    "medium",["Transcribed from voice — recognition errors may be present in the Original Version.","This interpretation is inferred from context and may not fully represent your intended meaning."]),
   N(38,"text","2024-09-14T18:40:00Z","Fear: the fast lane of feedback",
    "Fear is the oldest feedback system. The amygdala fires before the conscious mind even labels the threat. That means the feedback loop has a fast lane and a slow lane, and most of our decisions about risk travel the fast one. If I'm designing anything — a product, an argument, a habit — I should assume the fast lane gets there first.",
    "Fear is the oldest feedback system we possess. The amygdala fires before the conscious mind has even labelled a threat, which means every feedback loop has two lanes — a fast one and a slow one — and most of our decisions about risk travel the fast lane first. Anything I design, whether a product, an argument, or a habit, should assume the fast lane arrives before reason does.",
    [C("Fear Response",.95),C("Feedback Loops",.85),C("Psychology",.7)],["Psychology","Biology"],
    "The note frames fear as a dual-speed feedback mechanism and derives a design principle from it. Core concepts: Fear Response, Feedback Loops, Psychology.",
    "high",["This interpretation is inferred from context and may not fully represent your intended meaning."]),
   N(42,"voice","2024-11-02T11:05:00Z","The Nature Feedback Model",
    "so I've been thinking about how nature runs on feedback loops everywhere you look, um, a forest isn't just trees it's a conversation of signals, roots, fungi, chemicals, and every organism adjusts based on what it receives back from the environment, you know, and I think this is the deepest pattern there is, learning is just feedback over time",
    "Nature operates on feedback loops at every scale. A forest is not merely a collection of trees; it is a continuous exchange of signals — through roots, fungi, and chemistry — in which every organism adjusts based on what the environment returns to it. This appears to be one of the deepest recurring patterns in living systems: learning, at its core, is feedback accumulated over time.",
    [C("Feedback Loops",.98),C("Nature & Biology",.9),C("Systems Thinking",.75),C("Learning",.6)],["Biology","Systems","Evolution"],
    "This note proposes that feedback loops are the fundamental operating pattern of natural systems, and extends the idea to learning itself. Core concepts: Feedback Loops, Nature & Biology, Systems Thinking.",
    "high",["Transcribed from voice — recognition errors may be present in the Original Version.","This interpretation is inferred from context and may not fully represent your intended meaning."]),
   N(51,"text","2025-02-08T21:30:00Z","Agents as feedback engines",
    "I keep coming back to the feedback model from note #42. Agent architectures should mirror it: act, observe the environment's response, update internal state, act again. Memory isn't storage — memory is the residue of corrections. An agent without a feedback channel is just an autocomplete engine, however large.",
    "I keep returning to the feedback model recorded in Note #42. Agent architectures should mirror it directly: act, observe the environment's response, update the internal state, act again. On this view, memory is not storage — memory is the residue of accumulated corrections. An agent without a genuine feedback channel is only an autocomplete engine, regardless of its size.",
    [C("AI Agents",.95),C("Feedback Loops",.9),C("Systems Thinking",.7),C("Learning",.55)],["Artificial Intelligence","Systems"],
    "The note maps the earlier Nature Feedback Model (#42) onto AI agent design, redefining memory as accumulated corrections. Core concepts: AI Agents, Feedback Loops, Systems Thinking.",
    "high",["This interpretation is inferred from context and may not fully represent your intended meaning."]),
   N(63,"voice","2025-06-19T08:20:00Z","Feedback is not enough",
    "I've been rethinking my earlier position. On reflection, feedback alone can't be sufficient — if it were, everyone with a gym membership would be fit. There has to be a slower layer, something like reflection or meaning, that decides which feedback even matters. I think my nature-feedback model was right but incomplete.",
    "I have been rethinking my earlier position. On reflection, feedback alone cannot be sufficient — if it were, everyone with a gym membership would be fit. There must be a slower layer above it, something like reflection or meaning-making, that decides which feedback even matters in the first place. My nature-feedback model was right, but incomplete.",
    [C("Feedback Loops",.9),C("Philosophy of Mind",.8),C("Learning",.65),C("Habits",.5)],["Philosophy","Psychology"],
    "The note revises a prior belief: it argues that feedback requires a slower supervening layer of reflection or meaning to be effective. This directly extends and partially contradicts the position in Note #42. Core concepts: Feedback Loops, Philosophy of Mind, Learning.",
    "medium",["Transcribed from voice — recognition errors may be present in the Original Version.","Confidence below high: some suggested connections may be coincidental.","This interpretation is inferred from context and may not fully represent your intended meaning."])
  ],
  suggestions:[
   S("s1","n51","n42","expands","accepted",.82,"high","Shared concepts: Feedback Loops, Systems Thinking, Learning · #51 explicitly references the model recorded in #42 and builds a new architecture on it.","2025-02-08T21:31:00Z"),
   S("s2","n63","n42","contradicts","accepted",.58,"medium","Shared concepts: Feedback Loops, Learning · revision markers detected (\u201Crethinking\u201D, \u201Con reflection\u201D, \u201Cright but incomplete\u201D).","#2025-06-19T08:21:00Z".replace("#2","2")),
   S("s3","n17","n42","relates","accepted",.71,"high","Shared concepts: Feedback Loops, Learning · recurring terms: feedback, adjust, learning.","2024-11-02T11:06:00Z"),
   S("s4","n38","n42","relates","accepted",.49,"medium","Shared concept: Feedback Loops · fear is framed as a feedback mechanism in both notes.","2024-11-02T11:06:00Z"),
   S("s5","n63","n17","relates","accepted",.44,"medium","Shared concepts: Learning, Feedback Loops · both treat correction as the substance of learning.","2025-06-19T08:21:00Z"),
   S("s6","n63","n51","relates","pending",.52,"medium","Both treat feedback as a necessary condition for learning — one biological, one architectural. The \u201Cslower layer\u201D proposed in #63 may need to constrain the agent loop described in #51.","2025-06-19T08:22:00Z"),
   S("s7","n38","n51","relates","pending",.28,"low","Possible analogy between the fast-lane threat response (#38) and agent reaction cycles (#51). Signal is weak; treat as speculative.","2025-02-08T21:32:00Z")
  ]
 };
}
function save(){ try{localStorage.setItem(LSKEY,JSON.stringify(state))}catch(e){} }
function load(){ try{const r=localStorage.getItem(LSKEY); if(r){state=JSON.parse(r);return}}catch(e){} state=seedState(); save(); }

const noteOf=id=>state.notes.find(n=>n.id===id);
const numOf=id=>{const n=noteOf(id);return n?n.num:"?"};
const titleOf=id=>{const n=noteOf(id);return n?n.title:"?"};
const pendingCount=()=>state.suggestions.filter(s=>s.status==="pending").length;
const acceptedEdges=()=>state.suggestions.filter(s=>s.status==="accepted");
const noteHasPending=id=>state.suggestions.some(s=>s.status==="pending"&&(s.a===id||s.b===id));
function lineageOf(id){ const out=[]; acceptedEdges().forEach(s=>{ if(s.a===id) out.push({dir:"out",type:s.type,ref:s.b}); else if(s.b===id) out.push({dir:"in",type:s.type,ref:s.a}); }); return out; }
const LIN_LABEL={out:{expands:"expands",contradicts:"contradicts",relates:"related to"},in:{expands:"expanded by",contradicts:"contradicted by",relates:"related to"}};

/* ============================== AI engine (local heuristics) ============================== */
// AI-powered concept extraction using Google Gemini
async function extractConceptsAI(text){
  const apiKey=settings.googleApiKey;
  const model=settings.researchModel||'gemini-2.0-flash-exp';
  
  if(!apiKey){
    // Fallback to local lexicon-based extraction
    return extractConceptsLocal(text);
  }
  
  const prompt=`You are a concept extraction assistant. Analyze the following text and identify 3-5 key concepts from this list: ${Object.keys(LEXICON).join(', ')}. If none match well, suggest relevant concepts based on the content.

Text: ${text}

Return ONLY a JSON array in this exact format:
[{"name":"Concept Name","score":0.9},{"name":"Another Concept","score":0.7}]

Scores should be between 0 and 1 based on relevance.`;

  try{
    const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body={
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{
        temperature:0.1,
        maxOutputTokens:500,
        responseMimeType:'application/json'
      }
    };
    
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    
    if(!response.ok) throw new Error('AI concept extraction failed');
    
    const data=await response.json();
    if(data.candidates&&data.candidates[0]?.content?.parts){
      const responseText=data.candidates[0].content.parts.map(p=>p.text).join('');
      const jsonMatch=responseText.match(/\[[\s\S]*\]/);
      if(jsonMatch){
        const concepts=JSON.parse(jsonMatch[0]);
        return concepts.slice(0,5).map(c=>({name:c.name,score:Math.min(1,c.score||0.5)}));
      }
    }
  }catch(e){
    console.warn('AI concept extraction failed, using local fallback:',e.message);
  }
  
  // Fallback to local extraction
  return extractConceptsLocal(text);
}

// Local lexicon-based concept extraction (fallback)
function extractConceptsLocal(text){
 const toks=tokenize(text), out=[];
 for(const [name,words] of Object.entries(LEXICON)){
   const hits=new Set();
   toks.forEach(t=>words.forEach(w=>{ if(t===w||t.startsWith(w)||(w.startsWith(t)&&t.length>3)) hits.add(w); }));
   if(hits.size) out.push({name,hits:[...hits],score:Math.min(1,hits.size/3)});
 }
 out.sort((a,b)=>b.score-a.score);
 return out.slice(0,5);
}

// Alias for backward compatibility
function extractConcepts(text){ return extractConceptsLocal(text); }

function refineText(raw){
 let t=raw.replace(/\s+/g," ").trim();
 t=t.replace(/\b(?:um+|uh+|er+|you know|i mean|sort of|kind of|basically|so yeah|right\?|literally)\b/gi,"")
    .replace(/\s+,/g,",").replace(/\s+\./g,".").replace(/\s{2,}/g," ").trim();
 let sents=(t.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[t]).map(s=>s.trim()).filter(Boolean).map(s=>{
   s=s.replace(/\bi\b/g,"I"); return s.charAt(0).toUpperCase()+s.slice(1);
 });
 const paras=[]; for(let i=0;i<sents.length;i+=3) paras.push(sents.slice(i,i+3).join(" "));
 return paras.join("\n\n");
}

// AI-powered interpretation builder
async function buildInterpretationAI(text,concepts){
  const apiKey=settings.googleApiKey;
  const model=settings.researchModel||'gemini-2.0-flash-exp';
  
  if(!apiKey){
    // Fallback to local interpretation
    return buildInterpretationLocal(concepts);
  }
  
  const conceptNames=concepts.map(c=>c.name).join(', ');
  const prompt=`You are a knowledge interpretation assistant. Based on the text and detected concepts, write a brief interpretation (2-3 sentences) explaining what this note is about.

Text: ${text}

Detected Concepts: ${conceptNames}

Return ONLY a single paragraph interpretation. Do not include any labels or prefixes.`;

  try{
    const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body={
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{
        temperature:0.3,
        maxOutputTokens:200
      }
    };
    
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    
    if(!response.ok) throw new Error('AI interpretation failed');
    
    const data=await response.json();
    if(data.candidates&&data.candidates[0]?.content?.parts){
      return data.candidates[0].content.parts.map(p=>p.text).join('').trim();
    }
  }catch(e){
    console.warn('AI interpretation failed, using local fallback:',e.message);
  }
  
  return buildInterpretationLocal(concepts);
}

function buildInterpretationLocal(concepts){
 const names=concepts.map(c=>c.name); if(!names.length) return "The assistant could not detect strong concept signals in this note; treat all structure as provisional.";
 let s="This note centers on "+names.slice(0,Math.min(2,names.length)).join(" and ");
 if(names.length>2) s+=", with secondary threads of "+names.slice(2).join(", ");
 s+=". Concepts were identified from recurring terminology only — no external facts were added.";
 return s;
}

// Alias for backward compatibility  
function buildInterpretation(concepts){ return buildInterpretationLocal(concepts); }
function contrastSignal(text){ return /\b(but|however|although|yet|actually|rethink\w*|reconsider\w*|on reflection|wrong|mistake|incomplete|no longer|opposite|revis\w*)\b/i.test(text); }
function overlapOf(a,b){
 const ca=new Set(a.concepts.map(c=>c.name)), cb=new Set(b.concepts.map(c=>c.name));
 const shared=[...ca].filter(x=>cb.has(x));
 const ta=new Set(tokenize(a.original)), tb=new Set(tokenize(b.original));
 const tshared=[...ta].filter(x=>tb.has(x)&&x.length>4);
 const denom=Math.max(2,Math.min(ca.size,cb.size)+1);
 const score=Math.min(1,(shared.length/denom)*.7+Math.min(tshared.length/8,1)*.3);
 return {shared,tshared,score};
}
function detectType(newNote,older,ov){
 if(contrastSignal(newNote.original)&&ov.shared.length>=2) return "contradicts";
 const olderSet=new Set(older.concepts.map(c=>c.name));
 if(ov.shared.length>=2&&ov.shared.length>=olderSet.size*.55&&newNote.concepts.length>ov.shared.length) return "expands";
 return "relates";
}
const confFromScore=s=>s>=.6?"high":s>=.35?"medium":"low";
function buildLimitations(source,concepts,confidence){
 const L=[];
 if(source==="voice") L.push("Transcribed from voice — recognition errors may be present in the Original Version.");
 if(concepts.length<2) L.push("Concept signal is weak; the interpretation leans heavily on context.");
 if(confidence!=="high") L.push("Confidence below high: some suggested connections may be coincidental.");
 L.push("This interpretation is inferred from context and may not fully represent your intended meaning.");
 return L;
}
function findSuggestions(note){
 const cands=[];
 state.notes.filter(n=>n.id!==note.id).forEach(other=>{
   const ov=overlapOf(note,other);
   if(ov.shared.length>=2||ov.score>=.42){
     const already=state.suggestions.some(s=>(s.a===note.id&&s.b===other.id)||(s.a===other.id&&s.b===note.id));
     if(!already) cands.push({other,ov,type:detectType(note,other,ov)});
   }
 });
 cands.sort((a,b)=>b.ov.score-a.ov.score);
 return cands.slice(0,4).map(c=>({
   a:note.id, b:c.other.id, type:c.type, score:+c.ov.score.toFixed(2), confidence:confFromScore(c.ov.score),
   reason:"Shared concepts: "+c.ov.shared.join(", ")+(c.ov.tshared.length?" · recurring terms: "+c.ov.tshared.slice(0,4).join(", "):"")
 }));
}
function semanticSearch(q){
 const qtoks=tokenize(q); if(!qtoks.length) return null;
 const expanded=new Set(qtoks); const matchedConcepts=[];
 for(const [name,words] of Object.entries(LEXICON)){
   if(words.some(w=>qtoks.some(t=>t===w||t.startsWith(w)||(w.startsWith(t)&&t.length>3)))){
     matchedConcepts.push(name); words.forEach(w=>expanded.add(w));
     (ASSOC[name]||[]).forEach(an=>{ if(an!==name) (LEXICON[an]||[]).forEach(w=>expanded.add(w)); matchedConcepts.length; });
   }
 }
 const results=[];
 state.notes.forEach(n=>{
   const toks=tokenize(n.original+" "+n.refined);
   const found=[...expanded].filter(w=>toks.some(t=>t===w||t.startsWith(w)));
   let score=found.length;
   matchedConcepts.forEach(mc=>{ if(n.concepts.some(c=>c.name===mc)) score+=4; });
   if(found.length||matchedConcepts.some(mc=>n.concepts.some(c=>c.name===mc))) results.push({note:n,score,found});
 });
 results.sort((a,b)=>b.score-a.score);
 const extra=[...expanded].filter(w=>!qtoks.includes(w)).slice(0,18);
 return {results:results.slice(0,8),matchedConcepts,extra};
}

/* ============================== toasts ============================== */
function toast(msg,kind){
 const t=document.createElement("div"); t.className="toast"+(kind?" "+kind:""); t.innerHTML=msg;
 $("#toasts").appendChild(t); setTimeout(()=>{t.style.opacity="0";t.style.transition=".4s";setTimeout(()=>t.remove(),400)},3600);
}

/* ============================== components ============================== */
function domainChip(d){ const c=DOMAIN_COLORS[d]||"#EAF0D0"; return `<span class="chip" style="color:${c};border-color:${c}55;background:${c}14">${esc(d)}</span>`; }
function conceptChips(concepts){ return `<div class="chips">${concepts.map(c=>`<span class="chip" style="color:#A9D8B0;border-color:rgba(143,227,136,.35);background:rgba(143,227,136,.07)">${esc(c.name)}</span>`).join("")}</div>`; }
function confBlock(conf){ const n=conf==="high"?3:conf==="medium"?2:1;
 return `<span class="conf-${conf}"><span class="confmeter">${[1,2,3].map(i=>`<i class="${i<=n?"f":""}"></i>`).join("")}</span><span class="conftag">${conf} confidence</span></span>`; }
function suggCard(s,ctx){
 const A=noteOf(s.a),B=noteOf(s.b); if(!A||!B) return "";
 const pending=s.status==="pending";
 return `<div class="sugg ${pending?"":"resolved"}" data-sid="${s.id}">
   <div class="suggtop"><span class="tbadge ${s.type}">${s.type}</span>${confBlock(s.confidence)}${pending?"":`<span class="rtag ${s.status}">${s.status}</span>`}</div>
   <div class="suggpair"><b>#${A.num} ${esc(A.title)}</b> &nbsp;⇄&nbsp; <b>#${B.num} ${esc(B.title)}</b></div>
   <div class="suggwhy">${esc(s.reason)}</div>
   ${pending?`<div class="suggacts">
     <button class="btn btn-sm btn-primary" data-act="accepted" data-sid="${s.id}" data-ctx="${ctx}">Accept connection</button>
     <button class="btn btn-sm btn-reject" data-act="rejected" data-sid="${s.id}" data-ctx="${ctx}">Reject</button>
     <button class="btn btn-sm btn-ignore" data-act="ignored" data-sid="${s.id}" data-ctx="${ctx}">Ignore</button>
   </div>`:""}
 </div>`;
}
function lineageBadges(id){
 const lin=lineageOf(id); if(!lin.length) return "";
 return `<div class="tlineage">${lin.map(l=>`<span class="tbadge ${l.type}" data-nav="${l.ref}" title="Open #${numOf(l.ref)}">${LIN_LABEL[l.dir][l.type]} #${numOf(l.ref)}</span>`).join("")}</div>`;
}

/* ============================== mutations ============================== */
function deleteNote(id){
 const idx=state.notes.findIndex(n=>n.id===id); if(idx===-1) return;
 state.notes.splice(idx,1); save(); toast("Note deleted","warn"); updateStats(); buildNav(); 
 if(current==="timeline") renderTimeline(); 
 if(current==="review") renderMain(); 
 if(selId===id) closeInspector(); 
 else if(selId) renderInspector(selId);
}
function resolveSuggestion(sid,verdict,ctx){
 const s=state.suggestions.find(x=>x.id===sid); if(!s||s.status!=="pending") return;
 s.status=verdict; s.resolvedAt=new Date().toISOString(); save();
 if(verdict==="accepted") toast(`Connection accepted — #${numOf(s.a)} ⇄ #${numOf(s.b)} <span style="color:var(--faint)">(${s.type})</span>`);
 if(verdict==="rejected") toast("Suggestion rejected. It will not return.","warn");
 updateStats(); buildNav();
 if(ctx==="capture"){ const c=$("#ressuggs"); if(c) c.innerHTML=pendingForCaptureHTML(); }
 if(current==="review") renderMain();
 if(selId) renderInspector(selId);
}
let captureSuggIds=[];
function pendingForCaptureHTML(){
 const list=captureSuggIds.map(id=>state.suggestions.find(s=>s.id===id)).filter(s=>s&&s.status==="pending");
 if(!list.length) return `<div class="empty">No outstanding suggestions from this capture.</div>`;
 return list.map(s=>suggCard(s,"capture")).join("");
}
function ingestNote(source,text){
 const concepts=extractConcepts(text);
 const refined=refineText(text);
 const domains=[...new Set(concepts.slice(0,3).map(c=>CONCEPT_DOMAIN[c.name]))];
 const allTok=tokenize(text);
 const signal=concepts.reduce((a,c)=>a+c.score,0)/Math.max(1,allTok.length/40);
 const confidence=concepts.length>=3?"high":concepts.length===2?"medium":"low";
 const first=(refined.split(/[.!?]/)[0]||"Untitled thought").trim();
 const title=first.length>52?first.slice(0,52)+"…":first;
 const note={id:"n"+state.seq,num:state.seq,source,createdAt:new Date().toISOString(),title,original:text,refined,
   concepts:concepts.map(c=>({name:c.name,score:+c.score.toFixed(2)})),domains,
   interpretation:buildInterpretation(concepts),confidence,limitations:buildLimitations(source,concepts,confidence),status:"active"};
 state.notes.push(note); state.seq++;
 const found=findSuggestions(note);
 found.forEach((f,i)=>{ const s={id:"s"+Date.now()+i,...f,status:"pending",createdAt:new Date().toISOString(),resolvedAt:null};
   state.suggestions.push(s); });
 save();
 return {note,suggIds:found.map((_,i)=>"s"+(state.suggestions[state.suggestions.length-found.length+i]).id)};
}

/* ============================== router & views ============================== */
let current="capture", selId=null, capTab="text", lastExport=null;
const VIEWS=[["capture","Capture"],["graph","Constellation"],["review","Review"],["timeline","Timeline"],["search","Search"],["export","Export"]];

function buildNav(){
 $("#nav").innerHTML=VIEWS.map(([v,label])=>{
   const icon={graph:ICON.graph,capture:ICON.mic,review:ICON.inbox,timeline:ICON.branch,search:ICON.search,export:ICON.export}[v];
   const badge=v==="review"&&pendingCount()?`<span class="nbadge">${pendingCount()}</span>`:"";
   return `<div class="navitem ${current===v?"on":""}" data-view="${v}">${icon}<span class="nl">${label}</span>${badge}</div>`;
 }).join("");
 $$("#nav .navitem").forEach(el=>el.onclick=()=>setView(el.dataset.view));
}
function updateStats(){
 const links=acceptedEdges().length, conc=new Set(state.notes.flatMap(n=>n.concepts.map(c=>c.name))).size;
 $("#stats").innerHTML=`
  <div class="stat lf"><b>${state.notes.length}</b><span>Notes</span></div>
  <div class="stat tl"><b>${links}</b><span>Links</span></div>
  <div class="stat amb"><b>${pendingCount()}</b><span>Pending</span></div>
  <div class="stat vi"><b>${conc}</b><span>Concepts</span></div>`;
}
function setView(v){ stopRec(); current=v; buildNav(); renderMain(); $("#main").scrollTop=0; }
function renderMain(){
 stopRec();
 ({graph:renderGraph,capture:renderCapture,review:renderReview,timeline:renderTimeline,search:renderSearch,export:renderExport}[current])();
}

/* ---------- graph view ---------- */
function renderGraph(){
 const doms=[...new Set(state.notes.flatMap(n=>n.domains))];
 const pend=pendingCount();
 $("#main").innerHTML=`
  <div class="panel graphpanel rise d1" id="gwrap">
    <canvas id="gcanvas"></canvas>
    <div class="glegend">${doms.map(d=>`<span class="lchip"><i style="background:${DOMAIN_COLORS[d]||"#fff"}"></i>${esc(d)}</span>`).join("")}</div>
    ${pend?`<div class="gpendpill" id="gpill"><span class="dot"></span>${pend} AWAITING REVIEW →</div>`:""}
    <div class="ghint">drag to arrange · click a node to inspect · amber halo = pending suggestion</div>
  </div>`;
 if(pend) $("#gpill").onclick=()=>setView("review");
 initGraphCanvas(); syncGraph();
}

/* ---------- capture view ---------- */
function renderCapture(){
 $("#main").innerHTML=`
 <div class="viewhead rise">
   <div class="eyebrow">Capture</div>
   <h1 class="vt">Speak it or write it. It will not be lost.</h1>
   <p class="sub">Your original words are locked in verbatim <i>before</i> the assistant touches anything.</p>
 </div>
 <div class="capgrid">
  <div class="panel rise d1">
    <div class="tabs">
      <button class="tab ${capTab==="voice"?"on":""}" data-tab="voice">${ICON.mic} VOICE</button>
      <button class="tab ${capTab==="text"?"on":""}" data-tab="text">${ICON.export&&'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" width="13" height="13"><path d="M3 2h8l2 2v10H3zM6 6h5M6 9h5M6 12h3"/></svg>'} TEXT</button>
    </div>
    <div class="pane ${capTab==="voice"?"on":""}" id="voicepane">
      <div class="micwrap" id="micwrap">
        <button class="micbtn" id="micbtn">${ICON.mic}</button>
        <div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="micstat" id="micstat">TAP TO RECORD</div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:12px">
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" width="14" height="14"><path d="M8 1v10M3 6l5-5 5 5M2 11v3h12v-3"/></svg>
          Upload Audio File
          <input type="file" id="audiofileupload" accept="audio/*" style="display:none">
        </label>
      </div>
      <div id="uploadedfileinfo" style="display:none;font:11px var(--mono);color:var(--dim);margin-top:8px;text-align:center"></div>
      <div id="vnosupport" style="display:none" class="disclaim" >${ICON.spark.replace("currentColor","#F5B84B")} Voice capture needs a browser with MediaRecorder support. Text capture works everywhere.</div>
    </div>
    <div class="pane ${capTab==="text"?"on":""}" id="textpane">
      <textarea class="ta" id="ta" placeholder="Write the thought exactly as it is — unpolished is fine. The assistant refines a copy, never the original."></textarea>
      <div class="tahint"><span>Original text is preserved permanently.</span><span id="tcount">0 chars</span></div>
    </div>
    <div class="preserveline">${ICON.lock} Original Version is written to storage before any AI processing begins.</div>
    <button class="btn btn-primary" id="processbtn">${ICON.spark} Process with Knowledge Assistant</button>
  </div>
  <div class="panel rise d2" id="assistpanel">
    <div class="lbl"><span class="amb">${ICON.spark}</span> KNOWLEDGE ASSISTANT</div>
    <div id="assistbody"><div class="assist-idle">Standing by.<br><br>When you process a note I will —<br>· preserve your original words <b>verbatim</b><br>· extract concepts &amp; topics<br>· refine readability into a <b>separate copy</b><br>· scan the whole knowledge base for possible connections<br><br>I only suggest. <b>You decide.</b></div></div>
  </div>
 </div>`;
 $$(".tab").forEach(t=>t.onclick=()=>{capTab=t.dataset.tab;renderCapture();});
 const ta=$("#ta"); if(ta){ ta.oninput=()=>$("#tcount").textContent=ta.value.length+" chars"; }
 $("#micbtn").onclick=toggleMic;
 if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){ $("#vnosupport").style.display="flex"; $("#micbtn").disabled=true; $("#micbtn").style.opacity=.35; }
 $("#processbtn").onclick=processNote;
 // Audio file upload handler
 const audioUpload=$("#audiofileupload");
 if(audioUpload){
   audioUpload.onchange=async (e)=>{
     const file=e.target.files[0];
     if(!file) return;
     window.capturedAudio=file;
     $("#uploadedfileinfo").style.display="block";
     $("#uploadedfileinfo").textContent=`Uploaded: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
     $("#micstat").textContent="AUDIO FILE READY — PROCESS TO TRANSCRIBE";
   };
 }
}
let finalT="",interimT="";
function renderInterim(){
 const box=$("#vtranscript"); if(!box) return;
 if(!finalT&&!interimT){ box.innerHTML='<span class="empty">Live transcript appears here…</span>'; return; }
 box.innerHTML=`<span class="final">${esc(finalT)}</span><span style="color:var(--faint)">${esc(interimT)}</span>`;
}
async function processNote(){
 const btn=$("#processbtn");
 let text= capTab==="voice"? finalT.trim() : ($("#ta")?$("#ta").value.trim():"");
 let hasAudioFile = capTab==="voice" && window.capturedAudio && !finalT;
 
 // Step 1: Save locally first (before any AI processing)
 if(hasAudioFile){
   // Audio will be saved after AI returns transcript
 } else if(text){
   // Text is already available, will be saved as original
 }
 
 // Step 2: Send to AI based on input type
 if(capTab==="voice" && window.capturedAudio){
   // AUDIO INPUT: Send audio file directly to AI model
   btn.disabled=true;
   const body=$("#assistbody");
   body.innerHTML=`<div class="step active"><span class="tick"></span><div class="st">Sending audio to AI for transcription & refinement...<em id="std0"></em></div></div><div id="results"></div>`;
   
   try{
     const result=await sendAudioToAI(window.capturedAudio);
     if(!result || !result.transcript){ throw new Error("AI processing failed"); }
     
     // Save transcript locally as original
     finalT=result.transcript;
     text=result.transcript;
     window.aiRefinedVersion=result.refined;
     
     $("#assistbody").innerHTML=`<div class="step done"><span class="tick">✓</span><div class="st">Audio processed by AI: transcript extracted & refined</div></div><div id="results"></div>`;
     await sleep(500);
   }catch(e){
     console.error("AI audio processing failed:",e);
     toast("Audio processing failed: "+e.message,"err");
     btn.disabled=false;
     return;
   }
 }
 
 if(text.length<12){ toast("Add a little more thought before processing.","warn"); btn.disabled=false; return; }
 btn.disabled=true; stopRec();
 const body=$("#assistbody");
 const steps=[["Preserving original thought",""],["Extracting concepts",""],["Building structured output",""],["Scanning knowledge base for relations",""]];
 body.innerHTML=steps.map((s,i)=>`<div class="step" id="st${i}"><span class="tick"></span><div class="st">${s[0]}<em id="std${i}"></em></div></div>`).join("")+`<div id="results"></div>`;
 const act=i=>{$("#st"+i).classList.add("active")}, fin=(i,d)=>{$("#st"+i).classList.remove("active");$("#st"+i).classList.add("done");$("#st"+i).querySelector(".tick").textContent="✓";$("#std"+i).innerHTML=d;};
 
 act(0); await sleep(550);
 const originalText=text;
 fin(0,`locked verbatim as Note #${state.seq} — never editable, never deletable`);
 
 act(1); await sleep(700);
 const concepts=await extractConceptsAI(text);
 fin(1,concepts.length?concepts.map(c=>esc(c.name)).join(" · "):"no strong concept signals");
 
 act(2);
 let refined=text;
 if(window.aiRefinedVersion){
   refined=window.aiRefinedVersion;
   fin(2,`AI structured output ready <span style="color:var(--amber)">(original transcript preserved)</span>`);
   window.aiRefinedVersion=null;
 }else if(settings.googleApiKey){
   try{
     refined=await sendTextToAI(text);
     fin(2,`AI Refined Version drafted <span style="color:var(--faint)">(original untouched)</span>`);
   }catch(e){
     console.warn("AI refinement failed, using local refinement:",e);
     refined=refineText(text);
     fin(2,`Locally refined <span style="color:var(--faint)">(AI unavailable)</span>`);
   }
 }else{
   refined=refineText(text);
   fin(2,`Locally refined <span style="color:var(--faint)">(add API key in Settings for AI refinement)</span>`);
 }
 await sleep(400);
 
 // Step 4: Find suggestions
 act(3); await sleep(900);
 const domains=[...new Set(concepts.slice(0,3).map(c=>CONCEPT_DOMAIN[c.name]))];
 const interpretation=await buildInterpretationAI(text,concepts);
 const confidence=concepts.length>=3?"high":concepts.length===2?"medium":"low";
 const limitations=buildLimitations(capTab,concepts,confidence);
 const first=(refined.split(/[.!?]/)[0]||"Untitled thought").trim();
 const title=first.length>52?first.slice(0,52)+"…":first;
 
 const note={id:"n"+state.seq,num:state.seq,source:capTab,createdAt:new Date().toISOString(),title,original:originalText,refined,
   concepts:concepts.map(c=>({name:c.name,score:+c.score.toFixed(2)})),domains,
   interpretation,confidence,limitations,status:"active"};
 state.notes.push(note); state.seq++;
 
 const found=findSuggestions(note);
 found.forEach((f,i)=>{ const s={id:"s"+Date.now()+i,...f,status:"pending",createdAt:new Date().toISOString(),resolvedAt:null};
   state.suggestions.push(s); });
 save();
 
 const suggIds=found.map((_,i)=>"s"+(state.suggestions[state.suggestions.length-found.length+i]).id);
 captureSuggIds=suggIds;
 fin(3,`${suggIds.length} possible connection${suggIds.length===1?"":"s"} found — suggestions only, nothing applied`);
 const suggHTML=captureSuggIds.length?`<div class="lbl" style="margin-top:18px"><span class="amb">${ICON.spark}</span> SUGGESTED RELATIONSHIPS — YOUR CALL</div><div id="ressuggs">${pendingForCaptureHTML()}</div>`
   :`<div class="empty" style="margin-top:14px">No related notes detected yet. Connections will surface as your base grows.</div>`;
 $("#results").innerHTML=`
  <div class="rescard orig rise"><div class="lbl"><span class="leaf">${ICON.lock}</span> ORIGINAL THOUGHT · #${note.num} · PRESERVED VERBATIM</div><div class="notetext">${esc(note.original)}</div></div>
  <div class="rescard ref rise d1"><div class="lbl"><span class="amb">${ICON.spark}</span> AI REFINED VERSION</div>
    <div class="disclaim">${ICON.spark} ${settings.googleApiKey?'AI-generated':'Locally generated'} refinement. May contain interpretation errors. Your original above is the source of truth.</div>
    <div class="notetext">${esc(note.refined)}</div></div>
  <div class="rescard rise d2"><div class="lbl">AI TRANSPARENCY</div>
    <div class="interp">${esc(note.interpretation)}</div>
    ${conceptChips(note.concepts)}
    <div style="margin:12px 0">${confBlock(note.confidence)}</div>
    <div class="lbl">POSSIBLE LIMITATIONS</div>
    <ul class="limlist">${note.limitations.map(l=>`<li>${esc(l)}</li>`).join("")}</ul>
  </div>
  ${suggHTML}
  <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
    <button class="btn btn-ghost btn-sm" id="openconst">${ICON.graph} Open in Constellation</button>
    ${pendingCount()?`<button class="btn btn-amber btn-sm" id="openrev">Review queue (${pendingCount()})</button>`:""}
  </div>`;
        const oc=$("#openconst"); if(oc) oc.onclick=()=>{selId=note.id;setView("graph");};
  const orr=$("#openrev"); if(orr) orr.onclick=()=>setView("review");
  if($("#ta"))$("#ta").value="";
 // Clear uploaded audio info after processing
 window.capturedAudio=null;
 const uploadInfo=$("#uploadedfileinfo");
 if(uploadInfo){uploadInfo.style.display="none";uploadInfo.textContent="";}
 btn.disabled=false;
 toast(`Note #${note.num} captured — ${suggIds.length} possible connection${suggIds.length===1?"":"s"} found.`);
 updateStats(); buildNav();
 bindSuggActs();
}

/* ---------- review view ---------- */
function renderReview(){
 const pend=state.suggestions.filter(s=>s.status==="pending").sort((a,b)=>b.score-a.score);
 const hist=state.suggestions.filter(s=>s.status!=="pending").slice(-6).reverse();
 $("#main").innerHTML=`
 <div class="viewhead rise">
   <div class="eyebrow">Approval Gate</div>
   <h1 class="vt">Nothing connects without you</h1>
   <p class="sub">Every suggestion below is a proposal, never a decision. Accepting creates a graph edge; rejecting or ignoring removes it permanently. There is no automatic linking in this system.</p>
 </div>
 <div class="rise d1" id="pendlist">${pend.length?pend.map(s=>suggCard(s,"review")).join(""):`<div class="panel"><div class="empty">Queue clear — the assistant has nothing awaiting your decision.</div></div>`}</div>
 ${hist.length?`<div class="lbl rise d2" style="margin-top:26px">RECENTLY RESOLVED</div>
   <div class="rise d3">${hist.map(s=>`<div class="resolved-line"><span class="rtag ${s.status}">${s.status}</span><span class="tbadge ${s.type}">${s.type}</span> #${numOf(s.a)} ${esc(titleOf(s.a))} ⇄ #${numOf(s.b)} ${esc(titleOf(s.b))}</div>`).join("")}</div>`:""}`;
 bindSuggActs();
}
function bindSuggActs(){
 $$("[data-act]").forEach(b=>b.onclick=()=>resolveSuggestion(b.dataset.sid,b.dataset.act,b.dataset.ctx));
 $$("[data-nav]").forEach(b=>b.onclick=e=>{e.stopPropagation();openNote(b.dataset.nav);});
}

/* ---------- timeline view ---------- */
function renderTimeline(){
 const notes=[...state.notes].sort((a,b)=>a.createdAt<b.createdAt?-1:1).reverse();
 const exp=state.suggestions.filter(s=>s.status==="accepted"&&s.type==="expands").length;
 const con=state.suggestions.filter(s=>s.status==="accepted"&&s.type==="contradicts").length;
 $("#main").innerHTML=`
 <div class="viewhead rise">
   <div class="eyebrow">Evolution</div>
   <h1 class="vt">Ideas attach; they are never replaced</h1>
   <p class="sub">${exp} expansion${exp===1?"":"s"} · ${con} contradiction${con===1?"":"s"} on record. Every version stays accessible — nothing is ever deleted automatically.</p>
 </div>
 <div class="tl">
 ${notes.map((n,i)=>`
  <div class="tentry rise ${i<4?"d"+i:""}" data-open="${n.id}">
   <div class="tcard">
     <div style="display:flex;gap:16px;align-items:flex-start">
       <div class="tnum">#${n.num}</div>
       <div style="flex:1;min-width:0">
         <div class="tmeta"><span>${n.source==="voice"?"🎙 VOICE":"✎ TEXT"}</span><span>·</span><span>${fmtDate(n.createdAt)}</span>${n.domains.map(d=>`<span class="chip" style="color:${DOMAIN_COLORS[d]};border-color:${DOMAIN_COLORS[d]}55;background:${DOMAIN_COLORS[d]}12">${esc(d)}</span>`).join("")}</div>
         <h3>${esc(n.title)}</h3>
         <p>${esc(n.refined.replace(/\n+/g," ").slice(0,170))}…</p>
         ${lineageBadges(n.id)}
       </div>
       <button class="delbtn" data-del="${n.id}" title="Delete note">🗑</button>
     </div>
   </div>
  </div>`).join("")}
 </div>`;
 $$("[data-open]").forEach(el=>el.onclick=()=>openNote(el.dataset.open));
 $$(".delbtn").forEach(btn=>btn.onclick=e=>{e.stopPropagation();deleteNote(btn.dataset.del);});
 bindSuggActs();
}

/* ---------- search view ---------- */
function renderSearch(preset){
 $("#main").innerHTML=`
 <div class="viewhead rise">
   <div class="eyebrow">Semantic Search</div>
   <h1 class="vt">Meaning first, keywords second</h1>
   <p class="sub">Queries are expanded through your concept network before matching — so searching “feedback” also surfaces trial &amp; error, learning, adaptation and reinforcement.</p>
 </div>
 <form class="searchbar rise d1" id="sform"><input id="sq" placeholder='Try: feedback, fear, agents, learning…' autocomplete="off" value="${esc(preset||"")}"><button class="btn btn-primary" type="submit">${ICON.search} Search</button></form>
 <div id="sres"></div>`;
 $("#sform").onsubmit=e=>{e.preventDefault();runSearch($("#sq").value);};
 if(preset) runSearch(preset);
}
function hlSnippet(text,terms){
 const lower=text.toLowerCase(); let idx=-1;
 for(const t of terms){ if(!t) continue; const i=lower.indexOf(t); if(i>=0&&(idx===-1||i<idx)) idx=i; }
 if(idx<0) return esc(text.slice(0,190))+"…";
 const start=Math.max(0,idx-70), end=Math.min(text.length,idx+120);
 let seg=esc(text.slice(start,end));
 terms.forEach(t=>{ if(!t||t.length<3) return; const re=new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","ig"); seg=seg.replace(re,"<mark>$1</mark>"); });
 return (start>0?"…":"")+seg+(end<text.length?"…":"");
}
function runSearch(q){
 const box=$("#sres"); const r=semanticSearch(q);
 if(!r||!r.results.length){ box.innerHTML=`<div class="empty">No notes matched, even after semantic expansion.</div>`; return; }
 box.innerHTML=`
  <div class="expanbox rise">
    <div class="lbl" style="color:var(--teal)">${ICON.spark} SEMANTIC EXPANSION ACTIVE</div>
    ${r.matchedConcepts.length?`<div class="chips" style="margin-bottom:9px">${r.matchedConcepts.map(c=>`<span class="chip" style="color:var(--teal);border-color:rgba(87,227,196,.4);background:rgba(87,227,196,.07)">${esc(c)}</span>`).join("")}</div>`:""}
    <div style="font-size:11.5px;color:var(--dim)">Also considered: <span style="color:#9FD8CB">${esc(r.extra.join(", "))}</span></div>
  </div>
  ${r.results.map(({note,found},i)=>`
   <div class="resultcard rise ${i<3?"d"+(i+1):""}" data-open="${note.id}">
     <div class="rhead"><span class="rnum">#${note.num}</span><span class="rtitle">${esc(note.title)}</span><span style="margin-left:auto">${confBlock(note.confidence)}</span><button class="delbtn" data-del="${note.id}" title="Delete note">🗑</button></div>
     <div class="rbody">${hlSnippet(note.refined.replace(/\n+/g," "),found)}</div>
     <div class="chips">${note.domains.map(domainChip).join("")}</div>
   </div>`).join("")}`;
 $$("[data-open]").forEach(el=>el.onclick=()=>openNote(el.dataset.open));
}
 $$(".delbtn").forEach(btn=>btn.onclick=e=>{e.stopPropagation();deleteNote(btn.dataset.del);});

/* ---------- export view ---------- */
function renderExport(){
 const doms=[...new Set(state.notes.flatMap(n=>n.domains))].sort();
 $("#main").innerHTML=`
 <div class="viewhead rise">
   <div class="eyebrow">Export</div>
   <h1 class="vt">From network to document</h1>
   <p class="sub">Chapters follow your topics, sections follow evolution order, cross-references follow your accepted connections — and originals are reproduced verbatim in the appendix. Never rewritten.</p>
 </div>
 <div class="expgrid">
  <div class="panel rise d1">
    <label class="sellab">Scope</label>
    <select class="sel" id="exscope"><option value="all">All knowledge (${state.notes.length} notes)</option>${doms.map(d=>`<option value="${esc(d)}">${esc(d)} (${state.notes.filter(n=>n.domains.includes(d)).length})</option>`).join("")}</select>
    <label class="sellab">Format</label>
    <div style="display:flex;flex-direction:column;gap:9px;margin-top:4px">
      <button class="btn btn-primary" id="exbuild">${ICON.export} Build document</button>
      <button class="btn btn-ghost btn-sm" id="exmd" disabled>Download Markdown</button>
      <button class="btn btn-ghost btn-sm" id="expdf" disabled>Print / Save as PDF</button>
    </div>
    <div class="preserveline" style="margin-top:16px">${ICON.lock} Export never modifies your notes.</div>
  </div>
  <div class="rise d2" id="exprev"><div class="panel"><div class="empty">Choose a scope and build the document to preview it here.</div></div></div>
 </div>`;
 $("#exbuild").onclick=()=>{buildDoc($("#exscope").value);$("#exmd").disabled=false;$("#expdf").disabled=false;};
 $("#exmd").onclick=downloadMD; $("#expdf").onclick=()=>window.print();
}
function buildDoc(scope){
 const notes=state.notes.filter(n=>scope==="all"||n.domains.includes(scope)).slice().sort((a,b)=>a.createdAt<b.createdAt?-1:1);
 const chapters=new Map();
 notes.forEach(n=>{const dom=scope==="all"?n.domains[0]:scope;if(!chapters.has(dom))chapters.set(dom,[]);chapters.get(dom).push(n);});
 const xrefs=n=>lineageOf(n.id).map(l=>`${LIN_LABEL[l.dir][l.type]} #${numOf(l.ref)} — ${titleOf(l.ref)}`);
 const stamp=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
 let html=`<div class="paper"><h1>Collected Knowledge${scope!=="all"?" — "+esc(scope):""}</h1>
  <div class="pmeta">Generated by Rhizome · ${stamp} · ${notes.length} notes</div>
  <div class="pnote">This document was assembled from the user's knowledge graph. Refined text is AI-prepared for readability; Appendix A contains every original thought, verbatim and unedited.</div>`;
 let ci=0;
 chapters.forEach((list,dom)=>{ ci++;
   html+=`<h2>Chapter ${ci} — ${esc(dom)}</h2>`;
   list.forEach(n=>{
     html+=`<h3>#${n.num} · ${esc(n.title)}</h3><div class="pdate">${fmtDate(n.createdAt)} · ${n.source==="voice"?"voice":"text"} capture</div>
     <p style="margin-top:8px;white-space:pre-wrap">${esc(n.refined)}</p>
     ${xrefs(n).length?`<div class="pxref">⇄ ${xrefs(n).map(esc).join(" &nbsp;·&nbsp; ")}</div>`:""}`;
   });
 });
 html+=`<h2>Appendix A — Original Versions (verbatim)</h2>`;
 notes.forEach(n=>{ html+=`<h3>#${n.num} · ${esc(n.title)}</h3><div class="porig">${esc(n.original)}</div>`; });
 html+=`</div>`;
 $("#exprev").innerHTML=html; $("#printroot").innerHTML=html;
 lastExport={scope,notes,chapters,xrefs,stamp};
 toast("Document built — originals preserved in Appendix A.");
}
function downloadMD(){
 if(!lastExport) return;
 const {notes,chapters,xrefs,scope,stamp}=lastExport;
 let md=`# Collected Knowledge${scope!=="all"?" — "+scope:""}\n\n_Generated by Rhizome · ${stamp} · ${notes.length} notes_\n\n> Refined text is AI-prepared for readability. Appendix A contains every original thought, verbatim and unedited.\n`;
 let ci=0;
 chapters.forEach((list,dom)=>{ ci++; md+=`\n## Chapter ${ci} — ${dom}\n`;
   list.forEach(n=>{ md+=`\n### #${n.num} · ${n.title}\n_${fmtDate(n.createdAt)} · ${n.source} capture_\n\n${n.refined}\n`;
     const x=xrefs(n); if(x.length) md+=`\n**Connections:** ${x.join(" · ")}\n`; });
 });
 md+=`\n## Appendix A — Original Versions (verbatim)\n`;
 notes.forEach(n=>{ md+=`\n### #${n.num} · ${n.title}\n\n> ${n.original.replace(/\n/g,"\n> ")}\n`; });
 const blob=new Blob([md],{type:"text/markdown"});
 const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
 a.download=`rhizome-${scope==="all"?"all-knowledge":scope.toLowerCase().replace(/\s+/g,"-")}-${Date.now()/86400000|0}.md`;
 a.click(); URL.revokeObjectURL(a.href);
 toast("Markdown downloaded.","warn");
}

/* ============================== inspector ============================== */
function openNote(id){ selId=id; renderInspector(id); $("#shell").classList.add("insp"); }
function closeInspector(){ selId=null; $("#shell").classList.remove("insp"); if(gcanvas) syncGraph(); }
function renderInspector(id){
 const n=noteOf(id); if(!n){closeInspector();return;}
 const conns=acceptedEdges().filter(s=>s.a===id||s.b===id);
 const pends=state.suggestions.filter(s=>s.status==="pending"&&(s.a===id||s.b===id));
 const deg=conns.length;
 $("#inspector").innerHTML=`
  <div class="inshead">
    <span style="font:600 11px var(--mono);letter-spacing:.14em;color:var(--leaf)">NOTE #${n.num}</span>
    <span style="font:500 9.5px var(--mono);letter-spacing:.14em;color:var(--faint)">${n.source==="voice"?"🎙 VOICE":"✎ TEXT"} · ${fmtDate(n.createdAt)}</span>
    <button class="insclose" id="insx">✕</button>
  </div>
  <div class="insbody">
   <div>
     <h2>${esc(n.title)}</h2>
     <div class="chips">${n.domains.map(domainChip).join("")}</div>
   </div>
   <div class="insblock">
     <div class="lbl"><span class="leaf">${ICON.lock}</span> ORIGINAL THOUGHT — PRESERVED VERBATIM</div>
     <div class="rescard orig" style="margin-top:0"><div class="notetext">${esc(n.original)}</div></div>
   </div>
   <div class="insblock">
     <div class="lbl"><span class="amb">${ICON.spark}</span> AI REFINED VERSION</div>
     <div class="rescard ref" style="margin-top:0">
       <div class="disclaim">${ICON.spark} AI-generated. May contain interpretation errors — the original above is authoritative.</div>
       <div class="notetext">${esc(n.refined)}</div>
     </div>
   </div>
   <div class="insblock">
     <div class="lbl">${ICON.spark} AI TRANSPARENCY</div>
     <div class="interp">${esc(n.interpretation)}</div>
     ${conceptChips(n.concepts)}
     <div style="margin:11px 0">${confBlock(n.confidence)}</div>
     <ul class="limlist">${n.limitations.map(l=>`<li>${esc(l)}</li>`).join("")}</ul>
   </div>
   <div class="insblock">
     <div class="lbl">CONNECTIONS (${deg})</div>
     ${conns.length?conns.map(s=>{const other=s.a===id?s.b:s.a;return `<div class="connitem" data-nav="${other}"><span class="tbadge ${s.type}">${s.type}</span><span class="cn">#${numOf(other)}</span><span style="color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(titleOf(other))}</span></div>`;}).join(""):`<div class="empty" style="padding:8px 0">No accepted connections yet.</div>`}
     ${pends.map(s=>suggCard(s,"inspector")).join("")}
   </div>
   <div class="insblock">
     <div class="lbl">${ICON.branch} EVOLUTION</div>
     ${lineageBadges(id)||`<div class="insfoot">No lineage yet — future notes will attach here instead of replacing this one.</div>`}
     <div class="insfoot" style="margin-top:9px">Every version of this idea remains accessible. Nothing is deleted.</div>
   </div>
   <button class="btn btn-ghost btn-sm" id="locate">${ICON.graph} Locate in Constellation</button>
  </div>`;
 $("#insx").onclick=closeInspector;
 $("#locate").onclick=()=>{setView("graph");selId=id;};
 bindSuggActs();
}

/* ============================== graph engine ============================== */
let gcanvas=null,gctx=null,graph={nodes:[],edges:[],hover:null,drag:null,w:0,h:0};
function initGraphCanvas(){
 gcanvas=$("#gcanvas"); gctx=gcanvas.getContext("2d");
 const wrap=$("#gwrap");
 const fit=()=>{const r=wrap.getBoundingClientRect(),d=window.devicePixelRatio||1;
   gcanvas.width=r.width*d; gcanvas.height=r.height*d; graph.w=r.width; graph.h=r.height; gctx.setTransform(d,0,0,d,0,0);};
 fit(); new ResizeObserver(fit).observe(wrap);
 gcanvas.onpointerdown=e=>{const p=gpos(e),n=hitNode(p);
   if(n){graph.drag={n,sx:p.x,sy:p.y,moved:false};gcanvas.classList.add("drag");gcanvas.setPointerCapture(e.pointerId);}};
 gcanvas.onpointermove=e=>{const p=gpos(e);
   if(graph.drag){const d=graph.drag; if(Math.hypot(p.x-d.sx,p.y-d.sy)>4)d.moved=true;
     d.n.x=p.x;d.n.y=p.y;d.n.vx=0;d.n.vy=0;}
   graph.hover=hitNode(p); gcanvas.style.cursor=graph.hover?"pointer":(graph.drag?"grabbing":"grab");};
 gcanvas.onpointerup=e=>{const d=graph.drag;graph.drag=null;gcanvas.classList.remove("drag");
   if(d&&!d.moved){selId=d.n.id;renderInspector(selId);$("#shell").classList.add("insp");}};
}
function gpos(e){const r=gcanvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function hitNode(p){for(let i=graph.nodes.length-1;i>=0;i--){const n=graph.nodes[i];if(Math.hypot(p.x-n.x,p.y-n.y)<(n.r||12)+7)return n;}return null;}
function nodeDeg(id){return acceptedEdges().filter(s=>s.a===id||s.b===id).length;}
function syncGraph(){
 if(!gcanvas) return;
 const ids=new Set(state.notes.map(n=>n.id));
 graph.nodes=graph.nodes.filter(n=>ids.has(n.id));
 const have=new Set(graph.nodes.map(n=>n.id));
 state.notes.forEach((n,i)=>{ if(!have.has(n.id)){
   const ang=(i/state.notes.length)*Math.PI*2;
   graph.nodes.push({id:n.id,x:(graph.w||600)/2+Math.cos(ang)*150+(Math.random()*50-25),y:(graph.h||420)/2+Math.sin(ang)*115+(Math.random()*50-25),vx:0,vy:0,born:performance.now()});
 }});
 graph.nodes.forEach(n=>{n.r=Math.min(17,9+nodeDeg(n.id)*2.4);});
 graph.edges=acceptedEdges().map(s=>({a:s.a,b:s.b,type:s.type}));
}
function stepGraph(){
 const ns=graph.nodes,W=graph.w,H=graph.h;
 for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
   const a=ns[i],b=ns[j];let dx=b.x-a.x,dy=b.y-a.y;let d2=Math.max(60,dx*dx+dy*dy),d=Math.sqrt(d2);
   const f=3200/d2; dx/=d;dy/=d; a.vx-=dx*f;a.vy-=dy*f;b.vx+=dx*f;b.vy+=dy*f;
 }
 graph.edges.forEach(e=>{const a=ns.find(n=>n.id===e.a),b=ns.find(n=>n.id===e.b);if(!a||!b)return;
   let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;const f=(d-140)*.015;dx/=d;dy/=d;
   a.vx+=dx*f*d*.06;a.vy+=dy*f*d*.06;b.vx-=dx*f*d*.06;b.vy-=dy*f*d*.06;});
 ns.forEach(n=>{
   n.vx+=(W/2-n.x)*.012; n.vy+=(H/2-n.y)*.014;
   if(graph.drag&&graph.drag.n===n){n.vx=0;n.vy=0;return;}
   n.vx*=.85;n.vy*=.85; n.x+=n.vx;n.y+=n.vy;
   n.x=Math.max(30,Math.min(W-30,n.x)); n.y=Math.max(26,Math.min(H-40,n.y));
 });
}
const EDGE_COLORS={expands:"#8FE388",contradicts:"#FF6B6B",relates:"#57E3C4"};
function drawGraph(now){
 const c=gctx;if(!c)return;
 c.clearRect(0,0,graph.w,graph.h);
 graph.edges.forEach(e=>{
   const a=graph.nodes.find(n=>n.id===e.a),b=graph.nodes.find(n=>n.id===e.b);if(!a||!b)return;
   c.strokeStyle=EDGE_COLORS[e.type]||"#57E3C4"; c.globalAlpha=.55; c.lineWidth=1.4;
   if(e.type==="contradicts"){c.setLineDash([5,4]);c.lineDashOffset=-now*.02;}else c.setLineDash([]);
   c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);c.globalAlpha=1;
 });
 graph.nodes.forEach(n=>{
   const note=noteOf(n.id); if(!note)return;
   const col=DOMAIN_COLORS[note.domains[0]]||"#EAF0D0";
   const age=(now-n.born)/500, sc=Math.min(1,age);
   const r=n.r*(.4+.6*sc);
   if(noteHasPending(n.id)){
     c.beginPath();c.arc(n.x,n.y,r+6+Math.sin(now/300+n.x)*2,0,7);
     c.strokeStyle="rgba(245,184,75,"+(0.45+0.25*Math.sin(now/300))+")";c.lineWidth=1.6;c.stroke();
   }
   if(n.id===selId){c.beginPath();c.arc(n.x,n.y,r+7,0,7);c.strokeStyle="#8FE388";c.lineWidth=1.6;c.stroke();}
   c.shadowColor=col;c.shadowBlur=18;
   c.beginPath();c.arc(n.x,n.y,r,0,7);c.fillStyle=col;c.fill();c.shadowBlur=0;
   c.beginPath();c.arc(n.x,n.y,r,0,7);c.strokeStyle="rgba(255,255,255,.28)";c.lineWidth=1;c.stroke();
   const hov=graph.hover===n;
   c.font=(hov?"600 11px":"500 9.5px")+" 'IBM Plex Mono',monospace";
   c.textAlign="center"; c.fillStyle=hov?"rgba(233,244,230,.95)":"rgba(233,244,230,.62)";
   c.fillText("#"+note.num+(hov?" — "+note.title:""),n.x,n.y+r+15);
 });
}

/* ============================== ambient spores ============================== */
const spC=$("#spores"),spX=spC.getContext("2d");let spores=[];
function fitSpores(){spC.width=innerWidth;spC.height=innerHeight;}
fitSpores();addEventListener("resize",fitSpores);
for(let i=0;i<64;i++)spores.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.6+Math.random()*1.8,s:.08+Math.random()*.3,p:Math.random()*7,c:Math.random()<.82?"143,227,136":"245,184,75"});
function drawSpores(now){
 spX.clearRect(0,0,spC.width,spC.height);
 spores.forEach(p=>{
   p.y-=p.s; p.x+=Math.sin(now/2600+p.p)*.12;
   if(p.y<-8){p.y=spC.height+8;p.x=Math.random()*spC.width;}
   spX.beginPath();spX.arc(p.x,p.y,p.r,0,7);
   spX.fillStyle=`rgba(${p.c},${.1+.12*Math.sin(now/900+p.p)})`;spX.fill();
 });
}
function loop(now){
 drawSpores(now);
 if(current==="graph"&&gcanvas){stepGraph();drawGraph(now);}
 requestAnimationFrame(loop);
}

/* ============================== voice ============================== */
let mediaRecorder=null,recOn=false,audioChunks=[];
async function toggleMic(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    $("#vnosupport").style.display="flex";
    $("#micbtn").disabled=true;
    $("#micbtn").style.opacity=.35;
    return;
  }
  if(!recOn){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder=new MediaRecorder(stream);
      audioChunks=[];
      mediaRecorder.ondataavailable=e=>{if(e.data.size>0)audioChunks.push(e.data);};
      mediaRecorder.onstop=()=>{
        const audioBlob=new Blob(audioChunks,{type:"audio/webm"});
        // Store the audio blob for later processing
        window.capturedAudio=audioBlob;
        $("#micstat").textContent="AUDIO RECORDED — TAP TO RECORD AGAIN OR PROCESS";
      };
      mediaRecorder.start();
      recOn=true;
      $("#micbtn").classList.add("live");
      $("#micwrap").classList.add("live-ui");
      $("#micstat").textContent="RECORDING — TAP TO STOP";
      // Hide the transcript box since we don't do live transcription
      $("#vtranscript").style.display="none";
    }catch(e){
      toast("Microphone permission denied — use text capture.","err");
      stopRec();
    }
  }else{
    stopRec();
  }
}
function stopRec(){
  recOn=false;
  if(mediaRecorder&&mediaRecorder.state!=="stopped"){
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t=>t.stop());
  }
  const mb=$("#micbtn"),mw=$("#micwrap"),ms=$("#micstat");
  if(mb)mb.classList.remove("live");
  if(mw)mw.classList.remove("live-ui");
}

/* ============================== boot ============================== */
load(); buildNav(); updateStats(); renderMain(); requestAnimationFrame(loop);
// #capbtn removed - replaced with settings button
$("#gsearch").addEventListener("keydown",e=>{if(e.key==="Enter"){setView("search");const v=$("#gsearch").value;setTimeout(()=>{$("#sq").value=v;runSearch(v);},30);}else if(e.key==="Enter"&&e.shiftKey){setView("capture");}});
$("#resetlink").onclick=()=>{if(confirm("Reset all demo data? Your local notes will be replaced by the seed knowledge base.")){localStorage.removeItem(LSKEY);location.reload();}};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeInspector();});
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(b)resolveSuggestion(b.dataset.sid,b.dataset.act,b.dataset.ctx);});

/* ============================== settings panel ============================== */
const SETTINGS_KEY='rhizome_settings';
let settings={googleApiKey:'',transcriptModel:'',researchModel:''};

function loadSettings(){
  const s=localStorage.getItem(SETTINGS_KEY);
  if(s){try{settings=JSON.parse(s);}catch(e){}}
  $('#googleapikey').value=settings.googleApiKey||'';
  $('#transcriptmodel').value=settings.transcriptModel||'gemini-2.0-flash-exp';
  $('#researchmodel').value=settings.researchModel||'gemini-2.0-flash-exp';
}

function saveSettings(){
  settings.googleApiKey=$('#googleapikey').value.trim();
  settings.transcriptModel=$('#transcriptmodel').value.trim()||'gemini-2.0-flash-exp';
  settings.researchModel=$('#researchmodel').value.trim()||'gemini-2.0-flash-exp';
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  toast('Settings saved successfully','ok');
  closeSettingsPanel();
}

function openSettingsPanel(){
  $('#settingspanel').classList.add('open');
}

function closeSettingsPanel(){
  $('#settingspanel').classList.remove('open');
}

// Settings event listeners
$('#settingsbtn').onclick=openSettingsPanel;
$('#settingsclose').onclick=closeSettingsPanel;
$('#settingsoverlay').onclick=closeSettingsPanel;
$('#savesettings').onclick=saveSettings;

// Load settings on boot
loadSettings();

/* ============================== AI API functions ============================== */

// Utility: Convert Blob to Base64
function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onloadend=()=>{
      const base64String=reader.result.split(',')[1]; // Remove data:image/webm;base64, prefix
      resolve(base64String);
    };
    reader.onerror=reject;
    reader.readAsDataURL(blob);
  });
}

// Upload file to Google Files API and wait for it to become ACTIVE
async function uploadFileToGoogle(file, apiKey){
  // Validate API key format before making request
  if(!apiKey || apiKey.length < 30){
    throw new Error('Invalid API key. Please check your Google API key in Settings.');
  }
  
  const uploadEndpoint=`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  console.log('Uploading file to Google Files API...');
  
  // Create multipart upload body - metadata must be wrapped in 'file' object
  const metadata={
    file:{
      displayName:file.name,
      mimeType:file.type||'audio/webm'
    }
  };
  
  const boundary='----WebKitFormBoundary'+Math.random().toString(36).substring(2);
  const requestBody=[
    '--'+boundary,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    '--'+boundary,
    'Content-Type: '+(file.type||'audio/webm'),
    '',
    ''
  ].join('\r\n');
  
  // Read file as ArrayBuffer and combine with metadata
  const fileBuffer=await file.arrayBuffer();
  const requestBodyBytes=new TextEncoder().encode(requestBody);
  const closingBytes=new TextEncoder().encode('\r\n--'+boundary+'--\r\n');
  
  const fullBody=new Uint8Array(requestBodyBytes.byteLength+fileBuffer.byteLength+closingBytes.byteLength);
  fullBody.set(requestBodyBytes,0);
  fullBody.set(new Uint8Array(fileBuffer),requestBodyBytes.byteLength);
  fullBody.set(closingBytes,requestBodyBytes.byteLength+fileBuffer.byteLength);
  
  const response=await fetch(uploadEndpoint,{
    method:'POST',
    headers:{
      'X-Goog-Upload-Protocol':'multipart',
      'X-Goog-Upload-Header-Content-Length':file.size.toString(),
      'X-Goog-Upload-Header-Content-Type':file.type||'audio/webm',
      'Content-Type':'multipart/related; boundary='+boundary
    },
    body:fullBody
  }).catch(err=>{
    console.error('Network error during upload:',err);
    throw new Error('Failed to connect to Google API. Please check your internet connection and API key.');
  });
  
  if(!response.ok){
    let errorMsg=`File upload failed with status ${response.status}`;
    try{
      const err=await response.json();
      if(err.error?.message){
        errorMsg=err.error.message;
      }
    }catch(e){}
    
    // Provide helpful error messages based on status code
    if(response.status===400){
      errorMsg='Invalid request. Please verify your API key is correct and has the required permissions.';
    }else if(response.status===401){
      errorMsg='Authentication failed. Please check that your API key is valid.';
    }else if(response.status===403){
      errorMsg='Access denied. Your API key may not have permission to use the Files API.';
    }else if(response.status===404){
      errorMsg='Endpoint not found. Please verify your API key format is correct.';
    }
    throw new Error(errorMsg);
  }
  
  const data=await response.json();
  // Response returns file object directly, extract the name (URI)
  const fileObj=data.file||data;
  // Ensure we return the full HTTPS URI for the file (without /v1beta/ in the path)
  // Google Files API expects: https://generativelanguage.googleapis.com/files/<id>
  if(fileObj.name && !fileObj.name.startsWith('https://')){
    fileObj.name=`https://generativelanguage.googleapis.com/files/${fileObj.name.replace(/^files\//,'')}`;
  }
  return fileObj;
}

// Poll file state until it becomes ACTIVE
async function waitForFileActive(fileUri, apiKey){
  // 10 minutes = 600 seconds, with 2 second intervals = 300 attempts
  const maxAttempts=300;
  const pollInterval=2000;
  
  for(let i=0;i<maxAttempts;i++){
    await sleep(pollInterval);
    
    // fileUri is now a full HTTPS URL, extract the path part for polling
    let uri=fileUri;
    if(fileUri.includes('generativelanguage.googleapis.com/files/')){
      // Extract everything after 'files/' (e.g., "files/xyz")
      uri='files/'+fileUri.split('files/')[1];
    }else if(!uri.startsWith('files/')){
      uri=`files/${uri}`;
    }
    
    const fileEndpoint=`https://generativelanguage.googleapis.com/v1beta/${uri}?key=${apiKey}`;
    const response=await fetch(fileEndpoint,{method:'GET'});
    
    if(!response.ok){
      const errData=await response.json().catch(()=>({}));
      console.warn(`Poll attempt ${i+1} failed:`,errData);
      continue;
    }
    
    const data=await response.json();
    // Response returns file object directly at root level
    const fileObj=data.file||data;
    
    // Ensure fileObj.name is a full HTTPS URI (without /v1beta/ in the path)
    if(fileObj && fileObj.name && !fileObj.name.startsWith('https://')){
      fileObj.name=`https://generativelanguage.googleapis.com/files/${fileObj.name.replace(/^files\//,'')}`;
    }
    
    if(fileObj&&fileObj.state==='ACTIVE'){
      return fileObj;
    }
    if(fileObj&&fileObj.state==='FAILED'){
      throw new Error('File processing failed on Google servers: '+(fileObj.error?.message||'Unknown error'));
    }
    console.log(`Poll attempt ${i+1}: File state is ${fileObj?.state||'unknown'}, waiting...`);
  }
  
  throw new Error('Timeout waiting for file to become active. The file may still be processing.');
}

// Send audio to AI for transcription AND refinement using Google Files API
async function sendAudioToAI(audioBlob){
  const apiKey=settings.googleApiKey;
  const model=settings.transcriptModel||'gemini-2.0-flash-exp';
  
  if(!apiKey){
    throw new Error('Google API key not configured. Please add your API key in Settings.');
  }
  
  // Create a File object from the blob
  const file=new File([audioBlob],'audio_recording.webm',{type:audioBlob.type||'audio/webm'});
  
  // Step 1: Upload file to Google Files API
  const uploadedFile=await uploadFileToGoogle(file,apiKey);
  /* IMPORTANT: The generateContent API requires a FULL HTTPS URI, not just "files/xyz" */
  // uploadedFile.name is already a full HTTPS URI from uploadFileToGoogle
  const fileUri=uploadedFile.name; // Full HTTPS URI required by generateContent
  // Step 2: Wait for file state to become ACTIVE
  const activeFile=await waitForFileActive(fileUri,apiKey);
  
  // Step 3: FIRST API CALL - Extract COMPLETE transcript ONLY (no refinement)
  const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  // Focused system prompt for MAXIMUM transcript completeness
  const transcriptPrompt=`You are a professional transcription assistant. Your ONLY task is to transcribe the audio file word-for-word.
CRITICAL REQUIREMENTS:
- Transcribe EVERY single word from start to finish without exception
- Include ALL filler words (um, uh, like, you know, etc.), false starts, repetitions, and stutters exactly as spoken
- Do NOT summarize, paraphrase, condense, or omit ANY portion of the audio
- Do NOT add any commentary, analysis, or structured formatting
- Continue transcribing until the audio ends completely
- If the audio is long, use your full token capacity to capture everything
- Return ONLY the raw transcript text, nothing else

Your output must be the complete verbatim transcript of the entire audio.`;

  // First call: transcript only with maximum tokens
  const transcriptBody={
    contents:[{
      parts:[
        {text:transcriptPrompt},
        {file_data:{file_uri:activeFile.name,mime_type:'audio/webm'}}
      ]
    }],
    generationConfig:{
      temperature:0,
      maxOutputTokens:32768,
      responseMimeType:'text/plain'
    }
  };
  
  console.log('AI Step 1/2: Extracting complete transcript...');
  const transcriptResponse=await fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(transcriptBody)
  });
  
  if(!transcriptResponse.ok){
    const err=await transcriptResponse.json().catch(()=>({}));
    throw new Error(err.error?.message||`Transcript API request failed with status ${transcriptResponse.status}`);
  }
  
  const transcriptData=await transcriptResponse.json();
  let transcript='';
  if(transcriptData.candidates&&transcriptData.candidates[0]?.content?.parts){
    transcript=transcriptData.candidates[0].content.parts.map(p=>p.text).join('')||'';
  }
  
  if(!transcript||transcript.trim()===''){
    throw new Error('AI returned empty transcript');
  }
  
  console.log(`AI Step 1/2: Transcript extracted (${transcript.length} chars)`);
  
  // Step 4: SECOND API CALL - Refine the transcript (separate call)
  const refinePrompt=`You are a knowledge refinement assistant. You will receive a raw transcript.
Your task is to transform it into a clean, structured version:
- Organize content into clear PARTS (major themes) and POINTS (specific ideas)
- Remove all filler words, false starts, repetitions, and verbal tics
- Structure ideas hierarchically with logical flow
- Use numbered points, bullet points, and clear paragraph breaks
- Label each major section with descriptive headers (Part 1, Part 2, etc.)
- Preserve the EXACT meaning without adding external information
- Extract key insights and conclusions

Return ONLY the refined text, no explanations.`;

  const refineBody={
    contents:[{
      parts:[
        {text:refinePrompt},
        {text:`Refine this transcript:\n\n${transcript}`}
      ]
    }],
    generationConfig:{
      temperature:0.3,
      maxOutputTokens:8192
    }
  };
  
  console.log('AI Step 2/2: Refining transcript into structured format...');
  const refineResponse=await fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(refineBody)
  });
  
  let refined='';
  if(refineResponse.ok){
    const refineData=await refineResponse.json();
    if(refineData.candidates&&refineData.candidates[0]?.content?.parts){
      refined=refineData.candidates[0].content.parts.map(p=>p.text).join('')||'';
      console.log(`AI Step 2/2: Refinement complete (${refined.length} chars)`);
    }
  }else{
    console.warn('Refinement call failed, using transcript as fallback');
    refined=transcript;
  }
  
  return {transcript,refined};
}


// Send text to AI for refinement ONLY in SINGLE API call
async function sendTextToAI(text){
  const apiKey=settings.googleApiKey;
  const model=settings.transcriptModel||'gemini-2.0-flash-exp';
  
  if(!apiKey){
    throw new Error('Google API key not configured. Please add your API key in Settings.');
  }
  
  // System prompt for text: ONLY refine to structured format
  const systemPrompt=`You are a knowledge refinement assistant. You will receive text input.
Your task is to:
- Rewrite the text into a clean, structured format
- Remove unnecessary fluff, filler words, and repetitions
- Organize ideas logically with proper paragraphs
- Preserve the EXACT meaning without adding or removing any core concepts

Return ONLY the refined text, no explanations or additional commentary.`;

  const userPrompt=`Refine this text into a clear, structured format:\n\n${text}`;
  
  // Google Generative AI endpoint
  const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body={
    contents:[{
      parts:[
        {text:systemPrompt},
        {text:userPrompt}
      ]
    }],
    generationConfig:{
      temperature:0.3,
      maxOutputTokens:2000
    }
  };

  const response=await fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });

  if(!response.ok){
    const err=await response.json().catch(()=>({}));
    throw new Error(err.error?.message||`API request failed with status ${response.status}`);
  }

  const data=await response.json();
  // Handle Google Generative AI response format
  if(data.candidates&&data.candidates[0]?.content?.parts){
    return data.candidates[0].content.parts.map(p=>p.text).join('')||'';
  }
  return '';
}

