"""Original offline 3D assets. Run with Blender --background --factory-startup --python.
Never opens or modifies the user's working Blender document.
"""
import bpy, math, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'projector')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1100
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.world.use_nodes = True
bg = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs[0].default_value = (.23,.25,.30,1)
bg.inputs[1].default_value = .35

def material(name, color, metal=0, rough=.3):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    n.inputs['Base Color'].default_value=(*color,1)
    n.inputs['Metallic'].default_value=metal
    n.inputs['Roughness'].default_value=rough
    return m
enamel=material('Graphite enamel',(.035,.044,.049),.72,.29)
panel=material('Black anodised panel',(.018,.022,.025),.6,.32)
silver=material('Machined aluminium',(.47,.48,.46),1,.24)
bright=material('Polished edges',(.7,.67,.59),1,.18)
brass=material('Warm brushed brass',(.47,.29,.095),.92,.27)
rubber=material('Rubber feet and black film',(.009,.009,.010),.05,.7)
glass=material('Coated optical glass',(.012,.045,.055),.7,.12)
amber=material('Amber indicator glass',(.18,.065,.009),.3,.2)

def finish(o, mat, bevel=0):
    o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Machined soft edge','BEVEL');b.width=bevel;b.segments=3
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o
def box(name, pos, scale, mat=enamel, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,mat,bevel)
def cyl(name,pos,r,depth,mat=silver,axis='Y',vertices=96,bevel=.008):
    rot=(math.pi/2,0,0) if axis=='Y' else (0,math.pi/2,0) if axis=='X' else (0,0,0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=pos,rotation=rot)
    o=bpy.context.object;o.name=name
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,mat,bevel)
def rod(name,a,b,r=.045,mat=silver):
    delta=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,delta.length,mat,'Z',32)
    o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return o
def aim(o, point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,point,power,color,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;aim(o,point)
    return o

box('Cast base',(.25,0,.20),(2.8,1.32,.20),enamel,.09)
box('Silver base edge',(.25,-.02,.30),(2.60,1.15,.035),silver,.02)
for x in [-.75,1.25]:
    for y in [-.44,.44]:cyl('Rubber anti-vibration foot',(x,y,.065),.12,.13,rubber,'Z',40,.01)
box('Pedestal',(.37,.10,.69),(.58,.66,.77),enamel,.07)
box('Pedestal bevel',(.37,-.245,.69),(.45,.04,.63),silver,.025)
cyl('Tilt mechanism',(.3,0,1.02),.32,.72,panel,'Y')
cyl('Tilt lock',(.3,-.46,1.02),.18,.18,enamel,'Y')
cyl('Tilt lock cap',(.3,-.56,1.02),.08,.03,brass,'Y')
box('Projector casting',(.30,0,1.72),(2.05,1.03,1.42),enamel,.12)
box('Upper lid',(.30,0,2.43),(1.88,.94,.10),panel,.04)
box('Removable side plate',(.30,-.535,1.73),(1.84,.055,1.18),panel,.06)
box('Vent recess',(.40,-.575,1.88),(1.20,.025,.56),rubber,.025)
for i in range(11):box('Horizontal cooling fin',(.40,-.60,1.64+i*.047),(1.13,.055,.014),enamel,.004)
box('Lower technical plaque',(.30,-.581,1.31),(1.35,.025,.12),brass,.012)
box('Plaque inset',(.30,-.598,1.31),(1.20,.008,.065),panel,.006)
for x in [-.48,1.08]:
    for z in [1.25,2.19]:
        cyl('Flush screw',(x,-.583,z),.031,.018,bright,'Y',32,.003)
        box('Screw slot',(x,-.595,z),(.035,.004,.006),panel,.001)
cyl('Focus control',(-.34,-.65,1.58),.096,.15,enamel,'Y',64)
cyl('Focus dial ring',(-.34,-.735,1.58),.074,.018,silver,'Y',64)
cyl('Start switch',(1.00,-.607,1.52),.070,.08,panel,'Y',64)
cyl('Switch brass rim',(1.00,-.652,1.52),.055,.013,brass,'Y',64)
cyl('Amber indicator',(1.00,-.665,1.52),.035,.013,amber,'Y',48)
box('Film gate housing',(-.66,-.10,1.88),(.25,1.05,.85),silver,.04)
box('Film gate black panel',(-.80,-.11,1.88),(.05,.83,.67),panel,.025)
cyl('Lens mounting',(-.98,-.08,1.91),.31,.36,enamel,'X')
cyl('Lens brass mount',(-1.19,-.08,1.91),.282,.09,brass,'X')
cyl('Focus barrel',(-1.36,-.08,1.91),.260,.28,panel,'X')
for i in range(9):cyl('Lens knurled ring',(-1.25-i*.023,-.08,1.91),.269,.009,silver,'X',96,.002)
cyl('Front lens hood',(-1.57,-.08,1.91),.297,.13,enamel,'X')
cyl('Lens chrome front edge',(-1.642,-.08,1.91),.284,.016,bright,'X')
cyl('Optical inner ring',(-1.656,-.08,1.91),.251,.018,rubber,'X')
cyl('Optical front glass',(-1.669,-.08,1.91),.226,.011,glass,'X',96,.002)
for x,z,r in [(-.50,3.10,.86),(1.00,3.16,.79)]:
    rod('Spool support',(x*.7,.10,2.37),(x,.10,z),.073,enamel)
    rod('Polished arm edge',(x*.7,-.01,2.37),(x,-.01,z),.020,silver)
    cyl('Back reel cheek',(x,.11,z),r,.055,panel,'Y')
    cyl('Film winding',(x,.015,z),r*.84,.17,rubber,'Y')
    for n in range(8):
        # Closely spaced concentric windings catch the studio rim light.
        radius=r*(.30+n*.065)
        bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=.003,major_segments=96,minor_segments=6,location=(x,-.079,z),rotation=(math.pi/2,0,0))
        finish(bpy.context.object,panel)
    cyl('Spool shaft',(x,-.12,z),.11,.20,brass,'Y')
rod('Film entering gate',(-.62,-.21,2.29),(-.53,-.21,2.50),.009,brass)
rod('Film leaving gate',(.86,-.21,2.43),(.95,-.21,2.48),.009,brass)

camdata=bpy.data.cameras.new('Product camera');cam=bpy.data.objects.new('Product camera',camdata);scene.collection.objects.link(cam)
cam.location=(-5.3,-10,5.35);aim(cam,(-.02,0,2.07));camdata.type='ORTHO';camdata.ortho_scale=5.25;scene.camera=cam
area('Large neutral key',(-3,-5,7),(0,0,2),1050,(1,.93,.82),4.2)
area('Warm rim',(2,3,5),(0,0,2),1400,(1,.67,.31),3.0)
area('Cool edge',(-4,2,3),(0,0,2),650,(.60,.73,1),3.0)
area('Front bounce',(2,-5,2),(0,0,2),350,(.78,.84,1),3.0)

bpy.context.view_layer.update()
def projected(point):
    p=world_to_camera_view(scene,cam,Vector(point));return [p.x*1100,(1-p.y)*1000]
def wheel_meta(x,z,r):
    center=projected((x,-.16,z));px=projected((x+r*1.03,-.16,z));pz=projected((x,-.16,z+r*1.03))
    return {'center':center,'matrix':[(px[0]-center[0])/256,(px[1]-center[1])/256,-(pz[0]-center[0])/256,-(pz[1]-center[1])/256]}
metadata={'size':[1100,1000],'lens':projected((-1.68,-.08,1.91)),'indicator':projected((1,-.68,1.52)),'wheels':[wheel_meta(-.5,3.1,.86),wheel_meta(1,3.16,.79)]}
with open(os.path.join(OUT,'geometry.json'),'w') as f:json.dump(metadata,f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'projector.blend'))
scene.render.filepath=os.path.join(OUT,'body.png');bpy.ops.render.render(write_still=True)

# Render a canonical circular face once. CSS applies the camera's affine basis,
# then rotates the inner disc: the oval perspective never rotates incorrectly.
for o in list(scene.objects):
    if o.type=='MESH':o.hide_render=True
disc=cyl('Reel face', (0,0,0),1,.055,silver,'Y',128,0)
for i in range(6):
    a=2*math.pi*i/6
    cutter=cyl('Oval perforation',(math.sin(a)*.58,0,math.cos(a)*.58),.245,.4,rubber,'Y',48,0)
    cutter.scale.x=.75
    cutter.rotation_euler[1]=-a
    mod=disc.modifiers.new('Machined aperture','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.context.view_layer.objects.active=disc;bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
bev=disc.modifiers.new('Rounded perforations','BEVEL');bev.width=.012;bev.segments=3
disc.modifiers.new('Face normals','WEIGHTED_NORMAL')
for r in [.985,.94]:
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.009,major_segments=128,minor_segments=8,location=(0,-.033,0),rotation=(math.pi/2,0,0));finish(bpy.context.object,bright)
cyl('Hub',(0,-.063,0),.168,.08,brass,'Y')
cyl('Hub silver centre',(0,-.112,0),.092,.023,bright,'Y')
cyl('Hub shaft',(0,-.129,0),.043,.021,panel,'Y')
cam.location=(0,-7,0);aim(cam,(0,0,0));camdata.ortho_scale=2.06
scene.render.resolution_x=512;scene.render.resolution_y=512
scene.render.filepath=os.path.join(OUT,'reel.png');bpy.ops.render.render(write_still=True)
print('PROJECTOR_ASSETS_READY',json.dumps(metadata))
