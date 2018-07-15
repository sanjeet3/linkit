'''
Created on 06-Jul-2018

@author: Sanjay Saini
'''

from src.api.baseapi import json_response, SUCCESS, ERROR
from src.Database import SellerProduct, SellerOrder
from src.lib.FRBasehandler import ActionSupport

import datetime

from google.appengine.ext import ndb
from src.api.datetimeapi import get_dt_by_country, get_date_from_str

class Home(ActionSupport):
  def get(self):
    context = self.get_context  
    template = self.get_jinja2_env.get_template('franchisor/base.html')    
    self.response.out.write(template.render(context)) 

class Product(ActionSupport):
  def get(self):
    product_list = SellerProduct.get_seller_product_list(self.seller.key) 
    template = self.get_jinja2_env.get_template('franchisor/Products.html')    
    self.response.out.write(template.render({'product_list': product_list})) 

class ProductRetailPriceEdit(ActionSupport):
  def get(self): 
    prod=ndb.Key(urlsafe=self.request.get('key')).get()  
    prod.retail_price=float(self.request.get('retailPrice'))   
    prod.put()
    
    return json_response(self.response,
                         {'key': self.request.get('key')},
                         SUCCESS, 
                         'Retail price updated')
      
class Order(ActionSupport):
  def get(self):
    now = datetime.datetime.now()
    now = get_dt_by_country(now, 'KE')
    today_date = now.date()   
    today = now.strftime('%d-%m-%Y')
    order_list = SellerOrder.get_order_filetered(today_date,
                                                 today_date,
                                                 [self.seller.key]) 
     
    template = self.get_jinja2_env.get_template('franchisor/Order.html') 
       
    self.response.out.write(template.render({'dt': today,
                                             'order_list': order_list})) 
    
class OrderSearch(ActionSupport):
  def post(self):
    start= get_date_from_str(self.request.get('start'))
    end=get_date_from_str(self.request.get('end'))
    order_list = SellerOrder.get_order_filetered(start,
                                                 end,
                                                 [self.seller.key])      
    data = {'order_list': order_list}
    template = self.get_jinja2_env.get_template('franchisor/ordersearch.html')
    html = template.render(data)
    
    return json_response(self.response,
                         {'html': html},
                         SUCCESS,
                         'Order search result')