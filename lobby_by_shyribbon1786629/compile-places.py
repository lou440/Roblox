from pathlib import Path
import json,math,collections
PALETTE={1:[242,243,243],5:[215,197,154],9:[232,186,200],11:[128,187,219],21:[196,40,28],23:[13,105,172],24:[245,205,48],26:[27,42,53],28:[40,127,71],37:[75,151,75],38:[160,95,53],45:[180,210,228],102:[110,153,202],104:[107,50,124],106:[218,133,65],119:[164,189,71],141:[39,70,45],151:[120,144,130],179:[159,161,172],192:[105,64,40],194:[163,162,165],199:[99,95,98],208:[229,228,223],217:[124,92,70],226:[253,234,141],1001:[248,248,248],1002:[205,205,205],1003:[17,17,17],1004:[255,0,0],1010:[0,0,255],1020:[0,255,0]}
CLASSES={'Part','WedgePart','CornerWedgePart','SpawnLocation','TrussPart','MeshPart','Seat','VehicleSeat'}
IDENT=[1,0,0,0,1,0,0,0,1]
TITLES={'obby':'Obby','crossroads':'Classic Crossroads','headquarters':'ROBLOX World Headquarters','glass-houses':'Glass Houses','teapots':'Dodge the Teapots of Doom'}
configs={}
for slug,title in TITLES.items():
 items=json.load(open('maps/source/'+slug+'.json'));by={i['id']:i for i in items}
 def ancestors(i):
  a=[];p=by.get(i['parent'])
  while p and len(a)<100:a.insert(0,p);p=by.get(p['parent'])
  return a
 def path(i):return '/'.join(str(p['props'].get('Name',p['className'])) for p in ancestors(i)+[i])
 parts=[];spawns=[];scripts=json.load(open('maps/source/'+slug+'-scripts.json'));triggers=[];groups={};lighting={}
 for i in items:
  p=i['props'];cls=i['className']
  if cls=='Lighting':lighting={k:p[k] for k in ['Ambient','OutdoorAmbient','Brightness','ClockTime','TimeOfDay'] if k in p}
  if cls not in CLASSES:continue
  a=ancestors(i)
  if not any(j['className']=='Workspace' for j in a) or any(j['className'] in ['Tool','Accessory','Hat'] for j in a):continue
  size=p.get('Size',p.get('size'));cf=p.get('CFrame')
  if not size or not cf:continue
  group=a[1]['props'].get('Name','') if len(a)>1 else ''
  if group not in groups:groups[group]=len(groups)
  matrix=cf.get('rotation',IDENT);center=cf['position'];color=p.get('Color3uint8',p.get('Color')) or [v/255 for v in PALETTE.get(p.get('BrickColor'),[163,162,165])]
  shape='wedge' if 'Wedge' in cls else 'sphere' if p.get('Shape',p.get('shape',1))==0 else 'cylinder' if p.get('Shape',p.get('shape',1))==2 else 'box'
  part={'id':i['id'],'name':p.get('Name',cls),'className':cls,'center':center,'size':size,'matrix':matrix,'color':color+[1-p.get('Transparency',0)],'shape':shape,'canCollide':p.get('CanCollide',True),'anchored':p.get('Anchored',False),'walkable':True,'group':groups[group],'path':path(i),'reflectance':p.get('Reflectance',0)}
  part['destructible']=slug in ['crossroads','headquarters','glass-houses'] and not p.get('Locked',False) and max(size)<100 and cls!='SpawnLocation' and 'Killbot' not in part['path']
  parts.append(part)
  if cls=='SpawnLocation' and not p.get('Disabled',False):spawns.append({'id':i['id'],'name':part['name'],'center':[center[0],center[1]+size[1]/2,center[2]],'yaw':math.atan2(-matrix[2],-matrix[8]),'team':p.get('TeamColor'),'checkpoint':p.get('AllowTeamChangeOnTouch',False)})
 if slug=='obby':spawns.sort(key=lambda s:int(s['name'].replace('Lvl','')) if s['name'].startswith('Lvl') else 999)
 elif slug=='crossroads':spawns.sort(key=lambda s:s['center'][1])
 if not spawns:
  # This source has no SpawnLocation: use the clear central ground instead of inventing geometry.
  floors=[p for p in parts if p['canCollide'] and abs(p['center'][0])<=p['size'][0]/2 and abs(p['center'][2])<=p['size'][2]/2 and p['size'][1]<3]
  floor=min(floors,key=lambda p:abs(p['center'][1])) if floors else min(parts,key=lambda p:p['center'][1])
  spawns=[{'id':-1,'name':'Default spawn','center':[0,floor['center'][1]+floor['size'][1]/2,0],'yaw':0,'team':None,'checkpoint':False}]
 offset=spawns[0]['center'][1]
 for p in parts:p['center'][1]-=offset
 for s in spawns:s['center'][1]-=offset
 pby={p['id']:p for p in parts}
 def area(part):
  m=part['matrix'];s=part['size'];return {'id':part['id'],'center':part['center'],'size':[sum(abs(m[k*3+j])*s[j] for j in range(3)) for k in range(3)]}
 def add(kind,part,**extra):
  if part:triggers.append({'kind':kind,**area(part),**extra})
 for script in scripts:
  code=script['props'].get('Source','');par=by.get(script['parent']);part=pby.get(script['parent']);sp=script['path']
  if 'humanoid.Health = 0' in code:
   if part:add('kill',part)
   elif par and '/Bounce/' in sp:
    for p in parts:
     if by[p['id']]['parent']==par['id']:add('kill',p)
  if 'TreeElevator' in sp:add('elevator',part,rise=67.2,delay=2,hold=10)
  if 'BattleArmorScript' in sp:add('armor',part,maxHealth=200)
  if 'FireGun' in sp:
   emplacement=by.get(par['parent']) if par else None
   barrels=[p for p in parts if p['name'] in ['One','Two'] and emplacement and any(a['id']==emplacement['id'] for a in ancestors(by[p['id']]))]
   add('cannon',part,barrels=[{'id':p['id'],'center':p['center'],'matrix':p['matrix']} for p in barrels])
  if 'SummonKillbot' in sp:add('summon',part,team='Red Hawks' if 'RedTeam' in sp else 'Blue Falcons')
  if '/Bouncer/' in sp:
   for p in parts:
    if '/PL3Trampoline/Bouncer/' in p['path']:add('bounce',p,speed=200,duration=.25)
  if 'TeamBeacon' in sp:
   prefix=sp.rsplit('/Script',1)[0];pp=[p for p in parts if p['path'].startswith(prefix+'/')];center=next((p for p in pp if p['name']=='Center'),None)
   if center:
    for p in pp:add('beacon',p,team=prefix.split('/')[-1].replace('TeamBeacon ',''),color=center['color'][:3])
 if slug=='obby':
  for stage,s in enumerate(spawns):
   add('checkpoint',pby.get(s['id']),stage=stage,spawn=s)
 if slug=='teapots':add('finish',next((p for p in parts if p['name']=='finish'),None),target=[17.5,40-offset,9])
 killbot=next((p for p in parts if '/Killbot/Sphere' in p['path']),None)
 rules={'kind':slug,'triggers':triggers,'offset':offset,'killY':-100,'lighting':lighting,'groups':groups,'killbot':area(killbot) if killbot else None,'regenTime':300 if slug=='glass-houses' else 120,'regenDelay':4,'scriptCount':len(scripts)}
 if slug=='crossroads':
  for i in items:
   if i['props'].get('Name')=='RegenerationTime':rules['regenTime']=i['props'].get('Value',120)
   if i['props'].get('Name')=='RegenerationDelay':rules['regenDelay']=i['props'].get('Value',4)
 data={'id':slug,'title':title,'parts':parts,'spawns':spawns,'rules':rules,'scripts':scripts}
 Path('maps/'+slug+'.json').write_text(json.dumps(data,separators=(',',':'),allow_nan=False))
 boxes=[]
 for p in parts:
  if p['canCollide'] or p['destructible']:
   ar=area(p);boxes.append([p['id']]+[round(v,3) for v in ar['center']+ar['size']]+[int(p['canCollide'])+int(p['destructible'])*2,p['group']])
 configs[slug]={'id':slug,'imported':True,'noBuild':True,'noTools':slug in ['obby','teapots'],'combat':slug in ['crossroads','headquarters','glass-houses'],'boxesData':boxes,'spawn':dict(zip(['x','y','z'],spawns[0]['center']),yaw=spawns[0]['yaw']),'spawns':[dict(zip(['x','y','z'],s['center']),yaw=s['yaw'],id=s['id'],stage=n,team=s['team']) for n,s in enumerate(spawns)],'rules':rules}
 print(slug,'parts',len(parts),'spawns',len(spawns),'offset',offset,'triggers',collections.Counter(t['kind'] for t in triggers),'boxes',len(boxes),'bytes',Path('maps/'+slug+'.json').stat().st_size)
Path('maps/server-configs.json').write_text(json.dumps(configs,separators=(',',':')))
print('backend config bytes',Path('maps/server-configs.json').stat().st_size)
