// Globals
let e=[],n=0;async function t(t,a){let r=t.stream().pipeThrough(new TextDecoderStream),d=r.getReader(),u="";try{for(;;){let{done:e,value:n}=await d.read();if(e)break;u+=n}}finally{d.releaseLock()}try{let a=JSON.parse(u),r=function(t,a){let r=document.getElementById("json-viewer"),d=document.getElementById("filename");return o(d,a),n=Math.ceil((e=function(e){let n=[],t=Array.isArray(e),i=0;t&&(n.push(l(i,null,null,!0,"[")),i++);let a=function e(n,t,i){let a=[];for(let r in n)if(n.hasOwnProperty(r)){let o=n[r];if(null!==o&&"object"==typeof o){let n=Array.isArray(o);a.push(l(i,r,null,t,n?"[":null));let d=e(o,n,i+1);d.forEach(e=>a.push(e)),n&&a.push(l(i,null,null,t,"]"))}else o=null===o?"null":"string"==typeof o?`"${o}"`:o.toString(),a.push(l(i,r,o,t))}return a}(e,t,i);return a.forEach(e=>n.push(e)),t&&(i--,n.push(l(i,null,null,!0,"]"))),n}(t)).length/20),i(0),r}(a,t.name),d=document.querySelector(".file-form");d.classList.add("hidden"),r.classList.remove("hidden"),n>1&&function(){let e=document.querySelector(".pagination-container");e.classList.remove("hidden")}()}catch(e){console.log(e),function(e){e.classList.add("visible");let n=document.getElementById("load-json");n.disabled=!1;let t=document.getElementById("loading-indicator");t.classList.add("hidden")}(a);return}}function l(e,n,t,l,i){return{indentation:e,key:n,value:t,isArray:l,bracket:i}}function i(t){let l=document.getElementById("content-container");l.innerHTML="";let i=20*t,d=Math.min((t+1)*20,e.length);for(let n=i;n<d;n++)!function(e,n){var t,l;let i=r("div","json-line",n);!function(e,n){for(let t=0;t<n;t++)r("span","indent",e,"    ")}(i,e.indentation);let a=r("span","content",i);(function(e,n,t){if(!n)return;let l=["json-key"];t&&l.push("array-idx"),r("span",l.join(" "),e,`${n}: `)})(a,e.key,e.isArray),null!==(t=e.value)&&o(a,t),(l=e.bracket)&&r("span","bracket",a,l)}(e[n],l);!function(e){let t=document.getElementById("pagination-container");t.innerHTML="",e>0&&(a("\xab",0,e,t,!0),a("‹",e-1,e,t,!0)),a(1,0,e,t);let l=Math.floor(2),i=Math.max(0,e-l);n-e<l&&(i=Math.max(0,n-5));let o=Math.min(n-2,i+5-1);i>1&&r("span",null,t,"...");for(let n=i;n<=o;n++)0!==n&&a(n+1,n,e,t);o<n-2&&r("span",null,t,"..."),a(n,n-1,e,t),e<n-1&&(a("›",e+1,e,t,!0),a("\xbb",n-1,e,t,!0))}(t)}function a(e,n,t,l,a){if(n===t)return r("span",null,l,e);{let t=r("a",a?"special":null,l,e);return t.href=`?page=${n+1}`,!function(e,n){e.addEventListener("click",e=>{e.preventDefault();let t=n();i(t)})}(t,()=>n),t}}function r(e,n,t,l){let i=document.createElement(e);return n&&(i.className=n),t&&t.appendChild(i),l&&o(i,l),i}function o(e,n){let t=document.createTextNode(n);e.appendChild(t)}document.addEventListener("DOMContentLoaded",()=>{let e=document.getElementById("upload-file-input"),n=document.getElementById("load-json"),l=document.querySelector(".error-msg"),i=document.getElementById("loading-indicator");e.addEventListener("change",()=>{(function(e){e.classList.remove("visible")})(l),0!==e.files.length&&(n.disabled=!0,i.classList.remove("hidden"),t(e.files[0],l))}),n.addEventListener("click",()=>{e.click()})});//# sourceMappingURL=index.e4043b1c.js.map

//# sourceMappingURL=index.e4043b1c.js.map
