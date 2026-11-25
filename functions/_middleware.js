const HOST="chainbeat.pages.dev";
const OLD=["nabd-crypto.pages.dev","dalilak-mobile-ar.pages.dev"];
export async function onRequest({request,next}){
  const u=new URL(request.url);
  if(OLD.indexOf(u.hostname)>-1&&(request.method==="GET"||request.method==="HEAD")){u.hostname=HOST;return Response.redirect(u.toString(),301)}
  const r=await next();
  if(u.hostname!==HOST){const o=new Response(r.body,r);o.headers.set("X-Robots-Tag","noindex");return o}
  return r}
