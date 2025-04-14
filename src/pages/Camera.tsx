import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faDownload, faFaceSmile } from '@fortawesome/free-solid-svg-icons';
import switchCameraIcon from '../assets/camera.png';
import captureSound from '../assets/sound.mp3';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = async (mode: "environment" | "user" = "environment") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
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
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 1.0); // JPEG high quality
        setCapturedImage(dataUrl);
        setIsCaptured(true);

        const audio = new Audio(captureSound);
        audio.play();
      }
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setIsCaptured(false);
    startCamera(facingMode);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = 'captured_image.jpg';
      link.click();
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="bg-gray-800 flex items-center justify-center h-screen relative flex-col">
      <div className="flex-1 w-full h-full relative aspect-video bg-black">
        {error ? (
          <div className="text-white text-center p-4">{error}</div>
        ) : isCaptured ? (
          <img
            src={capturedImage || undefined}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted
          />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Bottom Bar */}
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
            <div className="w-1/3 flex justify-start">
              <FontAwesomeIcon icon={faFaceSmile} className="text-white text-2xl" />
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
