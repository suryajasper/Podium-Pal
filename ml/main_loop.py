import sys
import time
import multiprocessing

from speech_analysis.speech_to_text import SpeechToTextLoop
from webcam_loop import WebcamLoop

def middleman(queue):
    cat_count = {}
    cats = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    
    def reset_count():
        for cat in cats:
            cat_count[cat] = 0
    
    def pop_emotion() -> str:
        max_count = -1
        max_cat = None
        
        for cat in cats:
            if cat_count[cat] > max_count:
                max_count = cat_count[cat]
                max_cat = cat
        
        reset_count()
        return max_cat

    reset_count()
    
    while True:
        while not queue.empty():
            message = queue.get()
            if message['source'] == 'webcam':
                if message['status'] == 'classification':
                    cat_count[message['data']] += 1
            elif message['source'] == 'audio':
                if message['status'] == 'new_sentence':
                    cat = pop_emotion()
                    sentence = message['data']
                    print(f'{sentence} ({cat})')
            
            # print(f"Middleman received message: {message}")

def webcam_worker(queue):
    webcam = WebcamLoop(queue)
    webcam.start_loop()

def audio_worker(queue):
    audio = SpeechToTextLoop(queue)
    while True:
        audio.start_loop()
        time.sleep(0.5)

if __name__ == '__main__':
    # Create a multiprocessing Queue for communication
    communication_queue = multiprocessing.Queue()

    # Create middleman process
    middleman_process = multiprocessing.Process(target=middleman, args=(communication_queue,))
    middleman_process.start()

    # Create worker processes
    worker1_process = multiprocessing.Process(target=webcam_worker, args=(communication_queue,))
    worker2_process = multiprocessing.Process(target=audio_worker, args=(communication_queue,))

    # Start worker processes
    worker1_process.start()
    worker2_process.start()

    # Wait for the worker processes to finish (optional)
    worker1_process.join()
    worker2_process.join()

