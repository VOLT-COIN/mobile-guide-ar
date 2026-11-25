(function(){
"use strict";
var BASE="https://data-api.binance.vision",WSU="wss://data-stream.binance.vision/ws/!miniTicker@arr";
var NAMES={BTC:"Bitcoin",ETH:"Ethereum",BNB:"BNB",SOL:"Solana",XRP:"XRP",ADA:"Cardano",DOGE:"Dogecoin",TRX:"TRON",LTC:"Litecoin",AVAX:"Avalanche",DOT:"Polkadot",LINK:"Chainlink",MATIC:"Polygon",POL:"Polygon",SHIB:"Shiba Inu",TON:"Toncoin",BCH:"Bitcoin Cash",NEAR:"NEAR",UNI:"Uniswap",ATOM:"Cosmos",XLM:"Stellar",ETC:"Ethereum Classic",FIL:"Filecoin",APT:"Aptos",ARB:"Arbitrum",OP:"Optimism",SUI:"Sui",PEPE:"Pepe",AAVE:"Aave",INJ:"Injective",HBAR:"Hedera",ICP:"Internet Computer",ZEC:"Zcash",HYPE:"Hyperliquid",TAO:"Bittensor",RENDER:"Render",FET:"Fetch.ai",IMX:"Immutable",MKR:"Maker",GRT:"The Graph",ALGO:"Algorand",VET:"VeChain",SAND:"The Sandbox",MANA:"Decentraland",CRV:"Curve",LDO:"Lido DAO",RUNE:"THORChain",SEI:"Sei",TIA:"Celestia",WLD:"Worldcoin",ENA:"Ethena",JUP:"Jupiter",ONDO:"Ondo",PENDLE:"Pendle",BONK:"Bonk",WIF:"dogwifhat",FLOKI:"Floki",XMR:"Monero",EOS:"EOS",XTZ:"Tezos",THETA:"Theta",AXS:"Axie Infinity",GALA:"Gala",CAKE:"PancakeSwap",QNT:"Quant",KAS:"Kaspa",STX:"Stacks",EGLD:"MultiversX",FTM:"Fantom",S:"Sonic",PAXG:"PAX Gold",CRO:"Cronos",ENS:"ENS",COMP:"Compound",SNX:"Synthetix",DYDX:"dYdX",TRUMP:"Official Trump",WLFI:"World Liberty",PUMP:"Pump.fun"};
var STABLE={USDC:1,FDUSD:1,TUSD:1,USDP:1,DAI:1,EUR:1,AEUR:1,USDE:1,BUSD:1,XUSD:1,USD1:1};
var D={},lastTick=0,wsOk=false,ws=null,order=[],spark={},sparkAt={},p7={},prev={},lastRender=0,pending=false;
var sel="BTC",range="1D",ctype="line",tab="all",sortK="vol",sortD=-1,shown=40,qtxt="",route="home";
var FAV=[];try{FAV=JSON.parse(localStorage.getItem("nabd_fav")||"[]")}catch(e){}
var $=function(i){return document.getElementById(i)};
function fmt(p){p=+p;if(!isFinite(p))return"—";return p>=1000?p.toLocaleString("en-US",{maximumFractionDigits:2}):p>=1?p.toFixed(3):p>=0.01?p.toFixed(4):p.toPrecision(3)}
function fv(v){v=+v;if(!isFinite(v))return"—";return v>=1e9?(v/1e9).toFixed(2)+"B":v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?(v/1e3).toFixed(0)+"K":v.toFixed(0)}
function pc(p){return isFinite(p)?(p>=0?"+":"")+p.toFixed(2)+"%":"—"}
function tm(d){return new Date(d).toLocaleTimeString("en-GB")}
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML}
function icoCol(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return"linear-gradient(135deg,hsl("+h+",65%,48%),hsl("+((h+40)%360)+",65%,38%))"}
var HASICO={BTC:1,ETH:1,BNB:1,SOL:1,XRP:1,ADA:1,DOGE:1,TRX:1,LTC:1,AVAX:1,DOT:1,LINK:1,BCH:1,UNI:1,ATOM:1,XLM:1,ETC:1,FIL:1,AAVE:1,ICP:1,ZEC:1,GRT:1,ALGO:1,VET:1,SAND:1,MANA:1,CRV:1,XTZ:1,THETA:1,QNT:1,STX:1,PAXG:1,COMP:1,SNX:1};
function ico(s){if(HASICO[s])return'<div class="ico has"><svg viewBox="0 0 32 32" aria-hidden="true"><use href="/icons.svg#'+s+'"/></svg></div>';return'<div class="ico" style="background:'+icoCol(s)+'">'+esc(s.slice(0,4))+"</div>"}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function setStatus(c,t){$("status").className="pill "+c;$("statusText").textContent=t}
function isFav(s){return FAV.indexOf(s)>-1}
function toggleFav(s){var i=FAV.indexOf(s);i>-1?FAV.splice(i,1):FAV.push(s);try{localStorage.setItem("nabd_fav",JSON.stringify(FAV))}catch(e){}render()}
function ingest(arr){arr.forEach(function(t){var s=t.s;if(!/USDT$/.test(s))return;var b=s.slice(0,-4);if(!NAMES[b]||STABLE[b]||/(UP|DOWN|BULL|BEAR)$/.test(b))return;var o=+t.o,c=+t.c;D[b]={last:c,open:o,pct:o>0?(c-o)/o*100:0,high:+t.h,low:+t.l,vol:+t.q}});lastTick=Date.now()}
function rank(){order=Object.keys(D).sort(function(a,b){return D[b].vol-D[a].vol}).slice(0,200)}
function rk(s){return order.indexOf(s)+1}
// ---------- home
function cards(){
  if(!order.length)return;var up=0,dn=0,vol=0;order.forEach(function(s){D[s].pct>=0?up++:dn++;vol+=D[s].vol});
  var srt=order.slice().sort(function(a,b){return D[b].pct-D[a].pct}),gn=srt.slice(0,3),ls=srt.slice(-3).reverse();
  $("stats").innerHTML='<span>العملات المتتبَّعة: <b class="num">'+order.length+'</b></span><span>حجم 24 ساعة (المتتبَّعة): <b class="num">'+fv(vol)+' USDT</b></span><span>حصة BTC من هذا الحجم: <b class="num">'+(D.BTC?(D.BTC.vol/vol*100).toFixed(1):"—")+'%</b></span><span>صاعدة: <b class="up num">'+up+'</b></span><span>هابطة: <b class="down num">'+dn+'</b></span>';
  function c(s,l,v,sub,cl){return'<div class="card click" data-go="'+s+'"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s '+cl+'"><span class="num">'+sub+"</span></div></div>"}
  function list(t,a){return'<div class="card"><div class="l">'+t+'</div><ul class="mini">'+a.map(function(s){return'<li data-go="'+s+'"><span>'+s+'</span><span class="num '+(D[s].pct>=0?"up":"down")+'">'+fmt(D[s].last)+" · "+pc(D[s].pct)+"</span></li>"}).join("")+"</ul></div>"}
  heat();$("cards").innerHTML=(D.BTC?c("BTC","Bitcoin",fmt(D.BTC.last)+" USDT",pc(D.BTC.pct),D.BTC.pct>=0?"up":"down"):"")+(D.ETH?c("ETH","Ethereum",fmt(D.ETH.last)+" USDT",pc(D.ETH.pct),D.ETH.pct>=0?"up":"down"):"")+list("أعلى صعودًا (من المتتبَّعة)",gn)+list("أكثر هبوطًا (من المتتبَّعة)",ls)}
function listFor(){var q=qtxt.trim().toUpperCase();var l=order.slice();
  if(q)l=l.filter(function(s){return s.indexOf(q)>-1||(NAMES[s]||"").toUpperCase().indexOf(q)>-1});
  if(tab==="gain")l=l.filter(function(s){return D[s].pct>0});if(tab==="lose")l=l.filter(function(s){return D[s].pct<0});if(tab==="fav")l=l.filter(isFav);
  var k=sortK;l.sort(function(a,b){var x,y;if(k==="name"){return sortD*(NAMES[a]||a).localeCompare(NAMES[b]||b)}
    if(k==="p7"){x=p7[a];y=p7[b];if(x==null)return 1;if(y==null)return-1}else{x=D[a][k];y=D[b][k]}return sortD*(x-y)});return l}
function spk(s){var a=spark[s];if(!a)return"";var mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),w=110,h=32,r=mx-mn||1;var pts=a.map(function(v,i){return(i/(a.length-1)*w).toFixed(1)+","+(h-2-(v-mn)/r*(h-4)).toFixed(1)}).join(" ");
  return'<svg class="spark" viewBox="0 0 110 32"><polyline fill="none" stroke="'+(a[a.length-1]>=a[0]?"#16c784":"#ea3943")+'" stroke-width="1.7" stroke-linejoin="round" points="'+pts+'"/></svg>'}
function isStale(){return Date.now()-lastTick>15000}
function table(){
  var l=listFor(),tot=l.length,vis=l.slice(0,shown);
  [].forEach.call(document.querySelectorAll("th.s"),function(th){th.classList.toggle("on",th.dataset.k===sortK);var t=th.textContent.replace(/ [▲▼]$/,"");th.textContent=t+(th.dataset.k===sortK?(sortD<0?" ▼":" ▲"):"")});
  if(!vis.length){$("rows").innerHTML='<tr><td colspan="11" class="empty">'+(!order.length?"جارٍ التحميل...":tab==="fav"&&!FAV.length?"لم تضف عملات للمفضلة بعد. اضغط ☆ بجانب أي عملة.":"لا توجد عملة مطابقة")+"</td></tr>";$("more").hidden=true;$("count").textContent="";return}
  $("rows").innerHTML=vis.map(function(s){var d=D[s],cl=d.pct>=0?"up":"down",f=prev[s]?(d.last>prev[s]?"fu":d.last<prev[s]?"fd":""):"",w=p7[s];
    return'<tr data-s="'+s+'" class="'+f+'"><td><button class="star'+(isFav(s)?" on":"")+'" data-star="'+s+'" aria-label="مفضلة '+s+'">'+(isFav(s)?"★":"☆")+'</button></td><td class="hm">'+rk(s)+'</td><td><a class="sym" href="/coin/'+s+'">'+ico(s)+'<div><b>'+esc(s)+"</b><small>"+esc(NAMES[s]||s)+'</small></div></a></td><td class="n">'+fmt(d.last)+'</td><td class="n '+cl+'">'+pc(d.pct)+'</td><td class="n hm '+(w==null?"":w>=0?"up":"down")+'">'+(w==null?"—":pc(w))+'</td><td class="n hm">'+fmt(d.high)+'</td><td class="n hm">'+fmt(d.low)+'</td><td class="n hm">'+fv(d.vol)+'</td><td class="hm">'+spk(s)+'</td><td class="hm"><button class="btn" data-open="'+s+'">تفاصيل</button></td></tr>'}).join("");
  l.forEach(function(s){prev[s]=D[s].last});
  $("more").hidden=tot<=shown;$("more").textContent="عرض المزيد ("+(tot-shown>0?tot-shown:0)+" عملة)";$("count").textContent="يعرض "+Math.min(shown,tot)+" من "+tot;
  document.querySelector("table").className=isStale()?"stalecls":"";
  sparks(vis)}
function sparks(l){var need=l.filter(function(s){return !sparkAt[s]||Date.now()-sparkAt[s]>300000}).slice(0,80);var i=0;
  function next(){if(i>=need.length)return;var batch=need.slice(i,i+5);i+=5;
    Promise.all(batch.map(function(s){sparkAt[s]=Date.now();return fetch(BASE+"/api/v3/klines?symbol="+s+"USDT&interval=1h&limit=168").then(function(r){return r.json()}).then(function(k){if(Array.isArray(k)&&k.length>2){var c=k.map(function(x){return+x[4]});spark[s]=c.filter(function(v,j){return j%3===0||j===c.length-1});p7[s]=(c[c.length-1]-c[0])/c[0]*100}}).catch(function(){sparkAt[s]=0})})).then(function(){if(route==="home")table();setTimeout(next,300)})}
  if(need.length&&!sparks.busy){sparks.busy=1;setTimeout(function(){sparks.busy=0},4000);next()}}
// ---------- detail
var RG={"1D":["15m",96,"24 ساعة"],"7D":["1h",168,"7 أيام"],"1M":["4h",180,"30 يومًا"],"3M":["1d",90,"3 شهور"],"1Y":["1d",365,"سنة"]},series=[],cKey="",hover=-1,tick24={},tickAt=0;
function legacyHash(){var m=/^#\/coin\/([A-Z0-9]+)$/.exec(location.hash);if(m&&NAMES[m[1]])history.replaceState(null,"","/coin/"+m[1]);else if(location.hash==="#/tools")history.replaceState(null,"","/tools");else if(location.hash==="#/")history.replaceState(null,"","/")}
function setMeta(){var t,d,u;
  if(route==="coin"){t=NAMES[sel]+" ("+sel+") السعر المباشر مقابل USDT | نبض الكريبتو";d="سعر "+NAMES[sel]+" ("+sel+") مقابل USDT على Binance مع شارت وإحصاءات 24 ساعة وأخبار. المعلومات للاطلاع فقط وليست نصيحة استثمارية.";u="/coin/"+sel}
  else if(route==="tools"){t="أدوات: محوّل العملات الرقمية وحاسبة المحفظة | نبض الكريبتو";d="محوّل بين العملات الرقمية و USDT وحاسبة محفظة محلية تُحفظ في متصفحك فقط. أداة حساب للمعلومات وليست نصيحة استثمارية.";u="/tools"}
  else{t="نبض الكريبتو | أسعار العملات الرقمية وأخبارها";d="أسعار مباشرة لأشهر العملات الرقمية من Binance مع شارتات وتفاصيل لكل عملة وبحث وأخبار من مصادر معروفة، ووقت آخر تحديث ظاهر.";u="/"}
  document.title=t;document.querySelector('meta[name="description"]').content=d;document.querySelector('link[rel="canonical"]').href="https://nabd-crypto.pages.dev"+u;
  document.querySelector('meta[property="og:title"]').content=t;document.querySelector('meta[property="og:description"]').content=d;document.querySelector('meta[property="og:url"]').content="https://nabd-crypto.pages.dev"+u}
function curPath(){var m=/^\/coin\/([A-Za-z0-9]+)\/?$/.exec(location.pathname);if(m)return["coin",m[1].toUpperCase()];if(/^\/tools\/?$/.test(location.pathname))return["tools"];return["home"]}
function go(p){if(location.pathname===p)return showRoute();history.pushState(null,"",p);showRoute()}
function showRoute(){legacyHash();var cp=curPath(),m=cp[0]==="coin"?[0,cp[1]]:null;
  if(m&&NAMES[m[1]]){route="coin";sel=m[1];$("home").className="home hide";$("det").className="det show";$("tools").className="det";window.scrollTo(0,0);loadChart();loadTick();render();coinNews()}
  else if(cp[0]==="tools"){route="tools";$("home").className="home hide";$("det").className="det";$("tools").className="det show";window.scrollTo(0,0);render()}
  else{route="home";$("home").className="home";$("det").className="det";$("tools").className="det";render();table()}
  setMeta();$("coinlinks").hidden=route!=="home";$("navMarket").className=route==="home"&&tab!=="fav"?"on":"";$("navFav").className=route==="home"&&tab==="fav"?"on":"";$("navTools").className=route==="tools"?"on":""}
function openCoin(s){go("/coin/"+s)}
function loadTick(){var s=sel;fetch(BASE+"/api/v3/ticker/24hr?symbol="+s+"USDT").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){if(s===sel){tick24=j;tickAt=Date.now();stats()}}).catch(function(){tick24={};stats()})}
function head(){var d=D[sel];if(!d)return;$("dName").textContent=NAMES[sel]||sel;$("dSub").textContent=sel+"/USDT · المرتبة "+rk(sel)+" بحجم التداول";$("crumbName").textContent=NAMES[sel]||sel;$("nName").textContent=NAMES[sel]||sel;
  if(HASICO[sel]){$("dIco").className="ico has";$("dIco").innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><use href="/icons.svg#'+sel+'"/></svg>'}else{$("dIco").className="ico";$("dIco").textContent=sel.slice(0,4);$("dIco").style.background=icoCol(sel)}$("dIntro").textContent=NAMES[sel]?"صفحة "+NAMES[sel]+" ("+sel+"): السعر مقابل USDT على Binance مع شارت وإحصاءات 24 ساعة وأخبار. الأرقام تُحمَّل مباشرة في الصفحة، وللمعلومات فقط وليست نصيحة استثمارية. أُنشئ الموقع بمساعدة الذكاء الاصطناعي.":"";$("dPrice").textContent=fmt(d.last)+" USDT";var e=$("dChg");e.innerHTML='<span class="num">'+pc(d.pct)+'</span> <small>24 ساعة</small>';e.className="chg "+(d.pct>=0?"up":"down");
  var f=$("dFav");f.className="btn fav"+(isFav(sel)?" on":"");f.textContent=isFav(sel)?"★ في المفضلة":"☆ أضف للمفضلة"}
function stats(){var d=D[sel];if(!d)return;var t=tick24&&tick24.symbol===sel+"USDT"?tick24:null;var rs=series.length>1?series:null;
  function c(l,v,cl){return'<div class="card"><div class="l">'+l+'</div><div class="v '+(cl||"")+'">'+v+"</div></div>"}
  var a=[c("سعر الافتتاح (24س)",fmt(d.open)+" USDT"),c("أعلى 24 ساعة",fmt(d.high)+" USDT"),c("أدنى 24 ساعة",fmt(d.low)+" USDT"),c("حجم 24س (USDT)",fv(d.vol)+" USDT"),
   c("حجم 24س ("+sel+")",t?fv(+t.volume)+" "+sel:'<span class="na">—</span>'),c("متوسط السعر المرجَّح",t?fmt(t.weightedAvgPrice)+" USDT":'<span class="na">—</span>'),c("عدد الصفقات (24س)",t?(+t.count).toLocaleString("en-US"):'<span class="na">—</span>'),c("المرتبة بحجم التداول","#"+rk(sel))];
  if(rs){var hi=Math.max.apply(0,rs.map(function(x){return x.h})),lo=Math.min.apply(0,rs.map(function(x){return x.l})),ch=(rs[rs.length-1].c-rs[0].o)/rs[0].o*100;
    a.push(c("أعلى سعر في الفترة",fmt(hi)+" USDT"),c("أدنى سعر في الفترة",fmt(lo)+" USDT"),c("تغيّر الفترة",pc(ch),ch>=0?"up":"down"),c("عدد الشموع",rs.length))}
  $("sgrid").innerHTML=a.join("");$("rangeLbl").textContent="(الفترة المختارة: "+RG[range][2]+")"}
function loadChart(){var k=sel+range;cKey=k;$("chartMsg").textContent="جارٍ تحميل الشارت...";series=[];drawChart();
  fetch(BASE+"/api/v3/klines?symbol="+sel+"USDT&interval="+RG[range][0]+"&limit="+RG[range][1]).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(a){if(cKey!==k)return;series=a.map(function(x){return{t:x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4],v:+x[5]}});$("chartMsg").textContent="";drawChart();stats()}).catch(function(){if(cKey===k)$("chartMsg").textContent="تعذر تحميل الشارت الآن من المصدر. جرّب تغيير الفترة."})}
function drawChart(){var cv=$("chart"),dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;cv.width=w*dpr;cv.height=h*dpr;var x=cv.getContext("2d");x.scale(dpr,dpr);x.clearRect(0,0,w,h);
  if(series.length<2)return;var pts=series.map(function(p){return{t:p.t,o:p.o,h:p.h,l:p.l,c:p.c,v:p.v}});
  if(D[sel]&&!isStale()){var q=pts[pts.length-1];q.c=D[sel].last;q.h=Math.max(q.h,q.c);q.l=Math.min(q.l,q.c)}
  var mn=Math.min.apply(0,pts.map(function(p){return p.l})),mx=Math.max.apply(0,pts.map(function(p){return p.h})),pad=(mx-mn)*.06||1;mn-=pad;mx+=pad;
  var L=8,R=68,T=10,B=24,VH=ctype==="candle"||true?46:0,cw=w-L-R,ch=h-T-B-VH,up=pts[pts.length-1].c>=pts[0].o,col=up?css("--g"):css("--r"),gcol=css("--grid"),mc=css("--m"),n=pts.length;
  function X(i){return L+(i+.5)/n*cw}function Y(v){return T+(1-(v-mn)/(mx-mn))*ch}
  x.font="11px system-ui";x.fillStyle=mc;x.strokeStyle=gcol;x.lineWidth=1;
  for(var g=0;g<=4;g++){var v=mn+(mx-mn)*g/4,y=Y(v);x.beginPath();x.moveTo(L,y);x.lineTo(w-R,y);x.stroke();x.textAlign="left";x.fillText(fmt(v),w-R+6,y+4)}
  x.textAlign="center";for(var i=0;i<=4;i++){var idx=Math.round(i/4*(n-1)),dt=new Date(pts[idx].t);x.fillText(range==="1D"?dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}),Math.min(Math.max(X(idx),24),w-R-20),h-6)}
  var vm=Math.max.apply(0,pts.map(function(p){return p.v}))||1,bw=Math.max(1,cw/n*.7);
  pts.forEach(function(p,i){var hh=p.v/vm*(VH-6);x.fillStyle=(p.c>=p.o?css("--g"):css("--r"))+"55";x.fillRect(X(i)-bw/2,h-B-hh,bw,hh)});
  if(ctype==="candle"){pts.forEach(function(p,i){var c=p.c>=p.o?css("--g"):css("--r");x.strokeStyle=c;x.fillStyle=c;x.lineWidth=1;x.beginPath();x.moveTo(X(i),Y(p.h));x.lineTo(X(i),Y(p.l));x.stroke();var y1=Y(Math.max(p.o,p.c)),y2=Y(Math.min(p.o,p.c));x.fillRect(X(i)-bw/2,y1,bw,Math.max(1,y2-y1))})}
  else{var gr=x.createLinearGradient(0,T,0,T+ch);gr.addColorStop(0,col+"44");gr.addColorStop(1,col+"00");
    x.beginPath();pts.forEach(function(p,i){i?x.lineTo(X(i),Y(p.c)):x.moveTo(X(i),Y(p.c))});x.lineTo(X(n-1),T+ch);x.lineTo(X(0),T+ch);x.closePath();x.fillStyle=gr;x.fill();
    x.beginPath();pts.forEach(function(p,i){i?x.lineTo(X(i),Y(p.c)):x.moveTo(X(i),Y(p.c))});x.strokeStyle=col;x.lineWidth=2;x.lineJoin="round";x.stroke()}
  if(hover>=0&&hover<n){var hx=X(hover),p=pts[hover];x.strokeStyle=mc+"99";x.lineWidth=1;x.setLineDash([4,4]);x.beginPath();x.moveTo(hx,T);x.lineTo(hx,T+ch);x.stroke();x.setLineDash([]);
    var t=$("tip");t.hidden=false;t.innerHTML=new Date(p.t).toLocaleString("en-GB",{hour12:false,day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})+"<br>O "+fmt(p.o)+" H "+fmt(p.h)+"<br>L "+fmt(p.l)+" C "+fmt(p.c)+"<br>Vol "+fv(p.v);t.style.left=Math.min(Math.max(hx-60,4),w-R-130)+"px"}else $("tip").hidden=true;
  drawChart.n=n;drawChart.geo={L:L,cw:cw}}
function hv(e){var g=drawChart.geo;if(!g)return;var r=$("chart").getBoundingClientRect(),xx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;hover=Math.max(0,Math.min(drawChart.n-1,Math.floor((xx-g.L)/g.cw*drawChart.n)));drawChart()}
var cvs=$("chart");cvs.addEventListener("mousemove",hv);cvs.addEventListener("touchstart",hv,{passive:true});cvs.addEventListener("touchmove",hv,{passive:true});cvs.addEventListener("mouseleave",function(){hover=-1;drawChart()});cvs.addEventListener("touchend",function(){hover=-1;drawChart()});

// ---------- heatmap + tools
function heat(){var l=order.slice(0,40);$("heat").innerHTML=l.map(function(s){var d=D[s],a=Math.min(1,Math.abs(d.pct)/8),col=d.pct>=0?"22,199,132":"234,57,67";return'<div class="tile" data-go="'+s+'" style="background:rgba('+col+','+(0.16+a*0.55).toFixed(2)+')"><b>'+s+'</b><span class="num">'+pc(d.pct)+"</span></div>"}).join("")}
$("heat").addEventListener("click",function(e){var g=e.target.closest("[data-go]");if(g)openCoin(g.dataset.go)});
var LOTS=[];try{LOTS=JSON.parse(localStorage.getItem("nabd_lots")||"[]")}catch(e){}
LOTS=(Array.isArray(LOTS)?LOTS:[]).filter(function(l){return l&&typeof l.s==="string"&&isFinite(l.a)&&l.a>0&&(l.p==null||(isFinite(l.p)&&l.p>=0))});
function saveLots(){try{localStorage.setItem("nabd_lots",JSON.stringify(LOTS))}catch(e){}}
function px(x){return x==="USDT"?1:D[x]?D[x].last:NaN}
function opts(withUsdt){return(withUsdt?['<option value="USDT">USDT</option>']:[]).concat(order.map(function(s){return'<option value="'+s+'">'+s+" · "+esc(NAMES[s]||s)+"</option>"})).join("")}
function fillSel(){if(!order.length||$("cFrom").options.length)return;$("cFrom").innerHTML=opts(1);$("cTo").innerHTML=opts(1);$("pCoin").innerHTML=opts(0);$("cFrom").value="BTC";$("cTo").value="USDT"}
function num(v){v=parseFloat(v);return isFinite(v)?v:NaN}
function toolsRender(){fillSel();if(!order.length){$("cRes").textContent="جارٍ تحميل الأسعار...";return}
  var a=num($("cAmt").value),f=$("cFrom").value,t=$("cTo").value,r=a*px(f)/px(t);
  $("cRes").textContent=isFinite(r)&&isFinite(a)&&a>=0&&!isStale()?a.toLocaleString("en-US",{maximumFractionDigits:8})+" "+f+" = "+r.toLocaleString("en-US",{maximumFractionDigits:r<1?8:4})+" "+t:(isStale()&&isFinite(r)?"الأسعار متأخرة أو منقطعة، لا يمكن عرض تحويل حديث":"أدخل مبلغًا صحيحًا");
  var stale=isStale(),tb=$("tStale");tb.hidden=!stale;if(stale)tb.textContent="الأسعار متأخرة أو منقطعة (آخر تحديث "+(lastTick?tm(lastTick):"لم يصل بعد")+"). القيم أدناه قديمة وليست حالية.";
  var tv=0,tc=0,tp=0,tq=0,miss=0,nocost=0,hasPl=false;
  $("pRows").innerHTML=LOTS.length?LOTS.map(function(l,i){var p=px(l.s),ok=isFinite(p),v=ok?l.a*p:NaN,pl=(l.p!=null&&ok)?v-l.a*l.p:null;if(ok)tv+=v;else miss++;if(l.p==null)nocost++;if(pl!=null){hasPl=true;tp+=pl;if(l.p>0){tc+=l.a*l.p;tq+=pl}}
    var pct=pl==null?"":(l.a*l.p>0?" ("+pc(pl/(l.a*l.p)*100)+")":" (النسبة غير محسوبة: تكلفة صفر)");
    var plTxt=pl==null?(l.p==null?"— (بدون سعر شراء)":"— (السعر غير متاح)"):fmt(pl)+" USDT"+pct;
    return'<div class="pcard'+(stale?" stalecls":"")+'"><div class="ph2">'+ico(l.s)+'<b>'+esc(l.s)+'</b> <small class="meta">'+esc(NAMES[l.s]||"")+'</small><button class="btn del" data-del="'+i+'">حذف</button></div><dl><div><dt>الكمية</dt><dd class="num">'+l.a+'</dd></div><div><dt>سعر الشراء</dt><dd class="num">'+(l.p!=null?fmt(l.p):"—")+'</dd></div><div><dt>السعر الحالي'+(stale?" (قديم)":"")+'</dt><dd class="num">'+(ok?fmt(p):"غير متاح")+'</dd></div><div><dt>القيمة (USDT)</dt><dd class="num">'+(ok?fmt(v):"—")+'</dd></div></dl><div class="plrow">الربح/الخسارة: <b class="num '+(pl==null?"":pl>=0?"up":"down")+'">'+plTxt+'</b></div></div>'}).join(""):'<div class="empty">لا توجد عملات في محفظتك بعد. أضف أول عملة من النموذج أعلاه.</div>';
  $("pTotal").innerHTML=LOTS.length?'<div><span>القيمة'+(stale?" (قديمة)":" الحالية")+'</span><br><b class="num">'+fmt(tv)+' USDT</b>'+(miss?'<br><small class="meta">لم تُحسب '+miss+' عملة لعدم توفر سعرها</small>':"")+'</div>'+(hasPl?'<div><span>الربح/الخسارة (للصفقات ذات سعر شراء فقط)</span><br><b class="num '+(tp>=0?"up":"down")+'">'+fmt(tp)+" USDT"+(tc>0?" ("+pc(tq/tc*100)+")":"")+'</b>'+(tc>0?'<br><small class="meta">النسبة محسوبة على الصفقات ذات تكلفة أكبر من صفر فقط</small>':"")+(nocost?'<br><small class="meta">'+nocost+' صفقة بدون سعر شراء مستبعدة من الربح/الخسارة</small>':"")+'</div>':(nocost?'<div><small class="meta">لا يوجد سعر شراء لحساب الربح/الخسارة</small></div>':"")):""}
$("pAdd").onclick=function(){var a=num($("pAmt").value),p=$("pPrice").value.trim()===""?($("pPrice").validity.badInput?NaN:null):num($("pPrice").value),m=$("pMsg");if($("pAmt").validity.badInput)a=NaN;
  if(!(a>0&&isFinite(a))){m.textContent="أدخل كمية أكبر من صفر.";return}if(p!==null&&!(isFinite(p)&&p>=0)){m.textContent="سعر الشراء غير صحيح.";return}
  LOTS.push({s:$("pCoin").value,a:a,p:p});saveLots();$("pAmt").value="";$("pPrice").value="";m.textContent="تمت الإضافة.";toolsRender()};
$("pRows").addEventListener("click",function(e){var d=e.target.closest("[data-del]");if(d){LOTS.splice(+d.dataset.del,1);saveLots();toolsRender()}});
["cAmt","cFrom","cTo"].forEach(function(i){$(i).addEventListener("input",toolsRender)});
$("cSwap").onclick=function(){var f=$("cFrom").value;$("cFrom").value=$("cTo").value;$("cTo").value=f;toolsRender()};
$("navTools").onclick=function(){go("/tools")};
// ---------- events
function render(){lastRender=Date.now();if(route==="home"){cards();table()}else if(route==="tools"){toolsRender()}else{head();stats();drawChart()}}
function schedule(){if(pending)return;pending=true;setTimeout(function(){pending=false;render()},Math.max(0,1000-(Date.now()-lastRender)))}
$("range").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;range=b.dataset.r;[].forEach.call(this.children,function(c){c.className=c===b?"on":""});loadChart()});
$("ctype").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;ctype=b.dataset.c;[].forEach.call(this.children,function(c){c.className=c===b?"on":""});drawChart()});
$("rows").addEventListener("click",function(e){if(e.target.closest("a"))return;var st=e.target.closest("[data-star]");if(st){toggleFav(st.dataset.star);return}var o=e.target.closest("[data-open]");if(o){openCoin(o.dataset.open);return}var tr=e.target.closest("tr");if(tr&&tr.dataset.s)openCoin(tr.dataset.s)});
$("cards").addEventListener("click",function(e){var g=e.target.closest("[data-go]");if(g)openCoin(g.dataset.go)});
document.querySelector("thead").addEventListener("click",function(e){var th=e.target.closest("th.s");if(!th)return;var k=th.dataset.k;if(sortK===k)sortD=-sortD;else{sortK=k;sortD=k==="name"?1:-1}table()});
$("tabs").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;setTab(b.dataset.t)});
function setTab(t){tab=t;shown=40;[].forEach.call($("tabs").children,function(c){c.className=c.dataset.t===t?"on":""});if(t==="gain"){sortK="pct";sortD=-1}else if(t==="lose"){sortK="pct";sortD=1}else{sortK="vol";sortD=-1}if(route!=="home")location.hash="#/";else showRoute();table()}
$("more").onclick=function(){shown+=40;table()};
$("navMarket").onclick=function(){setTab("all");go("/");window.scrollTo({top:0,behavior:"smooth"})};
$("navFav").onclick=function(){setTab("fav");if(route==="home")$("marketSec").scrollIntoView({behavior:"smooth"})};
$("navNews").onclick=function(){if(route!=="home"){go("/");setTimeout(function(){$("newsSec").scrollIntoView({behavior:"smooth"})},60)}else $("newsSec").scrollIntoView({behavior:"smooth"})};
$("dBack").onclick=function(){go("/")};$("dFav").onclick=function(){toggleFav(sel)};
$("theme").onclick=function(){var t=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=t;try{localStorage.setItem("nabd_theme",t)}catch(e){}drawChart()};
try{var th=localStorage.getItem("nabd_theme");if(th)document.documentElement.dataset.theme=th}catch(e){}
var qi=$("q"),sg=$("sugg"),hl=-1;
function suggest(){var q=qi.value.trim().toUpperCase();qtxt=q;if(route==="home"){shown=40;table()}if(!q){sg.hidden=true;return}
  var m=order.filter(function(s){return s.indexOf(q)>-1||(NAMES[s]||"").toUpperCase().indexOf(q)>-1}).slice(0,6);hl=-1;
  sg.innerHTML=m.length?m.map(function(s,i){return'<button data-s="'+s+'">'+ico(s)+"<span><b>"+s+"</b> "+esc(NAMES[s]||"")+'</span><span class="px">'+fmt(D[s].last)+"</span></button>"}).join(""):'<div class="empty">لا توجد عملة مطابقة</div>';sg.hidden=false}
qi.addEventListener("input",suggest);
qi.addEventListener("keydown",function(e){var b=sg.querySelectorAll("button");if(e.key==="ArrowDown"&&b.length){hl=(hl+1)%b.length}else if(e.key==="ArrowUp"&&b.length){hl=(hl-1+b.length)%b.length}else if(e.key==="Enter"&&b.length){openCoin(b[hl>=0?hl:0].dataset.s);sg.hidden=true;qi.value="";qtxt="";return}else if(e.key==="Escape"){sg.hidden=true;return}else return;[].forEach.call(b,function(x,i){x.className=i===hl?"hl":""});e.preventDefault()});
sg.addEventListener("mousedown",function(e){var b=e.target.closest("button");if(b){e.preventDefault();openCoin(b.dataset.s);sg.hidden=true;qi.value="";qtxt="";if(route==="home")table()}});
qi.addEventListener("blur",function(){setTimeout(function(){sg.hidden=true},120)});
window.addEventListener("hashchange",showRoute);window.addEventListener("popstate",showRoute);document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;var h=a.getAttribute("href");if(h==="/"||h==="/tools"||/^\/coin\/[A-Z0-9]+$/.test(h)){e.preventDefault();go(h)}});window.addEventListener("resize",function(){if(route==="coin")drawChart()});
// ---------- data
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
  if(route==="tools")toolsRender();if(age>=15000)document.querySelector("table").className="stalecls"},1000);
setInterval(function(){if(!wsOk||isStale())poll()},10000);
setInterval(function(){rank();if(route==="home"&&order.length)table();if(route==="coin"&&Date.now()-tickAt>30000)loadTick()},60000);
setInterval(function(){if(route==="coin")loadChart()},300000);
poll().then(function(){showRoute()});connect();
setTimeout(function(){if(!order.length)$("rows").innerHTML='<tr><td colspan="11" class="empty">تعذر الاتصال بمصدر الأسعار حاليًا. نعيد المحاولة تلقائيًا.</td></tr>'},12000);
// ---------- news
var FEEDS=[["Cointelegraph"],["CoinDesk"],["Decrypt"],["Bitcoin Magazine"]];
var items=[],nf="all";
function ago(d){var m=Math.max(0,Math.round((Date.now()-d)/60000));return m<1?"الآن":m<60?"منذ "+m+" دقيقة":m<1440?"منذ "+Math.round(m/60)+" ساعة":"منذ "+Math.round(m/1440)+" يوم"}
function card(i){return'<div class="item"><a href="'+esc(i.l)+'" target="_blank" rel="noopener noreferrer">'+esc(i.t)+'</a><div class="src"><span class="tag">'+i.src+"</span><span>"+ago(i.d)+"</span></div></div>"}
function drawNews(){var l=items.filter(function(i){return nf==="all"||i.src===nf}).slice(0,20);
  $("chips").innerHTML=["all"].concat(FEEDS.map(function(f){return f[0]})).map(function(s){return'<button class="chip'+(s===nf?" on":"")+'" data-s="'+s+'">'+(s==="all"?"الكل":s)+"</button>"}).join("");
  $("news").innerHTML=l.map(card).join("")||'<p class="empty">لا توجد أخبار حاليًا</p>';coinNews()}
function coinNews(){if(route!=="coin")return;var nm=NAMES[sel]||sel,re=new RegExp("\\b("+sel+"|"+nm.replace(/[^A-Za-z0-9 ]/g,"")+")\\b","i");var l=items.filter(function(i){return re.test(i.t)}).slice(0,8);
  $("dNews").innerHTML=l.length?l.map(card).join(""):'<p class="empty">'+(items.length?"لا توجد عناوين عن "+esc(nm)+" الآن في المصادر الأربعة.":"لا توجد أخبار محمّلة بعد.")+"</p>"}
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
    if(!items.length)$("news").innerHTML='<p class="empty">لا توجد أخبار محمّلة بعد.</p>';coinNews()})}
news();setInterval(news,120000);
})();

(function(){
var b=document.getElementById("visitsBody");if(!b)return;
var isNew=1;try{if(localStorage.getItem("nabd_seen")){isNew=0}else{localStorage.setItem("nabd_seen","1")}}catch(e){}
function flag(c){return String.fromCodePoint.apply(null,c.split("").map(function(x){return 127397+x.charCodeAt(0)}))}
var dn;try{dn=new Intl.DisplayNames(["ar"],{type:"region"})}catch(e){}
function nm(c){try{return dn?dn.of(c):c}catch(e){return c}}
function fmt(n){return n.toLocaleString("en-US")}
function draw(j){
  if(!j||j.error){b.textContent="العدّاد غير متاح الآن.";return}
  var h='<div class="vis-tot"><div><b>'+fmt(j.totalVisitors)+'</b><span>زائر (متصفح مختلف)</span></div><div><b>'+fmt(j.totalViews)+'</b><span>مرة فتح للصفحة</span></div></div>';
  if(j.countries.length){h+='<ul class="vis-list">'+j.countries.map(function(r){return '<li><span class="fl" aria-hidden="true">'+flag(r.country)+'</span><span class="cn">'+nm(r.country)+' <small>'+r.country+'</small></span><b>'+fmt(r.visitors)+' <small>زائر</small></b><i>'+fmt(r.views)+' فتح</i></li>'}).join("")+'</ul>'}
  else h+='<p class="empty">لا توجد زيارات مسجلة بعد.</p>';
  var d=j.since?j.since.slice(0,10):"";
  h+='<p class="note">أرقام حقيقية تُسجَّل منذ '+d+' (تبدأ من الصفر). الدولة تُحدد من اتصال الزائر عبر Cloudflare، ولا نخزن عنوان IP. "زائر" = متصفح فتح الموقع لأول مرة، وليس شخصًا بعينه. الزيارات من بوتات معروفة لا تُحسب.</p>';
  b.innerHTML=h}
fetch("/api/visits",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({n:isNew})}).then(function(r){return r.json()}).then(draw).catch(function(){draw(null)});
})();
