const socketIo = require("socket.io");
const userModel = require("./models/users.models");
const captainModel = require("./models/captain.model");

let io;

function initiateSocket(server) {
    io = socketIo(server, {
        cors: {
            // 👇 Dynamically allow whatever origin is requesting, or fallback
            origin: (origin, callback) => {
                const allowedOrigins = [
                    "https://maarg-frontend.onrender.com",
                    "http://localhost:5173"
                ];
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true,
        handlePreflightRequest: (req, res) => {
            const clientOrigin = req.headers.origin || "https://maarg-frontend.onrender.com";
            
            res.writeHead(200, {
                "Access-Control-Allow-Origin": clientOrigin,
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, my-custom-header",
                "Allow": "GET,POST,OPTIONS",
                "Access-Control-Allow-Credentials": "true"
            });
            res.end();
        }
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