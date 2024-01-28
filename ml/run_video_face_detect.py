"""
This code uses the pytorch model to detect faces from live video or camera.
"""
import torch
from torchvision import transforms

import argparse
import sys
import cv2
import os #for output
from PIL import Image

from facial_detection.vision.ssd.mb_tiny_fd import create_mb_tiny_fd, create_mb_tiny_fd_predictor
from facial_detection.vision.ssd.mb_tiny_RFB_fd import create_Mb_Tiny_RFB_fd, create_Mb_Tiny_RFB_fd_predictor
from facial_detection.vision.utils.misc import Timer

from facial_detection.vision.ssd.config.fd_config import define_img_size
from expression_classification.models import ExpressionClassifier

def load_classifier_model(save_path : str) -> ExpressionClassifier:
    model = ExpressionClassifier(num_classes=7).to(device)

    if torch.cuda.is_available():
        checkpoint = torch.load(save_path)
    else:
        checkpoint = torch.load(save_path, map_location=torch.device('cpu'))

    model.load_state_dict(checkpoint)
    model.eval()
    
    return model

def get_classification(model : ExpressionClassifier, cv_face, device) -> str:
    cats = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

    face_gray = cv2.cvtColor(cv_face, cv2.COLOR_BGR2GRAY)
        
    resized_face = cv2.resize(face_gray, (48, 48))
    cv2.imwrite('output_images/output_image.jpg', resized_face)
    
    transform = transforms.Compose([transforms.ToTensor()])
    tensor_face = transform(resized_face).repeat(3, 1, 1) # preserve 3 channels
    tensor_face_pt = torch.unsqueeze(tensor_face.to(device), 0)
    print('to model', tensor_face_pt.shape)
    
    out = model(tensor_face_pt)
    classif = int(torch.max(out, 0).indices.item())
    
    return cats[classif]

MODEL_PATH = 'expression_classification/model_checkpoint_trial1.pth'
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = load_classifier_model(MODEL_PATH).to(device)
print('Loaded classifier model')

parser = argparse.ArgumentParser(description='detect_video')
parser.add_argument('--net_type', default="RFB", type=str, help='The network architecture: RFB (higher precision) or slim (faster)')
parser.add_argument('--input_size', default=480, type=int, help='Define network input size (128/160/320/480/640/1280)')
parser.add_argument('--threshold', default=0.7, type=float, help='Score threshold')
parser.add_argument('--candidate_size', default=1000, type=int, help='NMS candidate size')
parser.add_argument('--path', default="imgs", type=str, help='Images directory')
parser.add_argument('--test_device', default="cuda:0", type=str, help='Device for testing (cuda:0 or cpu)')
parser.add_argument('--video_path', default="/home/peika/Videos/video/16_1.MP4", type=str, help='Path of video')
args = parser.parse_args()

input_img_size = args.input_size
define_img_size(input_img_size)

label_path = "C:\\Users\\georg\\Documents\\Surya_Shit\\Podium-Pal\\ml\\facial_detection\\voc_model_labels.txt"

net_type = args.net_type

cap = cv2.VideoCapture(0)  # Set to 0 for camera, or provide video path for file

class_names = [name.strip() for name in open(label_path).readlines()]
num_classes = len(class_names)
test_device = args.test_device

candidate_size = args.candidate_size
threshold = args.threshold

if net_type == 'slim':
    model_path = "C:\\Users\\georg\\Documents\\Surya_Shit\\Podium-Pal\\ml\\facial_detection\\pretrained\\version-slim-320.pth"
    net = create_mb_tiny_fd(len(class_names), is_test=True, device=test_device)
    predictor = create_mb_tiny_fd_predictor(net, candidate_size=candidate_size, device=test_device)
elif net_type == 'RFB':
    model_path = "C:\\Users\\georg\\Documents\\Surya_Shit\\Podium-Pal\\ml\\facial_detection\\pretrained\\version-RFB-320.pth"
    net = create_Mb_Tiny_RFB_fd(len(class_names), is_test=True, device=test_device)
    predictor = create_Mb_Tiny_RFB_fd_predictor(net, candidate_size=candidate_size, device=test_device)
else:
    print("The net type is wrong!")
    sys.exit(1)
net.load(model_path)

output_dir = "output_images"
os.makedirs(output_dir, exist_ok=True)

frame_count = 0
timer = Timer()
sum_faces = 0

classif_window = []
window_size = 200

while True:
    ret, orig_image = cap.read()
    if orig_image is None:
        print("End of video")
        break
    
    image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)

    timer.start()
    boxes, labels, probs = predictor.predict(image, candidate_size / 2, threshold)
    interval = timer.end()

    print('Time: {:.6f}s, Detected Objects: {:d}.'.format(interval, labels.size(0)))
    
    for i in range(boxes.size(0)):
        box = boxes[i, :]
        label = f" {probs[i]:.2f}"
        x1, y1, x2, y2 = map(int, box)

        # crop and save face
        cropped_face = orig_image[y1:y2, x1:x2]
        
        classif = get_classification(model, cropped_face, device)
        classif_window.append(classif)
        
        # keep classification window relevant
        if len(classif_window) > window_size:
            classif_window.pop(0)
        
        max_classif = max(set(classif_window), key=classif_window.count)
        
        print('classification', max_classif)
        
        cv2.rectangle(orig_image, (x1, y1), (x2, y2), (0, 255, 0), 4)
        cv2.putText(orig_image, f"{classif}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        break

    orig_image = cv2.resize(orig_image, None, None, fx=0.8, fy=0.8)
    sum_faces += boxes.size(0)
    cv2.imshow('Annotated', orig_image)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Total number of detected faces: {}".format(sum_faces))
