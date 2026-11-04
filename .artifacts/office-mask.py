import json, math
from PIL import Image
im=Image.open('C:/Users/Gian Karlo/Downloads/office-building.png').convert('RGB')
width,height=im.size
ratio=min(1,384/max(width,height))
w,h=max(5,math.floor(width*ratio+.5)),max(5,math.floor(height*ratio+.5))
pixels=im.load()
gray=[]
for y in range(h):
 for x in range(w):
  darkest=255
  for yy in range(math.floor(y*height/h),math.ceil((y+1)*height/h)):
   for xx in range(math.floor(x*width/w),math.ceil((x+1)*width/w)):
    r,g,b=pixels[xx,yy]
    darkest=min(darkest,.2126*r+.7152*g+.0722*b)
  gray.append(darkest)
with open('.artifacts/office-mask.json','w') as output:
 json.dump(dict(width=w,height=h,gray=gray,imageWidth=width,imageHeight=height,threshold=155,padding=0,floor=0),output)
print(json.dumps(dict(imageWidth=width,imageHeight=height,maskWidth=w,maskHeight=h)))
