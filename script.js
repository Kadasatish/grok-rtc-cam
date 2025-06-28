const dot = document.getElementById("dot");
const dotToggle = document.getElementById("dotToggle");
const camToggle = document.getElementById("camToggle");
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");
const peerIdDisplay = document.getElementById("peerId");

// Fixed Peer IDs
const HOST_ID = "lasya-host-123";
const CLIENT_ID = "lasya-client-456";
let myPeer = null;
let conn = null;
let call = null;
let stream = null;
let isHost = false;

// Determine if this device is host or client based on URL parameter
const urlParams = new URLSearchParams(window.location.search);
isHost = urlParams.get("role") === "host";

// Set Peer ID based on role
const myPeerId = isHost ? HOST_ID : CLIENT_ID;
const remotePeerId = isHost ? CLIENT_ID : HOST_ID;

// Display Peer ID in UI
peerIdDisplay.textContent = myPeerId;

// Initialize PeerJS with fixed ID
myPeer = new Peer(myPeerId);

myPeer.on("open", () => {
  console.log(`Peer ID: ${myPeerId}`);
  if (!isHost) {
    // Client initiates connection to host
    conn = myPeer.connect(remotePeerId);
    conn.on("open", () => {
      console.log("Data connection established!");
      setupDataHandlers(conn);
    });

    // Start video call
    startCamera();
  }
});

// Incoming connection (for host)
myPeer.on("connection", incomingConn => {
  if (isHost) {
    conn = incomingConn;
    conn.on("open", () => {
      console.log("Incoming data connection!");
      setupDataHandlers(conn);
    });
  }
});

// Incoming call (for host)
myPeer.on("call", incomingCall => {
  if (isHost) {
    startCamera(incomingCall);
  }
});

// Sync dot toggle
dotToggle.addEventListener("change", () => {
  const isOn = dotToggle.checked;
  dot.style.backgroundColor = isOn ? "white" : "black";
  if (conn) conn.send({ type: "dot", state: isOn });
});

// Camera toggle
camToggle.addEventListener("change", () => {
  if (camToggle.checked) {
    startCamera();
  } else {
    stopCamera();
  }
});

function setupDataHandlers(conn) {
  conn.on("data", data => {
    if (data.type === "dot") {
      dot.style.backgroundColor = data.state ? "white" : "black";
      dotToggle.checked = data.state;
    }
  });
}

function startCamera(incomingCall = null) {
  if (stream) stopCamera();
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }, // Front camera only
    audio: true
  }).then(s => {
    stream = s;
    myVideo.srcObject = stream;
    if (incomingCall) {
      incomingCall.answer(stream);
      incomingCall.on("stream", remoteStream => {
        remoteVideo.srcObject = remoteStream;
      });
    } else if (conn) {
      call = myPeer.call(remotePeerId, stream);
      call.on("stream", remoteStream => {
        remoteVideo.srcObject = remoteStream;
      });
    }
  }).catch(err => {
    console.error("Error accessing camera:", err);
    camToggle.checked = false;
  });
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  myVideo.srcObject = null;
  if (call) {
    call.close();
    call = null;
  }
    }
