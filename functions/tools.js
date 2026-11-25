import {page} from "./_seo.js";
export async function onRequestGet({request,env}){
  return page(request,env,"/tools",{title:"Tools: Crypto Converter and Portfolio Calculator | Chainbeat",desc:"Convert between cryptocurrencies and USDT, and a local portfolio calculator saved only in your browser. A calculation tool for information, not investment advice."},"tools")}
