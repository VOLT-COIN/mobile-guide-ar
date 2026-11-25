const J={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
async function read(db){
  const r=await db.prepare("SELECT country,views,visitors FROM visits ORDER BY visitors DESC,views DESC LIMIT 60").all();
  const s=await db.prepare("SELECT v FROM meta WHERE k='since'").first();
  const rows=r.results||[];
  return {since:s?s.v:null,totalViews:rows.reduce((a,x)=>a+x.views,0),totalVisitors:rows.reduce((a,x)=>a+x.visitors,0),countries:rows};
}
export async function onRequest({request,env}){
  if(!env.DB)return new Response(JSON.stringify({error:"unavailable"}),{status:503,headers:J});
  try{
    if(request.method==="POST"){
      const ua=request.headers.get("user-agent")||"";
      const bot=/bot|crawl|spider|slurp|preview|headless|curl|wget|python|monitor/i.test(ua);
      let isNew=0;try{const b=await request.json();isNew=b&&b.n===1?1:0}catch(e){}
      const c=(request.cf&&request.cf.country)||"";
      if(!bot&&/^[A-Z]{2}$/.test(c)&&c!=="XX"&&c!=="T1"){
        await env.DB.prepare("INSERT INTO visits(country,views,visitors) VALUES(?,1,?) ON CONFLICT(country) DO UPDATE SET views=views+1,visitors=visitors+?").bind(c,isNew,isNew).run();
      }
    }else if(request.method!=="GET")return new Response("",{status:405});
    return new Response(JSON.stringify(await read(env.DB)),{headers:J});
  }catch(e){return new Response(JSON.stringify({error:"unavailable"}),{status:503,headers:J})}
}
