import json, numpy as np, collections
from pathlib import Path
D={int(k):v for k,v in json.load(open('home-source.json')).items()}
def under(i):
 while i in D:
  if i==240:return True
  i=D[i]['parent']
 return False
palette={1:(242,243,243),5:(215,197,154),24:(245,205,48),26:(27,42,53),38:(160,95,53),45:(180,210,228),192:(105,64,40),194:(163,162,165),199:(99,95,98),208:(229,228,223),217:(124,92,70),226:(253,234,141),1001:(248,248,248),1002:(205,205,205),1003:(17,17,17),1012:(255,0,0)}
parts=[];colliders=[];seats=[]
for i,v in D.items():
 p=v['props']
 if not under(i) or 'CFrame' not in p or 'size' not in p:continue
 m=np.array(p['CFrame']['rotation']).reshape(3,3);size=np.array(p['size'])*.5;c=np.array(p['CFrame']['position'])*.5+np.array([155.50122,-22.0013,52.0038]);e=np.abs(m)@size/2
 color=[round(x/255,4) for x in palette.get(p.get('BrickColor'),(163,162,165))]+[round(1-p.get('Transparency',0),4)]
 leaf=v['parent']==7939 and p.get('Name') in ['Door1','Door2','Door1Hinge1','Door1Hinge2','Door2Hinge1','Door2Hinge2']
 # Door leaves are removed to leave the original framed entry open for gameplay.
 if color[3]>.05 and not leaf:parts.append({'center':c.round(4).tolist(),'size':size.round(4).tolist(),'color':color,'matrix':m.round(5).flatten().tolist(),'shape':'wedge' if v['class']=='WedgePart' else 'box','sourceId':i})
 if p.get('CanCollide',True) and not leaf and min(size)>.035 and max(size)>.4:
  lo=np.round(c-e,2);hi=np.round(c+e,2)
  if np.all(hi>lo):colliders.append([lo.tolist(),hi.tolist()])
 if v['class']=='Seat':seats.append({'center':[round(c[0],3),round(c[2],3)],'seatTop':round(c[1]+e[1],3),'yaw':float(np.arctan2(m[0,2],m[2,2])),'triggerHalf':[float(max(.65,e[0])),float(max(.65,e[2]))],'floor':.2})
# Merge collinear touching collision boxes, leaving openings untouched.
for axis in (0,2,1,0,2):
 groups=collections.defaultdict(list)
 for lo,hi in colliders:groups[tuple((lo[k],hi[k]) for k in range(3) if k!=axis)].append([lo,hi])
 result=[]
 for boxes in groups.values():
  boxes.sort(key=lambda b:b[0][axis]);last=None
  for lo,hi in boxes:
   if last is not None and lo[axis]<=last[1][axis]+.025:last[1][axis]=max(last[1][axis],hi[axis])
   else:last=[lo[:],hi[:]];result.append(last)
 colliders=result
cp=[{'center':[round((lo[k]+hi[k])/2,3) for k in range(3)],'size':[round(hi[k]-lo[k],3) for k in range(3)],'color':[.5,.4,.3,1],'walkable':True} for lo,hi in colliders]
data={'parts':parts,'collisionParts':cp,'seats':seats,'stairs':[],'beds':[],'upper':[],'center':[13,-45],'entry':[8,-38],'ground':.2,'upstairs':12,'source':'Happy_Home_in_Robloxia__1_-2.rbxl / Workspace Model 240; geometry only, scale 0.5'}
Path('house-extracted.json').write_text(json.dumps(data,separators=(',',':')))
Path('house.js').write_text("""/* Extracted from the user-supplied Happy Home place. No source scripts executed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DemoHouse=factory()})(globalThis,function(){return """+json.dumps(data,separators=(',',':'))+';});')
# Mirror the exact simplified colliders into the self-contained backend.
s=Path('server.js').read_text();a=s.index('const solidBoxes=');print('solid declaration',s[a:a+300])
Path('home-colliders.json').write_text(json.dumps([{'x':p['center'][0],'y':p['center'][1],'z':p['center'][2],'s':p['size']} for p in cp],separators=(',',':')))
print('Extracted',len(parts),'visible parts;',len(cp),'merged colliders;',len(seats),'seats')
