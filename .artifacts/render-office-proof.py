import json
from PIL import Image,ImageDraw,ImageFont
im=Image.open('C:/Users/Gian Karlo/Downloads/office-building.png').convert('RGB')
path=json.load(open('.artifacts/office-route-proof.json'))['path']
out=Image.new('RGB',(im.width+48,im.height+128),'#f8f4ec')
out.paste(im,(24,100))
d=ImageDraw.Draw(out)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
d.text((24,18),'Office plan: tested wall-avoiding path',font=font,fill='#214e3a')
d.text((24,46),'Stair approach to Manager\'s Office entrance',font=small,fill='#333333')
d.text((24,66),'Manually verified endpoints; algorithm-generated path. Not an AI scan result.',font=small,fill='#555555')
points=[(x+24,y+100) for x,y in path]
d.line(points,fill='white',width=8,joint='curve')
d.line(points,fill='#205f45',width=4,joint='curve')
for i,(x,y) in enumerate([points[0],points[-1]]):
 d.ellipse((x-7,y-7,x+7,y+7),fill='#205f45',outline='white',width=2)
 label='Start' if i==0 else 'Entrance'
 d.text((x-52,y-24),label,font=small,fill='#173f2c',stroke_width=2,stroke_fill='white')
out.save('outputs/office-route-proof.png')
