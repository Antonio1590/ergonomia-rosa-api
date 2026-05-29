import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

def analyze_posture(image_path):

    image = cv2.imread(image_path)

    pose = mp_pose.Pose(
        static_image_mode=True,
        min_detection_confidence=0.5
    )

    image_rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    results = pose.process(image_rgb)

    if not results.pose_landmarks:

        return {
            "success": False,
            "message": "No se detectó postura"
        }

    mp_drawing = mp.solutions.drawing_utils

    annotated_image = image.copy()

    mp_drawing.draw_landmarks(
        annotated_image,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS
    )

    output_path = "output_pose.jpg"

    cv2.imwrite(
        output_path,
        annotated_image
    )

    return {
        "success": True,
        "message": "Postura analizada",
        "output_image": output_path
    }