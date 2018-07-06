'''
Created on 06-Jul-2018

@author: Sanjay Saini
'''

from src.api.baseapi import json_response, SUCCESS, ERROR
from src.lib.FRBasehandler import ActionSupport

import datetime

class Home(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('franchisor/base.html')    
    self.response.out.write(template.render({})) 

class Product(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('franchisor/Products.html')    
    self.response.out.write(template.render({})) 

class Order(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('franchisor/Order.html') 
    today = datetime.datetime.now().strftime('%d-%m-%Y')
       
    self.response.out.write(template.render({'dt': today})) 