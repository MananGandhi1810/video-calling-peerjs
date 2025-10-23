// Config
const CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

// State
let peer;
let localStream;
let remoteStream;
let currentCall;
let screenStream;
let isAudioEnabled = true;
let isVideoEnabled = true;
let isScreenSharing = false;

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const localNoVideo = document.getElementById('localNoVideo');
const remoteNoVideo = document.getElementById('remoteNoVideo');
const myPeerId = document.getElementById('myPeerId');
const remotePeerIdInput = document.getElementById('remotePeerId');
const callButton = document.getElementById('callButton');
const toggleAudioBtn = document.getElementById('toggleAudio');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleScreenShareBtn = document.getElementById('toggleScreenShare');
const endCallBtn = document.getElementById('endCall');
const statusIndicator = document.getElementById('statusIndicator');
const audioText = document.getElementById('audioText');
const videoText = document.getElementById('videoText');
const screenText = document.getElementById('screenText');
const audioIcon = document.getElementById('audioIcon');
const videoIcon = document.getElementById('videoIcon');
const screenIcon = document.getElementById('screenIcon');

// Initialize Peer connection
function initializePeer() {
  peer = new Peer({
    iceServers: CONFIG.iceServers
  });

  peer.on('open', (id) => {
    myPeerId.textContent = id;
    statusIndicator.classList.add('connected');
    console.log('✓ Peer initialized with ID:', id);
  });

  peer.on('call', handleIncomingCall);
  peer.on('connection', handleConnection);
  peer.on('error', (err) => {
    console.error('Peer error:', err);
  });
}

// Get local media stream
async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    
    localVideo.srcObject = localStream;
    localNoVideo.style.display = 'none';
    console.log('✓ Local stream obtained');
    return localStream;
  } catch (err) {
    console.error('Error accessing media devices:', err);
    localNoVideo.style.display = 'flex';
    alert('Unable to access camera/microphone. Please check permissions.');
    return null;
  }
}

// Make a call to another peer
async function callPeer() {
  const remotePeerId = remotePeerIdInput.value.trim();
  
  if (!remotePeerId) {
    alert('Please enter a peer ID');
    return;
  }

  if (!localStream) {
    alert('Local stream not available');
    return;
  }

  try {
    currentCall = peer.call(remotePeerId, localStream);
    setupCallHandlers(currentCall);
    endCallBtn.disabled = false;
    console.log('✓ Calling peer:', remotePeerId);
  } catch (err) {
    console.error('Error calling peer:', err);
    alert('Failed to call peer. Check ID and try again.');
  }
}

// Handle incoming call
function handleIncomingCall(call) {
  console.log('Incoming call from:', call.peer);
  
  currentCall = call;
  
  if (!localStream) {
    call.close();
    return;
  }

  call.answer(localStream);
  setupCallHandlers(call);
  endCallBtn.disabled = false;
}

// Setup call event handlers
function setupCallHandlers(call) {
  call.on('stream', (stream) => {
    remoteStream = stream;
    remoteVideo.srcObject = stream;
    remoteNoVideo.style.display = 'none';
    console.log('✓ Remote stream received');
  });

  call.on('close', () => {
    remoteStream = null;
    remoteVideo.srcObject = null;
    remoteNoVideo.style.display = 'flex';
    currentCall = null;
    endCallBtn.disabled = true;
    console.log('✓ Call closed');
  });

  call.on('error', (err) => {
    console.error('Call error:', err);
    closeCall();
  });
}

// Handle data connection
function handleConnection(conn) {
  conn.on('open', () => {
    console.log('Data connection established');
  });

  conn.on('error', (err) => {
    console.error('Connection error:', err);
  });
}

// Toggle audio
function toggleAudio() {
  if (!localStream) return;

  isAudioEnabled = !isAudioEnabled;
  
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = isAudioEnabled;
  });

  audioText.textContent = isAudioEnabled ? 'Mute Audio' : 'Unmute Audio';
  audioIcon.textContent = isAudioEnabled ? '🎤' : '🔇';
  toggleAudioBtn.classList.toggle('active', !isAudioEnabled);
  console.log('Audio:', isAudioEnabled ? 'enabled' : 'disabled');
}

// Toggle video
function toggleVideo() {
  if (!localStream) return;

  isVideoEnabled = !isVideoEnabled;
  
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = isVideoEnabled;
  });

  videoText.textContent = isVideoEnabled ? 'Stop Video' : 'Start Video';
  videoIcon.textContent = isVideoEnabled ? '📷' : '📹';
  toggleVideoBtn.classList.toggle('active', !isVideoEnabled);

  if (!isVideoEnabled) {
    localNoVideo.style.display = 'flex';
  } else {
    localNoVideo.style.display = 'none';
  }

  console.log('Video:', isVideoEnabled ? 'enabled' : 'disabled');
}

// Toggle screen share
async function toggleScreenShare() {
  try {
    if (!isScreenSharing) {
      // Start screen share
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = currentCall?.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');

      if (sender) {
        await sender.replaceTrack(screenTrack);
        screenTrack.onended = () => {
          stopScreenShare();
        };
        isScreenSharing = true;
        screenText.textContent = 'Stop Sharing';
        screenIcon.textContent = '🛑';
        toggleScreenShareBtn.classList.add('active');
        console.log('✓ Screen share started');
      }
    } else {
      stopScreenShare();
    }
  } catch (err) {
    if (err.name !== 'NotAllowedError') {
      console.error('Screen share error:', err);
    }
  }
}

// Stop screen share
async function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
  }

  if (currentCall?.peerConnection) {
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = currentCall.peerConnection.getSenders().find((s) => s.track?.kind === 'video');

    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }
  }

  isScreenSharing = false;
  screenText.textContent = 'Share Screen';
  screenIcon.textContent = '🖥️';
  toggleScreenShareBtn.classList.remove('active');
  console.log('✓ Screen share stopped');
}

// End call
function endCall() {
  if (currentCall) {
    currentCall.close();
  }

  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
    isScreenSharing = false;
  }

  remoteStream = null;
  remoteVideo.srcObject = null;
  remoteNoVideo.style.display = 'flex';
  currentCall = null;
  endCallBtn.disabled = true;
  console.log('✓ Call ended');
}

// Close peer connection
function closeCall() {
  if (currentCall) {
    currentCall.close();
  }
  endCall();
}

// Event listeners
callButton.addEventListener('click', callPeer);
toggleAudioBtn.addEventListener('click', toggleAudio);
toggleVideoBtn.addEventListener('click', toggleVideo);
toggleScreenShareBtn.addEventListener('click', toggleScreenShare);
endCallBtn.addEventListener('click', endCall);

remotePeerIdInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    callPeer();
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
  }
  if (currentCall) {
    currentCall.close();
  }
  peer?.destroy();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initializePeer();
  await getLocalStream();
});
