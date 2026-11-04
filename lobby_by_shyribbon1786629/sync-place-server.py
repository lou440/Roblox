from pathlib import Path
s=Path('server.js').read_text(); marker='const ImportedMapConfigs='
a=s.index(marker);b=s.index(';\nfunction buildShapeParts',a)
s=Path('place-script-engine.js').read_text()+'\n'+marker+Path('maps/server-configs.json').read_text()+s[b:]
Path('server.js').write_text(s)
print('Embedded script controller and map configuration:',len(s),'bytes')
