import asyncio
import websockets
import json

port = 8578

async def echo(websocket, path):
    async for message in websocket:
        message = json.loads(message)
        print(f"Received message: {message} {type(message)}")
        await websocket.send(f"Echo: {message}")

async def main():
    async with websockets.serve(echo, "localhost", port):
        print(f'listening on localhost:{port}')
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
