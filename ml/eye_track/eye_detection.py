import cv2

class EyeDetectionTicker():
   def __init__(self):
      # self.face_cascade = cv2.CascadeClassifier('pretrained/haarcascades/haarcascade_frontalface_alt.xml')
      self.eye_cascade = cv2.CascadeClassifier('pretrained/haarcascades/haarcascade_eye_tree_eyeglasses.xml')
      
   def detect_eyes(self, face):
      face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
      
      eyes = self.eye_cascade.detectMultiScale(face)
      return [] if eyes is None else eyes