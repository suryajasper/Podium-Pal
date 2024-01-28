"""
This code uses the pytorch model to detect faces from live video or camera.
"""
import torch

import cv2
import os
from os import path
import asyncio
from queue import Queue

from expression_classification.webcam_tick import ExpressionClassifierTicker
from facial_detection.webcam_tick import FacialDetectionTicker
from eye_track.eye_detection import EyeDetectionTicker

class WebcamLoop():
    def __init__(self, queue):
        self.queue = queue
        
        print('initializing webcam')
        self.cap = cv2.VideoCapture(0) 

        data_path = path.join(os.getcwd(), 'facial_detection/voc_model_labels.txt')
        class_names = [name.strip() for name in open(data_path).readlines()]
        num_classes = len(class_names)

        device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

        self.cats = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

        self.face_detect_model = FacialDetectionTicker(num_classes, device)
        self.exp_classif_model = ExpressionClassifierTicker(self.cats, device, 'expression_classification/model_checkpoint_trial1.pth')
        self.eye_track_model = EyeDetectionTicker()
        
        self.cat_count = {}
        self.reset_count()
        print('successfully set up webcam')
        
        self.queue.put({'source': 'webcam', 'status': 'instantiated'})
    
    def reset_count(self):
        for cat in self.cats:
            self.cat_count[cat] = 0
    
    def pop_emotion(self) -> str:
        max_count = -1
        max_cat = None
        
        for cat in self.cats:
            if self.cat_count[cat] > max_count:
                max_count = self.cat_count[cat]
                max_cat = cat
        
        self.reset_count()
        return max_cat

    def start_loop(self):
        self.queue.put({'source': 'webcam', 'status': 'start_loop'})
        while True:
            ret, orig_image = self.cap.read()
            if orig_image is None:
                print("End of video")
                break
            
            image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)
            
            # detect face
            face_box = self.face_detect_model.detect_face(image)
            if face_box is None:
                continue
            x1, y1, x2, y2 = face_box
            cropped_face = orig_image[y1:y2, x1:x2]
            
            # detect eyes
            eyes = self.eye_track_model.detect_eyes(cropped_face)
            if len(eyes) > 0:
                for (ex, ey, ew, eh) in eyes:
                    cv2.rectangle(orig_image, (x1+ex,y1+ey), (x1+ex+ew,y1+ey+eh), (0,255,255), 2)
            
            # classify
            classif = self.exp_classif_model.get_classification(cropped_face)
            
            self.queue.put({
                'source': 'webcam', 
                'status': 'update', 
                'data': {
                    'classification': classif,
                    'eyes': len(eyes) / 2,
                }
            })
            
            # update category frequency
            self.cat_count[classif] += 1
            
            cv2.rectangle(orig_image, (x1, y1), (x2, y2), (0, 255, 0), 4)
            cv2.putText(orig_image, f"{classif}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)

            orig_image = cv2.resize(orig_image, None, None, fx=0.8, fy=0.8)
            cv2.imshow('Annotated', orig_image)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    # def __del__(self):
    #     print('destroying webcam interface')
    #     if hasattr(self, 'cap') and self.cap is not None:
    #         self.cap.release()
    #     cv2.destroyAllWindows()

if __name__ == '__main__':
    webcam_loop = WebcamLoop(Queue())
    webcam_loop.start_loop()
    print('started loop')