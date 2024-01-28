import torch
import torch.nn as nn

class ExpressionClassifier(nn.Module):
    def __init__(self, num_classes):
        super(ExpressionClassifier, self).__init__()
        
        self.num_classes = num_classes
        
        self.network = nn.Sequential(
            nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(num_features=32),
            nn.ReLU(inplace=True),
        )
        
        self.bottleneck_upscale_networks = nn.ModuleList([
            Bottleneck(32, 64, 1),
            Bottleneck(64, 128, 2),
            Bottleneck(128, 256, 2),
            Bottleneck(256, 512, 2),
        ])
        
        self.bottleneck_dense_networks = nn.ModuleList([
            Bottleneck(64, 64, 1),
            Bottleneck(128, 128, 1),
            Bottleneck(256, 256, 1),
            Bottleneck(512, 512, 1),
        ])
        
        self.avgpool2d = nn.AdaptiveAvgPool2d(1)
        
        self.fully_connected = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )

    def forward(self, x : torch.TensorType):
        x = self.network(x)
        
        for i in range(len(self.bottleneck_upscale_networks)):
            x = self.bottleneck_upscale_networks[i](x)
            
            for _ in range(3):
                x = self.bottleneck_dense_networks[i](x)
        
        x = self.avgpool2d(x).squeeze()
        
        x = self.fully_connected(x)
        
        return x
        
class Bottleneck(nn.Module):
    def __init__(self, in_features, out_features, stride):
        super(Bottleneck, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.stride = stride
        
        self.network = nn.Sequential(
            nn.Conv2d(in_features, in_features, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(in_features),
            nn.ReLU(inplace=True),
            
            nn.Conv2d(in_features, in_features, kernel_size=3, stride=stride, padding=1, groups=in_features, bias=False),
            nn.BatchNorm2d(in_features),
            nn.ReLU(inplace=True),
            
            nn.Conv2d(in_features, out_features, kernel_size=1, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(out_features),
        )
    
    def forward(self, x : torch.TensorType) -> torch.TensorType:
        y = self.network(x)

        if self.in_features == self.out_features:
            y += x
        
        return y

if __name__ == '__main__':
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print('Testing expression classifier on device', device)
    
    batch_size = 16
    num_classes = 3
    size = 256
    
    test_img = torch.randn((batch_size, 3, size, size), dtype=torch.float32, device=device)
    assert size % 16 == 0, 'Image shape invalid'
    
    print('Initializing network')
    model = ExpressionClassifier(num_classes).to(device)
    
    print('Running forward pass on image of size', test_img.shape)
    out = model(test_img)
    
    assert out.shape[0] == batch_size and out.shape[1] == num_classes, 'Wrong output'
    print('ALL GOOD')