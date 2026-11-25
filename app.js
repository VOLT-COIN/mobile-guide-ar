(function(){
"use strict";
var BASE="https://data-api.binance.vision",WSU="wss://data-stream.binance.vision/ws/!miniTicker@arr";
var NAMES={BTC:"Bitcoin",ETH:"Ethereum",BNB:"BNB",SOL:"Solana",XRP:"XRP",ADA:"Cardano",DOGE:"Dogecoin",TRX:"TRON",LTC:"Litecoin",AVAX:"Avalanche",DOT:"Polkadot",LINK:"Chainlink",MATIC:"Polygon",POL:"Polygon",SHIB:"Shiba Inu",TON:"Toncoin",BCH:"Bitcoin Cash",NEAR:"NEAR",UNI:"Uniswap",ATOM:"Cosmos",XLM:"Stellar",ETC:"Ethereum Classic",FIL:"Filecoin",APT:"Aptos",ARB:"Arbitrum",OP:"Optimism",SUI:"Sui",PEPE:"Pepe",AAVE:"Aave",INJ:"Injective",HBAR:"Hedera",ICP:"Internet Computer",ZEC:"Zcash",HYPE:"Hyperliquid",TAO:"Bittensor",RENDER:"Render",FET:"Fetch.ai",IMX:"Immutable",MKR:"Maker",GRT:"The Graph",ALGO:"Algorand",VET:"VeChain",SAND:"The Sandbox",MANA:"Decentraland",CRV:"Curve",LDO:"Lido DAO",RUNE:"THORChain",SEI:"Sei",TIA:"Celestia",WLD:"Worldcoin",ENA:"Ethena",JUP:"Jupiter",ONDO:"Ondo",PENDLE:"Pendle",BONK:"Bonk",WIF:"dogwifhat",FLOKI:"Floki",XMR:"Monero",EOS:"EOS",XTZ:"Tezos",THETA:"Theta",AXS:"Axie Infinity",GALA:"Gala",CAKE:"PancakeSwap",QNT:"Quant",KAS:"Kaspa",STX:"Stacks",EGLD:"MultiversX",FTM:"Fantom",S:"Sonic",PAXG:"PAX Gold",CRO:"Cronos",ENS:"ENS",COMP:"Compound",SNX:"Synthetix",DYDX:"dYdX",TRUMP:"Official Trump",WLFI:"World Liberty",PUMP:"Pump.fun"};
var STABLE={USDC:1,FDUSD:1,TUSD:1,USDP:1,DAI:1,EUR:1,AEUR:1,USDE:1,BUSD:1,XUSD:1,USD1:1};
var D={},lastTick=0,wsOk=false,ws=null,sel="BTC",range="1D",order=[],spark={},sparkAt={},prev={},filter="",lastRender=0,pending=false;
var $=function(i){return document.getElementById(i)};
function fmt(p){p=+p;if(!isFinite(p))return"—";return p>=1000?p.toLocaleString("en-US",{maximumFractionDigits:2}):p>=1?p.toFixed(3):p>=0.01?p.toFixed(4):p.toPrecision(3)}
function fv(v){v=+v;return v>=1e9?(v/1e9).toFixed(2)+"B":v>=1e6?(v/1e6).toFixed(1)+"M":(v/1e3).toFixed(0)+"K"}
function tm(d){return new Date(d).toLocaleTimeString("en-GB")}
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML}
function setStatus(c,t){$("status").className="pill "+c;$("statusText").textContent=t}
function ingest(arr){arr.forEach(function(t){var s=t.s;if(!/USDT$/.test(s))return;var b=s.slice(0,-4);if(!NAMES[b]||STABLE[b]||/(UP|DOWN|BULL|BEAR)$/.test(b))return;var o=+t.o,c=+t.c;D[b]={last:c,open:o,pct:o>0?(c-o)/o*100:0,high:+t.h,low:+t.l,vol:+t.q}});lastTick=Date.now()}
function rank(){order=Object.keys(D).sort(function(a,b){return D[b].vol-D[a].vol}).slice(0,200)}
function visible(){var q=filter.trim().toUpperCase();var l=order;if(q)l=order.filter(function(s){return s.indexOf(q)>-1||(NAMES[s]||"").toUpperCase().indexOf(q)>-1});return l.slice(0,40)}
function isStale(){return Date.now()-lastTick>15000}
function cards(){
  if(!order.length)return;var top=order.slice(0,100),up=0,dn=0,vol=0;top.forEach(function(s){D[s].pct>=0?up++:dn++;vol+=D[s].vol});
  var g=top.slice().sort(function(a,b){return D[b].pct-D[a].pct})[0];
  function c(l,v,s,cl){return '<div class="card"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s '+(cl||"")+'">'+(s||"&nbsp;")+'</div></div>'}
  function pc(s){var p=D[s].pct;return '<span class="num">'+(p>=0?"+":"")+p.toFixed(2)+"%</span>"}
  $("cards").innerHTML=c("Bitcoin",fmt(D.BTC.last)+" USDT",pc("BTC"),D.BTC.pct>=0?"up":"down")+c("Ethereum",fmt(D.ETH.last)+" USDT",pc("ETH"),D.ETH.pct>=0?"up":"down")+
   c("أعلى صعودًا بين أبرز العملات",g+" <span class='num'>"+fmt(D[g].last)+" USDT</span>",pc(g),"up")+
   c("العملات المتتبَّعة: صاعدة / هابطة","<span class='up'>"+up+"</span> / <span class='down'>"+dn+"</span>","من "+top.length+" عملة متتبَّعة على Binance (وليس السوق كله) · حجم 24 ساعة <span class=\"num\">"+fv(vol)+" USDT</span>")}
function spk(s){var a=spark[s];if(!a)return"";var mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),w=96,h=30,r=mx-mn||1;var pts=a.map(function(v,i){return(i/(a.length-1)*w).toFixed(1)+","+(h-2-(v-mn)/r*(h-4)).toFixed(1)}).join(" ");
  return '<svg class="spark" viewBox="0 0 96 30"><polyline fill="none" stroke="'+(a[a.length-1]>=a[0]?"#22c55e":"#ef4444")+'" stroke-width="1.6" points="'+pts+'"/></svg>'}
function table(){
  var l=visible();if(!l.length){$("rows").innerHTML='<tr><td colspan="8" class="empty">'+(order.length?"لا توجد عملة بهذا الاسم":"جارٍ التحميل...")+'</td></tr>';return}
  $("rows").innerHTML=l.map(function(s,i){var d=D[s],cl=d.pct>=0?"up":"down",f=prev[s]?(d.last>prev[s]?"fu":d.last<prev[s]?"fd":""):"";
    return '<tr data-s="'+s+'" class="'+(s===sel?"sel ":"")+f+'"><td>'+(i+1)+'</td><td><div class="sym"><div class="ico">'+esc(s.slice(0,3))+'</div><div><b>'+esc(s)+'</b><small>'+esc(NAMES[s]||s+"/USDT")+'</small></div></div></td><td class="n">'+fmt(d.last)+'</td><td class="n '+cl+'">'+(d.pct>=0?"+":"")+d.pct.toFixed(2)+'%</td><td class="n hm">'+fmt(d.high)+'</td><td class="n hm">'+fmt(d.low)+'</td><td class="n hm">'+fv(d.vol)+'</td><td class="hm">'+spk(s)+'</td></tr>'}).join("");
  l.forEach(function(s){prev[s]=D[s].last});
  document.querySelector("table").className=isStale()?"stalecls":"";
  sparks(l)}
function sparks(l){var need=l.filter(function(s){return !sparkAt[s]||Date.now()-sparkAt[s]>300000}).slice(0,40);var i=0;
  function next(){if(i>=need.length)return;var batch=need.slice(i,i+5);i+=5;sparkAt[batch[0]]=sparkAt[batch[0]]||0;
    Promise.all(batch.map(function(s){sparkAt[s]=Date.now();return fetch(BASE+"/api/v3/klines?symbol="+s+"USDT&interval=1h&limit=24").then(function(r){return r.json()}).then(function(k){if(Array.isArray(k))spark[s]=k.map(function(x){return+x[4]})}).catch(function(){sparkAt[s]=0})})).then(function(){table();setTimeout(next,300)})}
  if(need.length&&!sparks.busy){sparks.busy=1;setTimeout(function(){sparks.busy=0},4000);next()}}
function head(){var d=D[sel];if(!d)return;$("cName").textContent=(NAMES[sel]||sel)+" ("+sel+"/USDT)";$("cPrice").textContent=fmt(d.last)+" USDT";var e=$("cChg");e.innerHTML='<span class="num">'+(d.pct>=0?"+":"")+d.pct.toFixed(2)+'%</span> <small>خلال 24 ساعة</small>';e.className="chg "+(d.pct>=0?"up":"down")}
function render(){lastRender=Date.now();cards();table();head();drawChart()}
function schedule(){if(pending)return;pending=true;setTimeout(function(){pending=false;render()},Math.max(0,1000-(Date.now()-lastRender)))}
// chart
var CFG={"1D":["15m",96],"7D":["1h",168],"1M":["4h",180],"1Y":["1d",365]},series=[],cKey="",hover=-1;
function loadChart(){var k=sel+range;cKey=k;$("chartMsg").textContent="جارٍ تحميل الشارت...";series=[];drawChart();
  fetch(BASE+"/api/v3/klines?symbol="+sel+"USDT&interval="+CFG[range][0]+"&limit="+CFG[range][1]).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(a){if(cKey!==k)return;series=a.map(function(x){return{t:x[0],c:+x[4]}});$("chartMsg").textContent="";drawChart()}).catch(function(){if(cKey===k)$("chartMsg").textContent="تعذر تحميل الشارت الآن من المصدر. سنعيد المحاولة عند تغيير الفترة."})}
function drawChart(){var cv=$("chart"),dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;cv.width=w*dpr;cv.height=h*dpr;var x=cv.getContext("2d");x.scale(dpr,dpr);x.clearRect(0,0,w,h);
  if(series.length<2)return;var pts=series.slice();if(D[sel]&&range&&!isStale())pts[pts.length-1]={t:pts[pts.length-1].t,c:D[sel].last};
  var mn=Math.min.apply(0,pts.map(function(p){return p.c})),mx=Math.max.apply(0,pts.map(function(p){return p.c})),pad=(mx-mn)*.08||1;mn-=pad;mx+=pad;
  var L=8,R=64,T=8,B=22,cw=w-L-R,ch=h-T-B,up=pts[pts.length-1].c>=pts[0].c,col=up?"#22c55e":"#ef4444";
  function X(i){return L+i/(pts.length-1)*cw}function Y(v){return T+(1-(v-mn)/(mx-mn))*ch}
  x.font="11px system-ui";x.fillStyle="#8d99ae";x.strokeStyle="#232c3f";x.lineWidth=1;
  for(var g=0;g<=4;g++){var v=mn+(mx-mn)*g/4,y=Y(v);x.beginPath();x.moveTo(L,y);x.lineTo(w-R,y);x.stroke();x.textAlign="left";x.fillText(fmt(v),w-R+6,y+4)}
  var n=4;x.textAlign="center";for(var i=0;i<=n;i++){var idx=Math.round(i/n*(pts.length-1)),dt=new Date(pts[idx].t);x.fillText(range==="1D"?dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}),Math.min(Math.max(X(idx),24),w-R-20),h-6)}
  var gr=x.createLinearGradient(0,T,0,T+ch);gr.addColorStop(0,col+"44");gr.addColorStop(1,col+"00");
  x.beginPath();pts.forEach(function(p,i){i?x.lineTo(X(i),Y(p.c)):x.moveTo(X(i),Y(p.c))});x.lineTo(X(pts.length-1),T+ch);x.lineTo(X(0),T+ch);x.closePath();x.fillStyle=gr;x.fill();
  x.beginPath();pts.forEach(function(p,i){i?x.lineTo(X(i),Y(p.c)):x.moveTo(X(i),Y(p.c))});x.strokeStyle=col;x.lineWidth=2;x.stroke();
  if(hover>=0&&hover<pts.length){var hx=X(hover),hy=Y(pts[hover].c);x.strokeStyle="#8d99ae88";x.lineWidth=1;x.beginPath();x.moveTo(hx,T);x.lineTo(hx,T+ch);x.stroke();x.fillStyle=col;x.beginPath();x.arc(hx,hy,4,0,7);x.fill();
    var t=$("tip");t.hidden=false;t.textContent=fmt(pts[hover].c)+" USDT"+"  "+new Date(pts[hover].t).toLocaleString("en-GB",{hour12:false,day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});t.style.left=Math.min(Math.max(hx-60,4),w-R-130)+"px"}else $("tip").hidden=true;
  drawChart.pts=pts;drawChart.geo={L:L,cw:cw}}
function hv(e){var p=drawChart.pts,g=drawChart.geo;if(!p)return;var r=$("chart").getBoundingClientRect(),xx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;hover=Math.max(0,Math.min(p.length-1,Math.round((xx-g.L)/g.cw*(p.length-1))));drawChart()}
$("chart").addEventListener("mousemove",hv);$("chart").addEventListener("touchmove",hv,{passive:true});$("chart").addEventListener("mouseleave",function(){hover=-1;drawChart()});$("chart").addEventListener("touchend",function(){hover=-1;drawChart()});
window.addEventListener("resize",drawChart);
$("range").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;range=b.dataset.r;[].forEach.call(this.children,function(c){c.className=c===b?"on":""});loadChart()});
$("rows").addEventListener("click",function(e){var tr=e.target.closest("tr");if(!tr||!tr.dataset.s)return;sel=tr.dataset.s;loadChart();render();window.scrollTo({top:0,behavior:"smooth"})});
$("q").addEventListener("input",function(){filter=this.value;table()});
// data
function poll(){return fetch(BASE+"/api/v3/ticker/24hr?type=MINI").then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(a){ingest(a.map(function(t){return{s:t.symbol,o:t.openPrice,c:t.lastPrice,h:t.highPrice,l:t.lowPrice,q:t.quoteVolume}}));rank();schedule()}).catch(function(){})}
function connect(){try{ws=new WebSocket(WSU)}catch(e){return}
  ws.onopen=function(){wsOk=true};
  ws.onmessage=function(e){try{var a=JSON.parse(e.data);ingest(a);if(!order.length||Date.now()%20==0)rank();schedule()}catch(x){}};
  ws.onclose=ws.onerror=function(){wsOk=false;setTimeout(connect,5000)}}
setInterval(function(){
  if(!lastTick){setStatus("wait","جارٍ الاتصال...");return}
  var age=Date.now()-lastTick;$("lastTick").innerHTML='<span class="num">'+tm(lastTick)+'</span> (قبل '+Math.round(age/1000)+" ثانية)";
  var b=$("banner");
  if(age<15000){setStatus("live",wsOk?"مباشر: تحديث كل ثانية تقريبًا":"متصل: تحديث كل 10 ثوانٍ");b.hidden=true}
  else if(age<60000){setStatus("stale","تأخر التحديث");b.hidden=false;b.className="banner";b.textContent="تأخر وصول الأسعار من المصدر. الأرقام المعروضة قد لا تكون حديثة (آخر تحديث "+tm(lastTick)+")."}
  else{setStatus("err","انقطع الاتصال بالمصدر");b.hidden=false;b.className="banner err";b.textContent="انقطع الاتصال بمصدر الأسعار منذ أكثر من دقيقة. الأرقام المعروضة قديمة (آخر تحديث "+tm(lastTick)+") ونحاول إعادة الاتصال تلقائيًا."}
  if(age>=15000)document.querySelector("table").className="stalecls"},1000);
setInterval(function(){if(!wsOk||isStale())poll()},10000);
setInterval(function(){rank();if(order.length)table()},60000);
poll().then(function(){render();loadChart()});connect();
setTimeout(function(){if(!order.length)$("rows").innerHTML='<tr><td colspan="8" class="empty">تعذر الاتصال بمصدر الأسعار حاليًا. نعيد المحاولة تلقائيًا.</td></tr>'},12000);
// news
var FEEDS=[["Cointelegraph","https://cointelegraph.com/rss"],["CoinDesk","https://www.coindesk.com/arc/outboundfeeds/rss/"],["Decrypt","https://decrypt.co/feed"],["Bitcoin Magazine","https://bitcoinmagazine.com/.rss/full/"]];
var items=[],nf="all";
function ago(d){var m=Math.max(0,Math.round((Date.now()-d)/60000));return m<1?"الآن":m<60?"منذ "+m+" دقيقة":m<1440?"منذ "+Math.round(m/60)+" ساعة":"منذ "+Math.round(m/1440)+" يوم"}
function drawNews(){var l=items.filter(function(i){return nf==="all"||i.src===nf}).slice(0,20);
  $("chips").innerHTML=['all'].concat(FEEDS.map(function(f){return f[0]})).map(function(s){return '<button class="chip'+(s===nf?" on":"")+'" data-s="'+s+'">'+(s==="all"?"الكل":s)+'</button>'}).join("");
  $("news").innerHTML=l.map(function(i){return '<div class="item"><a href="'+esc(i.l)+'" target="_blank" rel="noopener noreferrer">'+esc(i.t)+'</a><div class="src"><span class="tag">'+i.src+'</span><span>'+ago(i.d)+'</span></div></div>'}).join("")||'<p class="empty">لا توجد أخبار حاليًا</p>'}
$("chips").addEventListener("click",function(e){var b=e.target.closest(".chip");if(b){nf=b.dataset.s;drawNews()}});
function news(){
  fetch("/api/news").then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){
    if(!j.items||!j.items.length)throw new Error("empty");
    items=j.items;drawNews();
    $("lastNews").textContent="جُلبت من المصادر "+tm(j.fetchedAt);
    var bad=j.sources.filter(function(s){return !s.ok}).map(function(s){return s.name});
    $("newsState").textContent=bad.length?"(تعذر تحميل: "+bad.join("، ")+")":"";
  }).catch(function(){
    $("newsState").innerHTML='<span class="down">تعذر تحميل الأخبار الآن.</span> <button class="retry" id="rt">إعادة المحاولة</button>';$("rt").onclick=news;
    if(!items.length)$("news").innerHTML='<p class="empty">لا توجد أخبار محمّلة بعد.</p>'})}
news();setInterval(news,120000);setInterval(function(){if(items.length)drawNews()},60000);
})();
