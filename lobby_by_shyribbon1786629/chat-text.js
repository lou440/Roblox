/* Preserve languages/emoji; cap combining marks and remove disruptive controls. */
function cleanChatText(value,limit=200){
 const input=String(value??'').slice(0,4096).normalize('NFC');let out='',marks=0,count=0,hasBase=false,joiner=false;
 for(const ch of input){const cp=ch.codePointAt(0);if(/[\p{Cs}]/u.test(ch)||/[\u200b\u200e\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff\u00ad\u061c]/u.test(ch))continue;
 if(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(ch)){if(out&&!out.endsWith(' ')&&count<limit){out+=' ';count++}marks=0;hasBase=false;continue}
 if(ch==='\u200d'||ch==='\u200c'){if(!hasBase||joiner)continue;joiner=true}else joiner=false;
 if(/\p{M}/u.test(ch)){if(!hasBase||marks>=2||(/\p{Me}/u.test(ch)&&cp!==0x20e3))continue;if(cp!==0xfe0e&&cp!==0xfe0f)marks++}else if(ch!=='\u200d'&&ch!=='\u200c'){marks=0;hasBase=!/\s/u.test(ch)}
 if(count>=limit)break;out+=ch;count++;
 }return out.replace(/\s{2,}/gu,' ').trim().normalize('NFC');
}
window.ChatText={clean:cleanChatText};
