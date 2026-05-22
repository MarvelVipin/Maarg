const socketIo = require("socket.io");
const userModel = require("./models/users.models");
const captainModel = require("./models/captain.model");

let io;

function initiateSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: [
                "https://maarg-frontend.onrender.com", 
                "http://localhost:5173"                
            ],
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['polling', 'websocket'], 
        allowEIO3: true 
    });
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        
        socket.on("join", async (data) => {
            try {
                const { userId, userType } = data;
                
                console.log(`User joined with ID: ${userId}, Type: ${userType}`);

                if (!userId || !userType) {
                    console.log("Invalid join data:", data);
                    return;
                }

                if (userType === "user") {
                    await userModel.findByIdAndUpdate(userId, {
                        socketId: socket.id
                    });
                } 
                else if (userType === "captain") {
                    await captainModel.findByIdAndUpdate(userId, {
                        socketId: socket.id
                    });
                }

                console.log(`${userType} joined with ID: ${userId}`);
            } catch (error) {
                console.error("Join Error:", error.message);
            }
        });

        socket.on("update-location-captain", async (data) => {
            const { userId, location } = data;

            if(!location || !location.ltd || !location.lng) {
                return socket.emit("error", { message: "Invalid location data" });
            }

            await captainModel.findByIdAndUpdate(userId, {location: {
                ltd: location.ltd,
                lng: location.lng
            }});

        });

        
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}


const sendMessageToSocketId = (socketId, messageObject) => {

    console.log(`Sending message to  ${socketId},  ${messageObject.event}`);    
    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log("Socket.io is not initialized.");
    }
}

module.exports = {
    initiateSocket,
    sendMessageToSocketId
};