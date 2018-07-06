'''
Created on 05-Jul-2018

@author: Sanjay Saini
'''
import json

SUCCESS='SUCCESS'
ERROR='ERROR'

def json_response(response, data_dict={}, status=SUCCESS, message=''):  
  ''' Response json string '''
    
  response.content_type = 'application/json'
  result = {'status' : status,
            'data': data_dict,
            'message': message}
    
  response.out.write(json.dumps(result))
