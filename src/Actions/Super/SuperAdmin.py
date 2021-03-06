'''
Created on 04-Jul-2018

@author: Sanjay Saini '''

from src.api.baseapi import json_response, SUCCESS, ERROR, WARNING
from src.api.baseapi import get_64bit_binary_string_from_int
from src.api.baseapi import get_integer_from_binary_string
from src.api.bucketHandler import upload_file, delete_bucket_file
from src.app_configration import config
from src.api.datetimeapi import get_dt_by_country, date_to_str
from src.api.datetimeapi import get_date_from_str
from src.api.datetimeapi import get_first_day_of_month
from src.Database import Client, MailUploads, MailTemplateModel, ProductTutorial,\
    HomeScreenStaticURL, ProductDiscount
from src.Database import Product, StaticImage
from src.Database import ProductDesign
from src.Database import ProductCategory
from src.Database import ProductUOM
from src.Database import Seller
from src.Database import SellerLadger
from src.Database import SellerProduct
from src.Database import SellerOrder
from src.Database import ClientLogs
from src.Database import OrderStage
from src.Database import Themes
from src.Database import EventMaster
from src.Database import DesignCategory
from src.Database import DesignSubCategory
from src.Database import UserModel, RoleModel, ROLE_LIST
from src.lib.SABasehandler import ActionSupport
 
import json, logging, datetime
import cgi    
from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.api import images
from src.Actions.taskqueue import mail_sender
import time

design_img_title = config.get('design_img_title')

class Home(ActionSupport):
  def get(self):
    cdt=datetime.datetime.now()
    dt=get_dt_by_country(cdt, 'KE')
    logging.info(dt)
    today_date = dt.date()  
    first_of_month = get_first_day_of_month(today_date)
    all_client = Client.get_all().count()
    inactive_client = Client.get_inactive().count()
    today_order_count = SellerOrder.get_order_filetered(today_date, today_date).count()
    month_order_count = SellerOrder.get_order_filetered(first_of_month, today_date).count()
    context = self.get_context
    context['all_client'] = all_client
    context['inactive_client'] = inactive_client
    context['today_order_count'] = today_order_count
    context['month_order_count'] = month_order_count
    context['log_list'] = ClientLogs.get_list()
    context['dt'] = today_date
    
    logging.info(self.permission)
    template = self.get_jinja2_env.get_template('super/base.html')    
    self.response.out.write(template.render(context))      
     
class Frenchise(ActionSupport):
  def get(self):
    prd_list=Product.get_product_list()
    seller_list=Seller.get_list()
    context={'prd_list': prd_list,
             'seller_list':seller_list}  
    template = self.get_jinja2_env.get_template('super/Frenchise.html')    
    self.response.out.write(template.render(context))      
     
class Products(ActionSupport):
  def get(self):
    prd_list=Product.get_product_list() 
    category_list=ProductCategory.get_list()
    uom_list=ProductUOM.get_list()
    context={'prd_list': prd_list,
             'category_list': category_list,
             'uom_list': uom_list,
             'design_img_title': design_img_title,
             }
    template = self.get_jinja2_env.get_template('super/Products.html')    
    self.response.out.write(template.render(context))

class ProductTutorialObj(ActionSupport):
  def get(self):
    product_key = ndb.Key(urlsafe=self.request.get('k'))
    e = ProductTutorial.get_tutorial(product_key)  
    data_dict = {'video_link': e.video_link,
                 'pdf_bucket_path': e.pdf_bucket_path,
                 'pdf_bucket_key': e.pdf_bucket_key,
                 'k': e.entityKey}

    return json_response(self.response, data_dict, SUCCESS, '')

  def post(self): 
    tutorial = ndb.Key(urlsafe=self.request.get('k')).get()
    video_link = self.request.get('video_link')
    pdf = self.request.get('pdf')
    tutorial.video_link = video_link
    if not tutorial.pdf_bucket_key and pdf: 
      bucket_path = '/designer_textptrn/tutorial/%s.pdf' %(str(time.time()))
      upload_file(pdf, bucket_path)  
      tutorial.pdf_bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      tutorial.pdf_bucket_path = bucket_path
    tutorial.put()
    return json_response(self.response, {}, SUCCESS, 'Tutorial updated')

class GetEventList(ActionSupport):
  def get(self):
    event_list = []
    for e in EventMaster.get_list():
      event_list.append({'key': e.entityKey,
                         'title': e.title})    
    data_dict = {'event_list': event_list}
    return json_response(self.response, data_dict, SUCCESS, '')


class GetProductPics(ActionSupport):
  def get(self):  
    key = self.request.get('key') 
    product = ndb.Key(urlsafe=key).get()
    img_list = product.image_url   
    
    data_dict = {'img_list': img_list,
                 'bg_uri': product.bg_uri,
                 'bg_bckt_key': product.bg_bckt_key,
                 'key': key, }
      
    return  json_response(self.response, data_dict, SUCCESS,'')


class DeleteProductIMG(ActionSupport):
  def get(self):  
    k = self.request.get('k') 
    i = int(self.request.get('i'))
    e = ndb.Key(urlsafe=k).get() 
    try:
      if delete_bucket_file(e.bucket_key[i]):
        e.image_url.pop(i)
        e.bucket_path.pop(i)
        e.bucket_key.pop(i)
        e.put()    
    except Exception:
      pass      
    data_dict={'k':k, 'i':i}  
    return  json_response(self.response, data_dict, SUCCESS,'Image Deleted')

class UpdateDesignSize(ActionSupport):
  def post(self):
    #design = ProductDesign()
    key = self.request.get('key') 
    design = ndb.Key(urlsafe=key).get()  
    design_scallex = self.request.get('design_scallex') 
    design_scalley = self.request.get('design_scalley') 
    design_top = self.request.get('design_top') 
    design_left = self.request.get('design_left') 
    if design_left:
      design.left = design_left
    if design_scallex:      
      design.scaleX = design_scallex
    if design_scalley:
      design.scaleY = design_scalley
    if design_top:
      design.top = design_top        
    design.put()
    
    data_dict = {}
    return json_response(self.response, data_dict, SUCCESS, 'Design size updated')

class DeleteDesign(ActionSupport):  
  def get(self):      
    key = self.request.get('k') 
    #design = ProductDesign()
    design = ndb.Key(urlsafe=key).get()
    if delete_bucket_file(design.bucket_key):
      design.key.delete()  
      return json_response(self.response, {'k': key}, SUCCESS, 'Design deleted')
    else:
      return json_response(self.response, {}, ERROR, 'Try again')      


class SearchProducts(ActionSupport):
  def get(self):
    category = self.request.get('category')
    if category:
      p_list = Product.get_product_list_by_categgory(ndb.Key(urlsafe=category))
    else:
      p_list = Product.get_product_list()          
    context = {'p_list': p_list}  
    template = self.get_jinja2_env.get_template('super/Product_Search.html')    
    self.response.out.write(template.render(context))  
      
    

class EditProducts(ActionSupport):
  def get(self):
    key = self.request.get('k')
    p = ndb.Key(urlsafe=key).get()
    data_dict = {'code':p.code,
    'name': p.name,
    'size':p.size,
    'category': p.category_key.urlsafe() if p.category_key else '',
    'price': p.price,
    'min_qty': p.min_qty,
    'uom': p.uom_key.urlsafe() if p.uom_key else '',
    'description': p.description,
    'product_key': p.entityKey,
    'event_urlsafe': p.event_urlsafe,
    'status': p.status,
    'custom_lable': p.custom_lable,
    }
    
    return  json_response(self.response, data_dict, SUCCESS, '')
      
  def post(self):          
    name=self.request.get('name')
    size=self.request.get('size')
    price=float(self.request.get('price'))
    min_qty=int(self.request.get('min_qty'))
    category=self.request.get('category')
    uom=self.request.get('uom')
    event_list = self.request.get_all('event')
    description=self.request.get('description') 
    custom_lable=self.request.get('custom_lable') 
    
    key = self.request.get('k')  
    p = ndb.Key(urlsafe=key).get()
    p.custom_lable=custom_lable
    p.description=description
    p.name=name
    p.price=price
    p.min_qty=min_qty
    p.size=size
    p.event_list = []
    p.event_urlsafe = []
    if category:
      e=ndb.Key(urlsafe=category).get()
      p.category=e.name
      p.category_key=e.key
      category=e.name
    if uom:
      e=ndb.Key(urlsafe=uom).get()
      p.uom=e.name
      p.uom_key=e.key
      uom=e.name
    if event_list:
      p.event_list = [ ndb.Key(urlsafe=k) for k in event_list ]
      p.event_urlsafe = event_list   
    if self.request.get('status'):
      p.status = True
    else:  
      p.status = False
                   
    p.put()   
    data_dict={'code':p.code,
    'name': name,
    'size':size,
    'min_qty':min_qty,
    'category': category,
    'price': price,
    'uom': uom,
    'description': description,
    'key': p.entityKey, 
    'status': p.status,
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product %s updated' %(name))        

class SaveProducts(ActionSupport):
  def post(self):          
    code=self.request.get('code').upper()
    name=self.request.get('name')
    size=self.request.get('size')
    price=float(self.request.get('price'))
    min_qty=int(self.request.get('min_qty'))
    category=self.request.get('category')
    uom=self.request.get('uom')
    event_list = self.request.get_all('event')
    description=self.request.get('description')
    if code.__len__() < 3:
      return json_response(self, {}, WARNING, 'Product code minimum 3 character')    
    if Product.get_product_by_code(code):
      return json_response(self, {}, WARNING, 'Product code duplicate')
    cdt=datetime.datetime.now()
    dt=get_dt_by_country(cdt, 'KE')
    p=Product()
    p.code=code
    p.created_on=dt.replace(tzinfo=None)
    p.description=description
    p.name=name
    p.price=price
    p.min_qty=min_qty
    p.size=size
    if category:
      e=ndb.Key(urlsafe=category).get()
      p.category=e.name
      p.category_key=e.key
      category=e.name
    if uom:
      e=ndb.Key(urlsafe=uom).get()
      p.uom=e.name
      p.uom_key=e.key
      uom=e.name
    if event_list:
      p.event_list = [ ndb.Key(urlsafe=k) for k in event_list ]
      p.event_urlsafe = event_list          
    p=p.put().get()   
    data_dict={'code':code,
    'name': name,
    'size':size,
    'category': category,
    'price': price,
    'min_qty': min_qty,
    'uom': uom,
    'description': description,
    'key': p.entityKey, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product %s saved' %(name))

class SaveProductsUOM(ActionSupport):
  def post(self):           
    uom=self.request.get('uom')
    uom_obj = ProductUOM.get_product_uom(uom)
    if not uom_obj:
      uom_obj = ProductUOM(name=uom).put().get()
    data_dict={ 
    'name': uom, 
    'key': uom_obj.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product UOM %s saved' %(uom))

class SaveProductsCategory(ActionSupport):
  def post(self):           
    category=self.request.get('category')
    c_obj = ProductCategory.get_product_cat(category)
    if not c_obj:
      c_obj = ProductCategory(name=category).put().get()
    data_dict={ 
    'name': category, 
    'key': c_obj.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product category %s saved' %(category))

class EditProductsCATUOM(ActionSupport):
  def get(self):
    category_list=ProductCategory.get_list()
    uom_list=ProductUOM.get_list()
    context = {'category_list': category_list,
               'uom_list': uom_list}
    template = self.get_jinja2_env.get_template('super/ProductCategoryUOM.html')    
    self.response.out.write(template.render(context))
        
  def post(self):           
    name=self.request.get('name')
    e=ndb.Key(urlsafe=self.request.get('k')).get()
    e.name=name
    e.put()
    return json_response(self.response, {'k': self.request.get('k')}, SUCCESS, 'Rename Done')

class SaveFrenchise(ActionSupport):
  def post(self):          
    person=self.request.get('person')
    name=self.request.get('name')
    email=self.request.get('email').lower().strip()
    telephone=self.request.get('telephone')
    mobile=self.request.get('mobile')
    geo=self.request.get('geo')
    address=self.request.get('address') 
    if '@' not in email:
      return  json_response(self.response, {}, WARNING, 'Seller %s email' %(email))    
    
    if Seller.get_by_email(email):
      return  json_response(self.response, {}, WARNING, 'Seller %s account exist' %(email))    
    
    e = Seller(email=email,
               name=name,
               address=address,
               geo_code=geo,
               mobile=mobile,
               telephone=telephone,
               person=person)
               
    e=e.put().get()
    
    data_dict={'person':person,
    'name': name,
    'email':email,
    'telephone': telephone,
    'mobile': mobile,
    'geo': geo,
    'address': address, 
    'key': e.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Seller %s account created' %(email))
     
class AssignProductToSeller(ActionSupport):     
  def get(self):
    seller=Seller()
    product=Product()  
    product=ndb.Key(urlsafe=self.request.get('product_key')).get()  
    seller=ndb.Key(urlsafe=self.request.get('seller_key')).get()   
    e=SellerProduct()
    e.seller=seller.key
    e.seller_urlsafe=seller.entityKey
    e.master_price=product.price
    e.master_product=product.key
    e.master_product_urlsafe=product.entityKey
    e.code=product.code
    e.name=product.name 
    e.size=product.size 
    e.uom=product.uom 
    e.category=product.category 
    e.description=product.description
    e.retail_price=float(self.request.get('reatilPrice')) 
    e.master_price=product.price 
    e.image_url=product.image_url 
    e.endclient_visible=True 
    e.instock=product.instock
    
    e.put().get()  
    product.endclient_visible=True
    product.put()
    d={'key': e.entityKey,
       'code': e.code,
       'name': e.name,
       'size': e.size,
       'uom': e.uom,
       'category': e.category,
       'retail_price': e.retail_price,
       'master_price': e.master_price,
       'description':e.description,
       'product_key': self.request.get('product_key'),
       }
    return  json_response(self.response, d, SUCCESS, '')   

class GetSellerProduct(ActionSupport):     
  def get(self): 
    seller_key=ndb.Key(urlsafe=self.request.get('key'))
    product_list=[]
    for e in SellerProduct.get_seller_product_list(seller_key):
      product_list.append({'key': e.entityKey,
       'code': e.code,
       'name': e.name,
       'size': e.size,
       'uom': e.uom,
       'category': e.category,
       'retail_price': e.retail_price,
       'master_price': e.master_price,
       'description':e.description,
       'product_key': e.master_product_urlsafe})  
      
    return json_response(self.response, {'product_list': product_list}, SUCCESS, '')  
           
class Order(ActionSupport):
  def get(self):
    seller_list = Seller.get_list()  
    template = self.get_jinja2_env.get_template('super/Order.html')
    now = datetime.datetime.now() 
    now = get_dt_by_country(now, 'KE')
    today = now.strftime('%d-%m-%Y')
    today_date = now.date()
    order_list = SellerOrder.get_order_filetered(today_date, today_date).fetch()
    stage_list = OrderStage.get_order_stage().name
    data = {'dt': today,
            'stage_list': stage_list,
            'seller_list': seller_list,
            'order_list': order_list}   
    self.response.out.write(template.render(data))

class OrderSearch(ActionSupport):
  def post(self):
    seller_list=[]
    key = self.request.get('seller')
    if key:
      seller_list = [ndb.Key(urlsafe=key)]    
    start= get_date_from_str(self.request.get('start'))
    end=get_date_from_str(self.request.get('end'))
    order_list = SellerOrder.get_order_filetered(start, end, seller_list).fetch()
    data = {'order_list': order_list}
    template = self.get_jinja2_env.get_template('super/ordersearch.html')
    html = template.render(data)
    
    return json_response(self.response,
                         {'html': html},
                         SUCCESS,
                         'Order search result')

class EditOrderStage(ActionSupport):
  def post(self):
    order = ndb.Key(urlsafe=self.request.get('key')).get()
    stage = self.request.get('stage')
    action_date = self.request.get('date')
    action_time = self.request.get('time')  
    local_dt = get_dt_by_country(datetime.datetime.now(), 'KE')
    d = action_date if action_date else local_dt.strftime('%d%b, %Y') 
    t = action_time if action_time else local_dt.strftime('%H:%M')
    history_list = json.loads(order.history)
    history_list.append({
        'stage': stage,
        'date': d,
        'time': t,
        'updated_by': self.user_obj.email,
        'updated_on': local_dt.strftime('%d%b, %Y %H:%M'),
        'remarks': 'Status updated'
                     })
    order.history = json.dumps(history_list)
    order.status = stage
    order.put()
    
    
    try:
      if 'approve' in stage.lower():  
        taskqueue.add(url='/taskqueue/OrderApproveMailer',
                      queue_name='OrderApproveMailer',
                      params={'receiver_mail': order.email,
                              'name': order.client_name,
                              'key': order.entityKey,
                              'order_number': order,
                              'order_amt': order,
                            
                            })
    except Exception, msg:
      logging.error(msg)
    
    data_dict = {'key': self.request.get('key'),
                 'stage': stage,}
    return json_response(self.response, data_dict, SUCCESS, 'Order stage updated')

class GerOrderProductPrint(ActionSupport):
  def get(self): 
    order = ndb.Key(urlsafe=self.request.get('key')).get()
    if order.client_print: 
      template = self.get_jinja2_env.get_template('super/order_production_print.html') 
      html_str = template.render({'order': order }) 
    else:    
      html_str = 'No design available'  
    data_dict = {'html': html_str}  
    return json_response(self.response, data_dict, SUCCESS, '')

class GerOrderDetails(ActionSupport):
  def get(self):  
    order = ndb.Key(urlsafe=self.request.get('key')).get()    
  
    template = self.get_jinja2_env.get_template('super/order_details.html') 
    html_str = template.render({'order': order}) 
    data_dict = {'html': html_str}  
    return json_response(self.response, data_dict, SUCCESS, '')


class UploadProductPicture(ActionSupport):    
  def post(self):  
    key = self.request.get('key') 
    product = ndb.Key(urlsafe=key).get()
    
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
        
    file_name = image_file.filename    
    bucket_path = '/product_pictures/%s' %(file_name)
    bucket_path = bucket_path.lower()  
  
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')  
  
   
    product.image_url.append(serving_url)
    product.bucket_path.append(bucket_path)
    product.bucket_key.append(bucket_key)
    product.put()
    return json_response(self.response, 
                         {'serving_url': serving_url},
                         SUCCESS,
                         'Product image uploaded')
    
class UploadProductDesign(ActionSupport):    
  def post(self):  
    key = self.request.get('key') 
    title = self.request.get('title') 
    top = self.request.get('top') 
    left = self.request.get('left') 
    product_key = ndb.Key(urlsafe=key)
    
    
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
    
    if not title or ProductDesign.get_exist_design(product_key, title):
      return json_response(self.response, 
                          {},
                          ERROR,
                          'Product design exist')  
        
    file_name = image_file.filename    
    bucket_path = '/design_variation/design/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')    

    design = ProductDesign()
    design.product = product_key
    design.bucket_key = bucket_key
    design.bucket_path = bucket_path
    design.image_url = serving_url
    design.left = left
    design.top = top
    design.title = title
    design.put() 
    
    return json_response(self.response, 
                         {'serving_url': serving_url,
                          'title': title},
                         SUCCESS,
                         'Product design uploaded')    

class UploadProductBG(ActionSupport):    
  def post(self):  
    key = self.request.get('key')  
    product = ndb.Key(urlsafe=key).get()
    
    
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')     
        
    file_name = image_file.filename    
   
    return json_response(self.response, 
                         {'bg_uri': '', },
                         SUCCESS,
                         'Product background uploaded')  
    
class OrderStageView(ActionSupport):
  def get(self):
    order_stage_obj = OrderStage.get_order_stage()
    order_stage_obj.name
    template = self.get_jinja2_env.get_template('super/OrderStage.html')
    
    data = {'stage_list': order_stage_obj.name }   
    self.response.out.write(template.render(data))    
    
    
  def post(self):
    code = self.request.get('code').upper()
    order_stage_obj = OrderStage.get_order_stage()
    order_stage_obj.name.append(code)  
    order_stage_obj.put()
    
    data_dict = {'i': order_stage_obj.name.__len__(),
                 'code': code}
    
    return json_response(self.response,
                         data_dict,
                         SUCCESS,
                         'Status saved')

    
class OrderStageUpdated(ActionSupport):
  def post(self):
    stage_list = []
    stagedict = json.loads(self.request.get('data'))
    for key in sorted(stagedict.iterkeys()):
      name = stagedict[key]  
      logging.info( "%s: %s" % (key, name) )
      stage_list.append(name) 
    order_stage_obj = OrderStage.get_order_stage()
    order_stage_obj.name = stage_list
    order_stage_obj.put()
    return json_response(self.response,
                         {},
                         SUCCESS,
                         'Status updated')    

class RenameOrderStatus(ActionSupport):
  def post(self):
    index = int(self.request.get('index'))
    order_status = self.request.get('order_status').upper()
    
    order_stage_obj = OrderStage.get_order_stage()
    try:
      order_stage_obj.name[index]=order_status
      order_stage_obj.put()
    except IndexError, msg:
      logging.error(msg)
              
    return json_response(self.response,
                         {'index': index,
                          'order_status': order_status},
                         SUCCESS,
                         'Stage renamed')    

class ManageStripImg(ActionSupport):
  def get(self): 
    bucket_key = ''  
    index = self.request.get('index')
    static_img = HomeScreenStaticURL.get_obj() 
    if index=='1':
      bucket_key = static_img.url_one_key
      static_img.url_one = ''
      static_img.url_one_key = ''
    if index=='2':
      bucket_key = static_img.url_tow_key
      static_img.url_tow = ''
      static_img.url_tow_key = ''
          
    if bucket_key and delete_bucket_file(bucket_key):
      static_img.put()  
      return json_response(self.response,
                         {'index': index},
                         SUCCESS,
                         'Deleted')
    else:
      return json_response(self.response, {}, ERROR, '')
       
  def post(self): 
    index = self.request.get('index')  
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')     
        
    file_name = image_file.filename    
    bucket_path = '/designer_textptrn/static_image/%s' %(file_name)
    bucket_path = bucket_path.lower()
    upload_file(file_obj, bucket_path)
    serving_url=''
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)
      static_img = HomeScreenStaticURL.get_obj()  
      if index=='1':
        static_img.url_one = serving_url   
        static_img.url_one_key=bucket_key
        static_img.put()
      elif index=='2':
        static_img.url_tow = serving_url  
        static_img.url_tow_key=bucket_key
        static_img.put()
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, ERROR, 'Try again')
    
    return json_response(self.response,
                         {'index': index,
                          'url': serving_url},
                         SUCCESS,
                         'Updated') 
class ThemesView(ActionSupport):
  def get(self): 
    static_img = HomeScreenStaticURL.get_obj()
    themes_list = Themes.get_theme_list() 
    product_list = Product.get_selling_product_list()
    context={'themes_list': themes_list,
             'product_list': product_list,
             'static_img': static_img,
             }
    template = self.get_jinja2_env.get_template('super/Themes.html')    
    self.response.out.write(template.render(context))  
    
  def post(self): 
    i = Themes.get_theme_count()    
    title = 'theme%s' %(i+1)  
    e = Themes(title=title).put().get()  
    data_dict = {'title': title,
                 'key': e.entityKey}  
    return json_response(self.response,
                         data_dict,
                         SUCCESS,
                         '')  

class SetupThemesLive(ActionSupport):
  def get(self):
    
    for e in Themes.get_active_theme():
      e.status=False
      e.put()
      
    tk = self.request.get('key')
    if tk:  
      themes = ndb.Key(urlsafe=tk).get()
      themes.status = True
      themes.put()
        
    data_dict = {}
    return json_response(self.response,
                         data_dict,
                         SUCCESS,
                         '')
    
class ThemesPicsUploading(ActionSupport):    
  def post(self):     
    collum = self.request.get('collum')
    param = self.request.get('param')
    image_file = self.request.POST.get(param, None)
    file_obj = self.request.get(param, None)   
    
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
        
    themes = ndb.Key(urlsafe=self.request.get('key')).get()
    file_name = image_file.filename
    msg = '%s, %s, %s' %(collum, param, file_name) 
    logging.info(msg)   
    bucket_path = '/design_variation/theme/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = '', ''
    if not serving_url:
      return json_response(self.response, {}, WARNING, 'Try again')
  
    if collum == 'img1':
      themes.img1 = serving_url
    elif collum == 'img2':     
      themes.img2 = serving_url
    elif collum == 'img3':     
      themes.img3 = serving_url
    elif collum == 'img4':     
      themes.img4 = serving_url
    elif collum == 'img5':     
      themes.img5 = serving_url
    elif collum == 'img6':     
      themes.img6 = serving_url
    elif collum == 'img7':     
      themes.img7 = serving_url
    elif collum == 'img8':     
      themes.img8 = serving_url
    elif collum == 'img9':     
      themes.img9 = serving_url
    elif collum == 'img10':     
      themes.img10 = serving_url
    elif collum == 'img11':     
      themes.img11 = serving_url
    elif collum == 'img12':     
      themes.img12 = serving_url 
       
    themes.put()
          
    data_dict = {}     
    return json_response(self.response,
                         data_dict,
                         SUCCESS,
                         '')
                  
class DeleteProductBG(ActionSupport):    
  def get(self): 
    product = ndb.Key(urlsafe=self.request.get('key')).get()  
    bucket_key = product.bg_bckt_key  
    if product.bg_bckt_key and delete_bucket_file(bucket_key):
      product.bg_bckt_key = ''
      product.bg_uri = ''
      product.put()    
    
    data_dict = {}     
    return json_response(self.response,
                         data_dict,
                         SUCCESS,
                         'Product background removed')
    
    
class GetEvent(ActionSupport):
  def get(self): 
    e = ndb.Key(urlsafe=self.request.get('k')).get()  
    data_dict={'k': self.request.get('k'),
        'title': e.title,
        'status': e.status,
        'date': date_to_str(e.date),
        'start_date': date_to_str(e.start_date),
        'end_date': date_to_str(e.end_date),} 
    return json_response(self.response, data_dict, SUCCESS, '')  

class EditEvent(ActionSupport):
  def post(self): 
    e = ndb.Key(urlsafe=self.request.get('k')).get()
    e.title = self.request.get('title')
    e.date = get_date_from_str(self.request.get('event_date'))
    e.start_date = get_date_from_str(self.request.get('event_start_date'))
    e.end_date = get_date_from_str(self.request.get('event_end_date'))
    if self.request.get('status'):
      e.status = True
    else:    
      e.status = False  
    e.put()
    return json_response(self.response, {'k':self.request.get('k'),
                                         'status': e.status}, SUCCESS, 'Updated')

class EventView(ActionSupport):
  def get(self):
    e_list = EventMaster.get_list()  
    context = {'e_list': e_list}
    template = self.get_jinja2_env.get_template('super/events.html')    
    self.response.out.write(template.render(context)) 
    
  def post(self):
    title=self.request.get('title')
    description=self.request.get('description')
    religion=self.request.get_all('religion')
    gender=self.request.get_all('gender')
    all_age=self.request.get('all_age')
    from_age=self.request.get('from_age')
    to_age=self.request.get('to_age')
    image_file = self.request.POST.get('pic', None)
    file_obj = self.request.get('pic', None)   
    
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')
    file_name = image_file.filename    
    bucket_path = '/design_variation/event/%s' %(file_name)
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')
    
    e = EventMaster()
    if all_age:  
      e.all_age = True
    e.bucket_key = bucket_key
    e.description = description
    try:
      from_age = int(from_age)
      to_age = int(to_age) + 1
      age_list = []
      for i in range(from_age, to_age):
        age_list.append(i)
      e.age_list = age_list if age_list else [0]  
    except Exception:
      pass
    e.gender = gender
    e.img_url = serving_url
    e.religion = religion
    e.title = title
    e.date = get_date_from_str(self.request.get('event_date'))
    e.start_date = get_date_from_str(self.request.get('event_start_date'))
    e.end_date = get_date_from_str(self.request.get('event_end_date'))
    e.put()
    
    data_dict = {'title': e.title,
                 'description': e.description,
                 'img_url': e.img_url
                 }
    return json_response(self.response, data_dict, SUCCESS, 'Event created')  

class EventSequenceSet(ActionSupport):
  def post(self):
    d = self.request.get('data')        
    d = json.loads(d)
    e_list = []
    active_list = []
    for e in EventMaster.get_client_view():
      e.seq_selected  = False
      active_list.append(e)
      
    if active_list:
      ndb.put_multi(active_list) 
      active_list = []
         
    for k, i in d.items():
      e = ndb.Key(urlsafe=k).get()
      e.seq_selected = True
      e.seq_num = i
      e_list.append(e)
      
    if e_list:
      ndb.put_multi(e_list)        
      e_list=[]
    return json_response(self.response, {}, SUCCESS, 'Event sequence updated')  

class UploadTest(ActionSupport):    
  def get(self):     
    template = self.get_jinja2_env.get_template('super/test_upload.html')    
    self.response.out.write(template.render({})) 
    
  def post(self):   
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')     
        
    file_name = image_file.filename    
    bucket_path = '/designer_textptrn/static_image/%s' %(file_name)
    bucket_path = bucket_path.lower()
    upload_file(file_obj, bucket_path)
    serving_url=''
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key) 
      e = StaticImage.get_obj()
      e.img_url.append(serving_url)
      e.put() 
    except Exception, msg:
      logging.error(msg)  
      
    return json_response(self.response, 
                         {'serving_url': serving_url, },
                         SUCCESS,
                         'Product background uploaded')  
    
class CustomDesign(ActionSupport):   
  def get(self):   
    cat_list = DesignCategory.get_list()
    sub_list = DesignSubCategory.get_list()    
    d = {'cat_list': cat_list, 'sub_list': sub_list}  
    template = self.get_jinja2_env.get_template('super/customDesing.html')    
    self.response.out.write(template.render(d)) 
    
class DesignCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title')  
    e = DesignCategory()
    e.title = title
    e = e.put().get()  
    data_dict = {'title': title,
                 'key': e.entityKey}
    return json_response(self.response, data_dict, SUCCESS, 'Category created')
      
class DesignSubCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title')
    category = self.request.get('category')
    cat = ndb.Key(urlsafe=category).get()
    e = DesignSubCategory()
    e.category = cat.key
    e.category_name = cat.title
    e.category_urlsafe = category
    e.title = title
    e = e.put().get()
    data_dict = {'title': title,
                 'category': cat.title,
                 'category_key': category,
                 'key': e.entityKey}      
    return json_response(self.response, data_dict, SUCCESS, 'Sub-Category created')
          
class UploadDesignImage(ActionSupport):
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
    
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
            
    file_name = image_file.filename    
    bucket_path = '/design_variation/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')  
    
    
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
    e.img_url.append(serving_url)
    e.bucket_key.append(bucket_key)
    e.bucket_path.append(bucket_path)
    e.img_title.append(self.request.get('title'))
    e.put()
    return json_response(self.response, {}, SUCCESS, 'Success')

class Ledger(ActionSupport):
  def get(self):    
    seller_list = Seller.get_list()  
    now = datetime.datetime.now() 
    now = get_dt_by_country(now, 'KE')
    today = now.strftime('%d-%m-%Y')
    today_date = now.date()  
    
    d = {'seller_list': seller_list,
         'dt': today,
         'seller_ladger_list': SellerLadger.get_filtered_list(today_date, today_date)}
    template = self.get_jinja2_env.get_template('super/ledger.html')    
    self.response.out.write(template.render(d)) 

class ManageUserStatus(ActionSupport):
  def get(self): 
    message = ''
    k = self.request.get('k')  
    status = self.request.get('status')  
    e = ndb.Key(urlsafe=k).get()
    if status:
      e.active=True
    else:  
      e.active=False
    e.put()
           
    return json_response(self.response, {'k':k, 'status': status}, SUCCESS, message)  

class UserAccount(ActionSupport):
  def get(self):  
    if self.user_obj.role != "ADMIN":
      self.abort(401)      
    user_list = UserModel.get_list()  
    d={'user_list': user_list,
       'ROLE_LIST': ROLE_LIST}      
    template = self.get_jinja2_env.get_template('super/user.html')    
    self.response.out.write(template.render(d)) 
  
  def post(self): 
    if self.user_obj.role != "ADMIN":
      self.abort(401)
    user_name = self.request.get('user_name')  
    email = self.request.get('email').lower().strip()  
    role = self.request.get('role').upper()
      
    if not email or email.__len__()<5 or '@' not in email:
      return json_response(self.response, {}, ERROR, 'Email invalid')
    
    if UserModel.get_by_email(email):
      return json_response(self.response, {}, ERROR, 'Email exist')
    e = UserModel()
    e.email = email
    e.name = user_name
    e.role = role
    if role != 'ADMIN':
      r = RoleModel.get_by_role(role)
      e.acl = r.acl
    e.put()
    data_dict = {'user_name': user_name,
                 'email': email,
                 'role': role}
    
    return json_response(self.response, data_dict, SUCCESS, 'User account created')
    
class UpdateRoleSettings(ActionSupport): 
  def post(self):  
    if self.user_obj.role != "ADMIN":
      self.abort(401)   
    role = self.request.get('role').upper() 
    if not role or role not in ['ACCOUNT', 'DESIGN', 'PRODUCTION', 'STORE']:
      return json_response(self.response, {}, ERROR, 'Role invalid')

    e = RoleModel.get_by_role(role)
    e.acl = self.prepare_acl()
    e.put()
    
    return json_response(self.response, {}, SUCCESS, 'Role setting updated')   

  def prepare_acl(self):
    
    binary_string = ''   
    binary_string += '1' if self.request.get('events') else '0'
    binary_string += '1' if self.request.get('products') else '0'
    binary_string += '1' if self.request.get('custom_design') else '0'
    binary_string += '1' if self.request.get('seller') else '0'
    binary_string += '1' if self.request.get('ledger') else '0'
    binary_string += '1' if self.request.get('order') else '0'
    binary_string += '1' if self.request.get('order_stage') else '0'
    binary_string += '1' if self.request.get('themes') else '0' 
    
    binary_string = binary_string[::-1] #reverse binary string
    acl = get_integer_from_binary_string(binary_string)
    return acl  

class GetRoleSettings(ActionSupport): 
  def get(self):
    role = self.request.get('role').upper()
    e = RoleModel.get_by_role(role)
    acl = get_64bit_binary_string_from_int(e.acl)
    data_dict = {'acl': acl}
    return json_response(self.response, data_dict, SUCCESS, 'Access right loaded')

class GetMailTemplates(ActionSupport):    
  def get(self):
    template_type=self.request.get('t')  
    message = 'Create new template'
    data_dict ={'key': '',
                'subject': '',
                'template_type': template_type, 
                'header_img': '', 
                'bg_img':'',
                'padding_bottom':'30',
                'padding_top':'30'}
    e=MailTemplateModel.get_template(template_type)
    if e:
      data_dict['key'] = e.entityKey    
      data_dict['subject'] = e.subject    
      data_dict['template'] = e.template    
      data_dict['header_img'] = e.header_img    
      data_dict['bg_img'] = e.bg_img    
      data_dict['padding_top'] = e.padding_top    
      data_dict['padding_bottom'] = e.padding_bottom    
      data_dict['codeline_html'] = e.codeline_html  
      message = 'Template loads'  
    return json_response(self.response, data_dict, SUCCESS, message)

  def post(self):
    template_type=self.request.get('template_type')  
    key=self.request.get('key')  
    codeline=self.request.get('codeline')  
    template=self.request.get('template')   
    subject=self.request.get('subject')   
    
    e = MailTemplateModel(template_type=template_type)
    if key:
      e = ndb.Key(urlsafe=key).get()
     
    e.codeline_html = codeline
    e.subject = subject
    e.template = template  
    e.padding_top = self.request.get('padding_top')
    e.padding_bottom = self.request.get('padding_bottom')
    e.header_img = self.request.get('header_img')
    e.bg_img = self.request.get('bg_img')
    e = e.put().get()
    data_dict = {'key': e.entityKey}
    return json_response(self.response, data_dict, SUCCESS, 'Mail template saved')      

class MailTemplates(ActionSupport):    
  def get(self):
    MAIL_TEMPLATE_CHOICES = config.get('MAIL_TEMPLATE_CHOICES')  
    d={'upload_list': MailUploads.get_list(),
       'MAIL_TEMPLATE_CHOICES': MAIL_TEMPLATE_CHOICES,}  
    template = self.get_jinja2_env.get_template('super/mailtemplates.html')    
    self.response.out.write(template.render(d))     
    
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
        
    file_name = image_file.filename    
    bucket_path = '/mail_upload/%s' %(file_name)
    bucket_path = bucket_path.lower()  
  
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')  
  
    e = MailUploads()
    e.serving_url = serving_url
    e.bucket_key = bucket_key
    e.bucket_path = bucket_path
    e.put()
    return json_response(self.response, {'serving_url': serving_url 
                                         },
                         SUCCESS, 'uploads')  


class ClientLogsSearch(ActionSupport):
  def get(self):    
    dt= get_date_from_str(self.request.get('dt'))
    data = {'log_list': ClientLogs.get_list(dt)}
    template = self.get_jinja2_env.get_template('super/client_log_search.html')
    html = template.render(data)
    
    return json_response(self.response,
                         {'html': html},
                         SUCCESS,
                         'Search result')        

import webapp2         
body='''
<h2>test</h2>'''
class Test(webapp2.RequestHandler):    
  def get(self):  
    #e = ndb.Key(urlsafe='ahBpfmxpbmstaXQtcG9ydGFschQLEgdQcm9kdWN0GICAgICdipYKDA').get()
    #e.default_design_template = 'card_designer'
    #e.put()
    #mail_sender('appboxtechnologies@gmail.com', 'subject', body)
    #self.response.out.write('200')     
    e = UserModel() 
    e.email='appboxtechnologies@gmail.com'
    e.name='Appbox Tech'
    e.role='ADMIN'
    e.put()
    self.response.content_type = 'application/json'
    result = {'status' : 'SUCCESS',
            'data': {'key1': 'value1', 'k2': 375},
            'message': 'message strong'}
    
    self.response.out.write(json.dumps(result)) 
    
MAIN_PAGE_HTML = """\
<html>
  <body>
    <form action="/superadmin/Python" method="post">
      <div><textarea name="content" rows="3" cols="60"></textarea></div>
      <div><input type="submit" value="Execute"></div>
    </form>
  </body>
</html>
"""
 

class SuperAdminPython(ActionSupport): 
  def get(self):
    if self.user_obj.email!='appboxtechnologies@gmail.com':
      return ''
    self.response.write(MAIN_PAGE_HTML)
      
  def post(self):
    if self.user_obj.email!='appboxtechnologies@gmail.com':
      return ''
    mycode = self.request.get('content')
    exec mycode 
    self.response.write(MAIN_PAGE_HTML)    

    
class ProductDiscountsHandler(ActionSupport):
  def get(self):
    prd_list=Product.get_product_list()  
   
    context={'prd_list': prd_list
             }
    template = self.get_jinja2_env.get_template('super/Discount.html')    
    self.response.out.write(template.render(context))
 
  def post(self):
    newEntry=True
    k = self.request.get('k')  
    pk = self.request.get('pk')
    qty = int(self.request.get('qty'))
    discount = float(self.request.get('discount'))
    pkey = ndb.Key(urlsafe=pk)
    text='New discount created'
    e = ProductDiscount(product=pkey, p_key=pk)
    
    if k:
      newEntry=False
      e = ndb.Key(urlsafe=k).get()
      text='Discount updated'
    e.qty = qty 
    e.discount=discount
    k = e.put() 
    d ={'k': k.urlsafe(),
        'qty': qty,
        'discount': discount,
        'newEntry': newEntry} 
    return json_response(self.response, d, SUCCESS, text)


class GetProductDiscountList(ActionSupport):
  def get(self):    
    d_list=[]  
    for e in ProductDiscount.get_product_discount_list(ndb.Key(urlsafe = self.request.get('k'))):
      d_list.append({
            'k': e.entityKey,
            'qty': e.qty,
            'discount': e.discount
          })
    return json_response(self.response, d_list, SUCCESS, 'Product discount loaded')
      