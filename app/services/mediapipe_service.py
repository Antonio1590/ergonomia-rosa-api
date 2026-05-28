import cv2
import mediapipe as mp
import math


mp_pose = mp.solutions.pose

mp_drawing = mp.solutions.drawing_utils


def calculate_angle(a, b, c):

    angle = math.degrees(

        math.atan2(
            c[1] - b[1],
            c[0] - b[0]
        ) -

        math.atan2(
            a[1] - b[1],
            a[0] - b[0]
        )

    )

    angle = abs(angle)

    if angle > 180:

        angle = 360 - angle

    return angle


def analyze_posture(image_path):

    image = cv2.imread(image_path)

    if image is None:

        return {
            "success": False,
            "message": "No se pudo leer la imagen"
        }

    rgb_image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    with mp_pose.Pose(
        static_image_mode=True,
        min_detection_confidence=0.5
    ) as pose:

        results = pose.process(
            rgb_image
        )

        if not results.pose_landmarks:

            return {
                "success": False,
                "message": "No se detectó postura"
            }

        landmarks = results.pose_landmarks.landmark


        # CUELLO

        shoulder = landmarks[
            mp_pose.PoseLandmark.LEFT_SHOULDER
        ]

        ear = landmarks[
            mp_pose.PoseLandmark.LEFT_EAR
        ]

        hip = landmarks[
            mp_pose.PoseLandmark.LEFT_HIP
        ]


        # BRAZO

        elbow = landmarks[
            mp_pose.PoseLandmark.LEFT_ELBOW
        ]

        wrist = landmarks[
            mp_pose.PoseLandmark.LEFT_WRIST
        ]


        shoulder_point = (
            shoulder.x,
            shoulder.y
        )

        ear_point = (
            ear.x,
            ear.y
        )

        hip_point = (
            hip.x,
            hip.y
        )

        elbow_point = (
            elbow.x,
            elbow.y
        )

        wrist_point = (
            wrist.x,
            wrist.y
        )


        neck_angle = calculate_angle(
            ear_point,
            shoulder_point,
            hip_point
        )

        arm_angle = calculate_angle(
            shoulder_point,
            elbow_point,
            wrist_point
        )


        recommendations = []

        score = 1


        # REGLAS ROSA

        if neck_angle < 40:

            recommendations.append(
                "Elevar monitor y corregir cuello"
            )

            score += 3


        if arm_angle < 70:

            recommendations.append(
                "Ajustar altura de brazos"
            )

            score += 2


        if score <= 2:

            risk = "BAJO"

        elif score <= 4:

            risk = "MEDIO"

        else:

            risk = "ALTO"


        if len(recommendations) == 0:

            recommendations.append(
                "Postura ergonomica adecuada"
            )


        annotated_image = image.copy()

        mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )


        cv2.putText(
            annotated_image,
            f"Neck: {int(neck_angle)}",
            (30, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        cv2.putText(
            annotated_image,
            f"Arm: {int(arm_angle)}",
            (30, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 0, 0),
            2
        )

        cv2.putText(
            annotated_image,
            f"Risk: {risk}",
            (30, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )


        output_path = "output_pose.jpg"

        cv2.imwrite(
            output_path,
            annotated_image
        )


        return {

            "success": True,

            "score": score,

            "risk": risk,

            "neck_angle": neck_angle,

            "arm_angle": arm_angle,

            "recommendations": recommendations,

            "output_image": output_path

        }