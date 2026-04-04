from flask import Flask, request, jsonify
from config import app, db
from models import Exercise, WorkoutLog
from datetime import date 

@app.route("/")
def home():
    return "Flask working!"

@app.route("/exercises")
def get_exercises():
    exercises = Exercise.query.all()
    return jsonify([
        {
            "id": e.id,
            "name": e.name,
            "set1": e.set1,
            "set2": e.set2,
            "set3": e.set3
        } for e in exercises
    ])


@app.route("/log", methods=["POST"])
def log_workout():
    data = request.json

    log = WorkoutLog(
        exercise_id=data["exercise_id"],
        set1=data["set1"],
        set2=data["set2"],
        set3=data["set3"],
        duration=data["duration"]
    )

    db.session.add(log)
    db.session.commit()

    return {"message": "Logged successfully"}


from datetime import date

@app.route("/logs/today")
def get_today_logs():
    today = date.today()

    logs = WorkoutLog.query.filter_by(date=today).all()

    return jsonify([
        {
            "exercise_id": l.exercise_id,
            "set1": l.set1,
            "set2": l.set2,
            "set3": l.set3,
            "duration": l.duration,
            "date": l.date.isoformat()
        } for l in logs
    ])



if __name__ == '__main__':
    with app.app_context():
        db.create_all()  

    
    app.run(debug=True)