'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product, Seller, SellerProduct, SellerOrder
from src.Database import Client
from src.lib.ECBasehandler import ActionSupport
 
import logging, time 
from uuid import uuid1
import json
from src.api.baseapi import json_response, SUCCESS, ERROR
from src.api.datetimeapi import get_dt_by_country
import datetime

from google.appengine.ext import ndb
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError



class Register(ActionSupport): 
  def post(self):  
    data_dict = {}  
    name = self.request.get('name')
    email = self.request.get('email')
    password = self.request.get('password')
    contact = self.request.get('contact') 
    if not email or '@' not in  email or email.__len__()<5:
      return json_response(self.response, data_dict, ERROR, 'Invalid email')
  
    if Client.verify_email(email):
      return json_response(self.response, data_dict, ERROR, 'Email account exist')    
    
    e = Client()
    e.status=True
    e.email=email
    e.name=name
    e.telephone=contact
    e.password=password 
    e.alert = True if self.request.get('recieved_offers') else False
    e.put()
    data_dict['email']=email    
    return json_response(self.response, data_dict, SUCCESS, '%s account created' %(email))
    
class Login(ActionSupport): 
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/loginerror.html')    
    self.response.out.write(template.render({'msg': 'Kindly fill login details'}))    
      
  def validate_login_detail(self):
    self.valid_credential = True     
    email = self.request.get('email').lower()
    password =  self.request.get('password').lower()
    if email.__len__() < 5:
      self.valid_credential = False
      self.msg = 'invalid email: minimum 5 char'       
    if password.__len__() < 5:
      self.valid_credential = False    
      self.msg = 'invalid password: minimum 5 char'
      
  def post(self):
    logging.info('Validating log-in!')
    user = None
    email = self.request.get('email').lower()
    password =  self.request.get('password').lower()
    self.validate_login_detail()
    if self.valid_credential:
      user  = Client.validate_active_client(email, password)
      self.msg = 'invalid email or password'
    sesion_success = False
    if user:
      sesion_success = True    
      if not self.validate_in_session(email, password):
        if not self.register_and_validate(email, password): 
          self.msg = 'Please try again' 
          sesion_success = False
    
    if sesion_success:
      return self.redirect('/')      
    else:
      template = self.get_jinja2_env.get_template('endclient/loginerror.html')    
      self.response.out.write(template.render({'msg': self.msg}))   
    
  def validate_in_session(self, user_name, password):
    ''' Validate User in Webapp2.model.user '''  
    #logging.info('validating User: %s, Password:%s' % (user_name, password))  
    try:
      u = self.auth.get_user_by_password(user_name,
                                         password,
                                         remember=True,
                                         save_session=True)
      logging.info(u) 
    except (InvalidAuthIdError, InvalidPasswordError) as e:
      logging.info('login_failed for user %s because of %s', user_name, type(e))
      return None
    
    return u  

  def register_and_validate(self, email, password):
    ''' Register New User in Webapp2.model.user 
        def user_session_model.create_user(cls, auth_id, unique_properties=None, **user_values)
    '''
    logging.info('Registering')
    user_data = [False]  
    try: 
      user_data = self.user_session_model.create_user(email,
                                                      username = email,                    
                                                      password_raw=password,
                                                      verified=False)
      logging.info(user_data)
    except Exception, e:
      logging.info(e)    
    
    if user_data[0]:
      time.sleep(2)    
             
    try:
      logging.info('Get User by password')  
      u = self.auth.get_user_by_password(email,
                                         password,
                                         remember=True,
                                         save_session=True)
      #logging.info(u) 
    except (InvalidAuthIdError, InvalidPasswordError) as e:
      logging.info('register_failed for user %s because of %s', email, type(e))
      return None
    
    return u

           
class Logout(ActionSupport):
  def get(self):
    #logout from session
    self.auth.unset_session()     
    return self.redirect('/')   

class Home(ActionSupport):
  def get(self):
    product_list = Product.get_selling_product_list()  
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.out.write(template.render({'product_list': product_list,
                                             'user_obj': self.client}))
    
    
class GetProductDetails(ActionSupport):
  def get(self):
    p = ndb.Key(urlsafe=self.request.get('key')).get()
    seller_dict = Seller.get_key_obj_dict()
    seller_product_list = SellerProduct.get_product_by_master_key_for_client(p.key)
    
    template = self.get_jinja2_env.get_template('endclient/product_datails.html')    
    self.response.out.write(template.render({'p': p,
                                             'seller_product_list': seller_product_list,
                                             'seller_dict': seller_dict}))

QUANTITY_ERROR='''
'<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;width: 100%;">
  <p>Please choose minimum quantity 1 for place order</p>
  <br>
  <button type="button" onclick="[ONCLICK]"
      class="btn btn-sm btn-primary btn-white btn-round btn-mini">
      <i class="ace-icon fa fa-refresh"></i> Reset Quantity
    </button>
<div>
'''

class OrderStageFirst(ActionSupport):
  def get(self):
    seller = Seller()
    product = SellerProduct()  
    qty = int(self.request.get('qty'))
    if qty < 1:
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backFromOrderStageFirst()')  
      return self.response.out.write(HTML)  
      
    product = ndb.Key(urlsafe=self.request.get('product')).get()
    seller = product.seller.get()
    
    template = self.get_jinja2_env.get_template('endclient/product-buy-stage1.html')    
    self.response.out.write(template.render({'product': product,
                                             'seller': seller,
                                             'qty': qty
                                             }))

class PlaceOrder(ActionSupport):
  def post(self):
    seller = Seller()
    master_product = Product()
    product = SellerProduct()  
    qty = int(self.request.get('qty'))   
    if qty < 1:
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backFromOrderStageFirst()')  
      return json_response(self.response, {'html': HTML}, 'ERROR', 'Item quantity missing') 
     
    client_name = self.request.get('client_name')
    client_mobile = self.request.get('client_mobile')
    client_email = self.request.get('client_email')
    card_number = self.request.get('card_number')
    name_on_card = self.request.get('name_on_card')
    cvv_number = self.request.get('cvv_number')
    cdt=datetime.datetime.now()
    ldt=get_dt_by_country(cdt, 'KE')
    logging.info(ldt)  
    history_list = []  
    product = ndb.Key(urlsafe=self.request.get('product')).get()
    seller = product.seller.get()  
    order = SellerOrder()
    order.date = ldt.date()
    order.qty = qty
    order.amount = qty*product.retail_price
    order.category = product.category
    order.client_name = client_name
    order.code = product.code
    order.description = product.description
    order.email = client_email
    order.master_price = product.master_price
    order.master_product = product.master_product
    order.master_product_urlsafe = product.master_product_urlsafe
    order.name = product.name
    order.retail_price = product.retail_price
    order.seller = seller.key
    order.seller_email = seller.email
    order.seller_name = seller.name
    order.seller_urlsafe = seller.entityKey
    order.size = product.size
    order.status = 'Ordered'
    order.phone = client_mobile
    order.uom = product.uom
    order.payed =True
    order.payment_ref = str(uuid1(123456789))
    order.order_number = order.payment_ref.replace('-','').upper()[:10]
    history_list.append({'status': order.status,
                         'qty': qty,
                         'retail_price': product.retail_price,
                         'price': product.master_price,
                         'amount': order.amount,
                         'time': ldt.strftime('%I:%M %p'),
                         'date': ldt.strftime('%I:%M %p'),
                         })
    order.history = json.dumps(history_list) 
    order.put()
    
    
    data={'order': order,
          'product': product,
          'seller': seller}
    template = self.get_jinja2_env.get_template('endclient/order-success.html') 
    html_str = template.render(data)   
    return json_response(self.response, {'html': html_str}, SUCCESS, 'Payment success')
                            

class CreateDesign(ActionSupport):
  def get(self):
    product_list = Product.get_selling_product_list()  
    template = self.get_jinja2_env.get_template('endclient/customDesign.html')    
    self.response.out.write(template.render({}))                            
                            
                            