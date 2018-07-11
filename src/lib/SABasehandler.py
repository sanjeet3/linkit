'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.app_configration import config

import os 
import webapp2
import jinja2

from google.appengine.api import users

class ActionSupport(webapp2.RequestHandler):
  '''
     Action support for all requests in app
  '''
  
  def __init__(self, request, response):
    
    self.initialize(request, response)
    self.user = users.get_current_user()
    unauthorize=True
    if self.user and self.user.email() in config['super_admin']:
      unauthorize = False     
    if unauthorize:
      self.request_unauthorize(request)    
        
  def dispatch(self):
    webapp2.RequestHandler.dispatch(self) 
    
  @webapp2.cached_property
  def get_jinja2_env(self):  
    environment = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), '..')), extensions=['jinja2.ext.do',],
        autoescape=True)
    return environment    

  @webapp2.cached_property
  def get_context(self):
    return {'logout_url': users.create_logout_url('/'),
            'email': self.user.email(),
            }
    
  def request_unauthorize(self, request):
    self.abort(401)  