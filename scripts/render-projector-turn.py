"""Render a real turn towards the viewer, for the phone-first opening.
Run against assets/projector/projector.blend in an isolated background Blender.
"""
import bpy, math, os, json
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','projector','turn')
os.makedirs(OUT,exist_ok=True)
scene=bpy.context.scene
scene.render.resolution_x=512;scene.render.resolution_y=466
scene.render.resolution_percentage=100
scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
silver=bpy.data.materials['Machined aluminium']
brass=bpy.data.materials['Warm brushed brass']
bright=bpy.data.materials['Polished edges']
panel=bpy.data.materials['Black anodised panel']

def cylinder(name, pos, radius, depth, mat, vertices=80):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=pos,rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    for poly in o.data.polygons:poly.use_smooth=True
    return o

disc=cylinder('Turn reel face',(0,0,0),1,.055,silver,112)
for i in range(6):
    a=math.tau*i/6
    cutter=cylinder('Hole',(math.sin(a)*.58,0,math.cos(a)*.58),.245,.4,panel,40)
    cutter.scale.x=.75;cutter.rotation_euler[1]=-a
    mod=disc.modifiers.new('Oval opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.context.view_layer.objects.active=disc;bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
bev=disc.modifiers.new('Edge radius','BEVEL');bev.width=.012;bev.segments=2
bpy.context.view_layer.objects.active=disc;bpy.ops.object.modifier_apply(modifier=bev.name)
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
parts=[disc]
for r in [.985,.94]:
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.009,major_segments=96,minor_segments=6,location=(0,-.033,0),rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.data.materials.append(bright);parts.append(o)
parts.append(cylinder('Hub',(0,-.063,0),.168,.08,brass))
parts.append(cylinder('Hub cap',(0,-.112,0),.092,.023,bright))
parts.append(cylinder('Hub centre',(0,-.129,0),.043,.021,panel))
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=disc;bpy.ops.object.join()
first=disc;first.name='Rotating reel A';first.location=(-.5,-.16,3.10);first.scale=(.86,)*3
second=first.copy();second.data=first.data.copy();scene.collection.objects.link(second)
second.name='Rotating reel B';second.location=(1,-.16,3.16);second.scale=(.79,)*3

rig=bpy.data.objects.new('Turntable axis',None);scene.collection.objects.link(rig)
pivot=Vector((.25,0,.2));rig.location=pivot
bpy.context.view_layer.update()
for o in list(scene.objects):
    if o.type=='MESH':o.parent=rig;o.matrix_parent_inverse=rig.matrix_world.inverted()
camera=scene.camera
horizontal=camera.location-pivot
# The optical axis is local -X. Align it with the viewer in plan, with no upward beam.
turn_angle=math.atan2(-horizontal.y,-horizontal.x)
glass=bpy.data.materials['Coated optical glass']
glass_node=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
glass_node.inputs['Emission Color'].default_value=(1,.67,.27,1)

def projected(point):
    p=world_to_camera_view(scene,camera,point)
    return [p.x*512,(1-p.y)*466]

frames=[]
for i in range(24):
    p=i/23
    q=max(0,min(1,(p-.12)/.78));q=q*q*(3-2*q)
    angle=turn_angle*q
    rig.rotation_euler.z=angle
    first.rotation_euler.y=math.radians(300*p*p)
    second.rotation_euler.y=math.radians(345*p*p)
    glass_node.inputs['Emission Strength'].default_value=max(0,min(1,p*1.4))*.55
    bpy.context.view_layer.update()
    transform=Matrix.Translation(pivot) @ Matrix.Rotation(angle,4,'Z') @ Matrix.Translation(-pivot)
    center=projected(transform@Vector((-1.68,-.08,1.91)))
    tangent=projected(transform@Vector((-1.68,-.08+.226,1.91)))
    vertical=projected(transform@Vector((-1.68,-.08,1.91+.226)))
    rx=math.hypot(tangent[0]-center[0],vertical[0]-center[0])
    ry=math.hypot(tangent[1]-center[1],vertical[1]-center[1])
    indicator=projected(transform@Vector((1,-.68,1.52)))
    frames.append({'lamp':[center[0],center[1],rx,ry],'indicator':indicator})
    scene.render.filepath=os.path.join(OUT,f'{i:02d}.png')
    bpy.ops.render.render(write_still=True)
    print('TURN_FRAME',i,flush=True)

with open(os.path.join(OUT,'geometry.json'),'w') as f:json.dump({'size':[512,466],'columns':6,'rows':4,'frames':frames},f,indent=2)
print('TURN_READY',flush=True)
