from pathlib import Path
import struct,json,collections
b=Path('uploads/Happy_Home_in_Robloxia__1_-2.rbxl').read_bytes()
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
class R:
 def __init__(self,b):self.b=b;self.p=0
 def take(self,n):v=self.b[self.p:self.p+n];self.p+=n;return v
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
 def vectors(self,n):return list(zip(self.packed(n,True),self.packed(n,True),self.packed(n,True)))
classes={};items={};p=32
normals=[(1,0,0),(0,1,0),(0,0,1),(-1,0,0),(0,-1,0),(0,0,-1)]
while p<len(b):
 tag=b[p:p+4];c,n,_=struct.unpack_from('<III',b,p+4);p+=16;raw=b[p:p+(c or n)];p+=c or n;r=R(lz4(raw,n) if c else raw)
 if tag==b'INST':
  cid=r.u32();name=r.string();fmt=r.u8();count=r.u32();ids=r.packed(count,s=True,delta=True);classes[cid]=ids
  for i in ids:items[i]={'class':name,'props':{},'parent':-1}
 elif tag==b'PROP':
  ids=classes[r.u32()];name=r.string();typ=r.u8();n=len(ids);v=None
  if name not in ['Name','Size','size','CFrame','Color','Color3uint8','BrickColor','Transparency','CanCollide','Anchored','Shape']:continue
  if typ==1:v=[r.string() for i in ids]
  elif typ==2:v=[bool(r.u8()) for i in ids]
  elif typ==4:v=r.packed(n,f=True)
  elif typ in (7,11):v=r.packed(n)
  elif typ in (12,14):v=r.vectors(n)
  elif typ==26:
   c=r.take(n*3);v=[tuple(c[k*n+i]/255 for k in range(3)) for i in range(n)]
  elif typ==16:
   rots=[]
   for i in ids:
    rot=r.u8()
    if not rot:mat=struct.unpack('<9f',r.take(36))
    else:
     x=normals[(rot-1)//6];y=normals[(rot-1)%6];z=(x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]);mat=tuple(q for k in range(3) for q in (x[k],y[k],z[k]))
    rots.append(mat)
   pos=r.vectors(n);v=[{'position':pos[i],'rotation':rots[i]} for i in range(n)]
  if v is not None:
   for i,val in zip(ids,v):items[i]['props'][name]=val
 elif tag==b'PRNT':
  r.u8();n=r.u32();children=r.packed(n,s=True,delta=True);parents=r.packed(n,s=True,delta=True)
  for i,j in zip(children,parents):items[i]['parent']=j
 elif tag==b'END\0':break
Path('home-source.json').write_text(json.dumps(items))
models=[(i,v['props'].get('Name'),v['parent']) for i,v in items.items() if v['class']=='Model']
print('instances',len(items),'models',len(models));print(models[:180])
