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

uri = "ws://localhost:8080"

def queue_to_list_and_preserve(queue):
    temp_queue = multiprocessing.Queue()
    lst = []

    # Transfer from original queue to temp queue and list
    while not queue.empty():
        item = queue.get()
        lst.append(item)
        temp_queue.put(item)

    # Transfer back from temp queue to original queue
    while not temp_queue.empty():
        queue.put(temp_queue.get())

    return lst


def middleman(communication_queue, send_queue, is_listening):
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
                    print(f'{sentence} - Emotion: {cat}, Eye Contact: {(eye_contact*100):.2f}%')
                    
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

# def start_websocket_client(received_queue, send_queue):
#     print('Starting WebSocket client')

#     async def receive_websocket():
#         uri = "ws://localhost:8765"
#         async with websockets.connect(uri) as websocket:
#             while True:
#                 print('Waiting for packet')
#                 received = await websocket.recv()
#                 print(f"WebSocket client - Received data from server: {received}")
#                 received_queue.put(received)

#     async def send_websocket():
#         uri = "ws://localhost:8766"
#         async with websockets.connect(uri) as websocket:
#             while True:
#                 if not send_queue.empty():
#                     to_send = send_queue.get()
#                     await websocket.send(to_send)

#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#     tasks = asyncio.gather(receive_websocket(), send_websocket())
#     loop.run_until_complete(tasks)

#     # Optionally, you can close the loop at the end if needed
#     # loop.close()
        
async def receive_websocket(websocket, path, received_queue, send_queue, is_listening, gpt_history):
    print('start of receive socket')
    while True:
        print('waiting to receive')
        message = await websocket.recv()
        message = json.loads(message)
        print(f"Received: {message}")

        if 'type' in message:
            if message['type'] == 'initial_prompt':
                gpt_initial_question = gpt_session.ask(message['content'])
                print('GPT: ', gpt_initial_question)
                send_queue.put({'type': 'speak', 'content': gpt_initial_question})

            if message['type'] == 'mic':
                is_muted = message['mute']
                is_listening.value = not is_muted

        received_queue.put(message)

async def send_websocket(websocket, path, send_queue):
    print('start of send socket')
    while True:
        if not send_queue.empty():
            message = send_queue.get()
            print('sending message', message)
            await websocket.send(message)

def start_websocket_server(received_queue, send_queue, is_listening, gpt_history):
    print('starting websocket server')
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    receive_server = websockets.serve(
        lambda ws, path: receive_websocket(ws, path, received_queue, send_queue, is_listening, gpt_history), "localhost", 8765
    )
    send_server = websockets.serve(
        lambda ws, path: send_websocket(ws, path, send_queue), "localhost", 8766
    )

    loop.run_until_complete(receive_server)
    loop.run_until_complete(send_server)
    loop.run_forever()

    print('done with everything')


# def gpt_worker(received_queue, to_send_queue, is_listening):
#     gpt_session = GPTSession()

if __name__ == '__main__':
    communication_queue = multiprocessing.Queue()
    received_queue = multiprocessing.Queue()
    to_send_queue = multiprocessing.Queue()
    gpt_history = multiprocessing.Queue()
    is_listening = multiprocessing.Value('b', False)
    
    middleman_process = multiprocessing.Process(target=middleman, args=(communication_queue, received_queue, to_send_queue, gpt_history))
    worker1_process = multiprocessing.Process(target=webcam_worker, args=(communication_queue,))
    worker2_process = multiprocessing.Process(target=audio_worker, args=(communication_queue,))
    
    websocket_thread = threading.Thread(target=start_websocket_server, args=(received_queue, to_send_queue, is_listening, gpt_history))
    
    websocket_thread.start()
    middleman_process.start()
    worker1_process.start()
    worker2_process.start()

    worker1_process.join()
    worker2_process.join()

