const video = document.getElementById('video');
const statusDiv = document.getElementById('status');

// Khởi động webcam
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    statusDiv.innerText = "Không thể truy cập camera: " + err.message;
  }
}

async function loadModels() {
  statusDiv.innerText = "Đang tải mô hình...";
  await faceapi.nets.tinyFaceDetector.loadFromUri('./model');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./model');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./model');
  statusDiv.innerText = "Đã tải xong mô hình!";
  startVideo();
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
  }, 100);
});

loadModels();
