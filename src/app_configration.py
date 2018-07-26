'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

config={
    # webapp2 sessions
    'webapp2_extras.sessions': {'secret_key': '07c45ee19b5109a60d5fbe9c88e55a031f4875l'},
    'webapp2_extras.auth': {'user_model': 'src.Database.UserSession',
                            'user_attributes': ['username']},
    # application name
    'app_name': "linkit",
    
    # send error emails to developers
    'send_mail_developer': True,
    
    # default email as sender
    'emailsender': 'sainisanjeet3@gmail.com', 
    
    'app_lang': 'en',
    'design_img_title': ['BASE', 'LEFT', 'CENTER', 'RIGHT'],
    
    'super_admin': ['care4growth@gmail.com',
                    'badalvpatel1980@gmail.com',
                    'sainisanjeet3@gmail.com',
                    'ballucorp@gmail.com',
                    'balvinder.kumar913@gmail.com'],
    
    }
 