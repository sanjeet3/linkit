'''
Created on 04-Jul-2018

@author: Sanjay Saini '''

from src.api.baseapi import json_response, SUCCESS, ERROR
from src.lib.SABasehandler import ActionSupport
 
import logging, datetime

class Home(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('super/base.html')    
    self.response.out.write(template.render({}))      
     
class Frenchise(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('super/Frenchise.html')    
    self.response.out.write(template.render({}))      
     
class Products(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('super/Products.html')    
    self.response.out.write(template.render({}))

class SaveProducts(ActionSupport):
  def post(self):          
    code=self.request.get('code')
    name=self.request.get('name')
    size=self.request.get('size')
    price=float(self.request.get('price'))
    category=self.request.get('category')
    uom=self.request.get('uom')
    description=self.request.get('description') 
    data_dict={'code':code,
    'name': name,
    'size':size,
    'category': category,
    'price': price,
    'uom': uom,
    'description': description, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product %s saved' %(name))

class SaveProductsUOM(ActionSupport):
  def post(self):           
    uom=self.request.get('uom').upper() 
    data_dict={ 
    'name': uom, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product UOM %s saved' %(uom))

class SaveProductsCategory(ActionSupport):
  def post(self):           
    category=self.request.get('category').upper() 
    data_dict={ 
    'name': category, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product category %s saved' %(category))



class SaveFrenchise(ActionSupport):
  def post(self):          
    person=self.request.get('person')
    name=self.request.get('name')
    email=self.request.get('email')
    telephone=float(self.request.get('telephone'))
    mobile=self.request.get('mobile')
    geo=self.request.get('geo')
    address=self.request.get('address') 
    data_dict={'person':person,
    'name': name,
    'email':email,
    'telephone': telephone,
    'mobile': mobile,
    'geo': geo,
    'address': address, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Seller %s account created' %(email))
     
class Order(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('super/Order.html') 
    today = datetime.datetime.now().strftime('%d-%m-%Y')
       
    self.response.out.write(template.render({'dt': today}))
