#! python3.7

import argparse
import os
import numpy as np
import speech_recognition as sr
import whisper
import torch

from datetime import datetime, timedelta
from queue import Queue
from time import sleep
from sys import platform

class SpeechToTextLoop:
    def __init__(
        self,
        queue,
        sentence_callback=None,
        model='small',
        non_english=False,
        energy_threshold=600,
        record_timeout=2,
        phrase_timeout=20,
    ):
        self.queue = queue
        print('initializing speech to text model')
        self.sentence_callback = sentence_callback
        # The last time a recording was retrieved from the queue.
        self.phrase_time = None
        # Thread safe Queue for passing data from the threaded recording callback.
        self.data_queue = Queue()
        # We use SpeechRecognizer to record our audio because it has a nice feature where it can detect when speech ends.
        recorder = sr.Recognizer()
        recorder.energy_threshold = energy_threshold
        # Definitely do this, dynamic energy compensation lowers the energy threshold dramatically to a point where the SpeechRecognizer never stops recording.
        recorder.dynamic_energy_threshold = False

        source = sr.Microphone(sample_rate=16000)

        # Load / Download model
        model = model
        if model != "large" and not non_english:
            model = model + ".en"
        self.audio_model = whisper.load_model(model)

        self.record_timeout = record_timeout
        self.phrase_timeout = phrase_timeout

        self.transcription = ['']

        with source:
            recorder.adjust_for_ambient_noise(source)

        def record_callback(_, audio:sr.AudioData) -> None:
            """
            Threaded callback function to receive audio data when recordings finish.
            audio: An AudioData containing the recorded bytes.
            """
            # Grab the raw bytes and push it into the thread safe queue.
            data = audio.get_raw_data()
            self.data_queue.put(data)

        # Create a background thread that will pass us raw audio bytes.
        # We could do this manually but SpeechRecognizer provides a nice helper.
        recorder.listen_in_background(source, record_callback, phrase_time_limit=record_timeout)

        # Cue the user that we're ready to go.
        print("speech to text model loaded.\n")
        self.queue.put({'source': 'audio', 'status': 'instantiated'})
        
    
    def start_loop(self):
        self.queue.put({'source': 'audio', 'status': 'started_loop'})
        try:
            if not self.data_queue.empty():
                now = datetime.utcnow()
                # Pull raw recorded audio from the queue.
                phrase_complete = False
                # If enough time has passed between recordings, consider the phrase complete.
                # Clear the current working audio buffer to start over with the new data.
                if self.phrase_time and now - self.phrase_time > timedelta(seconds=self.phrase_timeout):
                    phrase_complete = True
                
                if not self.data_queue.empty():
                    self.phrase_time = now
                
                # Combine audio data from queue
                audio_data = b''.join(self.data_queue.queue)
                self.data_queue.queue.clear()
                
                # Convert in-ram buffer to something the model can use directly without needing a temp file.
                # Convert data from 16 bit wide integers to floating point with a width of 32 bits.
                # Clamp the audio stream frequency to a PCM wavelength compatible default of 32768hz max.
                audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

                # Read the self.transcription.
                result = self.audio_model.transcribe(audio_np, fp16=torch.cuda.is_available())
                text = result['text'].strip()

                # If we detected a pause between recordings, add a new item to our self.transcription.
                # Otherwise edit the existing one.
                # print(self.transcription[-1])
                self.queue.put({'source': 'audio', 'status': 'new_sentence', 'data': text})
                if phrase_complete:
                    self.transcription.append(text)
                else:
                    self.transcription[-1] += text + ' '

                # Clear the console to reprint the updated self.transcription.
                # os.system('cls' if os.name=='nt' else 'clear')
                # for line in self.transcription:
                #     print(line)
                # # Flush stdout.
                # print('', end='', flush=True)

                # Infinite loops are bad for processors, must sleep.
                # sleep(0.25)
        except KeyboardInterrupt:
            return

        # print("\n\nself.transcription:")
        # for line in self.transcription:
        #     print(line)
