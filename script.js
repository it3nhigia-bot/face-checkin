// === CẤU HÌNH VÀ BIẾN TOÀN CỤC ===
const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
const personDiv = document.getElementById('person');

// === KHỞI TẠO MÔ HÌNH NHẬN DIỆN ===
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./model'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./model'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./model'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('./model'), // mô hình chính xác hơn
]).then(startVideo)
  .catch(err => {
    statusDiv.innerText = `❌ Lỗi tải model: ${err.message}`;
  });

// === HÀM KHỞI ĐỘNG CAMERA ===
function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Camera error:", err);
      statusDiv.innerText = `⚠️ Không thể truy cập camera: ${err.message}`;
      alert("Hãy bật quyền truy cập camera trong trình duyệt để tiếp tục!");
    });
}

// === SỰ KIỆN KHI CAMERA SẴN SÀNG ===
video.addEventListener('play', async () => {
  statusDiv.innerText = '🔍 Đang tải dữ liệu khuôn mặt...';

  // Danh sách người cần nhận diện (tên file phải trùng trong /known_faces/)
  const labels = ['nguyen_tuan_anh', 'tran_b'];

  // Tải dữ liệu khuôn mặt đã biết
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 1; i++) { // có thể tăng lên nếu có nhiều ảnh
        const imgUrl = `./known_faces/${label}.jpg`;
        console.log(`Đang tải ảnh: ${imgUrl}`);
        try {
          const img = await faceapi.fetchImage(imgUrl);
          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (!detection) {
            console.warn(`⚠️ Không phát hiện được khuôn mặt trong ${imgUrl}`);
            continue;
          }
          descriptions.push(detection.descriptor);
        } catch (e) {
          console.error(`❌ Lỗi tải ảnh ${imgUrl}:`, e);
        }
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );

  statusDiv.innerText = '✅ Đã tải dữ liệu khuôn mặt. Hệ thống đang nhận diện...';

  // Khởi tạo FaceMatcher (độ chính xác: 0.6 càng thấp càng khắt khe)
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.8);

  // Tạo canvas để hiển thị khung nhận diện
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  // === NHẬN DIỆN THEO THỜI GIAN THỰC ===
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);

      if (result.label !== "unknown") {
        personDiv.innerText = `👤 Xin chào ${result.label.toUpperCase()}!`;
      } else {
        personDiv.innerText = `❌ Không nhận diện được khuôn mặt.`;
      }
    });
  }, 1000);
});

