export async function onRequest({request,next}){
  const u=new URL(request.url);
  if(u.hostname==="dalilak-mobile-ar.pages.dev"&&(request.method==="GET"||request.method==="HEAD")){u.hostname="nabd-crypto.pages.dev";return Response.redirect(u.toString(),301)}
  const r=await next();
  if(u.hostname!=="nabd-crypto.pages.dev"){const o=new Response(r.body,r);o.headers.set("X-Robots-Tag","noindex");return o}
  return r}
