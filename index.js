//#region Client Communications

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('Client server started');
})

const CurrentRooms = [];

wss.on('connection', (ws) => {
    // When a client connects, generate a room code and send it to the client
    const roomCode = GenerateRoomCode();
    ws.send(JSON.stringify({ type: "room", data: roomCode }));

    // Generate a unique ID for the room
    const roomId = generateUniqueId(); // You need to implement this function

    // Add the room to the list of current rooms
    CurrentRooms.push({ 
        socket: ws, 
        roomCode: roomCode, 
        roomId: roomId,
        players: []  });
    console.log(`Added new room: ${roomCode} - ${roomId}`);

    ws.on('message', (data) => {
        console.log('data received from client: ' + data);
    
        try {
            let msg = JSON.parse(data);
            console.log(msg);
            switch (msg.method) {
                case "content":
                    const index = CurrentPlayers.findIndex(player => player.data.room === msg.data.room && player.data.name === msg.data.player);
                    if (index !== -1) {
                        console.log("Sending to phone to local socket: " + CurrentPlayers[index].ws);
                        CurrentPlayers[index].ws.send(JSON.stringify({ method: "content", data: msg.data.content }));
                    }
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error("Failed to parse JSON: ", err);
        }
    });
    

    // Listen for the close event on the WebSocket connection
    ws.on('close', () => {
        // Remove the room from the CurrentRooms array when the connection is closed
        const index = CurrentRooms.findIndex(room => room.ws === ws);
        if (index !== -1) {
            CurrentRooms.splice(index, 1);
            console.log(`Removed ${index} from the list`);
        }
    });
});




function generateUniqueId(){
    return Math.random().toString(16).slice(2);
}

function GenerateRoomCode() {
    const characters = 'qwertyuiopasdfghjklzxcvbnm'
    let result = '';

    for (let i = 0; i < 5; i++) {
        const randomI = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomI);
    }
    return result;
}

wss.on('listening', () => {
    console.log('Client server is listening on port 8080')
})

wss.on('disconnection', (ws) => {
    
})

//#endregion

//#region Controller

const ConWss = new WebSocket.Server({ port: 8081 }, () => {
    console.log('Controller server started');
})

const CurrentPlayers = [];

ConWss.on('connection', (ws) => {
    // When a client connects, generate a room code and send it to the client
    console.log("Controller connected");

    ws.on('message', (msg) => {
        console.log('data received from controller: ' + msg);
        const data = JSON.parse(msg); // Parse the incoming message as JSON
        switch(data.method){
            case "connect": 
                console.log('Now Connecting');
                //check if room is available
                const index = CurrentRooms.findIndex(room => room.roomCode === data.data.room);
                console.log(index);
                if(index != -1){
                    console.log("Found room");
                    CurrentPlayers.push({ ws: ws, data: data.data });
                    CurrentRooms[index].socket.send(JSON.stringify({ type: "player", data: data.data.name }))
                }
                else{
                    console.log("No room found");
                    ws.send(JSON.stringify({ type: "noroom", data: null }));
                }
                break;
            case "playSend":
                console.log("Sending to game client");
                const Player = CurrentPlayers[CurrentPlayers.findIndex(player => player.ws === ws)];
                const room = CurrentRooms[CurrentRooms.findIndex(room => room.roomCode === Player.data.room)];
                const clientMSG =     { 
                    type: "playSend",
                    data: JSON.stringify( {player: Player.data.name, button: data.data.button, values: data.data.values  })
                }         
                console.log("Sending "+JSON.stringify(clientMSG));
                room.socket.send(JSON.stringify(clientMSG))
                //console.log(index);
                break;
            default: 
                break;
        }
    });
});




ConWss.on('listening', () => {
    console.log('Controller server is listening on port 8081')
})

//#endregion
