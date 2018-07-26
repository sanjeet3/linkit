'''
Created on 25-Jul-2018

@author: Sanjay Saini
'''

from src.app_configration import config

import json, logging, os

import jinja2
import webapp2
#task queue
from google.appengine.api import mail
from google.appengine.api import taskqueue

sender_address = config.get('emailsender')

envmnt = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), '..')), extensions=['jinja2.ext.do',],
        autoescape=True)


def mail_sender(receiver_email, subject, body, file_name=None, content=None):
  logging.info(body)  
  try:
    if file_name:
      mail.send_mail(sender_address, receiver_email, subject, body, html= body,
                     attachments=[(file_name, content)])
      logging.info('Mail_sent_to : %s' %(receiver_email))
    else:      
      mail.send_mail(sender_address, receiver_email, subject, body, html=body)
      logging.info('Mail_sent_to : %s' %(receiver_email))
  except Exception as e:
    logging.error(e)  

class VerifyAccountMailer(webapp2.RequestHandler):
  def post(self):
    logging.info('verify_email_account_start')  
    receiver_email = self.request.get('receiver_mail')
    d = {'receiver_mail': receiver_email,
         'name': self.request.get('name'),
         'key': self.request.get('key')}
    
    logging.info(self.request) 
    
    template = envmnt.get_template('endclient/account_verify_mailer.html')    
    html_str = template.render(d)
    subject = 'Please verify your custom branding account'
    mail_sender(receiver_email, subject, html_str)
    
    logging.info('verify_email_account_complete')
    
app = webapp2.WSGIApplication([
    ('/taskqueue/VerifyAccountMailer', VerifyAccountMailer), 
    
    ], debug=True)
         

