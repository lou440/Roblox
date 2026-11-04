// Browser copy of the chat filter (offline chat and the local preview).
// Generated from the filter in server.js. The server is authoritative online.
// Keep the two in sync. This file must not import server.js.
const bannedWords = ["nigger","nigga","niggers","niggas","chink","chinks","gook","gooks","spic","spics","kike","kikes","wetback","wetbacks","coon","coons","paki","pakis","faggot","fag","fags","dyke","tranny","retard","retarded","heilhitler","whitepower","killallblacks","killalljews"];
const confusables={'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','у':'y','і':'i','ј':'j','ѕ':'s','ɑ':'a','α':'a','ο':'o','ι':'i','κ':'k','τ':'t','ν':'v','0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i','|':'i','9':'g','6':'g','2':'z','ı':'i','ɩ':'i','ɪ':'i','ɡ':'g','ɢ':'g','ǝ':'e','ᴇ':'e','ʀ':'r','ɴ':'n','ᴏ':'o','ᴀ':'a','ᴄ':'c','ᴋ':'k','ᴍ':'m','ᴛ':'t','ʏ':'y','ᴜ':'u','ᴡ':'w','ꜱ':'s','ᴅ':'d','ʟ':'l','ʜ':'h','ɾ':'r','ƨ':'s','ϲ':'c'};
const hateGroups=['blacks','blackpeople','jews','jewishpeople','asians','muslims','arabs','mexicans','immigrants','gaypeople','gays','transpeople'];
for(const group of hateGroups)for(const phrase of ['killall'+group,'ihate'+group,group+'mustdie',group+'areanimals',group+'arevermin'])bannedWords.push(phrase);
// Long slur roots match inside other letters too (e.g. "ahnigger"); short words keep word boundaries so "raccoon" or "spice" pass.
const looseWords=/nigg|faggot|heilhitler|killall|ihate|mustdie|arevermin|areanimals/;
const filterPatterns=bannedWords.map(w=>{const loose=looseWords.test(w);return new RegExp((loose?'':'(?<![a-z])')+[...w].map(c=>c+'+').join('[^a-z0-9]*')+(loose?'':'(?![a-z])'),'g')});
function cleanChatText(value,limit=200){
 const input=String(value??'').slice(0,4096).normalize('NFC');let out='',marks=0,count=0,hasBase=false,joiner=false;
 for(const ch of input){const cp=ch.codePointAt(0);if(/[\p{Cs}]/u.test(ch)||/[\u200b\u200e\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff\u00ad\u061c]/u.test(ch))continue;
 if(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(ch)){if(out&&!out.endsWith(' ')&&count<limit){out+=' ';count++}marks=0;hasBase=false;continue}
 if(ch==='\u200d'||ch==='\u200c'){if(!hasBase||joiner)continue;joiner=true}else joiner=false;
 if(/\p{M}/u.test(ch)){if(!hasBase||marks>=2||(/\p{Me}/u.test(ch)&&cp!==0x20e3))continue;if(cp!==0xfe0e&&cp!==0xfe0f)marks++}else if(ch!=='\u200d'&&ch!=='\u200c'){marks=0;hasBase=!/\s/u.test(ch)}
 if(count>=limit)break;out+=ch;count++;
 }return out.replace(/\s{2,}/gu,' ').trim().normalize('NFC');
}
function filterChat(value){
 const original=cleanChatText(value);
 let folded='',offsets=[];for(let i=0;i<original.length;){const c=String.fromCodePoint(original.codePointAt(i)),n=c.normalize('NFKD').toLowerCase().replace(/\p{M}/gu,'');for(const ch of n){folded+=confusables[ch]||ch;offsets.push([i,i+c.length])}i+=c.length}
 const mask=new Uint8Array(original.length);for(const pattern of filterPatterns){pattern.lastIndex=0;let m;while((m=pattern.exec(folded))){const a=offsets[m.index][0],b=offsets[m.index+m[0].length-1][1];mask.fill(1,a,b)}}
 // Nazi symbols are masked wherever they appear, including homoglyph and spaced variants.
 const symbolRx=/[卐卍ᛋᛌ]/g;let sm;while((sm=symbolRx.exec(folded)))mask.fill(1,offsets[sm.index][0],offsets[sm.index][1]);
 return original.split('').map((c,i)=>mask[i]?'#':c).join('').replace(/█+/g,m=>'#'.repeat(m.length)).trim();
}

let times=[],until=0,lastNotice=0;
window.__chatSafety={filter:filterChat,allow(){const now=performance.now();times=times.filter(t=>now-t<8000);if(now<until||times.length>=5||(times.length&&now-times[times.length-1]<750)){if(now>=until)until=now+10000;if(now-lastNotice>=1000){lastNotice=now;window.dispatchEvent(new CustomEvent('mp:chat-cooldown',{detail:{remaining:until-now}}))}return false}times.push(now);return true}};
