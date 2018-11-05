'''
Created on 25-Jul-2018

@author: Sanjay Saini
'''

from src.app_configration import config

import json, logging, os, datetime

import jinja2
import webapp2
#task queue
from google.appengine.api import mail
from google.appengine.api import taskqueue
from jinja2 import Environment, BaseLoader
from src.Database import MailTemplateModel
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
    logging.info(self.request) 
    e = MailTemplateModel.get_template('Account Verification')
    if not e:
      logging.warning('Account Verification Mail template NA')
      return
    
    receiver_email = self.request.get('receiver_mail')
    y = datetime.datetime.now().strftime('%Y')
    d = {'receiver_mail': receiver_email,
         'name': self.request.get('name'),
         'key': self.request.get('key'),
         'year': y}
    verfy_url = 'https://www.craftyourchoice.com/ActivateAccount?key=%s' %(self.request.get('key'))
    template_str = e.template
    template_str = template_str.replace('[VERIFICATIONLINK]', verfy_url)
    template_str = template_str.replace('[USERNAME]', self.request.get('name'))
    template_str = template_str.replace('[USEREMAIL]', receiver_email)
    template = Environment(loader=BaseLoader).from_string(template_str) 
    html_str = template.render(d)
    subject = e.subject if e.subject else 'Please verify your craft your choice account'
    mail_sender(receiver_email, subject, html_str)
    
    logging.info('verify_email_account_complete')

class WelcomeMailer(webapp2.RequestHandler):
  def post(self):
    logging.info('welocme_email_account_start') 
    logging.info(self.request) 
    e = MailTemplateModel.get_template('Welcome Mail')
    if not e:
      logging.warning('Welcome Mail template NA')
      return
    
    receiver_email = self.request.get('receiver_mail')
    y = datetime.datetime.now().strftime('%Y')
    d = {'receiver_mail': receiver_email,
         'name': self.request.get('name'),
         'key': self.request.get('key'),
         'year': y}
    crafty = 'https://www.craftyourchoice.com'
    template_str = e.template
    template_str = template_str.replace('[CRAFTY]', crafty)
    template_str = template_str.replace('[USERNAME]', self.request.get('name'))
    template_str = template_str.replace('[USEREMAIL]', receiver_email)
    template = Environment(loader=BaseLoader).from_string(template_str) 
    html_str = template.render(d)
    subject = e.subject if e.subject else 'Welcome to craft your choice'
    mail_sender(receiver_email, subject, html_str)
    
    logging.info('welcome_email_account_complete')

class OrderApproveMailer(webapp2.RequestHandler):
  def post(self):
    logging.info('order_approve_email_account_start') 
    logging.info(self.request) 
    e = MailTemplateModel.get_template('On Order Approve')
    if not e:
      logging.warning('Welcome Mail template NA')
      return
    
    receiver_email = self.request.get('receiver_mail')
    y = datetime.datetime.now().strftime('%Y')
    d = {'receiver_mail': receiver_email,
         'name': self.request.get('name'),
         'key': self.request.get('key'),
         'year': y}
    template_str = e.template
    template_str = template_str.replace('[ORDERNUMBER]', self.request.get('order_number'))
    template_str = template_str.replace('[ORDERAMT]', self.request.get('order_amt'))
    template_str = template_str.replace('[USERNAME]', self.request.get('name'))
    template_str = template_str.replace('[USEREMAIL]', receiver_email)
    template = Environment(loader=BaseLoader).from_string(template_str) 
    html_str = template.render(d)
    subject = e.subject if e.subject else 'Your order craft your choice'
    subject = subject.replace('[ORDERNUMBER]', self.request.get('order_number'))
    mail_sender(receiver_email, subject, html_str)
    
    logging.info('welcome_email_account_complete')
    
app = webapp2.WSGIApplication([
    ('/taskqueue/VerifyAccountMailer', VerifyAccountMailer), 
    ('/taskqueue/WelcomeMailer', WelcomeMailer), 
    ('/taskqueue/OrderApproveMailer', OrderApproveMailer), 
    
    ], debug=True)
         

