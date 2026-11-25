import {page} from "./_seo.js";
export async function onRequestGet({request,env}){
  return page(request,env,"/tools",{title:"أدوات: محوّل العملات الرقمية وحاسبة المحفظة | نبض الكريبتو",desc:"محوّل بين العملات الرقمية و USDT وحاسبة محفظة محلية تُحفظ في متصفحك فقط. أداة حساب للمعلومات وليست نصيحة استثمارية."},"tools")}
