'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

import os
import logging
import webapp2
import jinja2

class ActionSupport(webapp2.RequestHandler):
  '''
     Action support for all requests in app
  '''
  
  def __init__(self, request, response):
    
    self.initialize(request, response)
    
  def dispatch(self):
    webapp2.RequestHandler.dispatch(self) 
    
  @webapp2.cached_property
  def get_jinja2_env(self): 
    msg=os.path.join(os.path.dirname(__file__), '..')
    logging.info(msg)  
    environment = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), '..')), extensions=['jinja2.ext.do',],
        autoescape=True)
    return environment    