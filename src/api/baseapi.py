'''
Created on 05-Jul-2018

@author: Sanjay Saini
'''
import json
import logging

SUCCESS='SUCCESS'
ERROR='ERROR'
WARNING='WARNING'
INFO='INFO'

def json_response(response, data_dict={}, status=SUCCESS, message=''):  
  ''' Response json string '''
    
  response.content_type = 'application/json'
  result = {'status' : status,
            'data': data_dict,
            'message': message}
    
  response.out.write(json.dumps(result))

def get_64bit_binary_string_from_int(number):
  return  '{0:064b}'.format(number)  
   
  
def get_integer_from_binary_string(binary_string):
  return int(binary_string, 2)   