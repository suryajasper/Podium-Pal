import torch
from torchvision import transforms
from expression_classification.models import ExpressionClassifier
import os
import cv2
import argparse

from facial_detection.vision.ssd.mb_tiny_fd import create_mb_tiny_fd, create_mb_tiny_fd_predictor
from facial_detection.vision.ssd.mb_tiny_RFB_fd import create_Mb_Tiny_RFB_fd, create_Mb_Tiny_RFB_fd_predictor
from facial_detection.vision.ssd.config.fd_config import define_img_size

class FacialDetectionTicker():
    def __init__(self, num_classes, device):
        self.input_size = 480
        self.threshold = 0.7
        self.candidate_size = 1000
        self.device = device
        self.num_classes = num_classes
        
        define_img_size(self.input_size)
        
        model_path = os.path.join(os.getcwd(), 'facial_detection/pretrained/version-RFB-320.pth')
        self.net = create_Mb_Tiny_RFB_fd(self.num_classes, is_test=True, device=self.device)
        self.predictor = create_Mb_Tiny_RFB_fd_predictor(self.net, candidate_size=self.candidate_size, device=self.device)
        self.net.load(model_path)
    
    def detect_face(self, image):
        boxes, labels, probs = self.predictor.predict(image, self.candidate_size / 2, self.threshold)
        
        if len(boxes) > 0:
            return map(int, boxes[0])
        else:
            return None