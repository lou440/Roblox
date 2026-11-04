from pathlib import Path
import json,struct,xml.etree.ElementTree as ET,collections,math
class R:
 def __init__(self,b):self.b=b;self.p=0
 def take(self,n):
  if self.p+n>len(self.b):raise ValueError('Truncated chunk')
  v=self.b[self.p:self.p+n];self.p+=n;return v
 def u32(self):return struct.unpack('<I',self.take(4))[0]
 def u8(self):return self.take(1)[0]
 def string(self):return self.take(self.u32()).decode('utf8',errors='replace')
 def packed(self,n,f=False,s=False,delta=False):
  b=self.take(n*4);out=[];last=0
  for i in range(n):
   v=int.from_bytes(bytes([b[i],b[n+i],b[2*n+i],b[3*n+i]]),'big')
   if f:v=struct.unpack('<f',struct.pack('<I',(v>>1)|((v&1)<<31)))[0]
   elif s:v=(v>>1)^(-(v&1))
   if delta:v+=last;last=v
   out.append(v)
  return out
 def vectors(self,n):return list(map(list,zip(self.packed(n,True),self.packed(n,True),self.packed(n,True))))
def lz4(b,n):
 out=bytearray();p=0
 def length(n):
  nonlocal p
  if n==15:
   while True:
    x=b[p];p+=1;n+=x
    if x!=255:break
  return n
 while p<len(b):
  t=b[p];p+=1;l=length(t>>4);out.extend(b[p:p+l]);p+=l
  if p==len(b):break
  off=b[p]|b[p+1]<<8;p+=2;l=length(t&15)+4
  for i in range(l):out.append(out[-off])
 assert len(out)==n
 return bytes(out)
normals=[(1,0,0),(0,1,0),(0,0,1),(-1,0,0),(0,-1,0),(0,0,-1)]
def binary(b):
 classes={};items={};shared=[];p=32
 while p<len(b):
  tag=b[p:p+4];c,n,_=struct.unpack_from('<III',b,p+4);p+=16;raw=b[p:p+(c or n)];p+=c or n;r=R(lz4(raw,n) if c else raw)
  if tag==b'INST':
   cid=r.u32();name=r.string();r.u8();count=r.u32();ids=r.packed(count,s=True,delta=True);classes[cid]=ids
   for i in ids:items[i]={'id':i,'className':name,'props':{},'parent':-1}
  elif tag==b'SSTR':
   r.u32();count=r.u32()
   for i in range(count):r.take(16);shared.append(r.string())
  elif tag==b'PROP':
   ids=classes[r.u32()];name=r.string();typ=r.u8();n=len(ids);v=None
   if typ==1:v=[r.string() for i in ids]
   elif typ==2:v=[bool(r.u8()) for i in ids]
   elif typ==3:v=r.packed(n,s=True)
   elif typ==4:v=r.packed(n,f=True)
   elif typ in (7,11):v=r.packed(n)
   elif typ in (12,14):v=r.vectors(n)
   elif typ==19:v=r.packed(n,s=True,delta=True)
   elif typ==26:
    c=r.take(n*3);v=[list(c[k*n+i]/255 for k in range(3)) for i in range(n)]
   elif typ==28:v=[shared[i] if i<len(shared) else '' for i in r.packed(n)]
   elif typ==16:
    rots=[]
    for i in ids:
     rot=r.u8()
     if not rot:mat=struct.unpack('<9f',r.take(36))
     else:
      x=normals[(rot-1)//6];y=normals[(rot-1)%6];z=(x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]);mat=tuple(q for k in range(3) for q in (x[k],y[k],z[k]))
     rots.append(list(mat))
    pos=r.vectors(n);v=[{'position':pos[i],'rotation':rots[i]} for i in range(n)]
   if v is not None:
    for i,val in zip(ids,v):items[i]['props'][name]=val
  elif tag==b'PRNT':
   r.u8();n=r.u32();children=r.packed(n,s=True,delta=True);parents=r.packed(n,s=True,delta=True)
   for i,j in zip(children,parents):items[i]['parent']=j
  elif tag[:3]==b'END':break
 return list(items.values())
def xml(b):
 root=ET.fromstring(b);nodes=list(root.iter('Item'));ids={n.attrib.get('referent'):i for i,n in enumerate(nodes)};out=[]
 parent={c:p for p in root.iter() for c in p}
 for n in nodes:
  props={}
  for p in n.find('Properties') or []:
   tag=p.tag;name=p.attrib.get('name');v=p.text or ''
   if tag in ['Vector3','Color3']:v=[float(p.findtext(k,'0')) for k in ('X','Y','Z') if tag=='Vector3'] if tag=='Vector3' else [float(p.findtext(k,'0')) for k in ('R','G','B')]
   elif tag=='CoordinateFrame':v={'position':[float(p.findtext(k,'0')) for k in ('X','Y','Z')],'rotation':[float(p.findtext(k,'0')) for k in ('R00','R01','R02','R10','R11','R12','R20','R21','R22')]}
   elif tag=='bool':v=v.lower()=='true'
   elif tag in ['int','int64','token','float','double','Color3uint8']:
    try:v=float(v) if tag in ['float','double'] else int(v)
    except:v=0
    if tag=='Color3uint8':v=[((v>>s)&255)/255 for s in (16,8,0)]
   elif tag=='Content':v=p.findtext('url','')
   elif tag=='Ref':v=ids.get(v,-1)
   props[name]=v
  par=parent.get(n);out.append({'id':ids[n.attrib.get('referent')],'className':n.attrib['class'],'parent':ids.get(par.attrib.get('referent'),-1) if par is not None else -1,'props':props})
 return out
FILES={'obby':'Obby','crossroads':'Classic_Crossroads','headquarters':'ROBLOX_World_Headquarters__1_','glass-houses':'Glass_Houses','teapots':'Universal_-_Dodge_the_Teapots_of_Doom'}
if __name__=='__main__':
 Path('maps/source').mkdir(parents=True,exist_ok=True)
 for slug,name in FILES.items():
  b=Path('uploads/'+name+'.rbxl').read_bytes();items=binary(b) if b.startswith(b'<roblox!') else xml(b)
  Path('maps/source/'+slug+'.json').write_text(json.dumps(items,separators=(',',':')))
  by={i['id']:i for i in items}
  def path(i):
   a=[]
   while i and len(a)<100:a.insert(0,str(i['props'].get('Name',i['className'])));i=by.get(i['parent'])
   return '/'.join(a)
  scripts=[{**i,'path':path(i)} for i in items if i['className'] in ['Script','LocalScript','ModuleScript']]
  Path('maps/source/'+slug+'-scripts.json').write_text(json.dumps(scripts,indent=2))
  print(slug,'instances',len(items),'scripts',len(scripts),'classes',collections.Counter(i['className'] for i in items).most_common(12))
  for i in scripts:print(' SCRIPT',i['id'],i['path'],'disabled',i['props'].get('Disabled'),len(i['props'].get('Source','')),'chars')
