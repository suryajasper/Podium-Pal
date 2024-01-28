"""
This code uses the pytorch model to detect faces from live video or camera.
"""
import torch

import cv2
import os #for output
from os import path

from expression_classification.webcam_tick import ExpressionClassifierTicker
from facial_detection.webcam_tick import FacialDetectionTicker

cap = cv2.VideoCapture(0) 

data_path = path.join(os.getcwd(), 'facial_detection/voc_model_labels.txt')
class_names = [name.strip() for name in open(data_path).readlines()]
num_classes = len(class_names)

device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

cats = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

face_detect_model = FacialDetectionTicker(num_classes, device)
exp_classif_model = ExpressionClassifierTicker(cats, device, 'expression_classification/model_checkpoint_trial1.pth')

while True:
    ret, orig_image = cap.read()
    if orig_image is None:
        print("End of video")
        break
    
    image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)
    
    # detect and classify
    x1, y1, x2, y2 = face_detect_model.detect_face(image)
    cropped_face = orig_image[y1:y2, x1:x2]
    classif = exp_classif_model.get_classification(cropped_face)
    
    cv2.rectangle(orig_image, (x1, y1), (x2, y2), (0, 255, 0), 4)
    cv2.putText(orig_image, f"{classif}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    orig_image = cv2.resize(orig_image, None, None, fx=0.8, fy=0.8)
    cv2.imshow('Annotated', orig_image)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
