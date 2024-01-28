import sys
import time
import multiprocessing
import threading
import asyncio
import websockets
import json

from speech_analysis.speech_to_text import SpeechToTextLoop
from webcam_loop import WebcamLoop
from gpt.chat import GPTSession

def middleman(communication_queue, send_queue, is_listening, gpt_queue):
    cat_count = {}
    total_updates = 0
    total_eye_contacts = 0
    
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
        while not communication_queue.empty():
            message = communication_queue.get()
            if not is_listening:
                continue
            
            if message['source'] == 'webcam':
                if message['status'] == 'update':
                    total_updates += 1
                    total_eye_contacts += message['data']['eyes']
                    cat_count[message['data']['classification']] += 1
                    
            elif message['source'] == 'audio':
                if message['status'] == 'new_sentence':
                    cat = pop_emotion()
                    sentence = message['data']
                    
                    eye_contact = 1.0 if total_updates == 0 else total_eye_contacts / total_updates
                    analysis_str = f'{sentence} - Emotion: {cat}, Eye Contact: {(eye_contact*100):.2f}%'
                    print(analysis_str)
                    send_queue.put({'type': 'display_speech', 'content': analysis_str})
                    
                    total_eye_contacts = 0
                    total_updates = 0
            # print(f"Middleman received message: {message}")

def webcam_worker(queue):
    webcam = WebcamLoop(queue)
    webcam.start_loop()

def audio_worker(queue):
    audio = SpeechToTextLoop(queue)
    while True:
        audio.start_loop()
        time.sleep(0.5)

def gpt_worker(gpt_queue, send_queue):
    print('starting gpt worker')
    gpt_session = GPTSession()
    while True:
        if not gpt_queue.empty():
            gpt_prompt = gpt_queue.get()
            print('gpt_prompt', gpt_prompt)
            question = gpt_prompt['question']
            endpoint = gpt_prompt['endpoint']
            gpt_response = gpt_session.ask(question)
            print('gpt_response', gpt_response)
            send_queue.put({'type': endpoint, 'content': gpt_response})
        
async def websocket_handler(websocket, path, received_queue, send_queue, gpt_queue):
    print('WebSocket connection established')
    while True:
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
            message = json.loads(message)
            print(f"Received: {message}")

            if 'type' in message:
                if message['type'] == 'initial_prompt':
                    gpt_queue.put({'question': message['content'], 'endpoint': 'speak'})
                elif message['type'] == 'ask_gpt':
                    gpt_queue.put({'question': message['content'], 'endpoint': 'speak'})
                elif message['type'] == 'summarize':
                    gpt_queue.put({'question': 'That\'s it for my interview. I\'d like you to gage how I did. Make sure to discuss my emotional responses, eye contact, content, and verbal inflection / ticks', 'endpoint': 'summarize'})
                if message['type'] == 'mic':
                    is_muted = message['mute']
                    is_listening.value = not is_muted
            

            received_queue.put(message)
        except asyncio.TimeoutError:
            pass

        # Handle sending messages
        if not send_queue.empty():
            message_to_send = send_queue.get()
            print('sending message', message)
            await websocket.send(json.dumps(message_to_send))

def start_websocket_server(received_queue, send_queue, gpt_queue):
    print('Starting WebSocket server')
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    server = websockets.serve(
        lambda ws, path: websocket_handler(ws, path, received_queue, send_queue, gpt_queue), "localhost", 8765
    )

    loop.run_until_complete(server)
    loop.run_forever()


# def gpt_worker(received_queue, to_send_queue, is_listening):
#     gpt_session = GPTSession()

if __name__ == '__main__':
    communication_queue = multiprocessing.Queue()
    received_queue = multiprocessing.Queue()
    to_send_queue = multiprocessing.Queue()
    gpt_queue = multiprocessing.Queue()
    is_listening = multiprocessing.Value('b', False)
    
    middleman_process = multiprocessing.Process(target=middleman, args=(communication_queue, received_queue, to_send_queue, gpt_queue))
    worker1_process = multiprocessing.Process(target=webcam_worker, args=(communication_queue,))
    worker2_process = multiprocessing.Process(target=audio_worker, args=(communication_queue,))
    gpt_process = multiprocessing.Process(target=gpt_worker, args=(gpt_queue, to_send_queue))
    
    websocket_thread = threading.Thread(target=start_websocket_server, args=(received_queue, to_send_queue, gpt_queue))
    
    websocket_thread.start()
    middleman_process.start()
    gpt_process.start()
    worker1_process.start()
    worker2_process.start()

    worker1_process.join()
    worker2_process.join()

