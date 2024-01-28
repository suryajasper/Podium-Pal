import torch
from tqdm import tqdm

from expression_classification.models import ExpressionClassifier

def load_classifier_model(save_path : str) -> ExpressionClassifier:
    model = ExpressionClassifier().to(device)

    if torch.cuda.is_available():
        checkpoint = torch.load(save_path)
    else:
        checkpoint = torch.load(save_path, map_location=torch.device('cpu'))

    model.load_state_dict(checkpoint)
    model.eval()

MODEL_PATH = 'expression_classification/model_checkpoint.pth'

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = load_classifier_model(MODEL_PATH).to(device)


