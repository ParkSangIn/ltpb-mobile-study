const pages=window.BRIDGE_PAGES||[],reviewPages=window.BRIDGE_REVIEW_PAGES||[];let mode="lesson",index=0,revealed=false;
const $=s=>document.querySelector(s),pageEl=$("#page"),countEl=$("#count"),back=$("#back"),next=$("#next");let textSize=19;try{textSize=Number(localStorage.getItem("bridge-study-font-size"))||19}catch{}function applyTextSize(){textSize=Math.max(15,Math.min(29,textSize));document.documentElement.style.setProperty("--font-size",textSize+"px");try{localStorage.setItem("bridge-study-font-size",textSize)}catch{}}
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function rich(s){return esc(s).replace(/♠/g,'<span class="suit black">♠</span>').replace(/♣/g,'<span class="suit black">♣</span>').replace(/♥/g,'<span class="suit red">♥</span>').replace(/♦/g,'<span class="suit red">♦</span>')}
function plain(s){return s.replace(/\r?\n/g," ").replace(/@C/g,"♣").replace(/@D/g,"♦").replace(/@H/g,"♥").replace(/@S/g,"♠").replace(/@N/g,"NT").replace(/\s+/g," ").trim()}
function title(raw){const m=raw.match(/\|qx\|[^,|]+,([^|]+)/i);return m?plain(m[1].replace(/\^\*[^\s]/g,"")):""}
function sourceSegments(raw,active=false){
  const tags=[...raw.matchAll(/\|(at|nt)\|/gi)],source=[],out=[];
  for(const tag of tags){
    const before=raw.slice(0,tag.index);
    const after=tag.index+tag[0].length,next=raw.slice(after).search(/\|[a-z]{1,2}\|/i),text=next<0?raw.slice(after):raw.slice(after,after+next);
    const last=pattern=>{const all=[...before.matchAll(pattern)];return all.length?all[all.length-1][1]:""};
    source.push({raw:text,cs:last(/\|cs\|(\d+)/gi),ht:last(/\|ht\|([^|\r\n]+)/gi),hf:last(/\|hf\|([^|\r\n]+)/gi)});
  }
  const add=(meta,text,highlight)=>{if(plain(text).length>3)out.push({...meta,raw:text,highlight})};
  for(const meta of source){
    let text=meta.raw,pos=0;
    // A continued callout must begin with {. Otherwise an omitted closing marker ends it.
    if(active&&!/^\s*\{/.test(text))active=false;
    while(pos<text.length){
      if(active){
        const close=text.indexOf("^-",pos);
        if(close<0){add(meta,text.slice(pos),true);pos=text.length}
        else{add(meta,text.slice(pos,close),true);active=false;pos=close+2}
      }else{
        const start=text.indexOf("^-{",pos);
        if(start<0){add(meta,text.slice(pos),false);pos=text.length}
        else{add(meta,text.slice(pos,start),false);active=true;pos=start+3}
      }
    }
  }
  return {segments:out,active};
}
function decoratePages(list){let active=false;return list.map(page=>{const parsed=sourceSegments(page.raw,active);active=parsed.active;return {...page,segments:parsed.segments}})}
function inline(raw,highlight=false){let s=plain(raw).replace(/\^-\{/g,"").replace(/\^-/g,"").replace(/\^[A-Z]\{/g,"").replace(/[{}]/g,"");s=s.replace(/\^\*B/g,"\uE001").replace(/\^\*I/g,"\uE002").replace(/\^\*U/g,"\uE003").replace(/\^\*H/g,"\uE004").replace(/\^\*N/g,"\uE005");let html=rich(s).replace(/\uE001/g,'<strong>').replace(/\uE002/g,'<em>').replace(/\uE003/g,'<u>').replace(/\uE004/g,'<span class="linkish">').replace(/\uE005/g,'</strong></em></u></span>');return {highlight,html}}
function bidValue(token){if(token==="p")return"Pass";if(token==="?")return"?";const m=token.match(/^([1-7])([cdhsn])$/i);if(!m)return rich(token);const suit=m[2].toLowerCase();if(suit==="n")return m[1]+"NT";const glyph={c:"♣",d:"♦",h:"♥",s:"♠"}[suit],color=(suit==="h"||suit==="d")?"red":"black";return m[1]+"<span class=\"auction-suit "+color+"\">"+glyph+"</span>"}
function auction(raw){const start=Math.min(3,(raw.match(/^\s*/)||[""])[0].length),tokens=[...raw.matchAll(/([1-7][cdhsn]|p|\?)/gi)].map(m=>m[1].toLowerCase());if(!tokens.length)return"";const cells=Array(start).fill("").concat(tokens);while(cells.length%4)cells.push("");const rows=[];for(let i=0;i<cells.length;i+=4)rows.push('<div class="auction-row">'+cells.slice(i,i+4).map(x=>'<span>'+bidValue(x)+'</span>').join("")+'</div>');return '<div class="auction"><div class="auction-head"><span>West</span><span>North</span><span>East</span><span>South</span></div>'+rows.join("")+'</div>'}
function diagrams(raw){return [...raw.matchAll(/\|ia\|([^|]+)/gi)].map(m=>auction(m[1])).filter(Boolean).join("")}
function hands(raw){return [...raw.matchAll(/\|ih\|([^|]+)/gi)].map(m=>m[1].trim()).map(code=>{let x=code.replace(/^p/i,"");if(/^ss/i.test(x))x=x.slice(1);const held={s:"",h:"",d:"",c:""};for(const m of x.matchAll(/([shdc])([akqjt2-9]+)/gi))held[m[1].toLowerCase()]=m[2].toUpperCase();const rows=[["s","♠","black"],["h","♥","red"],["d","♦","red"],["c","♣","black"]].filter(r=>held[r[0]]).map(r=>'<div class="'+r[2]+'"><span>'+r[1]+'</span> '+held[r[0]].split("").join(" ")+'</div>').join("");return rows?'<div class="hand">'+rows+'</div>':""}).join("")}
function isCheck(raw){return /\|ia\|[^|]*\?/i.test(raw)}
function body(item,answer=false){const heading=title(item.raw),segments=item.segments||sourceSegments(item.raw,false).segments;let out=heading?'<h2>'+rich(heading)+'</h2>':"";out+=segments.length?segments.map(x=>{const p=inline(x.raw,x.highlight),tag=p.highlight?'aside':'p',classes=[p.highlight?'callout':'','cs-'+(x.cs||'0'),'ht-'+(x.ht||'default'),'hf-'+(x.hf||'default')].filter(Boolean).join(' ');return '<'+tag+' class="'+classes+'">'+p.html+'</'+tag+'>'}).join(""):'<p class="empty">This screen contains a visual or interaction state in the original program.</p>';out+=diagrams(item.raw)+hands(item.raw);if(isCheck(item.raw)&&!answer)out+='<div class="selfcheck">Self-check prompt in the original lesson — think before moving on.</div>';return out}
const styledPages=decoratePages(pages),styledReviewPages=decoratePages(reviewPages);
const checks=styledPages.map((p,i)=>({prompt:p,answer:styledPages[i+1]})).filter(x=>x.answer&&isCheck(x.prompt.raw));
function reviewQuestion(page){
  const auctions=[...page.raw.matchAll(/\|ia\|([^|]+)/gi)],answerAuction=auctions.find((m,i)=>i>0&&!/\?/.test(m[1]));
  if(!answerAuction)return null;
  const labelMatch=page.raw.match(/\|lb\|([^|]+)/i),label=labelMatch?plain(labelMatch[1].replace(/\*B/g,"").replace(/\^\^[^|\s]*/g,"")):"What would you respond?";
  const promptRaw=page.raw.slice(0,answerAuction.index),answerRaw=page.raw.slice(answerAuction.index);
  return {prompt:{...page,raw:promptRaw,segments:sourceSegments(promptRaw,false).segments},answer:{...page,raw:answerRaw,segments:sourceSegments(answerRaw,false).segments},label};
}
const reviewChecks=styledReviewPages.map(reviewQuestion).filter(Boolean);
function draw(){
  if(mode==="lesson"){
    countEl.textContent=styledPages.length+" original lesson screens · scroll";
    pageEl.className="chapter";
    pageEl.innerHTML="<h2>Responding to a 1 of a suit opening</h2>"+styledPages.map(p=>'<section class="source-screen">'+body(p)+'</section>').join("");
    $(".nav").hidden=true;
    return;
  }
  const isReview=mode==="review",collection=isReview?reviewChecks:checks,item=collection[index];
  pageEl.className="";
  $(".nav").hidden=false;
  if(!item){pageEl.innerHTML='<p class="empty">No extractable prompts found.</p>';return}
  countEl.textContent=(index+1)+" / "+collection.length;
  let out="<h2>"+(isReview?"Review exercises":"Lesson quizzes")+"</h2>";
  if(isReview&&item.label)out+='<div class="selfcheck">'+rich(item.label)+'</div>';
  out+=body(item.prompt,isReview);
  if(!revealed)out+='<button class="reveal" id="reveal">Reveal answer</button>';
  else out+='<section class="answer"><p class="page-label">Original answer and explanation</p>'+body(item.answer,true)+'</section>';
  pageEl.innerHTML=out;
  $("#reveal")?.addEventListener("click",()=>{revealed=true;draw()});
  back.disabled=index===0;
  next.disabled=index===collection.length-1&&revealed;
  next.textContent=!revealed?"Reveal answer":"Next →";
}
back.onclick=()=>{if(index){index--;revealed=false;draw()}};
next.onclick=()=>{if(!revealed){revealed=true;draw();return}const collection=mode==="review"?reviewChecks:checks;if(index<collection.length-1){index++;revealed=false;draw()}};
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;index=0;revealed=false;document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("on",x===b));window.scrollTo(0,0);draw()}));
$("#font-down").addEventListener("click",()=>{textSize-=2;applyTextSize()});$("#font-up").addEventListener("click",()=>{textSize+=2;applyTextSize()});$("#font-reset").addEventListener("click",()=>{textSize=19;applyTextSize()});applyTextSize();document.addEventListener("keydown",e=>{if(e.altKey||e.ctrlKey||e.metaKey||["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;if(mode==="lesson"&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();window.scrollBy({top:(e.key==="ArrowRight"?1:-1)*Math.round(innerHeight*.72),behavior:"smooth"});return}if(e.key==="ArrowLeft"){e.preventDefault();back.click()}if(e.key==="ArrowRight"){e.preventDefault();next.click()}});
draw();