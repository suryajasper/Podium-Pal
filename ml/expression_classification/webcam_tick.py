import torch
from torchvision import transforms
from expression_classification.models_legacy import ExpressionClassifier
import cv2

class ExpressionClassifierTicker():
    def __init__(self, classes, device, checkpoint_file=None):
        self.classes = classes
        self.num_classes = len(classes)
        self.device = device
        
        self.model = ExpressionClassifier(num_classes=7).to(device)
        if checkpoint_file is not None:
            self.load_checkpoints(checkpoint_file)

    def load_checkpoints(self, save_path : str):
        if torch.cuda.is_available():
            checkpoint = torch.load(save_path)
        else:
            checkpoint = torch.load(save_path, map_location=torch.device('cpu'))

        self.model.load_state_dict(checkpoint)
        self.model.eval()

    def get_classification(self, cv_face) -> str:
        face_gray = cv2.cvtColor(cv_face, cv2.COLOR_BGR2GRAY)
            
        resized_face = cv2.resize(face_gray, (48, 48))
        
        transform = transforms.Compose([transforms.ToTensor()])
        tensor_face = transform(resized_face).repeat(3, 1, 1) # preserve 3 channels
        tensor_face_pt = torch.unsqueeze(tensor_face.to(self.device), 0)
        
        out = self.model(tensor_face_pt)
        classif = int(torch.max(out, 0).indices.item())
        
        return self.classes[classif]