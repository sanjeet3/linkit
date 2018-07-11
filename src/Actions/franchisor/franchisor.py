'''
Created on 06-Jul-2018

@author: Sanjay Saini
'''

from src.api.baseapi import json_response, SUCCESS, ERROR
from src.Database import SellerProduct
from src.lib.FRBasehandler import ActionSupport

import datetime

from google.appengine.ext import ndb

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
    template = self.get_jinja2_env.get_template('franchisor/Order.html') 
    today = datetime.datetime.now().strftime('%d-%m-%Y')
       
    self.response.out.write(template.render({'dt': today})) 