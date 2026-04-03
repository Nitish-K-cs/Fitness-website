from main import app, db
from models import Exercise

def seed_exercises():
    if Exercise.query.count() > 0:
        print("Already seeded")
        return

    exercises = [
        {"name": "Dumbbell Rows", "set1": 10, "set2": 10, "set3": 10, "video_url": "/static/workout.mp4"},
        {"name": "Dumbbell Chest Press", "set1": 10, "set2": 10, "set3": 10, "video_url": "/static/workout.mp4"},
        {"name": "Shoulder Press", "set1": 10, "set2": 10, "set3": 10, "video_url": "/static/workout.mp4"},
        {"name": "Biceps Curls", "set1": 10, "set2": 10, "set3": 10, "video_url": "/static/workout.mp4"},
        {"name": "Tricep Extension", "set1": 10, "set2": 10, "set3": 10, "video_url": "/static/workout.mp4"},
    ]

    for ex in exercises:
        db.session.add(Exercise(**ex))

    db.session.commit()
    print("Seeded successfully!")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()   # 👈 IMPORTANT
        seed_exercises()