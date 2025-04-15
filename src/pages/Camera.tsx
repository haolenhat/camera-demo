import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faDownload, faFaceSmile } from '@fortawesome/free-solid-svg-icons';
import switchCameraIcon from '../assets/camera.png';
import captureSound from '../assets/sound.mp3';
import filter1 from '../assets/filter1.png';
import filter2 from '../assets/filter2.png';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const startCamera = async (mode: "environment" | "user" = "environment") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Không thể truy cập camera. Vui lòng cho phép trình duyệt.");
    }
  };

  useEffect(() => {
    startCamera(facingMode);
  }, [facingMode]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        // Lấy kích thước hiển thị của video
        const displayWidth = video.clientWidth;
        const displayHeight = video.clientHeight;

        // Đặt kích thước canvas bằng kích thước hiển thị
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        // Tính tỷ lệ của video gốc và hiển thị
        const videoRatio = video.videoWidth / video.videoHeight;
        const displayRatio = displayWidth / displayHeight;

        let drawWidth, drawHeight, xOffset, yOffset;

        // Áp dụng logic tương tự object-cover
        if (videoRatio > displayRatio) {
          drawHeight = displayHeight;
          drawWidth = drawHeight * videoRatio;
          xOffset = (displayWidth - drawWidth) / 2;
          yOffset = 0;
        } else {
          drawWidth = displayWidth;
          drawHeight = drawWidth / videoRatio;
          xOffset = 0;
          yOffset = (displayHeight - drawHeight) / 2;
        }

        // Vẽ video lên canvas
        context.drawImage(video, xOffset, yOffset, drawWidth, drawHeight);

        if (selectedFilter) {
          const filterImg = new Image();
          filterImg.src = selectedFilter;

          filterImg.onload = () => {
            // Xác định filterRatio dựa trên thiết bị
            const isMobile = window.innerWidth <= 768; // Mobile nếu chiều rộng <= 768px
            const filterRatio = isMobile ? 0.8 : 0.4; // 80% trên mobile, 40% trên PC

            // Tính kích thước filter dựa trên kích thước canvas
            const filterWidth = canvas.width * filterRatio;
            const filterHeight = canvas.width * filterRatio; // Giữ tỷ lệ vuông
            const x = (canvas.width - filterWidth) / 2;
            const y = (canvas.height - filterHeight) / 2;

            // Vẽ filter lên canvas
            context.drawImage(filterImg, x, y, filterWidth, filterHeight);

            // Xuất ảnh
            const dataUrl = canvas.toDataURL("image/png");
            setCapturedImage(dataUrl);
            setIsCaptured(true);
            new Audio(captureSound).play();
          };
        } else {
          // Xuất ảnh nếu không có filter
          const dataUrl = canvas.toDataURL("image/png");
          setCapturedImage(dataUrl);
          setIsCaptured(true);
          new Audio(captureSound).play();
        }
      }
    }
  };

  const handleCancel = () => {
    // Dừng stream video hiện tại
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }

    // Reset trạng thái
    setCapturedImage(null);
    setIsCaptured(false);

    // Khởi động lại camera
    startCamera(facingMode);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = 'captured_image.png';
      link.click();
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="bg-gray-800 flex items-center justify-center h-screen relative flex-col">
      <div className="flex-1 w-full h-full relative">
        {error ? (
          <div className="text-white text-center p-4">{error}</div>
        ) : isCaptured ? (
          <img
            src={capturedImage || undefined}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              key={facingMode + (isCaptured ? 'captured' : 'live')}
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {selectedFilter && (
              <img
                src={selectedFilter}
                alt="Filter"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] md:w-[40%] h-auto object-contain pointer-events-none z-10"
              />
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {showFilterBox && !isCaptured && (
        <div className="absolute bottom-20 left-4 bg-white rounded-lg p-2 flex gap-2 z-50">
          {[filter1, filter2].map((filter, idx) => (
            <img
              key={idx}
              src={filter}
              alt={`filter-${idx}`}
              className="w-16 h-16 rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
              onClick={() => {
                setSelectedFilter(filter);
                setShowFilterBox(false);
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
        {isCaptured ? (
          <>
            <FontAwesomeIcon
              icon={faXmark}
              className="text-white text-2xl cursor-pointer"
              onClick={handleCancel}
            />
            <FontAwesomeIcon
              icon={faDownload}
              className="text-white text-2xl cursor-pointer"
              onClick={handleDownload}
            />
          </>
        ) : (
          <>
            <div className="w-1/3 flex justify-start relative">
              <FontAwesomeIcon
                icon={faFaceSmile}
                className="text-white text-2xl cursor-pointer"
                onClick={() => setShowFilterBox(prev => !prev)}
              />
            </div>
            <div className="w-1/3 flex justify-center">
              <div
                className="bg-white rounded-full p-4 cursor-pointer"
                onClick={handleCapture}
              ></div>
            </div>
            <div className="w-1/3 flex justify-end">
              <img
                src={switchCameraIcon}
                alt="Switch Camera"
                onClick={handleSwitchCamera}
                className="w-8 h-8 object-contain cursor-pointer"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Camera;