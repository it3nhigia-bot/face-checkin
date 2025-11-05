const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/checkin/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/checkin/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/checkin/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error(err));
}

video.addEventListener('play', async () => {
  const displaySize = { width: video.width, height: video.height };
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  faceapi.matchDimensions(canvas, displaySize);

  document.getElementById('status').textContent = "Nhận diện khuôn mặt đang hoạt động...";
});
