'''
Created on 19-Jul-2018

@author: Sanjay Saini
'''

import src.lib.external.cloudstorage as gcs

import logging

import cgi
import mimetypes

from google.appengine.ext import blobstore
from google.appengine.api import images
from google.appengine.api import search

def upload_image_to_bucket(file_obj, bucket_path): 
  """upload file to bucket.

    The retry_params specified in the open call will override the default
    retry params for this particular file handle.

    Arguments:
      file_obj: file object
      bucket_path: file name
      
    Return:
      str: image serving url
      str: bucket key  
  """
  logging.info('uploading_file_to_bucket %s\n' % bucket_path)
  content_type = mimetypes.guess_type(bucket_path)[0]
    
  if not content_type:
    logging.warning('Mimetype not guessed for: %s', bucket_path)
            
  write_retry_params = gcs.RetryParams(backoff_factor=1.1)
  try:
    with gcs.open(bucket_path,
                  'w',
                  content_type=content_type,
                  options={b'x-goog-acl': b'public-read'}) as f:
      f.write(file_obj)
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    return serving_url, bucket_key
  except Exception, e:
    raise Exception('Blob write failed for %s, exception: %s. Additional info was logged' % (bucket_path, str(e)))
  
  return '', ''

def delete_bucket_file(bucket_key):
  try:  
    blobstore.delete(bucket_key)
    return True
  except Exception, e:
    logging.error(e) 
    return False   
      
        