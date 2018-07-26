'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Client

import os
import logging
import webapp2
import jinja2
from webapp2_extras import auth
from webapp2_extras import sessions
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError
from oauth2client.client import GoogleCredentials

class ActionSupport(webapp2.RequestHandler):
  '''
     Action support for all requests in app
  '''
  
  def __init__(self, request, response):
    
    self.initialize(request, response)
    self.client = None
    user_session = self.auth.get_user_by_session()  
    if user_session:
      self.client = Client.get_active_client_by_email(user_session['username'])
          
  def dispatch(self):
    # Get a session store for this request.
    self.session_store = sessions.get_store(request=self.request)    
    try:
      # Dispatch the request.
      webapp2.RequestHandler.dispatch(self)
    finally:
      # Save all sessions.
     self.session_store.save_sessions(self.response)

  @webapp2.cached_property
  def session(self):
    # Returns a session using the default cookie key.
    return self.session_store.get_session()
    
      # Webapp2 auth validation implementation ''''
  @webapp2.cached_property
  def auth(self):
    """Shortcut to access the auth instance as a property."""
    return auth.get_auth()

  @webapp2.cached_property
  def user_session_model(self):
    """Returns the implementation of the user model.

    It is consistent with config['webapp2_extras.auth']['UserSession'], if set.
    """    
    return self.auth.store.user_model     
    
  @webapp2.cached_property
  def get_jinja2_env(self):  
    environment = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), '..')), extensions=['jinja2.ext.do',],
        autoescape=True)
    return environment    