import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from torchvision.datasets import ImageFolder
from tqdm import tqdm

from expression_classification.models import ExpressionClassifier

# Define configurable hyperparameters
batch_size = 32
learning_rate = 0.001
num_epochs = 30
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Define transformations for data preprocessing
transform = transforms.Compose([
    transforms.Resize((48, 48)),
    transforms.ToTensor(),
])

# Define a custom dataset class
class CustomDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.dataset = ImageFolder(root_dir, transform=transform)
        self.classes = self.dataset.classes

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        img, label = self.dataset[idx]
        return img, label

# initializing dataloaders
print('initializing dataloaders')
train_data_path = "expression_classification/data/images/train"
test_data_path = "expression_classification/data/images/validation"
save_path = "expression_classification/model_checkpoint.pth"

train_dataset = CustomDataset(train_data_path, transform=transform)
test_dataset = CustomDataset(test_data_path, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

# initializing model and loss
model = ExpressionClassifier(num_classes=len(train_dataset.classes)).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

if torch.cuda.is_available():
    checkpoint = torch.load(save_path)
else:
    checkpoint = torch.load(save_path, map_location=torch.device('cpu'))

model.load_state_dict(checkpoint)

# training loop
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0

    for batch_idx, (inputs, labels) in enumerate(tqdm(train_loader, desc=f"Epoch {epoch + 1}/{num_epochs}")):
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()

        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        # Print loss and accuracy every 100 batches
        if (batch_idx + 1) % 100 == 0:
            print(f"Epoch {epoch + 1}/{num_epochs}, Batch {batch_idx + 1}/{len(train_loader)}, Loss: {loss.item():.4f}")

    epoch_loss = running_loss / len(train_loader)
    print(f"Epoch {epoch + 1}/{num_epochs}, Loss: {epoch_loss:.4f}")

    # Testing loop
    model.eval()
    correct_predictions = 0
    total_samples = 0

    with torch.no_grad():
        for inputs, labels in tqdm(test_loader, desc="Testing"):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)

            total_samples += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()

    accuracy = correct_predictions / total_samples
    print(f"Test Accuracy: {accuracy * 100:.2f}%")

    # Save the model checkpoint at the end of each epoch
    torch.save(model.state_dict(), save_path)
    print(f"Model saved at: {save_path}")
