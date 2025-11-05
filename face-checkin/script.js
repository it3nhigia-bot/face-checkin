const video = document.getElementById('video');
const statusEl = document.getElementById('status');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error("Không truy cập được camera:", err));
}

video.addEventListener('play', () => {
  statusEl.textContent = "✅ Nhận diện khuôn mặt đang hoạt động!";
});
