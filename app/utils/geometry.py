import math


def calculate_angle(a, b, c):

    ba = (
        a[0] - b[0],
        a[1] - b[1]
    )

    bc = (
        c[0] - b[0],
        c[1] - b[1]
    )

    dot = (
        ba[0] * bc[0] +
        ba[1] * bc[1]
    )

    mag_ba = math.sqrt(
        ba[0]**2 +
        ba[1]**2
    )

    mag_bc = math.sqrt(
        bc[0]**2 +
        bc[1]**2
    )

    if mag_ba == 0 or mag_bc == 0:
        return 0

    cosine = dot / (mag_ba * mag_bc)

    cosine = max(
        -1,
        min(1, cosine)
    )

    angle = math.degrees(
        math.acos(cosine)
    )

    return round(angle, 2)