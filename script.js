const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
const personDiv = document.getElementById('person');

// Khởi động webcam
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./model'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./model'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./model'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('./model')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => {
  statusDiv.innerText = `⚠️ Không thể truy cập camera: ${err.message}`;
  alert("Hãy bật quyền truy cập camera trong trình duyệt để tiếp tục.");
});

}

video.addEventListener('play', async () => {
  statusDiv.innerText = 'Đang tải dữ liệu khuôn mặt...';

  const labels = ['nguyen_tuan_anh', 'tran_b']; // Tên file trong /known_faces (không cần .jpg)
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async label => {
      const img = await faceapi.fetchImage(`./known_faces/${label}.jpg`);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
    })
  );

  statusDiv.innerText = 'Sẵn sàng nhận diện!';

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const { label, distance } = result;
      const drawBox = new faceapi.draw.DrawBox(box, { label });
      drawBox.draw(canvas);
      personDiv.innerText = `✅ Xin chào ${label.toUpperCase()}!`;
    });
  }, 1000);
});




