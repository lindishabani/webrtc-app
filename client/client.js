////////////////
// Video Call //
////////////////
var name, connectedUser;
var connection = new WebSocket('ws://localhost:8888/');

connection.onopen = () => {
  console.log("Connected");
};

// Handle all messages through this callback
connection.onmessage = message => {
  console.log("Got message", message.data);
  var data = JSON.parse(message.data);

  switch(data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};

connection.onerror = err => {
  console.log("Got error", err);
};

// Alias for sending messages in JSON format
const send = message => {
  if (connectedUser) {
    message.name = connectedUser;
  }
  connection.send(JSON.stringify(message));
};

//
// Login 
//
var loginPage = document.querySelector('#login-page'), 
usernameInput = document.querySelector('#username'),
loginButton = document.querySelector('#login'),
callPage = document.querySelector('#call-page'),
theirUsernameInput = document.querySelector('#their-username'),
callButton = document.querySelector('#call'),
hangUpButton = document.querySelector('#hang-up'),
messageInput = document.querySelector("#message"),
sendButton = document.querySelector("#send"),
received = document.querySelector("#received")

callPage.style.display = "none";

// Login when the user clicks the button
loginButton.addEventListener("click", event => {
  name = usernameInput.value;
  if (name.length > 0) {
    send({
      type: "login",
      name: name
    });
  }
});

const onLogin = success => {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    loginPage.style.display = "none";
    callPage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
};

//
// Get User Media
//
var yourVideo = document.querySelector('#yours'),
theirVideo = document.querySelector('#theirs'),
yourConnection, connectedUser, stream, dataChannel;

const startConnection = () => {
  
  if (hasUserMedia()) {
    
    navigator.getUserMedia({ video: true, audio: false },
    myStream => {
      stream = myStream;
      yourVideo.srcObject = stream;
      // yourVideo.src = window.URL.createObjectURL(stream);
      
      if (hasRTCPeerConnection()) {
        setupPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    }, error => {
      console.log("HEREEEE", error)
      console.log(error);
    });
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

const setupPeerConnection = stream => {
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };

  yourConnection = new RTCPeerConnection(configuration);
  openDataChannel()

  // Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = e => {
    theirVideo.srcObject = e.stream;
    // theirVideo.src = window.URL.createObjectURL(e.stream);
  };

  // Setup ice handling
  yourConnection.onicecandidate = event => {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };
}

const hasUserMedia = () => {
  navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

const hasRTCPeerConnection = () => {
  window.RTCPeerConnection = window.RTCPeerConnection ||
  window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription ||
  window.webkitRTCSessionDescription ||
  window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate ||
  window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

//
// Start Peer Connection
//
callButton.addEventListener("click", () => {
  var theirUsername = theirUsernameInput.value;
  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

const startPeerConnection = user => {
  connectedUser = user;

  // Begin the offer
  yourConnection.createOffer(offer => {
    send({
      type: "offer",
      offer: offer
    });
    yourConnection.setLocalDescription(offer);
  }, error => {
    alert("An error has occurred.");
  });
};

const onOffer = (offer, name) => {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
  yourConnection.createAnswer(answer => {
    yourConnection.setLocalDescription(answer);
    send({
      type: "answer",
      answer: answer
    });
  }, error => {alert("An error has occurred");
  });
};

const onAnswer = answer => {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

const onCandidate = candidate => {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

//
// Hang Up
//
hangUpButton.addEventListener("click", () => {
  send({
    type: "leave"
  });
  onLeave();
});

function onLeave() {
  connectedUser = null;
  theirVideo.src = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  setupPeerConnection(stream);
};


///////////////////
// Data Channels //
///////////////////
const openDataChannel = () => {
  var dataChannelOptions = {
    reliable: false,
    RtpDataChannels: false
  };
  
  dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);
  dataChannel.onerror = error => {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage =  event => {
    console.log("Got Data Channel Message:", event.data);
    received.innerHTML += "from: "+ name +": " + event.data + "<br />";
    received.scrollTop = received.scrollHeight;
  };

  dataChannel.onopen = () => {
    dataChannel.send(name + " has connected.");
  };

  dataChannel.onclose = () => {
    console.log("The Data Channel is Closed");
  };

  // Bind our text input and received area
  sendButton.addEventListener("click",  () => {
    var val = messageInput.value;
    received.innerHTML += "send: " + val + "<br />";
    received.scrollTop = received.scrollHeight;
    dataChannel.send(val);
  });
}
