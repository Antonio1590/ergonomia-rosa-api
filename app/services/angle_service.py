from app.utils.geometry import calculate_angle


def get_body_angles(landmarks):

    angles = {}

    # Hombro izquierdo
    shoulder = (
        landmarks[11]["x"],
        landmarks[11]["y"]
    )

    # Codo izquierdo
    elbow = (
        landmarks[13]["x"],
        landmarks[13]["y"]
    )

    # Muñeca izquierda
    wrist = (
        landmarks[15]["x"],
        landmarks[15]["y"]
    )

    angles["left_elbow"] = calculate_angle(
        shoulder,
        elbow,
        wrist
    )

    # Cadera izquierda
    hip = (
        landmarks[23]["x"],
        landmarks[23]["y"]
    )

    # Rodilla izquierda
    knee = (
        landmarks[25]["x"],
        landmarks[25]["y"]
    )

    # Tobillo izquierdo
    ankle = (
        landmarks[27]["x"],
        landmarks[27]["y"]
    )

    angles["left_knee"] = calculate_angle(
        hip,
        knee,
        ankle
    )

    return angles