import {TRADING,coinMeta,NAMES,page} from "../_seo.js";
export async function onRequestGet({request,env,params}){
  const raw=String(params.sym||"");const sym=raw.toUpperCase();
  if(!TRADING.has(sym)){return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8","x-robots-tag":"noindex"}})}
  if(raw!==sym){return Response.redirect(new URL("/coin/"+sym,request.url).toString(),301)}
  const m=coinMeta(sym);m.name=NAMES[sym];
  return page(request,env,"/coin/"+sym,m,"det")}
