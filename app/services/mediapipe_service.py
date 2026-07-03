import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose


def detect_pose(image):

    pose = mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        min_detection_confidence=0.5
    )

    rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    results = pose.process(rgb)

    if not results.pose_landmarks:

        return None

    landmarks = []

    for point in results.pose_landmarks.landmark:

        landmarks.append({

            "x": point.x,
            "y": point.y,
            "z": point.z,
            "visibility": point.visibility

        })

    return landmarks