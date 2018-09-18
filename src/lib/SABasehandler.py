'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.app_configration import config
from src.api.baseapi import get_64bit_binary_string_from_int 
from src.Database import UserModel
import os 
import webapp2
import jinja2
from google.appengine.api import users

ALL_PERMISSION_BIN = '1111111111111111111111111111111111111111111111111111111111111111'

class ActionSupport(webapp2.RequestHandler):
  '''
     Action support for all requests in app
  '''
  
  def __init__(self, request, response):
    
    self.initialize(request, response)
    self.user = users.get_current_user()
    unauthorize=True
    self.user_obj = UserModel.get_active_by_email(self.user.email())
    if self.user_obj:
      if self.user_obj.role == "ADMIN":
        self.permission = ALL_PERMISSION_BIN  
      else:
        self.permission = get_64bit_binary_string_from_int(self.user_obj.acl) 
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
            'user': self.user_obj,
            'permission':self.permission,
            }
    
  def request_unauthorize(self, request):
    self.abort(401)  
    
